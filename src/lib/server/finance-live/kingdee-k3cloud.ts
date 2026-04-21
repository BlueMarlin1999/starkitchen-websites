import { z } from 'zod'
import { METRIC_SLUGS, MetricSlug } from '@/lib/business-metrics'
import type { FinanceLiveIngestPayload, FinanceLiveIngestScope } from '@/lib/finance-live-types'

type ScopeMap = Record<string, string[]>
type MetricFieldMap = Partial<Record<MetricSlug, string>>

interface KingdeeSession {
  sessionId: string
  kdsvcSessionId: string
}

interface KingdeeK3CloudConfig {
  baseUrl: string
  baseUrlHint: string
  acctId: string
  username: string
  appId: string
  appSecret: string
  lcid: string
  cloudVersion: string
  formId: string
  fieldKeys: string[]
  filterString: string
  orderString: string
  startRow: number
  limit: number
  topRowCount: number
  timeoutMs: number
  retryAttempts: number
  retryDelayMs: number
  defaultScopePath: string[]
  scopeField: string
  orgField: string
  scopeMap: ScopeMap
  metricFieldMap: MetricFieldMap
}

export const KINGDEE_REQUIRED_ENV_KEYS = [
  'KINGDEE_K3CLOUD_BASE_URL',
  'KINGDEE_K3CLOUD_ACCT_ID',
  'KINGDEE_K3CLOUD_USERNAME',
  'KINGDEE_K3CLOUD_APP_ID',
  'KINGDEE_K3CLOUD_APP_SECRET',
  'KINGDEE_K3CLOUD_FORM_ID',
] as const

type KingdeeRequiredEnvKey = (typeof KINGDEE_REQUIRED_ENV_KEYS)[number]

const getMissingRequiredEnvKeys = (): KingdeeRequiredEnvKey[] =>
  KINGDEE_REQUIRED_ENV_KEYS.filter((key) => clip(process.env[key], '', 600).length <= 0)

const hasMetricMappingConfigured = () => {
  if (Object.keys(metricFieldMapFromEnv()).length > 0) return true
  return parseCsv(process.env.KINGDEE_K3CLOUD_FIELD_KEYS).length > 0
}

export interface KingdeePullProbe {
  provider: 'kingdee-k3cloud'
  baseUrlHint: string
  formId: string
  fieldCount: number
  rowCount: number
  scopeCount: number
  generatedAt: string
}

const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_LIMIT = 500
const DEFAULT_SCOPE_PATH = ['global']
const DEFAULT_RETRY_ATTEMPTS = 2
const DEFAULT_RETRY_DELAY_MS = 600
const nowIso = () => new Date().toISOString()

const METRIC_CANDIDATES: Record<MetricSlug, string[]> = {
  revenue: ['FRevenue', 'Revenue', '营业收入', '收入'],
  'food-cost': ['FFoodCost', 'FoodCost', '食材成本', '材料成本'],
  'labor-cost': ['FLaborCost', 'LaborCost', '人力成本'],
  rent: ['FRent', 'Rent', '租金'],
  energy: ['FEnergy', 'EnergyCost', '能耗成本', '能源成本'],
  'other-material-cost': ['FOtherMaterialCost', 'OtherMaterialCost', '其他物料成本'],
  'marketing-cost': ['FMarketingCost', 'MarketingCost', '营销费用'],
  'maintenance-logistics-cost': ['FMaintenanceLogisticsCost', 'MaintenanceLogisticsCost', '维护物流成本'],
  tax: ['FTax', 'Tax', '税费'],
  interest: ['FInterest', 'Interest', '利息'],
  'depreciation-amortization': ['FDepreciationAmortization', 'DepreciationAmortization', '折旧摊销'],
  'operating-profit': ['FOperatingProfit', 'OperatingProfit', '营业利润'],
  'management-cost': ['FManagementCost', 'ManagementCost', '管理费用'],
  'net-profit': ['FNetProfit', 'NetProfit', '净利润'],
}

const clip = (value: unknown, fallback = '', max = 600) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const toInt = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(clip(value, '', 24), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const wait = async (delayMs: number) => {
  if (delayMs <= 0) return
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

const parseScopePath = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((segment) => clip(segment, '', 100).toLowerCase())
      .filter(Boolean)
  }
  return clip(value, '', 400)
    .split(/[>\/,，|]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean)
}

