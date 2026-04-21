import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  METRIC_SLUGS,
  MetricSlug,
  SCOPE_HIERARCHY_NODES,
  getScopedFinancialMetric,
} from '@/lib/business-metrics'
import {
  FinanceLiveIngestPayload,
  FinanceLiveIngestScope,
  FinanceLiveMetricSnapshot,
  FinanceLiveScopeSnapshot,
  FinanceLiveSegmentSnapshot,
  FinanceLiveState,
} from '@/lib/finance-live-types'
import {
  OperatingSegmentKey,
  SegmentComponentAmount,
  getScopeOperatingSegmentDetail,
  getScopeOperatingSegmentRows,
} from '@/lib/finance-granularity'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'
import { fetchKingdeeFinanceIngestPayload } from '@/lib/server/finance-live/kingdee-k3cloud'

const DEFAULT_FINANCE_DATA_DIR = '/tmp/starkitchen-finance-live'
const STATE_FILE_NAME = 'state.json'
const FINANCE_LIVE_STATE_NAMESPACE = 'finance/live/state'
const REMOTE_PULL_TIMEOUT_MS = 15_000
const SEGMENT_KEYS: OperatingSegmentKey[] = [
  'breakfast',
  'lunch',
  'tea-break',
  'dinner',
  'night-snack',
  'banquet',
]

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 120) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const round2 = (value: number) => Number(value.toFixed(2))

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const normalizeScopePath = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((segment) => clip(segment, '', 80).toLowerCase())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[>\/,]+/)
      .map((segment) => clip(segment, '', 80).toLowerCase())
      .filter(Boolean)
  }

  return []
}

const scopePathToKey = (scopePath: string[]) => scopePath.join('/')

const normalizeMonthlyValues = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => round2(Math.max(0, toNumber(item, 0))))
    .filter((item) => Number.isFinite(item))
    .slice(0, 24)
}

const normalizeMetricSnapshot = (
  value: unknown,
  metricSlug: MetricSlug,
  source: string
): FinanceLiveMetricSnapshot | null => {
  if (!isRecord(value)) return null
  const numeric = round2(Math.max(0, toNumber(value.value, Number.NaN)))
  if (!Number.isFinite(numeric)) return null

  return {
    value: numeric,
    unit: clip(value.unit, '万元', 16) || '万元',
    monthlyValues: normalizeMonthlyValues(value.monthlyValues),
    updatedAt: clip(value.updatedAt, nowIso(), 80),
    source: clip(value.source, source || `metric:${metricSlug}`, 80),
  }
}

const normalizeComponent = (value: unknown): SegmentComponentAmount | null => {
  if (!isRecord(value)) return null
  const id = clip(value.id, '', 80)
  const label = clip(value.label, '', 120)
  if (!id || !label) return null

  const share = Math.max(0, toNumber(value.share, 0))
  return {
    id,
    label,
    share: round2(share),
    amount: round2(Math.max(0, toNumber(value.amount, 0))),
  }
}

const normalizeComponents = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => normalizeComponent(item)).filter(Boolean) as SegmentComponentAmount[]
}

const resolveSegmentRate = (input: unknown, numerator: number, denominator: number) => {
  const explicitValue = toNumber(input, Number.NaN)
  if (Number.isFinite(explicitValue)) return round2(Math.max(0, explicitValue))
  if (denominator <= 0) return 0
  return round2((numerator / denominator) * 100)
}

const normalizeSegmentCoreAmounts = (value: Record<string, unknown>) => {
  const revenue = round2(Math.max(0, toNumber(value.revenue, Number.NaN)))
  const foodCost = round2(Math.max(0, toNumber(value.foodCost, Number.NaN)))
  const laborCost = round2(Math.max(0, toNumber(value.laborCost, Number.NaN)))
  if (!Number.isFinite(revenue) || !Number.isFinite(foodCost) || !Number.isFinite(laborCost)) return null

  const operatingProfitInput = toNumber(value.operatingProfit, Number.NaN)
  const operatingProfit = round2(
    Number.isFinite(operatingProfitInput) ? operatingProfitInput : revenue - foodCost - laborCost
  )
  const revenueShareInput = toNumber(value.revenueShare, Number.NaN)
  const revenueShare = round2(Number.isFinite(revenueShareInput) ? Math.max(0, revenueShareInput) : 0)

  return { revenue, foodCost, laborCost, operatingProfit, revenueShare }
}

