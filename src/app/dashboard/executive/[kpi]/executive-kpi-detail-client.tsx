'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Layers3, ShieldCheck, Target } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clampScopePathByRole, getRoleBaseScopePath } from '@/lib/access'
import {
  EXECUTIVE_DOMAIN_META,
  LISTED_CATERING_BENCHMARK_BANDS,
  MetricSlug,
  formatExecutiveKpiTrend,
  formatExecutiveKpiValue,
  getScopedFinancialMetric,
  getScopeExecutiveKpis,
  getScopeHierarchyBreadcrumb,
  getScopeHierarchyChildren,
  getScopeHierarchyNodeByPath,
} from '@/lib/business-metrics'
import { buildScopeDrilldownHref, buildScopeMetricHref } from '@/lib/scope-drilldown'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface ExecutiveKpiDetailClientProps {
  kpiKey: string
}

export function ExecutiveKpiDetailClient({ kpiKey }: ExecutiveKpiDetailClientProps) {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const defaultScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const requestedScopePath = (searchParams.get('scope') || '').split('/').filter(Boolean)
  const effectiveScopePath = clampScopePathByRole(user?.role, requestedScopePath, user?.scopePath)
  const scopeQuery = encodeURIComponent(effectiveScopePath.join('/'))

  const scopeNode = getScopeHierarchyNodeByPath(effectiveScopePath)
  const breadcrumbs = getScopeHierarchyBreadcrumb(effectiveScopePath)
  const children = getScopeHierarchyChildren(effectiveScopePath)
  const scopedKpi = getScopeExecutiveKpis(effectiveScopePath).find((item) => item.key === kpiKey)

  const linkedMetric = scopedKpi?.linkedMetricSlug
    ? getScopedFinancialMetric(scopedKpi.linkedMetricSlug, effectiveScopePath)
    : undefined
  const benchmarkBand = LISTED_CATERING_BENCHMARK_BANDS.find((item) => item.key === kpiKey)

  const childRows = useMemo(
    () =>
      children.map((child) => ({
        node: child,
        kpi: getScopeExecutiveKpis(child.path).find((item) => item.key === kpiKey),
      })),
    [children, kpiKey]
  )

  const fallbackMetricSlug: MetricSlug = scopedKpi?.linkedMetricSlug || 'revenue'

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看高管指标下钻详情">
        {!scopedKpi || !scopeNode ? (
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>指标未找到</CardTitle>
              <CardDescription className="text-slate-300">KPI Not Found</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link href={`/dashboard/executive/?scope=${encodeURIComponent(defaultScopePath.join('/'))}`} className="inline-flex items-center text-primary hover:text-primary/90">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回高管指标
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {scopedKpi.level4Menu}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {EXECUTIVE_DOMAIN_META[scopedKpi.domain].label} · {scopeNode.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{scopedKpi.level2Menu}</Badge>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{scopedKpi.level3Menu}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-400">当前值 Current</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{formatExecutiveKpiValue(scopedKpi)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-400">趋势 Trend</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatExecutiveKpiTrend(scopedKpi)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-400">域 Domain</p>
                  <p className="mt-2 text-xl font-semibold text-white">{EXECUTIVE_DOMAIN_META[scopedKpi.domain].label}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-400">当前层级 Scope</p>
                  <p className="mt-2 text-xl font-semibold text-white">{scopeNode.name}</p>
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>逐层下钻 Drilldown</CardTitle>
                <CardDescription className="text-slate-300">点击进入更细颗粒度，直到门店级</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.slug} className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/executive/${encodeURIComponent(kpiKey)}/?scope=${encodeURIComponent(crumb.path.join('/'))}`}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-slate-200 transition hover:border-primary/45 hover:bg-white/[0.1]"
                      >
                        {crumb.name}
                      </Link>
                      {index < breadcrumbs.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-slate-500" /> : null}
                    </div>
                  ))}
                </div>

                {childRows.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {childRows.map((row) => (
                      <Link
                        key={row.node.slug}
                        href={`/dashboard/executive/${encodeURIComponent(kpiKey)}/?scope=${encodeURIComponent(row.node.path.join('/'))}`}
                        className="group rounded-2xl border border-white/10 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-white">{row.node.name}</p>
                          <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="mt-2 text-sm text-slate-300">
                          {row.kpi ? formatExecutiveKpiValue(row.kpi) : '暂无数据'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{row.kpi ? formatExecutiveKpiTrend(row.kpi) : 'No Trend'}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    已到最小颗粒度（门店/项目级）Smallest Granularity Reached.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <Card className={panelClassName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-primary" />
                    联动分析入口
                  </CardTitle>
                  <CardDescription className="text-slate-300">Analysis Entry Points</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Link
                    href={buildScopeDrilldownHref(effectiveScopePath, fallbackMetricSlug)}
                    className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                  >
                    <p className="text-sm font-medium text-white">查看口径树 Drilldown Tree</p>
                    <p className="mt-2 text-xs text-slate-400">按组织层级查看并继续下钻。</p>
                  </Link>
                  <Link
                    href={buildScopeMetricHref(fallbackMetricSlug, effectiveScopePath)}
                    className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                  >
                    <p className="text-sm font-medium text-white">查看关联指标 Metric View</p>
                    <p className="mt-2 text-xs text-slate-400">进入关联财务指标并继续点击到门店。</p>
                  </Link>
                  <Link
                    href={`/dashboard/stores/?scope=${scopeQuery}`}
                    className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                  >
                    <p className="text-sm font-medium text-white">门店明细 Stores</p>
                    <p className="mt-2 text-xs text-slate-400">查看当前口径下的项目与负责人。</p>
                  </Link>
                  <Link
                    href={`/dashboard/reports/?scope=${scopeQuery}`}
                    className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                  >
                    <p className="text-sm font-medium text-white">报表明细 Reports</p>
                    <p className="mt-2 text-xs text-slate-400">导出该口径指标报表。</p>
                  </Link>
                </CardContent>
              </Card>

              <Card className={panelClassName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    基准与说明
                  </CardTitle>
                  <CardDescription className="text-slate-300">Benchmark Notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedMetric ? (
                    <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                      <p className="text-xs text-slate-400">关联财务指标</p>
                      <p className="mt-2 text-base font-semibold text-white">{linkedMetric.name}</p>
                      <p className="mt-1 text-sm text-slate-300">{linkedMetric.value.toLocaleString('zh-CN')} {linkedMetric.unit}</p>
                    </div>
                  ) : null}

                  {benchmarkBand ? (
                    <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                      <p className="text-xs text-slate-400">上市公司参考区间</p>
                      <p className="mt-2 text-sm text-slate-200">
                        Low {benchmarkBand.low}{benchmarkBand.unit} · Median {benchmarkBand.median}
                        {benchmarkBand.unit} · High {benchmarkBand.high}{benchmarkBand.unit}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{benchmarkBand.note}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                      <p className="text-xs text-slate-400">指标说明</p>
                      <p className="mt-2 text-sm text-slate-300">{scopedKpi.benchmarkReference}</p>
                    </div>
                  )}

                  {scopeNode.level === 'site' ? (
                    <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                      <p className="text-xs text-slate-400">项目负责人</p>
                      <p className="mt-2 text-sm text-slate-200">{scopeNode.owner || '未配置'} {scopeNode.ownerTitle || ''}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                      <p className="text-xs text-slate-400">当前范围</p>
                      <p className="mt-2 text-sm text-slate-300">{scopeNode.projects} 个项目 · {scopeNode.stores} 家门店</p>
                    </div>
                  )}

                  <Link href={`/dashboard/executive/?scope=${scopeQuery}`} className="inline-flex items-center text-sm text-primary hover:text-primary/90">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    返回高管指标列表
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </AccessGuard>
    </DashboardLayout>
  )
}