const parseCsv = (raw: unknown) =>
  clip(raw, '', 4000)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const parseJsonRecord = (value: unknown) => {
  const raw = clip(value, '', 10_000)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    const validated = z.record(z.string(), z.unknown()).safeParse(parsed)
    return validated.success ? validated.data : {}
  } catch {
    return {}
  }
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')

const sanitizeEndpointHint = (url: string) => {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return url.slice(0, 220)
  }
}

const normalizeScopeMap = (rawMap: Record<string, unknown>) => {
  const result: ScopeMap = {}
  for (const [key, value] of Object.entries(rawMap)) {
    const orgCode = clip(key, '', 120)
    if (!orgCode) continue
    const scopePath = parseScopePath(value)
    if (scopePath.length <= 0) continue
    result[orgCode] = scopePath
  }
  return result
}

const normalizeMetricFieldMap = (rawMap: Record<string, unknown>) => {
  const result: MetricFieldMap = {}
  const slugSet = new Set<string>(METRIC_SLUGS)
  for (const [key, value] of Object.entries(rawMap)) {
    const slug = clip(key, '', 80)
    if (!slugSet.has(slug)) continue
    const field = clip(value, '', 120)
    if (!field) continue
    result[slug as MetricSlug] = field
  }
  return result
}

const collectFieldKeys = (seed: string[], metricFieldMap: MetricFieldMap, scopeField: string, orgField: string) => {
  const set = new Set(seed)
  set.add(scopeField)
  set.add(orgField)
  for (const field of Object.values(metricFieldMap)) {
    if (field) set.add(field)
  }
  return Array.from(set)
}

const metricFieldMapFromEnv = (): MetricFieldMap => {
  const parsed = normalizeMetricFieldMap(parseJsonRecord(process.env.KINGDEE_K3CLOUD_METRIC_MAP_JSON))
  return Object.keys(parsed).length > 0 ? parsed : {}
}

const scopeMapFromEnv = (): ScopeMap =>
  normalizeScopeMap(parseJsonRecord(process.env.KINGDEE_K3CLOUD_SCOPE_MAP_JSON))

const buildKingdeeConfig = (): KingdeeK3CloudConfig => {
  const baseUrlRaw = clip(process.env.KINGDEE_K3CLOUD_BASE_URL, '', 600)
  const acctId = clip(process.env.KINGDEE_K3CLOUD_ACCT_ID, '', 120)
  const username = clip(process.env.KINGDEE_K3CLOUD_USERNAME, '', 120)
  const appId = clip(process.env.KINGDEE_K3CLOUD_APP_ID, '', 300)
  const appSecret = clip(process.env.KINGDEE_K3CLOUD_APP_SECRET, '', 300)
  const formId = clip(process.env.KINGDEE_K3CLOUD_FORM_ID, '', 120)

  if (!baseUrlRaw || !acctId || !username || !appId || !appSecret || !formId) {
    throw new Error('金蝶配置不完整：需配置 BASE_URL/ACCT_ID/USERNAME/APP_ID/APP_SECRET/FORM_ID')
  }

  const scopeField = clip(process.env.KINGDEE_K3CLOUD_SCOPE_FIELD, 'FScopePath', 120) || 'FScopePath'
  const orgField = clip(process.env.KINGDEE_K3CLOUD_ORG_FIELD, 'FOrgNumber', 120) || 'FOrgNumber'
  const metricFieldMap = metricFieldMapFromEnv()
  const defaultFieldKeys = parseCsv(process.env.KINGDEE_K3CLOUD_FIELD_KEYS)
  const fieldKeys = collectFieldKeys(defaultFieldKeys, metricFieldMap, scopeField, orgField)
  if (fieldKeys.length <= 2) {
    throw new Error('金蝶字段映射不完整：请至少配置一个指标字段（KINGDEE_K3CLOUD_FIELD_KEYS 或 METRIC_MAP_JSON）。')
  }

  const parsedDefaultScopePath = parseScopePath(process.env.KINGDEE_K3CLOUD_DEFAULT_SCOPE_PATH || '')
  return {
    baseUrl: normalizeBaseUrl(baseUrlRaw),
    baseUrlHint: sanitizeEndpointHint(baseUrlRaw),
    acctId,
    username,
    appId,
    appSecret,
    lcid: clip(process.env.KINGDEE_K3CLOUD_LCID, '2052', 10) || '2052',
    cloudVersion: clip(process.env.KINGDEE_K3CLOUD_CLOUD_VERSION, '', 40),
    formId,
    fieldKeys,
    filterString: clip(process.env.KINGDEE_K3CLOUD_FILTER_STRING, '', 500),
    orderString: clip(process.env.KINGDEE_K3CLOUD_ORDER_STRING, '', 300),
    startRow: toInt(process.env.KINGDEE_K3CLOUD_START_ROW, 0, 0, 1_000_000),
    limit: toInt(process.env.KINGDEE_K3CLOUD_LIMIT, DEFAULT_LIMIT, 1, 50_000),
    topRowCount: toInt(process.env.KINGDEE_K3CLOUD_TOP_ROW_COUNT, 0, 0, 50_000),
    timeoutMs: toInt(process.env.KINGDEE_K3CLOUD_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 3_000, 60_000),
    retryAttempts: toInt(process.env.KINGDEE_K3CLOUD_RETRY_ATTEMPTS, DEFAULT_RETRY_ATTEMPTS, 1, 5),
    retryDelayMs: toInt(process.env.KINGDEE_K3CLOUD_RETRY_DELAY_MS, DEFAULT_RETRY_DELAY_MS, 100, 10_000),
    defaultScopePath: parsedDefaultScopePath.length > 0 ? parsedDefaultScopePath : DEFAULT_SCOPE_PATH,
    scopeField,
    orgField,
    scopeMap: scopeMapFromEnv(),
    metricFieldMap,
  }
}

