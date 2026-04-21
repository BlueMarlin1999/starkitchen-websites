import type { ScopeExecutiveKpi } from '@/lib/business-metrics'

export const buildExecutiveKpiHref = (kpi: ScopeExecutiveKpi, scopePath: string[]) => {
  const scopeQuery = encodeURIComponent(scopePath.join('/'))

  if (kpi.linkedMetricSlug) {
    return `/dashboard/finance/${kpi.linkedMetricSlug}/?scope=${scopeQuery}&kpi=${encodeURIComponent(kpi.key)}`
  }

  return `/dashboard/executive/${encodeURIComponent(kpi.key)}/?scope=${scopeQuery}`
}
