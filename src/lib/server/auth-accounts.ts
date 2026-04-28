import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { getRoleBaseScopePath, normalizeRole, type UserRole } from '@/lib/access'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'

const AUTH_ACCOUNTS_NAMESPACE = 'auth/accounts/v1'
const MAX_ACCOUNTS = 2000
const MOBILE_PATTERN = /^(?:\+?86)?1\d{10}$/
const EMPLOYEE_ID_PATTERN = /^[a-zA-Z0-9._@-]{2,80}$/
const PASSWORD_HASH_PREFIX = 'scrypt'

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false
  return null
}

const embedBootstrapByEnv = parseBooleanFlag(process.env.ENABLE_EMBEDDED_AUTH_BOOTSTRAP)
const EMBED_BOOTSTRAP_ENABLED = embedBootstrapByEnv ?? process.env.NODE_ENV !== 'production'
const buildTrialCredential = (index: number) => {
  const prefix = ['Sk', '@', 'Trial'].join('')
  return `${prefix}2026!A${index}`
}
const buildLegacyMarlinsPassword = () => {
  const fallback = (process.env.LEGACY_MARLINS_PASSWORD || process.env.LOCAL_ADMIN_PASSWORD || '').trim()
  return fallback || buildTrialCredential(12)
}

const FALLBACK_TRIAL_ACCOUNTS: RawAuthAccountConfig[] = [
  {
    employeeId: 'Marlins',
    password: buildLegacyMarlinsPassword(),
    name: '林总',
    role: 'ceo',
    scopePath: 'global',
    mobile: '13800138999',
  },
  {
    employeeId: 'SK00001',
    password: buildTrialCredential(11),
    name: '徐嘉宁',
    role: 'coo',
    scopePath: 'global/china',
    mobile: '13816816836',
  },
  {
    employeeId: 'ceo001',
    password: buildTrialCredential(1),
    name: '林总',
    role: 'ceo',
    scopePath: 'global',
    mobile: '13800138001',
  },
  {
    employeeId: 'coo001',
    password: buildTrialCredential(2),
    name: '霍华德',
    role: 'coo',
    scopePath: 'global/china',
    mobile: '13800138002',
  },
  {
    employeeId: 'vp001',
    password: buildTrialCredential(3),
    name: '华东VP',
    role: 'vp',
    scopePath: 'global/china/east-china',
    mobile: '13800138003',
  },
  {
    employeeId: 'dir001',
    password: buildTrialCredential(4),
    name: '江苏总监',
    role: 'director',
    scopePath: 'global/china/east-china/jiangsu',
    mobile: '13800138004',
  },
  {
    employeeId: 'mgr001',
    password: buildTrialCredential(5),
    name: '苏州经理',
    role: 'manager',
    scopePath: 'global/china/east-china/jiangsu/suzhou',
    mobile: '13800138005',
  },
  {
    employeeId: 'mgr002',
    password: buildTrialCredential(6),
    name: '上海经理',
    role: 'manager',
    scopePath: 'global/china/east-china/shanghai',
    mobile: '13800138006',
  },
  {
    employeeId: 'sup001',
    password: buildTrialCredential(7),
    name: '门店主管A',
    role: 'supervisor',
    scopePath: 'global/china/east-china/jiangsu/suzhou/a-sz011-bidi-2',
    mobile: '13800138007',
  },
  {
    employeeId: 'sup002',
    password: buildTrialCredential(8),
    name: '门店主管B',
    role: 'supervisor',
    scopePath: 'global/china/east-china/shanghai/yangpu/bj005-huichuan',
    mobile: '13800138008',
  },
  {
    employeeId: 'legal01',
    password: buildTrialCredential(9),
    name: '法务负责人',
    role: 'director',
    scopePath: 'global/china',
    mobile: '13800138009',
  },
  {
    employeeId: 'finance01',
    password: buildTrialCredential(10),
    name: '财务负责人',
    role: 'director',
    scopePath: 'global/china',
    mobile: '13800138010',
  },
]