export const isKingdeePullConfigured = () => {
  try {
    buildKingdeeConfig()
    return true
  } catch {
    return false
  }
}

export const getKingdeeConfigSummary = () => {
  const missingRequiredEnvKeys = getMissingRequiredEnvKeys()
  const metricMappingConfigured = hasMetricMappingConfigured()
  try {
    const config = buildKingdeeConfig()
    return {
      configured: true,
      baseUrlHint: config.baseUrlHint,
      formId: config.formId,
      fieldCount: config.fieldKeys.length,
      missingRequiredEnvKeys,
      metricMappingConfigured,
    }
  } catch (error) {
    return {
      configured: false,
      baseUrlHint: '',
      formId: '',
      fieldCount: 0,
      missingRequiredEnvKeys,
      metricMappingConfigured,
      message: error instanceof Error ? error.message : 'UNKNOWN',
    }
  }
}

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

class KingdeeRequestError extends Error {
  status: number
  retryable: boolean

  constructor(message: string, status = 500, retryable = false) {
    super(message)
    this.name = 'KingdeeRequestError'
    this.status = status
    this.retryable = retryable
  }
}

const extractMessageFromPayload = (payload: unknown) => {
  if (typeof payload === 'string') return clip(payload, '', 300)
  if (!isRecord(payload)) return ''
  return (
    clip(payload.message, '', 300) ||
    clip(payload.Message, '', 300) ||
    clip(payload.msg, '', 300) ||
    clip(payload.Msg, '', 300)
  )
}

const extractBusinessFailureMessage = (payload: unknown) => {
  if (!isRecord(payload)) return ''
  const statusNode = isRecord(payload.ResponseStatus)
    ? payload.ResponseStatus
    : isRecord(payload.Result) && isRecord(payload.Result.ResponseStatus)
      ? payload.Result.ResponseStatus
      : null
  if (!statusNode) return ''
  const success =
    statusNode.IsSuccess === true ||
    clip(statusNode.IsSuccess, '', 8).toLowerCase() === 'true'
  if (success) return ''

  const errors = Array.isArray(statusNode.Errors) ? statusNode.Errors : []
  for (const item of errors) {
    if (!isRecord(item)) continue
    const message = clip(item.Message, '', 300) || clip(item.DetailedMessage, '', 300)
    if (message) return message
  }
  return clip(statusNode.Message, '', 300) || '金蝶业务校验失败'
}

