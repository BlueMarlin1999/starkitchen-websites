import type { MetricSlug } from '@/lib/business-metrics'
import type {
  OperatingSegmentKey,
  OperatingSegmentRow,
  SegmentComponentAmount,
} from '@/lib/finance-granularity'

export interface FinanceLiveMetricSnapshot {
  value: number
  unit: string
  monthlyValues: number[]
  updatedAt: string
  source: string
}

export interface FinanceLiveSegmentSnapshot extends Omit<OperatingSegmentRow, 'revenueShare'> {
  revenueShare?: number
  revenueComponents?: SegmentComponentAmount[]
  foodCostComponents?: SegmentComponentAmount[]
  laborCostComponents?: SegmentComponentAmount[]
}

export interface FinanceLiveScopeSnapshot {
  scopePath: string[]
  scopeKey: string
  metrics: Partial<Record<MetricSlug, FinanceLiveMetricSnapshot>>
  segments: FinanceLiveSegmentSnapshot[]
  updatedAt: string
  source: string
}

export interface FinanceLiveState {
  scopes: Record<string, FinanceLiveScopeSnapshot>
  updatedAt: string
  source: string
}

export interface FinanceLiveScopeResponse {
  mode: 'live' | 'fallback'
  scopePath: string[]
  scopeKey: string
  snapshot: FinanceLiveScopeSnapshot | null
  children: FinanceLiveScopeSnapshot[]
  updatedAt: string
  source: string
  totalScopes?: number
  message: string
}

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

export type FinanceLiveIngestScope = {
  scopePath: string[] | string
  metrics?: Partial<
    Record<
      MetricSlug,
      {
        value: number
        unit?: string
        monthlyValues?: number[]
        updatedAt?: string
      }
    >
  >
  segments?: Array<
    Partial<FinanceLiveSegmentSnapshot> & {
      key: OperatingSegmentKey
      label: string
      revenue: number
      foodCost: number
      laborCost: number
      operatingProfit?: number
    }
  >
  updatedAt?: string
}

export interface FinanceLiveIngestPayload {
  source?: string
  scopes?: FinanceLiveIngestScope[]
  scope?: FinanceLiveIngestScope
  syncRemote?: boolean
  seedAllScopes?: boolean
  scopePaths?: Array<string[] | string>
}
