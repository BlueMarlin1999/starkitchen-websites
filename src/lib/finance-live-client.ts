import { MetricSlug, ScopedFinancialMetric } from '@/lib/business-metrics'
import {
  FinanceLiveHealthSnapshot,
  FinanceLiveScopeResponse,
  FinanceLiveScopeSnapshot,
} from '@/lib/finance-live-types'
import {
  OperatingSegmentDetail,
  OperatingSegmentKey,
  OperatingSegmentRow,
  SegmentComponentAmount,
  getScopeOperatingSegmentDetail,
} from '@/lib/finance-granularity'
import { buildApiUrl } from '@/lib/runtime-config'

const round2 = (value: number) => Number(value.toFixed(2))

const buildAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const normalizeShares = (values: number[]) => {
  const sum = values.reduce((acc, value) => acc + value, 0)
  if (sum <= 0) return values.map(() => (values.length > 0 ? 1 / values.length : 0))
  return values.map((value) => value / sum)
}

const allocateByShares = (total: number, shares: number[]) =>
  normalizeShares(shares).map((share) => total * share)

const buildComponentRows = (items: SegmentComponentAmount[]) => {
  const shares = normalizeShares(items.map((item) => Math.max(0, item.share)))
  const sum = items.reduce((acc, item) => acc + Math.max(0, item.amount), 0)
  const amounts = sum > 0 ? items.map((item) => Math.max(0, item.amount)) : allocateByShares(0, shares)

  return items.map((item, index) => ({
    id: item.id,
    label: item.label,
    share: round2(shares[index]),
    amount: round2(amounts[index]),
  }))
}

export const loadFinanceLiveScope = async (
  scopePath: string[],
  options?: {
    includeChildren?: boolean
    sync?: boolean
    token?: string
  }
): Promise<FinanceLiveScopeResponse> => {
  const scope = scopePath.join('/')
  const params = new URLSearchParams({
    scope,
    includeChildren: options?.includeChildren ? '1' : '0',
    sync: options?.sync ? '1' : '0',
  })

  const response = await fetch(buildApiUrl(`/finance/live?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(options?.token),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`加载财务实时口径失败: ${response.status}`)
  }

  return (await response.json()) as FinanceLiveScopeResponse
}

export const loadFinanceLiveHealth = async (
  scopePath: string[],
  options?: {
    thresholdMinutes?: number
    token?: string
  }
): Promise<FinanceLiveHealthSnapshot> => {
  const scope = scopePath.join('/')
  const params = new URLSearchParams({ scope: scope || 'global' })
  if (typeof options?.thresholdMinutes === 'number' && Number.isFinite(options.thresholdMinutes)) {
    params.set('thresholdMinutes', String(Math.max(5, Math.min(24 * 60, Math.round(options.thresholdMinutes)))))
  }
  const response = await fetch(buildApiUrl(`/finance/live/health?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(options?.token),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`加载财务数据健康状态失败: ${response.status}`)
  }
  return (await response.json()) as FinanceLiveHealthSnapshot
}

export const mergeScopedMetricWithLive = (
  fallback: ScopedFinancialMetric | undefined,
  liveScope: FinanceLiveScopeSnapshot | null,
  slug: MetricSlug
) => {
  if (!fallback) return fallback
  const liveMetric = liveScope?.metrics?.[slug]
  if (!liveMetric) return fallback

  return {
    ...fallback,
    value: liveMetric.value,
    unit: liveMetric.unit || fallback.unit,
    monthlyValues:
      Array.isArray(liveMetric.monthlyValues) && liveMetric.monthlyValues.length > 0
        ? liveMetric.monthlyValues
        : fallback.monthlyValues,
  }
}

