import { getFinanceLiveScopeSnapshot, readFinanceLiveState } from '@/lib/server/finance-live/storage'

export type FinanceLiveHealthStatus = 'healthy' | 'degraded' | 'stale' | 'empty'

export interface FinanceLiveHealthSnapshot {
  status: FinanceLiveHealthStatus
  scopePath: string[]
  scopeKey: string
  thresholdMinutes: number
  ageMinutes: number | null
  totalScopes: number
  staleScopes: number
  realScopes: number
  realCoverageRate: number
  updatedAt: string
  source: string
  message: string
}

const clip = (value: unknown, fallback = '', max = 400) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const toScopePath = (value: string) =>
  value
    .split(/[>\/,]+/)
    .map((segment) => clip(segment, '', 80).toLowerCase())
    .filter(Boolean)

const toAgeMinutes = (isoText: string) => {
  const timestamp = Date.parse(isoText)
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
}

const isRealScopeSource = (source: string) => {
  const normalized = source.toLowerCase()
  if (!normalized || normalized === 'none') return false
  if (normalized.includes('seed')) return false
  return true
}

const buildStatus = (input: {
  totalScopes: number
  snapshotExists: boolean
  ageMinutes: number | null
  thresholdMinutes: number
  staleScopes: number
  realCoverageRate: number
}): FinanceLiveHealthStatus => {
  if (input.totalScopes <= 0) return 'empty'
  if (!input.snapshotExists) return 'degraded'
  if (typeof input.ageMinutes === 'number' && input.ageMinutes > input.thresholdMinutes) return 'stale'
  if (input.staleScopes > 0 && input.staleScopes >= Math.ceil(input.totalScopes * 0.5)) return 'stale'
  if (input.realCoverageRate < 0.5) return 'degraded'
  return 'healthy'
}

const buildMessage = (status: FinanceLiveHealthStatus, ageMinutes: number | null, thresholdMinutes: number) => {
  if (status === 'empty') return '当前尚未接入真实财务数据。'
  if (status === 'stale') {
    if (typeof ageMinutes === 'number') return `财务数据已过期 ${ageMinutes} 分钟（阈值 ${thresholdMinutes} 分钟）。`
    return '财务数据已过期，请检查同步任务。'
  }
  if (status === 'degraded') return '财务数据覆盖不足，当前处于降级口径。'
  return '财务数据健康，实时口径正常。'
}

export const getFinanceLiveHealthSnapshot = async (input?: {
  scope?: string
  thresholdMinutes?: number
}): Promise<FinanceLiveHealthSnapshot> => {
  const thresholdMinutes = Number.isFinite(input?.thresholdMinutes)
    ? Math.max(5, Math.min(24 * 60, Math.round(input?.thresholdMinutes || 30)))
    : 30
  const scopePath = toScopePath(clip(input?.scope, 'global', 400))
  const normalizedScopePath = scopePath.length > 0 ? scopePath : ['global']
  const scopeKey = normalizedScopePath.join('/')

  const [state, snapshot] = await Promise.all([
    readFinanceLiveState(),
    getFinanceLiveScopeSnapshot(normalizedScopePath),
  ])

  const scopes = Object.values(state.scopes)
  const totalScopes = scopes.length
  const staleScopes = scopes.filter((item) => {
    const ageMinutes = toAgeMinutes(item.updatedAt)
    return typeof ageMinutes === 'number' && ageMinutes > thresholdMinutes
  }).length
  const realScopes = scopes.filter((item) => isRealScopeSource(item.source)).length
  const realCoverageRate = totalScopes > 0 ? Number((realScopes / totalScopes).toFixed(4)) : 0
  const ageMinutes = toAgeMinutes(snapshot?.updatedAt || state.updatedAt)
  const status = buildStatus({
    totalScopes,
    snapshotExists: Boolean(snapshot),
    ageMinutes,
    thresholdMinutes,
    staleScopes,
    realCoverageRate,
  })

  return {
    status,
    scopePath: normalizedScopePath,
    scopeKey,
    thresholdMinutes,
    ageMinutes,
    totalScopes,
    staleScopes,
    realScopes,
    realCoverageRate,
    updatedAt: snapshot?.updatedAt || state.updatedAt,
    source: snapshot?.source || state.source,
    message: buildMessage(status, ageMinutes, thresholdMinutes),
  }
}
