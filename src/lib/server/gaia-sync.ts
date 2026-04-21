import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import {
  buildGaiaEmployeeRecord,
  GAIA_SEED_ROSTER,
  GaiaEmployeeRecord,
  parseGaiaRosterCsv,
} from '@/lib/hr-workforce'

export type GaiaSyncSource = 'auto' | 'seed' | 'gaia-api'
type GaiaRemoteFormat = 'json' | 'csv'

export interface GaiaRosterLoadOptions {
  source: GaiaSyncSource
  strictRemote: boolean
}

export interface GaiaRosterLoadResult {
  source: 'gaia-seed' | 'gaia-api'
  mode: GaiaRemoteFormat | 'seed'
  items: GaiaEmployeeRecord[]
  warnings: string[]
  fetchedAt: string
  endpointHint: string
}

interface GaiaRemoteConfig {
  endpoint: string
  endpointHint: string
  format: GaiaRemoteFormat
  timeoutMs: number
  authHeader: string
  authValue: string
  jsonPath: string
  extraHeaders: Record<string, string>
}

const DEFAULT_TIMEOUT_MS = 15_000
const MAX_WARNING_COUNT = 80
const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 300) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(clip(value, '', 16), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const parseExtraHeaders = (raw: string) => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    const validated = z.record(z.string(), z.string()).safeParse(parsed)
    return validated.success ? validated.data : {}
  } catch {
    return {}
  }
}

const sanitizeEndpointHint = (endpoint: string) => {
  try {
    const parsed = new URL(endpoint)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return endpoint.slice(0, 220)
  }
}

const buildRemoteConfig = (): GaiaRemoteConfig | null => {
  const endpoint = clip(process.env.GAIA_API_ROSTER_URL, '', 600)
  if (!endpoint) return null
  const format = clip(process.env.GAIA_API_FORMAT, 'json', 10).toLowerCase() === 'csv' ? 'csv' : 'json'
  const token = clip(process.env.GAIA_API_TOKEN, '', 600)
  const authHeader = clip(process.env.GAIA_API_AUTH_HEADER, 'Authorization', 80) || 'Authorization'
  const prefix = clip(process.env.GAIA_API_AUTH_PREFIX, 'Bearer ', 30)
  const authValue = token
    ? authHeader.toLowerCase() === 'authorization' && !token.toLowerCase().startsWith('bearer ')
      ? `${prefix}${token}`
      : token
    : ''
  return {
    endpoint,
    endpointHint: sanitizeEndpointHint(endpoint),
    format,
    timeoutMs: normalizeNumber(process.env.GAIA_API_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 3_000, 60_000),
    authHeader,
    authValue,
    jsonPath: clip(process.env.GAIA_API_JSON_PATH, 'data.items', 120),
    extraHeaders: parseExtraHeaders(clip(process.env.GAIA_API_HEADERS_JSON, '', 2000)),
  }
}

const buildFetchHeaders = (config: GaiaRemoteConfig) => {
  const headers = new Headers()
  headers.set('Accept', config.format === 'csv' ? 'text/csv, application/json' : 'application/json, text/csv')
  if (config.authValue) headers.set(config.authHeader, config.authValue)
  for (const [key, value] of Object.entries(config.extraHeaders)) {
    if (!key.trim() || !value.trim()) continue
    headers.set(key, value)
  }
  return headers
}

const fetchWithTimeout = async (config: GaiaRemoteConfig) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const response = await fetch(config.endpoint, {
      method: 'GET',
      headers: buildFetchHeaders(config),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`GAIA_REMOTE_HTTP_${response.status}`)
    }
    return response
  } finally {
    clearTimeout(timer)
  }
}

const readStringField = (record: Record<string, unknown>, keys: string[], max = 180) => {
  for (const key of keys) {
    const value = clip(record[key], '', max)
    if (value) return value
  }
  return ''
}

const readNumberField = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string') {
      const parsed = Number.parseFloat(raw.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return Number.NaN
}

const readTagField = (record: Record<string, unknown>) => {
  const fromArray = record.tags
  if (Array.isArray(fromArray)) return fromArray.map((item) => clip(item, '', 60)).filter(Boolean)
  const fromString = clip(record.tags, '', 500)
  if (!fromString) return []
  return fromString.split(/[;,，、\s]+/).map((item) => item.trim()).filter(Boolean).slice(0, 10)
}