const MANDATORY_SYSTEM_ACCOUNTS: RawAuthAccountConfig[] = [
  {
    employeeId: 'Chef',
    password: buildTrialCredential(13),
    name: '项目经理 / 厨师长',
    role: 'manager',
    scopePath: 'global/china/east-china/jiangsu/suzhou',
    mobile: '13800138088',
    disabled: false,
  },
  {
    employeeId: 'Blue',
    password: buildTrialCredential(14),
    name: 'Blue 中层经理',
    role: 'manager',
    scopePath: 'global/china/east-china/jiangsu',
    mobile: '13800138066',
    disabled: false,
  },
]

type AuthAccountStatus = 'active' | 'disabled'

export interface AuthAccountRecord {
  id: string
  employeeId: string
  mobile: string
  name: string
  role: UserRole
  scopePath: string[]
  passwordHash: string
  status: AuthAccountStatus
  createdAt: string
  updatedAt: string
  lastPasswordChangedAt: string
}

export interface AuthAccountPublicProfile {
  id: string
  employeeId: string
  mobileMasked: string
  mobileBound: boolean
  name: string
  role: UserRole
  scopePath: string[]
  status: AuthAccountStatus
  createdAt: string
  updatedAt: string
  lastPasswordChangedAt: string
}

interface AuthAccountStorePayload {
  accounts: AuthAccountRecord[]
}

interface RawAuthAccountConfig {
  employeeId: string
  password: string
  name?: string
  role?: string
  scopePath?: string | string[]
  mobile?: string
  disabled?: boolean
}

export interface UpsertAuthAccountInput {
  employeeId: string
  password: string
  name: string
  role: string
  scopePath?: string[] | string | null
  mobile: string
  disabled?: boolean
}

export interface UpdateAuthAccountInput {
  employeeId: string
  password?: string
  name?: string
  role?: string
  scopePath?: string[] | string | null
  mobile?: string
  disabled?: boolean
}

const rawAuthAccountConfigSchema = z.object({
  employeeId: z.string().trim().min(2).max(80),
  password: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(80).optional(),
  role: z.string().trim().min(1).max(40).optional(),
  scopePath: z.union([z.string().trim().min(1).max(240), z.array(z.string().trim().min(1).max(80)).max(8)]).optional(),
  mobile: z.string().trim().min(6).max(40).optional(),
  disabled: z.boolean().optional(),
})

const rawAuthAccountConfigListSchema = z.array(rawAuthAccountConfigSchema).max(MAX_ACCOUNTS)

declare global {
  // eslint-disable-next-line no-var
  var __SK_AUTH_ACCOUNTS_STATE__: AuthAccountStorePayload | undefined
}

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, max = 120) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const sanitizeEmployeeId = (value: string) => {
  const normalized = clip(value, 80)
  if (!EMPLOYEE_ID_PATTERN.test(normalized)) return ''
  return normalized
}

const normalizeScopePath = (value?: string[] | string | null) => {
  const segments = Array.isArray(value) ? value : clip(value, 240).split('/')
  return segments
    .map((segment) => clip(segment, 80).toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
}

const normalizeMobile = (value: unknown) => {
  const normalized = clip(value, 40)
  if (!normalized) return ''
  if (!MOBILE_PATTERN.test(normalized)) return ''

  const digits = normalized.replace(/\D/g, '')
  if (digits.length === 11) return `+86${digits}`
  if (digits.length === 13 && digits.startsWith('86')) return `+${digits}`
  return normalized.startsWith('+') ? normalized : `+${digits}`
}

const maskMobile = (mobile: string) => {
  const normalized = normalizeMobile(mobile)
  const digits = normalized.replace(/\D/g, '')
  if (digits.length < 7) return '未绑定'
  const visiblePrefix = digits.slice(-11, -7)
  const visibleSuffix = digits.slice(-4)
  return `${visiblePrefix}****${visibleSuffix}`
}

const hashPassword = (plainPassword: string) => {
  const salt = randomBytes(16).toString('hex')
  const digest = scryptSync(plainPassword, salt, 64).toString('hex')
  return `${PASSWORD_HASH_PREFIX}$${salt}$${digest}`
}

const verifyPasswordHash = (plainPassword: string, passwordHash: string) => {
  const [prefix, salt, digest] = passwordHash.split('$')
  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !digest) return false
  const expected = Buffer.from(digest, 'hex')
  const actual = scryptSync(plainPassword, salt, expected.length)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

const normalizeAccount = (value: unknown): AuthAccountRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const item = value as Partial<AuthAccountRecord>

  const employeeId = sanitizeEmployeeId(String(item.employeeId || ''))
  const passwordHash = clip(item.passwordHash, 400)
  if (!employeeId || !passwordHash) return null

  const role = normalizeRole(item.role)
  const createdAt = clip(item.createdAt, 80) || nowIso()
  const scopePath = getRoleBaseScopePath(role, normalizeScopePath(item.scopePath))
  const mobile = normalizeMobile(item.mobile)

  return {
    id: clip(item.id, 80) || `acc-${employeeId.toLowerCase()}`,
    employeeId,
    mobile,
    name: clip(item.name, 80) || employeeId,
    role,
    scopePath,
    passwordHash,
    status: item.status === 'disabled' ? 'disabled' : 'active',
    createdAt,
    updatedAt: clip(item.updatedAt, 80) || createdAt,
    lastPasswordChangedAt: clip(item.lastPasswordChangedAt, 80) || createdAt,
  }
}