const postJson = async (url: string, body: Record<string, unknown>, timeoutMs: number, headers?: Headers) => {
  const merged = headers || new Headers()
  if (!merged.has('Content-Type')) merged.set('Content-Type', 'application/json')
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: merged,
      body: JSON.stringify(body),
      cache: 'no-store',
    },
    timeoutMs
  )
  const text = await response.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  if (!response.ok) {
    const detail = extractMessageFromPayload(parsed)
    throw new KingdeeRequestError(
      detail ? `金蝶请求失败(${response.status})：${detail}` : `金蝶请求失败(${response.status})`,
      response.status,
      response.status >= 500 || response.status === 429 || response.status === 408
    )
  }
  const businessFailure = extractBusinessFailureMessage(parsed)
  if (businessFailure) {
    throw new KingdeeRequestError(`金蝶业务校验失败：${businessFailure}`, 422, false)
  }
  return parsed
}

const withRetry = async <T>(task: () => Promise<T>, config: KingdeeK3CloudConfig) => {
  let attempt = 0
  let lastError: unknown = null
  while (attempt < config.retryAttempts) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      const retryable = error instanceof KingdeeRequestError ? error.retryable : true
      const isLastAttempt = attempt >= config.retryAttempts - 1
      if (!retryable || isLastAttempt) break
      attempt += 1
      await wait(config.retryDelayMs * attempt)
    }
  }
  if (lastError instanceof Error) throw lastError
  throw new Error('金蝶请求失败：未知错误')
}

const loginByAppSecret = async (config: KingdeeK3CloudConfig): Promise<KingdeeSession> => {
  const payload = {
    cloudUrl: config.baseUrl,
    acctID: config.acctId,
    username: config.username,
    appId: config.appId,
    appSecret: config.appSecret,
    lcid: config.lcid,
    cloudVersion: config.cloudVersion,
  }
  const url = `${config.baseUrl}/Kingdee.BOS.WebApi.ServicesStub.AuthService.LoginByAppSecret.common.kdsvc`
  const loginResponse = await withRetry(() => postJson(url, payload, config.timeoutMs), config)
  if (!isRecord(loginResponse)) throw new Error('金蝶登录返回格式异常')
  const loginResultType = clip(loginResponse.LoginResultType, '', 20)
  if (loginResultType !== '1') {
    const message = clip(loginResponse.Message, '金蝶登录失败', 300) || '金蝶登录失败'
    throw new Error(message)
  }
  const context = isRecord(loginResponse.Context) ? loginResponse.Context : {}
  const sessionId = clip(context.SessionId, '', 200)
  const kdsvcSessionId = clip(loginResponse.KDSVCSessionId, '', 200)
  if (!sessionId || !kdsvcSessionId) throw new Error('金蝶登录成功但会话信息缺失')
  return { sessionId, kdsvcSessionId }
}

const buildExecuteBillQueryPayload = (config: KingdeeK3CloudConfig) => ({
  FormId: config.formId,
  FieldKeys: config.fieldKeys.join(','),
  FilterString: config.filterString,
  OrderString: config.orderString,
  StartRow: config.startRow,
  Limit: config.limit,
  TopRowCount: config.topRowCount,
})

const executeBillQuery = async (config: KingdeeK3CloudConfig, session: KingdeeSession) => {
  const queryHeaders = new Headers()
  queryHeaders.set('SessionId', session.sessionId)
  queryHeaders.set('KDSVCSessionId', session.kdsvcSessionId)
  const url = `${config.baseUrl}/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc`
  return withRetry(
    () => postJson(url, buildExecuteBillQueryPayload(config), config.timeoutMs, queryHeaders),
    config
  )
}

type KingdeeRow = unknown[] | Record<string, unknown>

const normalizeRows = (payload: unknown): KingdeeRow[] => {
  const candidates: unknown[] = [payload]
  if (isRecord(payload)) {
    candidates.push(payload.Result)
    candidates.push(payload.Data)
    candidates.push(payload.data)
    if (isRecord(payload.Result)) {
      candidates.push(payload.Result.Result)
      candidates.push(payload.Result.Data)
    }
  }

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    if (candidate.every((item) => Array.isArray(item) || isRecord(item))) {
      return candidate as KingdeeRow[]
    }
  }
  return []
}