const mapRemoteRecord = (record: Record<string, unknown>, rowNumber: number) => {
  const employeeId = readStringField(record, ['employeeId', 'employee_id', 'workNo', 'work_no', 'staffNo', 'staff_no'], 80)
  const name = readStringField(record, ['name', 'employeeName', 'employee_name', 'staffName', 'staff_name'], 120)
  if (!employeeId || !name) return { item: null, error: `第 ${rowNumber} 行缺少工号或姓名` }
  const item = buildGaiaEmployeeRecord({
    employeeId,
    name,
    roleTitle: readStringField(record, ['roleTitle', 'role_title', 'position', 'jobTitle', 'job_title'], 120),
    projectSlug: readStringField(record, ['projectSlug', 'project_slug', 'projectCode', 'project_code', 'siteSlug'], 120),
    projectName: readStringField(record, ['projectName', 'project_name', 'project'], 180),
    city: readStringField(record, ['city', 'projectCity', 'project_city'], 80),
    hourlyCost: readNumberField(record, ['hourlyCost', 'hourly_cost', 'costPerHour']),
    employmentType: readStringField(record, ['employmentType', 'employment_type', 'contractType', 'contract_type'], 20),
    status: readStringField(record, ['status', 'employeeStatus', 'employee_status'], 20),
    hiredAt: readStringField(record, ['hiredAt', 'hired_at', 'entryDate', 'entry_date'], 20),
    tags: readTagField(record),
  })
  if (!item) return { item: null, error: `第 ${rowNumber} 行项目无法匹配` }
  return { item, error: '' }
}

const extractRecordsByPath = (payload: unknown, path: string) => {
  const segments = path.split('.').map((item) => item.trim()).filter(Boolean)
  let cursor: unknown = payload
  for (const segment of segments) {
    if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return []
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return Array.isArray(cursor) ? cursor : []
}

const parseRemoteJsonRecords = (payload: unknown, path: string) => {
  const records = extractRecordsByPath(payload, path)
  const validated = z.array(z.record(z.string(), z.unknown())).safeParse(records)
  if (!validated.success) return { items: [] as GaiaEmployeeRecord[], warnings: ['盖雅 JSON 数据结构不合法'] }
  const warnings: string[] = []
  const items = validated.data
    .map((record, index) => mapRemoteRecord(record, index + 1))
    .flatMap((row) => {
      if (row.error) warnings.push(row.error)
      return row.item ? [row.item] : []
    })
  return { items, warnings: warnings.slice(0, MAX_WARNING_COUNT) }
}

const deduplicateByEmployeeId = (items: GaiaEmployeeRecord[]) => {
  const map = new Map<string, GaiaEmployeeRecord>()
  for (const item of items) map.set(item.employeeId, item)
  return Array.from(map.values())
}

const loadFromRemote = async (config: GaiaRemoteConfig) => {
  const response = await fetchWithTimeout(config)
  const contentType = clip(response.headers.get('content-type'), '', 200).toLowerCase()
  if (config.format === 'csv' || contentType.includes('text/csv')) {
    const parsed = parseGaiaRosterCsv(await response.text())
    return { mode: 'csv' as GaiaRemoteFormat, items: deduplicateByEmployeeId(parsed.items), warnings: parsed.errors }
  }
  return {
    mode: 'json' as GaiaRemoteFormat,
    ...parseRemoteJsonRecords(await response.json(), config.jsonPath),
  }
}

const buildSeedResult = (warning = ''): GaiaRosterLoadResult => ({
  source: 'gaia-seed',
  mode: 'seed',
  items: GAIA_SEED_ROSTER,
  warnings: warning ? [warning] : [],
  fetchedAt: nowIso(),
  endpointHint: 'seed',
})

export const loadGaiaRosterForSync = async (input: GaiaRosterLoadOptions): Promise<GaiaRosterLoadResult> => {
  const strictLiveMode = isStrictLiveMode()

  if (input.source === 'seed') {
    if (strictLiveMode) {
      throw new Error('STRICT_LIVE_MODE_SEED_DISABLED')
    }
    return buildSeedResult()
  }

  const config = buildRemoteConfig()
  if (!config) {
    if (strictLiveMode || input.source === 'gaia-api') {
      throw new Error('GAIA_API_ROSTER_URL 未配置')
    }
    return buildSeedResult('未配置盖雅远程接口，已使用种子花名册')
  }

  try {
    const remote = await loadFromRemote(config)
    return {
      source: 'gaia-api',
      mode: remote.mode,
      items: remote.items,
      warnings: remote.warnings.slice(0, MAX_WARNING_COUNT),
      fetchedAt: nowIso(),
      endpointHint: config.endpointHint,
    }
  } catch (error) {
    if (strictLiveMode || input.strictRemote || input.source === 'gaia-api') throw error
    const reason = error instanceof Error ? error.message : 'REMOTE_UNKNOWN_ERROR'
    return buildSeedResult(`盖雅远程拉取失败(${reason})，已回退到种子花名册`)
  }
}