const normalizeSegment = (value: unknown): FinanceLiveSegmentSnapshot | null => {
  if (!isRecord(value)) return null
  const key = clip(value.key, '', 40) as OperatingSegmentKey
  if (!SEGMENT_KEYS.includes(key)) return null
  const label = clip(value.label, '', 80)
  if (!label) return null

  const amountSnapshot = normalizeSegmentCoreAmounts(value)
  if (!amountSnapshot) return null
  const { revenue, foodCost, laborCost, operatingProfit, revenueShare } = amountSnapshot
  const foodCostRate = resolveSegmentRate(value.foodCostRate, foodCost, revenue)
  const laborCostRate = resolveSegmentRate(value.laborCostRate, laborCost, revenue)
  const operatingMargin = resolveSegmentRate(value.operatingMargin, operatingProfit, revenue)

  return {
    key,
    label,
    revenue,
    foodCost,
    laborCost,
    operatingProfit,
    revenueShare,
    foodCostRate,
    laborCostRate,
    operatingMargin,
    revenueComponents: normalizeComponents(value.revenueComponents),
    foodCostComponents: normalizeComponents(value.foodCostComponents),
    laborCostComponents: normalizeComponents(value.laborCostComponents),
  }
}

const normalizeScopeSnapshot = (
  value: unknown,
  fallbackSource = 'ingest'
): FinanceLiveScopeSnapshot | null => {
  if (!isRecord(value)) return null
  const scopePath = normalizeScopePath(value.scopePath)
  if (scopePath.length === 0) return null
  const scopeKey = scopePathToKey(scopePath)
  const source = clip(value.source, fallbackSource, 80) || fallbackSource
  const metrics: Partial<Record<MetricSlug, FinanceLiveMetricSnapshot>> = {}
  const metricRecord = isRecord(value.metrics) ? value.metrics : {}

  for (const metricSlug of METRIC_SLUGS) {
    const normalizedMetric = normalizeMetricSnapshot(metricRecord[metricSlug], metricSlug, source)
    if (normalizedMetric) {
      metrics[metricSlug] = normalizedMetric
    }
  }

  const segmentsInput = Array.isArray(value.segments) ? value.segments : []
  const segments = segmentsInput
    .map((item) => normalizeSegment(item))
    .filter(Boolean) as FinanceLiveSegmentSnapshot[]

  return {
    scopePath,
    scopeKey,
    metrics,
    segments,
    updatedAt: clip(value.updatedAt, nowIso(), 80),
    source,
  }
}

const buildInitialState = (): FinanceLiveState => ({
  scopes: {},
  updatedAt: nowIso(),
  source: 'none',
})

const normalizeState = (value: unknown): FinanceLiveState => {
  if (!isRecord(value)) return buildInitialState()

  const rawScopes = isRecord(value.scopes) ? value.scopes : {}
  const scopes = Object.values(rawScopes).reduce<Record<string, FinanceLiveScopeSnapshot>>((acc, item) => {
    const normalized = normalizeScopeSnapshot(item, clip(value.source, 'ingest', 80))
    if (!normalized) return acc
    acc[normalized.scopeKey] = normalized
    return acc
  }, {})

  return {
    scopes,
    updatedAt: clip(value.updatedAt, nowIso(), 80),
    source: clip(value.source, Object.keys(scopes).length > 0 ? 'ingest' : 'none', 80),
  }
}

const getDataDir = () =>
  (process.env.FINANCE_LIVE_DATA_DIR || DEFAULT_FINANCE_DATA_DIR).trim() || DEFAULT_FINANCE_DATA_DIR

const ensureDataDir = async () => {
  const target = getDataDir()
  await mkdir(target, { recursive: true })
  return target
}

const getStateFilePath = async () => {
  const dataDir = await ensureDataDir()
  return join(dataDir, STATE_FILE_NAME)
}

const readFinanceLiveStateFromDisk = async (): Promise<FinanceLiveState> => {
  try {
    const stateFilePath = await getStateFilePath()
    const raw = await readFile(stateFilePath, 'utf8')
    return normalizeState(JSON.parse(raw))
  } catch {
    return buildInitialState()
  }
}