const rowToObject = (row: KingdeeRow, fieldKeys: string[]) => {
  if (isRecord(row)) return row
  const record: Record<string, unknown> = {}
  for (let index = 0; index < fieldKeys.length; index += 1) {
    record[fieldKeys[index]] = row[index]
  }
  return record
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim()
    if (!normalized) return Number.NaN
    const parsed = Number.parseFloat(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return Number.NaN
}

const resolveScopePath = (record: Record<string, unknown>, config: KingdeeK3CloudConfig) => {
  const directScope = parseScopePath(record[config.scopeField])
  if (directScope.length > 0) return directScope
  const orgCode = clip(record[config.orgField], '', 120)
  if (orgCode && config.scopeMap[orgCode]) return config.scopeMap[orgCode]
  return config.defaultScopePath
}

const findMetricValue = (
  metricSlug: MetricSlug,
  record: Record<string, unknown>,
  config: KingdeeK3CloudConfig
) => {
  const explicitField = config.metricFieldMap[metricSlug]
  const candidateFields = explicitField ? [explicitField] : METRIC_CANDIDATES[metricSlug] || []
  for (const field of candidateFields) {
    const numeric = toNumber(record[field])
    if (Number.isFinite(numeric)) return Math.max(0, Number(numeric.toFixed(2)))
  }
  return Number.NaN
}

const mapRecordToScope = (record: Record<string, unknown>, config: KingdeeK3CloudConfig, updatedAt: string) => {
  const scopePath = resolveScopePath(record, config)
  if (scopePath.length <= 0) return null
  const metrics: NonNullable<FinanceLiveIngestScope['metrics']> = {}
  for (const metricSlug of METRIC_SLUGS) {
    const value = findMetricValue(metricSlug, record, config)
    if (!Number.isFinite(value)) continue
    metrics[metricSlug] = { value, unit: '万元', monthlyValues: [], updatedAt }
  }
  if (Object.keys(metrics).length <= 0) return null
  return { scopePath, metrics, updatedAt }
}

const mergeIngestScopes = (scopes: FinanceLiveIngestScope[]) => {
  const merged = new Map<string, FinanceLiveIngestScope>()
  for (const scope of scopes) {
    const path = parseScopePath(scope.scopePath)
    const key = path.join('/')
    if (!key) continue
    const current = merged.get(key) || { scopePath: path, metrics: {}, segments: [], updatedAt: scope.updatedAt }
    const incomingMetrics = scope.metrics || {}
    for (const metricSlug of METRIC_SLUGS) {
      const incoming = incomingMetrics[metricSlug]
      if (!incoming) continue
      const existing = current.metrics?.[metricSlug]
      const nextValue = (existing?.value || 0) + incoming.value
      current.metrics = current.metrics || {}
      current.metrics[metricSlug] = {
        value: Number(nextValue.toFixed(2)),
        unit: incoming.unit || existing?.unit || '万元',
        monthlyValues: existing?.monthlyValues || incoming.monthlyValues || [],
        updatedAt: incoming.updatedAt || existing?.updatedAt || nowIso(),
      }
    }
    current.updatedAt = scope.updatedAt || current.updatedAt || nowIso()
    merged.set(key, current)
  }
  return Array.from(merged.values())
}

const fetchIngestScopesFromKingdee = async (config: KingdeeK3CloudConfig) => {
  const session = await loginByAppSecret(config)
  const queryResult = await executeBillQuery(config, session)
  const rows = normalizeRows(queryResult)
  const updatedAt = nowIso()
  const scopes = rows
    .map((row) => rowToObject(row, config.fieldKeys))
    .map((record) => mapRecordToScope(record, config, updatedAt))
    .filter(Boolean) as FinanceLiveIngestScope[]
  return {
    scopes: mergeIngestScopes(scopes),
    rowCount: rows.length,
    updatedAt,
  }
}

export const fetchKingdeeFinanceIngestPayload = async (): Promise<{
  payload: FinanceLiveIngestPayload
  probe: KingdeePullProbe
}> => {
  const config = buildKingdeeConfig()
  const result = await fetchIngestScopesFromKingdee(config)
  const payload: FinanceLiveIngestPayload = {
    source: 'kingdee-k3cloud',
    scopes: result.scopes,
  }
  return {
    payload,
    probe: {
      provider: 'kingdee-k3cloud',
      baseUrlHint: config.baseUrlHint,
      formId: config.formId,
      fieldCount: config.fieldKeys.length,
      rowCount: result.rowCount,
      scopeCount: result.scopes.length,
      generatedAt: result.updatedAt,
    },
  }
}
