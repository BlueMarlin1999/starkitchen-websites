import { NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'
import { resolveGeoByHeaders, resolveRequestIp } from '@/lib/server/oa/context'

const AUTH_LOGIN_AUDIT_NAMESPACE = 'auth/login-audit/v1'
const MAX_AUTH_AUDIT_EVENTS = 20000

export type AuthLoginStatus = 'success' | 'failed' | 'blocked'
export type AuthCredentialType = 'employee_id' | 'mobile'
export type AuthRiskLevel = 'low' | 'medium' | 'high'

export interface AuthLoginAuditEvent {
  id: string
  timestamp: string
  identifier: string
  credentialType: AuthCredentialType
  employeeId: string
  fullName: string
  role: string
  mobileMasked: string
  ipAddress: string
  location: string
  country: string
  region: string
  city: string
  userAgent: string
  device: string
  deviceModel: string
  mfa: string
  status: AuthLoginStatus
  risk: AuthRiskLevel
  securityFlag: string
  reason: string
  path: string
}

interface AuthAuditStorePayload {
  events: AuthLoginAuditEvent[]
}

interface AppendAuthLoginAuditInput {
  identifier: string
  credentialType: AuthCredentialType
  employeeId?: string
  fullName?: string
  role?: string
  mobileMasked?: string
  status: AuthLoginStatus
  securityFlag: string
  reason: string
  mfa?: string
}

interface ListAuthLoginAuditQuery {
  page?: number
  size?: number
  status?: AuthLoginStatus
  risk?: AuthRiskLevel
  keyword?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __SK_AUTH_LOGIN_AUDIT_STATE__: AuthAuditStorePayload | undefined
}

const clip = (value: unknown, max = 240) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const nowIso = () => new Date().toISOString()

const buildAuditId = () => `${Date.now()}-${randomBytes(3).toString('hex')}`

const maskMobile = (value: string) => {
  const digits = clip(value, 40).replace(/\D/g, '')
  if (digits.length < 7) return '未绑定'
  return `${digits.slice(-11, -7)}****${digits.slice(-4)}`
}

const resolveBrowser = (ua: string) => {
  const normalized = ua.toLowerCase()
  if (normalized.includes('edg/')) return 'Edge'
  if (normalized.includes('chrome/')) return 'Chrome'
  if (normalized.includes('safari/') && !normalized.includes('chrome/')) return 'Safari'
  if (normalized.includes('firefox/')) return 'Firefox'
  if (normalized.includes('msie') || normalized.includes('trident')) return 'IE'
  return 'Unknown'
}

const resolveOs = (ua: string) => {
  const normalized = ua.toLowerCase()
  if (normalized.includes('windows')) return 'Windows'
  if (normalized.includes('mac os x') || normalized.includes('macintosh')) return 'macOS'
  if (normalized.includes('iphone') || normalized.includes('ipad') || normalized.includes('ios')) return 'iOS'
  if (normalized.includes('android')) return 'Android'
  if (normalized.includes('linux')) return 'Linux'
  return 'Unknown'
}

const resolveDeviceType = (ua: string) => {
  const normalized = ua.toLowerCase()
  if (normalized.includes('iphone') || normalized.includes('android') || normalized.includes('mobile')) return 'Mobile'
  if (normalized.includes('ipad') || normalized.includes('tablet')) return 'Tablet'
  if (normalized.includes('bot') || normalized.includes('spider') || normalized.includes('crawler')) return 'Bot'
  return 'Desktop'
}

const resolveRiskLevel = (input: {
  status: AuthLoginStatus
  securityFlag: string
  credentialType: AuthCredentialType
  location: string
}) => {
  if (input.status === 'blocked') return 'high'
  const flag = input.securityFlag.toLowerCase()
  if (flag.includes('异常') || flag.includes('攻击') || flag.includes('失败')) return 'high'
  if (input.status === 'failed') return 'medium'
  if (input.credentialType === 'mobile' && input.location.includes('未知')) return 'medium'
  return 'low'
}

const normalizeStatus = (value: unknown): AuthLoginStatus => {
  const normalized = clip(value, 20).toLowerCase()
  if (normalized === 'success' || normalized === 'failed' || normalized === 'blocked') return normalized
  return 'failed'
}

const normalizeRisk = (value: unknown): AuthRiskLevel => {
  const normalized = clip(value, 20).toLowerCase()
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high') return normalized
  return 'medium'
}

const normalizeEvent = (value: unknown): AuthLoginAuditEvent | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const item = value as Partial<AuthLoginAuditEvent>
  const id = clip(item.id, 80)
  if (!id) return null
  return {
    id,
    timestamp: clip(item.timestamp, 80) || nowIso(),
    identifier: clip(item.identifier, 80),
    credentialType: item.credentialType === 'mobile' ? 'mobile' : 'employee_id',
    employeeId: clip(item.employeeId, 80),
    fullName: clip(item.fullName, 80) || '未知账号',
    role: clip(item.role, 40) || 'N/A',
    mobileMasked: clip(item.mobileMasked, 40) || '未绑定',
    ipAddress: clip(item.ipAddress, 120) || '0.0.0.0',
    location: clip(item.location, 180) || '未知',
    country: clip(item.country, 80) || '未知',
    region: clip(item.region, 80) || '未知',
    city: clip(item.city, 80) || '未知',
    userAgent: clip(item.userAgent, 320) || 'unknown',
    device: clip(item.device, 120) || 'Unknown / Unknown',
    deviceModel: clip(item.deviceModel, 80) || 'Unknown',
    mfa: clip(item.mfa, 80) || '未配置',
    status: normalizeStatus(item.status),
    risk: normalizeRisk(item.risk),
    securityFlag: clip(item.securityFlag, 160) || '未标记',
    reason: clip(item.reason, 240) || '未记录',
    path: clip(item.path, 260) || '/api/auth/login',
  }
}