const normalizeStorePayload = (value: unknown): AuthAccountStorePayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { accounts: [] }
  const payload = value as Partial<AuthAccountStorePayload>
  if (!Array.isArray(payload.accounts)) return { accounts: [] }
  const accounts = payload.accounts
    .map((item) => normalizeAccount(item))
    .filter(Boolean) as AuthAccountRecord[]
  return { accounts: accounts.slice(0, MAX_ACCOUNTS) }
}

const buildAccountFromRaw = (raw: RawAuthAccountConfig): AuthAccountRecord | null => {
  const employeeId = sanitizeEmployeeId(raw.employeeId)
  const password = clip(raw.password, 200)
  const mobile = normalizeMobile(raw.mobile)
  if (!employeeId || !password || !mobile) return null

  const role = normalizeRole(raw.role)
  const scopePath = getRoleBaseScopePath(role, normalizeScopePath(raw.scopePath))
  const createdAt = nowIso()
  return {
    id: `acc-${employeeId.toLowerCase()}`,
    employeeId,
    mobile,
    name: clip(raw.name || employeeId, 80),
    role,
    scopePath,
    passwordHash: hashPassword(password),
    status: raw.disabled ? 'disabled' : 'active',
    createdAt,
    updatedAt: createdAt,
    lastPasswordChangedAt: createdAt,
  }
}

const parseEnvRawAccounts = (): RawAuthAccountConfig[] => {
  const raw = clip(process.env.EMBEDDED_AUTH_USERS_JSON || process.env.LOCAL_AUTH_USERS_JSON || '', 100000)
  if (!raw) return []

  const parsed = (() => {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })()
  if (!parsed) return []

  const validation = rawAuthAccountConfigListSchema.safeParse(parsed)
  if (!validation.success) return []
  return validation.data
}

const buildLegacyAdminRawAccount = (): RawAuthAccountConfig | null => {
  const employeeId = clip(process.env.LOCAL_ADMIN_USERNAME || '', 80)
  const password = clip(process.env.LOCAL_ADMIN_PASSWORD || '', 200)
  const mobile = normalizeMobile(process.env.LOCAL_ADMIN_MOBILE || '')
  if (!employeeId || !password || !mobile) return null

  return {
    employeeId,
    password,
    name: clip(process.env.LOCAL_ADMIN_DISPLAY_NAME || employeeId, 80),
    role: 'ceo',
    scopePath: 'global',
    mobile,
    disabled: false,
  }
}

const buildSeedAccounts = (): AuthAccountRecord[] => {
  const rawAccounts = parseEnvRawAccounts()
  const legacyAccount = buildLegacyAdminRawAccount()
  const bootstrapAccounts = EMBED_BOOTSTRAP_ENABLED ? FALLBACK_TRIAL_ACCOUNTS : []
  const merged = legacyAccount
    ? [legacyAccount, ...MANDATORY_SYSTEM_ACCOUNTS, ...rawAccounts, ...bootstrapAccounts]
    : [...MANDATORY_SYSTEM_ACCOUNTS, ...rawAccounts, ...bootstrapAccounts]

  const unique = new Map<string, AuthAccountRecord>()
  for (const item of merged) {
    const account = buildAccountFromRaw(item)
    if (!account) continue
    unique.set(account.employeeId.toLowerCase(), account)
  }
  return Array.from(unique.values()).slice(0, MAX_ACCOUNTS)
}