const writeFinanceLiveStateToDisk = async (state: FinanceLiveState) => {
  const normalized = normalizeState(state)
  const stateFilePath = await getStateFilePath()
  await writeFile(stateFilePath, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}

const readFinanceLiveStateFromStore = async (): Promise<FinanceLiveState> => {
  const payload = await readPersistentJsonState<FinanceLiveState>(FINANCE_LIVE_STATE_NAMESPACE)
  if (payload) return normalizeState(payload)

  const seeded = await readFinanceLiveStateFromDisk()
  await writePersistentJsonState(FINANCE_LIVE_STATE_NAMESPACE, seeded)
  return seeded
}

export const readFinanceLiveState = async (): Promise<FinanceLiveState> => {
  if (!isPersistentJsonStoreEnabled()) {
    return readFinanceLiveStateFromDisk()
  }

  try {
    return await readFinanceLiveStateFromStore()
  } catch {
    return readFinanceLiveStateFromDisk()
  }
}

export const writeFinanceLiveState = async (state: FinanceLiveState) => {
  const normalized = normalizeState(state)
  if (!isPersistentJsonStoreEnabled()) {
    return writeFinanceLiveStateToDisk(normalized)
  }

  try {
    await writePersistentJsonState(FINANCE_LIVE_STATE_NAMESPACE, normalized)
    return normalized
  } catch {
    return writeFinanceLiveStateToDisk(normalized)
  }
}

export const upsertFinanceLiveScopes = async (
  scopesInput: FinanceLiveIngestScope[],
  source = 'ingest'
) => {
  const state = await readFinanceLiveState()
  let upserted = 0

  for (const scopeInput of scopesInput) {
    const normalized = normalizeScopeSnapshot(
      {
        ...scopeInput,
        source,
      },
      source
    )
    if (!normalized) continue
    state.scopes[normalized.scopeKey] = normalized
    upserted += 1
  }

  if (upserted > 0) {
    state.updatedAt = nowIso()
    state.source = source
    await writeFinanceLiveState(state)
  }

  return {
    upserted,
    totalScopes: Object.keys(state.scopes).length,
    updatedAt: state.updatedAt,
    source: state.source,
  }
}

export const importFinanceLivePayload = async (
  payload: unknown,
  sourceFallback = 'ingest'
) => {
  const record = isRecord(payload) ? payload : {}
  const source = clip(record.source, sourceFallback, 80) || sourceFallback
  const scopes: FinanceLiveIngestScope[] = []

  if (Array.isArray(record.scopes)) {
    for (const item of record.scopes) {
      if (isRecord(item)) {
        scopes.push(item as FinanceLiveIngestScope)
      }
    }
  }

  if (isRecord(record.scope)) {
    scopes.push(record.scope as FinanceLiveIngestScope)
  }

  if (scopes.length === 0 && Array.isArray(payload)) {
    for (const item of payload) {
      if (isRecord(item)) {
        scopes.push(item as FinanceLiveIngestScope)
      }
    }
  }

  if (scopes.length === 0 && isRecord(payload) && 'scopePath' in payload) {
    scopes.push(payload as FinanceLiveIngestScope)
  }

  return upsertFinanceLiveScopes(scopes, source)
}

const buildBaselineScopeSeed = (scopePath: string[], updatedAt: string): FinanceLiveIngestScope | null => {
  if (!Array.isArray(scopePath) || scopePath.length === 0) return null

  const metrics: NonNullable<FinanceLiveIngestScope['metrics']> = {}
  for (const metricSlug of METRIC_SLUGS) {
    const metric = getScopedFinancialMetric(metricSlug, scopePath)
    if (!metric) continue
    metrics[metricSlug] = {
      value: round2(Math.max(0, metric.value)),
      unit: clip(metric.unit, '万元', 16) || '万元',
      monthlyValues: metric.monthlyValues.map((value) => round2(Math.max(0, value))).slice(0, 24),
      updatedAt,
    }
  }

  const segmentRows = getScopeOperatingSegmentRows(scopePath)
  const segments = segmentRows.map((segment) => {
    const detail = getScopeOperatingSegmentDetail(scopePath, segment.key)
    return {
      ...segment,
      revenueComponents: detail?.revenueComponents || [],
      foodCostComponents: detail?.foodCostComponents || [],
      laborCostComponents: detail?.laborCostComponents || [],
    }
  })

  if (Object.keys(metrics).length === 0 && segments.length === 0) return null
  return {
    scopePath,
    metrics,
    segments,
    updatedAt,
  }
}

export const seedFinanceLiveFromBaseline = async (options?: {
  source?: string
  scopePaths?: Array<string[] | string>
}) => {
  const source = clip(options?.source, 'baseline-seed', 80) || 'baseline-seed'
  const requestedPaths = Array.isArray(options?.scopePaths)
    ? options.scopePaths
        .map((item) => normalizeScopePath(item))
        .filter((scopePath) => scopePath.length > 0)
    : []

  const candidatePaths =
    requestedPaths.length > 0 ? requestedPaths : SCOPE_HIERARCHY_NODES.map((node) => node.path)
  const deduplicatedPaths: string[][] = []
  const seen = new Set<string>()
  for (const scopePath of candidatePaths) {
    const key = scopePathToKey(scopePath)
    if (!key || seen.has(key)) continue
    seen.add(key)
    deduplicatedPaths.push(scopePath)
  }

  const updatedAt = nowIso()
  const scopes = deduplicatedPaths
    .map((scopePath) => buildBaselineScopeSeed(scopePath, updatedAt))
    .filter((item): item is FinanceLiveIngestScope => Boolean(item))

  if (scopes.length === 0) {
    const state = await readFinanceLiveState()
    return {
      upserted: 0,
      totalScopes: Object.keys(state.scopes).length,
      updatedAt: state.updatedAt,
      source: state.source,
      seededScopes: 0,
    }
  }

  const imported = await upsertFinanceLiveScopes(scopes, source)
  return {
    ...imported,
    seededScopes: scopes.length,
  }
}

export const getFinanceLiveScopeSnapshot = async (scopePathInput: string[] | string) => {
  const scopePath = normalizeScopePath(scopePathInput)
  if (scopePath.length === 0) return null
  const state = await readFinanceLiveState()
  return state.scopes[scopePathToKey(scopePath)] || null
}

export const listFinanceLiveChildSnapshots = async (scopePathInput: string[] | string) => {
  const scopePath = normalizeScopePath(scopePathInput)
  if (scopePath.length === 0) return []
  const expectedDepth = scopePath.length + 1
  const state = await readFinanceLiveState()

  return Object.values(state.scopes)
    .filter((snapshot) => {
      if (snapshot.scopePath.length !== expectedDepth) return false
      for (let index = 0; index < scopePath.length; index += 1) {
        if (snapshot.scopePath[index] !== scopePath[index]) return false
      }
      return true
    })
    .sort((left, right) => left.scopePath.join('/').localeCompare(right.scopePath.join('/')))
}

const buildRemotePullHeaders = () => {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  const key = clip(process.env.FINANCE_LIVE_PULL_API_KEY, '', 400)
  if (!key) return headers

  const headerName = clip(process.env.FINANCE_LIVE_PULL_AUTH_HEADER, 'Authorization', 80) || 'Authorization'
  const headerValue = headerName.toLowerCase() === 'authorization' && !key.toLowerCase().startsWith('bearer ')
    ? `Bearer ${key}`
    : key
  headers.set(headerName, headerValue)
  return headers
}

const readPullProvider = () =>
  clip(process.env.FINANCE_LIVE_PULL_PROVIDER, 'remote-url', 60).toLowerCase() || 'remote-url'

const pullFinanceLiveFromKingdee = async () => {
  const { payload, probe } = await fetchKingdeeFinanceIngestPayload()
  const imported = await importFinanceLivePayload(payload, 'kingdee-k3cloud')
  return {
    ...imported,
    endpoint: probe.baseUrlHint,
    timeoutMs: 0,
    status: 200,
    ...probe,
  }
}

const pullFinanceLiveFromRemoteUrl = async (provider: string) => {
  const endpoint = clip(process.env.FINANCE_LIVE_PULL_URL, '', 600)
  if (!endpoint) {
    throw new Error('FINANCE_LIVE_PULL_URL 未配置，无法执行远程拉取。')
  }

  const timeoutRaw = Number.parseInt(clip(process.env.FINANCE_LIVE_PULL_TIMEOUT_MS, '', 12), 10)
  const timeoutMs = Number.isFinite(timeoutRaw)
    ? Math.max(2_000, Math.min(60_000, timeoutRaw))
    : REMOTE_PULL_TIMEOUT_MS

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: buildRemotePullHeaders(),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`远程拉取失败，状态码 ${response.status}`)
    }

    const payload = (await response.json()) as FinanceLiveIngestPayload
    const imported = await importFinanceLivePayload(payload, 'remote-pull')
    return {
      ...imported,
      endpoint,
      status: response.status,
      timeoutMs,
      provider,
    }
  } finally {
    clearTimeout(timer)
  }
}

export const pullFinanceLiveFromRemote = async () => {
  const provider = readPullProvider()
  if (provider === 'kingdee-k3cloud') {
    return pullFinanceLiveFromKingdee()
  }
  return pullFinanceLiveFromRemoteUrl(provider)
}