const normalizePayload = (value: unknown): AuthAuditStorePayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { events: [] }
  const payload = value as Partial<AuthAuditStorePayload>
  if (!Array.isArray(payload.events)) return { events: [] }
  return {
    events: payload.events.map((item) => normalizeEvent(item)).filter(Boolean) as AuthLoginAuditEvent[],
  }
}

const getMemoryStore = () => {
  if (!globalThis.__SK_AUTH_LOGIN_AUDIT_STATE__) {
    globalThis.__SK_AUTH_LOGIN_AUDIT_STATE__ = { events: [] }
  }
  return globalThis.__SK_AUTH_LOGIN_AUDIT_STATE__
}

const readAuditStore = async (): Promise<AuthAuditStorePayload> => {
  if (!isPersistentJsonStoreEnabled()) {
    return getMemoryStore()
  }
  try {
    const payload = await readPersistentJsonState<AuthAuditStorePayload>(AUTH_LOGIN_AUDIT_NAMESPACE)
    return normalizePayload(payload)
  } catch {
    return getMemoryStore()
  }
}

const writeAuditStore = async (payload: AuthAuditStorePayload) => {
  const normalized = normalizePayload(payload)
  if (!isPersistentJsonStoreEnabled()) {
    globalThis.__SK_AUTH_LOGIN_AUDIT_STATE__ = normalized
    return normalized
  }
  await writePersistentJsonState(AUTH_LOGIN_AUDIT_NAMESPACE, normalized)
  return normalized
}

const mutateAuditStore = async (
  updater: (payload: AuthAuditStorePayload) => AuthAuditStorePayload
) => {
  const current = await readAuditStore()
  const nextPayload = updater(current)
  return writeAuditStore(nextPayload)
}

export const appendAuthLoginAuditByRequest = async (
  request: NextRequest,
  payload: AppendAuthLoginAuditInput
) => {
  const userAgent = clip(request.headers.get('user-agent'), 320) || 'unknown'
  const os = resolveOs(userAgent)
  const browser = resolveBrowser(userAgent)
  const deviceType = resolveDeviceType(userAgent)
  const browserDescriptor = `${os} / ${browser}`
  const rawModel =
    clip(request.headers.get('x-sk-device-model'), 80) ||
    clip(request.headers.get('sec-ch-ua-model'), 80) ||
    ''
  const deviceModel = rawModel || deviceType
  const ipAddress = resolveRequestIp(request)
  const geo = resolveGeoByHeaders(request)
  const location = `${geo.country}·${geo.region}·${geo.city}`
  const risk = resolveRiskLevel({
    status: payload.status,
    securityFlag: payload.securityFlag,
    credentialType: payload.credentialType,
    location,
  })

  const event: AuthLoginAuditEvent = {
    id: buildAuditId(),
    timestamp: nowIso(),
    identifier: clip(payload.identifier, 80),
    credentialType: payload.credentialType,
    employeeId: clip(payload.employeeId, 80),
    fullName: clip(payload.fullName, 80) || '未知账号',
    role: clip(payload.role, 40) || 'N/A',
    mobileMasked: maskMobile(payload.mobileMasked || ''),
    ipAddress,
    location,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    userAgent,
    device: browserDescriptor,
    deviceModel,
    mfa: clip(payload.mfa, 80) || '未配置',
    status: payload.status,
    risk,
    securityFlag: clip(payload.securityFlag, 160) || '未标记',
    reason: clip(payload.reason, 240) || '未记录',
    path: request.nextUrl.pathname,
  }

  await mutateAuditStore((current) => ({
    events: [event, ...current.events].slice(0, MAX_AUTH_AUDIT_EVENTS),
  }))
}

export const listAuthLoginAuditEvents = async (query: ListAuthLoginAuditQuery = {}) => {
  const page = Number.isFinite(query.page) ? Math.max(1, Number(query.page)) : 1
  const size = Number.isFinite(query.size) ? Math.min(200, Math.max(1, Number(query.size))) : 50
  const keyword = clip(query.keyword, 120).toLowerCase()

  const state = await readAuditStore()
  const filtered = state.events.filter((item) => {
    if (query.status && item.status !== query.status) return false
    if (query.risk && item.risk !== query.risk) return false
    if (!keyword) return true
    const searchable = [
      item.identifier,
      item.employeeId,
      item.fullName,
      item.mobileMasked,
      item.ipAddress,
      item.location,
      item.device,
      item.deviceModel,
      item.securityFlag,
      item.reason,
    ]
      .join(' ')
      .toLowerCase()
    return searchable.includes(keyword)
  })

  const start = (page - 1) * size
  return {
    items: filtered.slice(start, start + size),
    total: filtered.length,
    page,
    size,
  }
}