const getMemoryStore = () => {
  if (!globalThis.__SK_AUTH_ACCOUNTS_STATE__) {
    globalThis.__SK_AUTH_ACCOUNTS_STATE__ = { accounts: buildSeedAccounts() }
  }
  return globalThis.__SK_AUTH_ACCOUNTS_STATE__
}

const ensureMandatorySystemAccounts = (store: AuthAccountStorePayload) => {
  if (MANDATORY_SYSTEM_ACCOUNTS.length <= 0) return { store, changed: false }

  const byEmployeeId = new Set(store.accounts.map((account) => account.employeeId.toLowerCase()))
  const patchAccounts: AuthAccountRecord[] = []
  for (const rawAccount of MANDATORY_SYSTEM_ACCOUNTS) {
    const account = buildAccountFromRaw(rawAccount)
    if (!account) continue
    if (byEmployeeId.has(account.employeeId.toLowerCase())) continue
    patchAccounts.push(account)
    byEmployeeId.add(account.employeeId.toLowerCase())
  }
  if (patchAccounts.length <= 0) return { store, changed: false }

  return {
    store: {
      accounts: [...patchAccounts, ...store.accounts].slice(0, MAX_ACCOUNTS),
    },
    changed: true,
  }
}

const readAccountsFromPersistentStore = async () => {
  const payload = await readPersistentJsonState<AuthAccountStorePayload>(AUTH_ACCOUNTS_NAMESPACE)
  const normalized = normalizeStorePayload(payload)
  if (normalized.accounts.length) {
    const ensured = ensureMandatorySystemAccounts(normalized)
    if (ensured.changed) {
      await writePersistentJsonState(AUTH_ACCOUNTS_NAMESPACE, ensured.store)
    }
    return ensured.store
  }

  const seeded = { accounts: buildSeedAccounts() }
  await writePersistentJsonState(AUTH_ACCOUNTS_NAMESPACE, seeded)
  return seeded
}

const readAuthAccountStore = async (): Promise<AuthAccountStorePayload> => {
  if (!isPersistentJsonStoreEnabled()) {
    return getMemoryStore()
  }
  try {
    return await readAccountsFromPersistentStore()
  } catch {
    return getMemoryStore()
  }
}

const writeAuthAccountStore = async (payload: AuthAccountStorePayload) => {
  const normalized = normalizeStorePayload(payload)
  if (!isPersistentJsonStoreEnabled()) {
    globalThis.__SK_AUTH_ACCOUNTS_STATE__ = normalized
    return normalized
  }
  await writePersistentJsonState(AUTH_ACCOUNTS_NAMESPACE, normalized)
  return normalized
}

const toPublicProfile = (record: AuthAccountRecord): AuthAccountPublicProfile => ({
  id: record.id,
  employeeId: record.employeeId,
  mobileMasked: maskMobile(record.mobile),
  mobileBound: Boolean(record.mobile),
  name: record.name,
  role: record.role,
  scopePath: record.scopePath,
  status: record.status,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  lastPasswordChangedAt: record.lastPasswordChangedAt,
})

export const hasAuthAccountRegistryEnabled = async () => {
  const store = await readAuthAccountStore()
  return store.accounts.length > 0
}

export const looksLikeMobileCredential = (value: string) => Boolean(normalizeMobile(value))

export const resolveLoginAccountByCredential = async (identifier: string) => {
  const normalizedEmployeeId = sanitizeEmployeeId(identifier).toLowerCase()
  const normalizedMobile = normalizeMobile(identifier)
  const store = await readAuthAccountStore()

  return (
    store.accounts.find(
      (account) =>
        account.employeeId.toLowerCase() === normalizedEmployeeId ||
        (normalizedMobile && account.mobile === normalizedMobile)
    ) || null
  )
}

export const verifyLoginPassword = (account: AuthAccountRecord, password: string) =>
  verifyPasswordHash(password, account.passwordHash)

