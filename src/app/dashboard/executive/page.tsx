'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleBaseScopePath } from '@/lib/access'
import {
  EXECUTIVE_DOMAIN_ORDER,
  EXECUTIVE_DOMAIN_META,
  formatExecutiveKpiTrend,
  formatExecutiveKpiValue,
  getScopeExecutiveKpiGroups,
  getScopeHierarchyNodeByPath,
} from '@/lib/business-metrics'
import { buildExecutiveKpiHref } from '@/lib/executive-navigation'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function ExecutiveHubPage() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const scopeNode = getScopeHierarchyNodeByPath(roleScopePath)
  const scopeLabel = scopeNode?.name || '当前口径'
  const scopeQuery = encodeURIComponent(roleScopePath.join('/'))
  const selectedDomain = (searchParams.get('domain') || 'all').toLowerCase()

  const groups = useMemo(() => getScopeExecutiveKpiGroups(roleScopePath), [roleScopePath])
  const sortedGroups = useMemo(() => {
    const groupedMap = new Map(groups.map((group) => [group.domain, group]))
    return EXECUTIVE_DOMAIN_ORDER.map((domain) => groupedMap.get(domain)).filter(Boolean)
  }, [groups])

  const visibleGroups = useMemo(() => {
    if (selectedDomain === 'all') return sortedGroups
    return sortedGroups.filter((group) => group?.domain === selectedDomain)
  }, [selectedDomain, sortedGroups])

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看高管协同指标详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                高管协同经营指标详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                当前口径 Scope: {scopeLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/executive/?scope=${scopeQuery}`}
                className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs transition ${
                  selectedDomain === 'all'
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-white/15 bg-white/[0.05] text-slate-200 hover:border-white/25 hover:bg-white/[0.1]'
                }`}
              >
                全部 All
              </Link>
              {EXECUTIVE_DOMAIN_ORDER.map((domain) => (
                <Link
                  key={domain}
                  href={`/dashboard/executive/?domain=${domain}&scope=${scopeQuery}`}
                  className={`inline-flex min-h-10 items-center rounded-full border px-3 text-xs transition ${
                    selectedDomain === domain
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-white/15 bg-white/[0.05] text-slate-200 hover:border-white/25 hover:bg-white/[0.1]'
                  }`}
                >
                  {EXECUTIVE_DOMAIN_META[domain].label}
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {visibleGroups.map((group) => {
              if (!group) return null
              return (
                <Card key={group.domain} className={panelClassName}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{EXECUTIVE_DOMAIN_META[group.domain].label}</CardTitle>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{group.kpis.length} 指标</Badge>
                    </div>
                    <CardDescription className="text-slate-300">{EXECUTIVE_DOMAIN_META[group.domain].mission}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {group.kpis.map((kpi) => (
                      <Link
                        key={`${group.domain}-${kpi.key}`}
                        href={buildExecutiveKpiHref(kpi, roleScopePath)}
                        className="group block rounded-xl border border-white/10 bg-[#081538]/55 p-3 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-200">{kpi.level4Menu}</p>
                          <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="mt-1.5 text-lg font-semibold text-white">{formatExecutiveKpiValue(kpi)}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatExecutiveKpiTrend(kpi)}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