export const getLiveOperatingSegmentRows = (liveScope: FinanceLiveScopeSnapshot | null): OperatingSegmentRow[] => {
  if (!liveScope || !Array.isArray(liveScope.segments) || liveScope.segments.length === 0) return []
  const totalRevenue = liveScope.segments.reduce((sum, segment) => sum + Math.max(0, segment.revenue), 0)

  return liveScope.segments.map((segment) => {
    const revenueShare =
      typeof segment.revenueShare === 'number' && Number.isFinite(segment.revenueShare)
        ? segment.revenueShare
        : totalRevenue > 0
          ? segment.revenue / totalRevenue
          : 0
    const operatingProfit =
      typeof segment.operatingProfit === 'number' && Number.isFinite(segment.operatingProfit)
        ? segment.operatingProfit
        : segment.revenue - segment.foodCost - segment.laborCost
    const foodCostRate =
      typeof segment.foodCostRate === 'number' && Number.isFinite(segment.foodCostRate)
        ? segment.foodCostRate
        : segment.revenue > 0
          ? (segment.foodCost / segment.revenue) * 100
          : 0
    const laborCostRate =
      typeof segment.laborCostRate === 'number' && Number.isFinite(segment.laborCostRate)
        ? segment.laborCostRate
        : segment.revenue > 0
          ? (segment.laborCost / segment.revenue) * 100
          : 0
    const operatingMargin =
      typeof segment.operatingMargin === 'number' && Number.isFinite(segment.operatingMargin)
        ? segment.operatingMargin
        : segment.revenue > 0
          ? (operatingProfit / segment.revenue) * 100
          : 0

    return {
      key: segment.key,
      label: segment.label,
      revenue: round2(segment.revenue),
      foodCost: round2(segment.foodCost),
      laborCost: round2(segment.laborCost),
      operatingProfit: round2(operatingProfit),
      revenueShare: round2(Math.max(0, revenueShare)),
      foodCostRate: round2(Math.max(0, foodCostRate)),
      laborCostRate: round2(Math.max(0, laborCostRate)),
      operatingMargin: round2(operatingMargin),
    }
  })
}

export const getLiveSegmentDetail = (
  liveScope: FinanceLiveScopeSnapshot | null,
  segmentKey: OperatingSegmentKey
): OperatingSegmentDetail | undefined => {
  const segmentRows = getLiveOperatingSegmentRows(liveScope)
  const segment = segmentRows.find((item) => item.key === segmentKey)
  if (!segment || !liveScope) return undefined

  const rawSegment = liveScope.segments.find((item) => item.key === segmentKey)
  if (!rawSegment) return undefined
  const fallbackDetail = getScopeOperatingSegmentDetail(liveScope.scopePath, segmentKey)

  return {
    segment,
    revenueComponents: buildComponentRows(rawSegment.revenueComponents || fallbackDetail?.revenueComponents || []),
    foodCostComponents: buildComponentRows(rawSegment.foodCostComponents || fallbackDetail?.foodCostComponents || []),
    laborCostComponents: buildComponentRows(rawSegment.laborCostComponents || fallbackDetail?.laborCostComponents || []),
  }
}

export const getLiveMetricComponentBreakdown = (
  metricSlug: MetricSlug,
  liveScope: FinanceLiveScopeSnapshot | null,
  segmentKey: OperatingSegmentKey,
  metricValue: number
): SegmentComponentAmount[] => {
  const detail = getLiveSegmentDetail(liveScope, segmentKey)
  if (!detail) return []

  if (metricSlug === 'revenue') return detail.revenueComponents
  if (metricSlug === 'food-cost') return detail.foodCostComponents
  if (metricSlug === 'labor-cost') return detail.laborCostComponents

  const baseComponents =
    detail.revenueComponents.length > 0
      ? detail.revenueComponents
      : detail.foodCostComponents.length > 0
        ? detail.foodCostComponents
        : detail.laborCostComponents
  if (baseComponents.length === 0) return []

  const shares = normalizeShares(baseComponents.map((item) => Math.max(0, item.share)))
  const amounts = allocateByShares(Math.max(0, metricValue), shares)

  return baseComponents.map((item, index) => ({
    id: item.id,
    label: item.label,
    share: round2(shares[index]),
    amount: round2(amounts[index]),
  }))
}