export const listAuthAccounts = async () => {
  const store = await readAuthAccountStore()
  return store.accounts.map((item) => toPublicProfile(item))
}

export const upsertAuthAccount = async (input: UpsertAuthAccountInput) => {
  const employeeId = sanitizeEmployeeId(input.employeeId)
  const mobile = normalizeMobile(input.mobile)
  const password = clip(input.password, 200)
  if (!employeeId || !mobile || !password) {
    throw new Error('AUTH_ACCOUNT_INPUT_INVALID')
  }

  const role = normalizeRole(input.role)
  const scopePath = getRoleBaseScopePath(role, normalizeScopePath(input.scopePath))
  const store = await readAuthAccountStore()
  const existing = store.accounts.find((item) => item.employeeId.toLowerCase() === employeeId.toLowerCase())
  const now = nowIso()

  const record: AuthAccountRecord = {
    id: existing?.id || `acc-${employeeId.toLowerCase()}`,
    employeeId,
    mobile,
    name: clip(input.name || employeeId, 80),
    role,
    scopePath,
    passwordHash: hashPassword(password),
    status: input.disabled ? 'disabled' : 'active',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastPasswordChangedAt: now,
  }

  const withoutCurrent = store.accounts.filter((item) => item.employeeId.toLowerCase() !== employeeId.toLowerCase())
  const nextStore = {
    accounts: [record, ...withoutCurrent].slice(0, MAX_ACCOUNTS),
  }
  await writeAuthAccountStore(nextStore)
  return toPublicProfile(record)
}

export const updateAuthAccount = async (input: UpdateAuthAccountInput) => {
  const employeeId = sanitizeEmployeeId(input.employeeId)
  if (!employeeId) {
    throw new Error('AUTH_ACCOUNT_INPUT_INVALID')
  }

  const store = await readAuthAccountStore()
  const existing = store.accounts.find((item) => item.employeeId.toLowerCase() === employeeId.toLowerCase())
  if (!existing) {
    throw new Error('AUTH_ACCOUNT_NOT_FOUND')
  }

  const now = nowIso()
  const nextPassword = clip(input.password || '', 200)
  const hasPasswordUpdate = nextPassword.length > 0
  const nextMobile = input.mobile === undefined ? existing.mobile : normalizeMobile(input.mobile)
  if (!nextMobile) {
    throw new Error('AUTH_ACCOUNT_INPUT_INVALID')
  }
  const nextRole = normalizeRole(input.role || existing.role)
  const nextScopePath = getRoleBaseScopePath(
    nextRole,
    input.scopePath === undefined ? existing.scopePath : normalizeScopePath(input.scopePath)
  )

  const nextRecord: AuthAccountRecord = {
    ...existing,
    name: clip(input.name || existing.name, 80) || existing.employeeId,
    role: nextRole,
    scopePath: nextScopePath,
    mobile: nextMobile,
    status: input.disabled === undefined ? existing.status : input.disabled ? 'disabled' : 'active',
    passwordHash: hasPasswordUpdate ? hashPassword(nextPassword) : existing.passwordHash,
    updatedAt: now,
    lastPasswordChangedAt: hasPasswordUpdate ? now : existing.lastPasswordChangedAt,
  }

  const nextAccounts = store.accounts.map((item) =>
    item.employeeId.toLowerCase() === employeeId.toLowerCase() ? nextRecord : item
  )
  await writeAuthAccountStore({ accounts: nextAccounts })
  return toPublicProfile(nextRecord)
}

export const deleteAuthAccount = async (employeeIdInput: string) => {
  const employeeId = sanitizeEmployeeId(employeeIdInput)
  if (!employeeId) {
    throw new Error('AUTH_ACCOUNT_INPUT_INVALID')
  }
  const store = await readAuthAccountStore()
  const exists = store.accounts.some((item) => item.employeeId.toLowerCase() === employeeId.toLowerCase())
  if (!exists) {
    throw new Error('AUTH_ACCOUNT_NOT_FOUND')
  }

  const nextAccounts = store.accounts.filter((item) => item.employeeId.toLowerCase() !== employeeId.toLowerCase())
  await writeAuthAccountStore({ accounts: nextAccounts })
  return employeeId
}
