'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronRight, Layers3, MapPinned, Store } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import {
  canAccessScopePath,
  clampScopePathByRole,
  getRoleBaseScopePath,
  isScopePathWithin,
  normalizeScopePath,
} from '@/lib/access'
import {
  EXECUTIVE_DOMAIN_META,
  LISTED_CATERING_BENCHMARK_BANDS,
  MetricSlug,
  formatAmount,
  formatExecutiveKpiTrend,
  formatExecutiveKpiValue,
  getMetricBySlug,
  getScopeExecutiveKpiGroups,
  getScopeExecutiveMenuTree,
  getScopeHierarchyBreadcrumb,
  getScopeHierarchyChildren,
  getScopeHierarchyNodeByPath,
  getScopedFinancialMetric,
} from '@/lib/business-metrics'
import { buildExecutiveKpiHref } from '@/lib/executive-navigation'
import { buildScopeDrilldownHref, buildScopeMetricHref } from '@/lib/scope-drilldown'
import {
  OperatingSegmentKey,
  getScopeOperatingSegmentDetail,
  getScopeOperatingSegmentRows,
} from '@/lib/finance-granularity'
import {
  getLiveOperatingSegmentRows,
  getLiveSegmentDetail,
  loadFinanceLiveScope,
  mergeScopedMetricWithLive,
} from '@/lib/finance-live-client'
import { FinanceLiveScopeSnapshot } from '@/lib/finance-live-types'
import { isStrictLiveMode } from '@/lib/live-mode'

interface DrilldownScopeClientProps {
  requestedScopePath?: string[]
}

const levelLabelMap: Record<string, string> = {
  global: '全球',
  country: '国家',
  region: '区域',
  province: '省级',
  city: '城市',
  site: '门店/项目',
}

const appendQuery = (href: string, params: Record<string, string | undefined>) => {
  const [pathname, search = ''] = href.split('?')
  const query = new URLSearchParams(search)
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return
    query.set(key, value)
  })
  const queryString = query.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export function DrilldownScopeClient({ requestedScopePath }: DrilldownScopeClientProps) {
  const { user, token } = useAuthStore()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const searchParams = useSearchParams()
  const requestedMetricSlug = searchParams.get('metric')?.trim().toLowerCase() || ''
  const requestedKpiKey = searchParams.get('kpi')?.trim() || ''
  const normalizedRequestedPath = normalizeScopePath(requestedScopePath)
  const roleBasePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const scopePath = clampScopePathByRole(
    user?.role,
    normalizedRequestedPath.length ? normalizedRequestedPath : roleBasePath,
    user?.scopePath
  )
  const isScopeClamped =
    normalizedRequestedPath.length > 0 && normalizedRequestedPath.join('/') !== scopePath.join('/')
  const scopeNode = getScopeHierarchyNodeByPath(scopePath)
  const scopeKey = scopePath.join('/')
  const [liveScopeSnapshot, setLiveScopeSnapshot] = useState<FinanceLiveScopeSnapshot | null>(null)
  const [liveChildSnapshots, setLiveChildSnapshots] = useState<FinanceLiveScopeSnapshot[]>([])
  const [liveMode, setLiveMode] = useState<'live' | 'fallback'>('fallback')
  const [liveUpdatedAt, setLiveUpdatedAt] = useState('')

  useEffect(() => {
    let disposed = false
    const scopePathForFetch = scopeKey.split('/').filter(Boolean)

    const loadLiveSnapshot = async () => {
      try {
        const response = await loadFinanceLiveScope(scopePathForFetch, {
          includeChildren: true,
          token,
        })
        if (disposed) return
        setLiveScopeSnapshot(response.snapshot)
        setLiveChildSnapshots(response.children || [])
        setLiveMode(response.mode)
        setLiveUpdatedAt(response.updatedAt || '')
      } catch {
        if (disposed) return
        setLiveScopeSnapshot(null)
        setLiveChildSnapshots([])
        setLiveMode('fallback')
        setLiveUpdatedAt('')
      }
    }

    void loadLiveSnapshot()
    return () => {
      disposed = true
    }
  }, [scopeKey, token])

  if (!scopeNode) {
    return (
      <DashboardLayout>
        <Card className="border-slate-200 bg-white text-slate-900 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
          <CardHeader>
            <CardTitle>路径不存在</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              路径无效 Invalid Scope Path
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/finance/"
              className="inline-flex items-center text-sm text-primary hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回财务分析总览
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }
  if (strictLiveMode && liveMode !== 'live') {
    return (
      <DashboardLayout>
        <Card className="border-red-300 bg-red-50 text-red-900 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-100">
          <CardHeader>
            <CardTitle>实时口径未接入</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-200">
              Strict Live Mode Enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              当前经营穿透页已禁用估算口径。请先接入并同步实时财务数据后再查看下钻明细。
            </p>
            <Link
              href="/dashboard/finance/"
              className="mt-4 inline-flex items-center text-sm text-red-700 hover:text-red-900 dark:text-red-100 dark:hover:text-red-50"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回财务分析总览
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const rawBreadcrumbs = getScopeHierarchyBreadcrumb(scopeNode.path)
  const filteredBreadcrumbs =
    user?.role === 'ceo'
      ? rawBreadcrumbs
      : rawBreadcrumbs.filter((crumb) => isScopePathWithin(roleBasePath, crumb.path))
  const breadcrumbs = filteredBreadcrumbs.length > 0 ? filteredBreadcrumbs : [scopeNode]
  const children = getScopeHierarchyChildren(scopeNode.path).filter((child) =>
    canAccessScopePath(user?.role, child.path, user?.scopePath)
  )
  const kpiGroups = getScopeExecutiveKpiGroups(scopeNode.path)
  const menuTree = getScopeExecutiveMenuTree(scopeNode.path)
  const scopedKpiMap = new Map(kpiGroups.flatMap((group) => group.kpis).map((kpi) => [kpi.key, kpi]))
  const selectedMetric = requestedMetricSlug ? getMetricBySlug(requestedMetricSlug) : undefined
  const requestedSegment = (searchParams.get('segment')?.trim().toLowerCase() || '') as OperatingSegmentKey
  const resolveScopedMetric = (slug: MetricSlug) =>
    mergeScopedMetricWithLive(getScopedFinancialMetric(slug, scopeNode.path), liveScopeSnapshot, slug)
  const selectedScopedMetric = selectedMetric ? resolveScopedMetric(selectedMetric.slug as MetricSlug) : undefined
  const metricQuickSlugs = [
    'revenue',
    'food-cost',
    'labor-cost',
    'operating-profit',
    'net-profit',
    'interest',
    'depreciation-amortization',
  ] as const
  const metricQuickItems = metricQuickSlugs
    .map((slug) => resolveScopedMetric(slug))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
  const revenueMetric = resolveScopedMetric('revenue')
  const netProfitMetric = resolveScopedMetric('net-profit')
  const operatingProfitMetric = resolveScopedMetric('operating-profit')
  const netMargin =
    revenueMetric && revenueMetric.value > 0 && netProfitMetric
      ? (netProfitMetric.value / revenueMetric.value) * 100
      : 0
  const liveSegmentRows = getLiveOperatingSegmentRows(liveScopeSnapshot)
  const segmentRows = liveSegmentRows.length > 0 ? liveSegmentRows : getScopeOperatingSegmentRows(scopeNode.path)
  const activeSegment =
    segmentRows.find((segment) => segment.key === requestedSegment) || segmentRows[0]
  const activeSegmentDetail = activeSegment
    ? getLiveSegmentDetail(liveScopeSnapshot, activeSegment.key) ||
      getScopeOperatingSegmentDetail(scopeNode.path, activeSegment.key)
    : undefined
  const fallbackSegmentScopeRows = activeSegment
    ? children
        .map((child) => {
          const row = getScopeOperatingSegmentRows(child.path).find((item) => item.key === activeSegment.key)
          if (!row) return null
          return {
            child,
            row,
          }
        })
        .filter((item): item is { child: (typeof children)[number]; row: (typeof segmentRows)[number] } => Boolean(item))
        .sort((left, right) => right.row.revenue - left.row.revenue)
    : []
  const childNodeMap = new Map(children.map((child) => [child.path.join('/'), child]))
  const liveSegmentScopeRows = activeSegment
    ? liveChildSnapshots
        .map((childSnapshot) => {
          const row = getLiveOperatingSegmentRows(childSnapshot).find((item) => item.key === activeSegment.key)
          const child = childNodeMap.get(childSnapshot.scopePath.join('/'))
          if (!row || !child) return null
          return { child, row }
        })
        .filter((item): item is { child: (typeof children)[number]; row: (typeof segmentRows)[number] } => Boolean(item))
        .sort((left, right) => right.row.revenue - left.row.revenue)
    : []
  const segmentScopeRows = liveSegmentScopeRows.length > 0 ? liveSegmentScopeRows : fallbackSegmentScopeRows
  const liveUpdatedLabel = (() => {
    const timestamp = Date.parse(liveUpdatedAt)
    if (!Number.isFinite(timestamp)) return ''
    return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
  })()
  const metricWithSegmentHref = (metricSlug: MetricSlug, segmentKey: OperatingSegmentKey, segmentLabel: string) =>
    appendQuery(buildScopeMetricHref(metricSlug, scopeNode.path), {
      segment: segmentKey,
      segmentLabel,
    })
  const kpiDetailHref = (kpi: (typeof kpiGroups)[number]['kpis'][number]) => {
    const baseHref = buildExecutiveKpiHref(kpi, scopeNode.path)

    if (activeSegment && kpi.linkedMetricSlug) {
      return appendQuery(baseHref, {
        segment: activeSegment.key,
        segmentLabel: activeSegment.label,
      })
    }

    return baseHref
  }
  const drilldownWithSegmentHref = (
    targetScopePath: string[],
    metricSlug: MetricSlug | undefined,
    segmentKey: OperatingSegmentKey,
    segmentLabel: string
  ) =>
    appendQuery(buildScopeDrilldownHref(targetScopePath, metricSlug), {
      segment: segmentKey,
      segmentLabel,
    })

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看经营穿透">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/finance/"
              className="inline-flex items-center text-sm text-primary hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回财务分析总览
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                多级穿透 Scope Guard
              </Badge>
              {liveMode === 'live' ? (
                <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                  实时口径{liveUpdatedLabel ? ` · ${liveUpdatedLabel}` : ''}
                </Badge>
              ) : (
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                  估算口径（待接入实时源）
                </Badge>
              )}
              {isScopeClamped ? (
                <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                  已按角色权限自动裁剪路径
                </Badge>
              ) : null}
            </div>
          </div>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.slug} className="inline-flex items-center gap-2">
                    <Link
                      href={
                        activeSegment
                          ? drilldownWithSegmentHref(crumb.path, selectedMetric?.slug, activeSegment.key, activeSegment.label)
                          : buildScopeDrilldownHref(crumb.path, selectedMetric?.slug)
                      }
                      className="rounded-md bg-white/[0.06] px-2 py-1 hover:bg-white/[0.10]"
                    >
                      {crumb.name}
                    </Link>
                    {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3.5 w-3.5 text-slate-500" /> : null}
                  </div>
                ))}
              </div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Layers3 className="h-5 w-5 text-primary" />
                {scopeNode.name} 经营颗粒度视图
              </CardTitle>
              <CardDescription className="text-slate-300">
                角色起点 Role Base Path:
                <span className="mx-1 rounded-md bg-white/[0.08] px-2 py-1 text-xs text-slate-100">
                  {roleBasePath.join(' / ')}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-500">当前层级</p>
                <p className="mt-2 text-xl font-semibold text-white">{levelLabelMap[scopeNode.level] || scopeNode.level}</p>
                <p className="mt-1 text-xs text-slate-400">{scopeNode.path.join(' / ')}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-500">覆盖项目 / 门店</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {scopeNode.projects} 项目 / {scopeNode.stores} 门店
                </p>
                <p className="mt-1 text-xs text-slate-400">下钻归属 Drill Ownership</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-500">营业收入（月）</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {revenueMetric ? formatAmount(revenueMetric.value, revenueMetric.unit) : '--'}
                </p>
                <p className="mt-1 text-xs text-slate-400">自动切换 Auto-scoped</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-500">营运利润 / 净利率</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {operatingProfitMetric ? formatAmount(operatingProfitMetric.value, operatingProfitMetric.unit) : '--'}
                </p>
                <p className="mt-1 text-xs text-slate-400">净利率 {netMargin.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle>指标上下文切换</CardTitle>
              <CardDescription className="text-slate-300">Metric Context Switch</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {metricQuickItems.map((metric) => (
                <Link
                  key={`quick-${metric.slug}`}
                  href={
                    activeSegment
                      ? drilldownWithSegmentHref(scopeNode.path, metric.slug, activeSegment.key, activeSegment.label)
                      : buildScopeDrilldownHref(scopeNode.path, metric.slug)
                  }
                  className={`rounded-xl border px-3 py-2 transition ${
                    selectedMetric?.slug === metric.slug
                      ? 'border-primary/45 bg-primary/15'
                      : 'border-white/10 bg-slate-950/35 hover:border-primary/35 hover:bg-white/[0.08]'
                  }`}
                >
                  <p className="text-sm text-slate-100">{metric.name}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatAmount(metric.value, metric.unit)}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {selectedScopedMetric ? (
            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle>当前指标上下文</CardTitle>
                <CardDescription className="text-slate-300">Current Metric Focus</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">{selectedScopedMetric.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {formatAmount(selectedScopedMetric.value, selectedScopedMetric.unit)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>项目/餐段经营明细穿透</CardTitle>
              <CardDescription className="text-slate-300">
                收入构成 + 食材成本 + 人力成本（可继续点击明细）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-white/[0.05] text-xs text-slate-300">
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-3">经营段</th>
                      <th className="px-3 py-3">收入</th>
                      <th className="px-3 py-3">食材成本</th>
                      <th className="px-3 py-3">人力成本</th>
                      <th className="px-3 py-3">营运利润</th>
                      <th className="px-3 py-3">收入占比</th>
                      <th className="px-3 py-3">食材成本率</th>
                      <th className="px-3 py-3">人力成本率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentRows.map((segment) => {
                      const isActiveSegment = activeSegment?.key === segment.key
                      return (
                        <tr
                          key={segment.key}
                          className={`border-b border-white/10 ${
                            isActiveSegment ? 'bg-primary/10' : 'bg-slate-950/35'
                          }`}
                        >
                          <td className="px-3 py-3">
                            <Link
                              href={drilldownWithSegmentHref(
                                scopeNode.path,
                                selectedMetric?.slug,
                                segment.key,
                                segment.label
                              )}
                              className="group inline-flex items-center text-white hover:text-primary"
                            >
                              {segment.label}
                              <ArrowRight className="ml-1 h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={metricWithSegmentHref('revenue', segment.key, segment.label)}
                              className="text-slate-100 hover:text-primary"
                            >
                              {formatAmount(segment.revenue)}
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={metricWithSegmentHref('food-cost', segment.key, segment.label)}
                              className="text-slate-100 hover:text-primary"
                            >
                              {formatAmount(segment.foodCost)}
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={metricWithSegmentHref('labor-cost', segment.key, segment.label)}
                              className="text-slate-100 hover:text-primary"
                            >
                              {formatAmount(segment.laborCost)}
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={metricWithSegmentHref('operating-profit', segment.key, segment.label)}
                              className="text-slate-100 hover:text-primary"
                            >
                              {formatAmount(segment.operatingProfit)}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-slate-300">{(segment.revenueShare * 100).toFixed(1)}%</td>
                          <td className="px-3 py-3 text-slate-300">{segment.foodCostRate.toFixed(1)}%</td>
                          <td className="px-3 py-3 text-slate-300">{segment.laborCostRate.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {activeSegmentDetail ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{activeSegmentDetail.segment.label} 收入构成</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {formatAmount(activeSegmentDetail.segment.revenue)}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {activeSegmentDetail.revenueComponents.map((item) => (
                        <Link
                          key={`revenue-component-${item.id}`}
                          href={appendQuery(metricWithSegmentHref('revenue', activeSegmentDetail.segment.key, activeSegmentDetail.segment.label), {
                            componentType: 'revenue',
                            component: item.id,
                            componentLabel: item.label,
                          })}
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-200 transition hover:border-primary/35 hover:bg-white/[0.08]"
                        >
                          <span>{item.label}</span>
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            {formatAmount(item.amount)}
                            <span className="text-slate-500">{(item.share * 100).toFixed(1)}%</span>
                            <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{activeSegmentDetail.segment.label} 食材成本</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {formatAmount(activeSegmentDetail.segment.foodCost)}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {activeSegmentDetail.foodCostComponents.map((item) => (
                        <Link
                          key={`food-component-${item.id}`}
                          href={appendQuery(metricWithSegmentHref('food-cost', activeSegmentDetail.segment.key, activeSegmentDetail.segment.label), {
                            componentType: 'food',
                            component: item.id,
                            componentLabel: item.label,
                          })}
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-200 transition hover:border-primary/35 hover:bg-white/[0.08]"
                        >
                          <span>{item.label}</span>
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            {formatAmount(item.amount)}
                            <span className="text-slate-500">{(item.share * 100).toFixed(1)}%</span>
                            <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{activeSegmentDetail.segment.label} 人力成本</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {formatAmount(activeSegmentDetail.segment.laborCost)}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {activeSegmentDetail.laborCostComponents.map((item) => (
                        <Link
                          key={`labor-component-${item.id}`}
                          href={appendQuery(metricWithSegmentHref('labor-cost', activeSegmentDetail.segment.key, activeSegmentDetail.segment.label), {
                            componentType: 'labor',
                            component: item.id,
                            componentLabel: item.label,
                          })}
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-200 transition hover:border-primary/35 hover:bg-white/[0.08]"
                        >
                          <span>{item.label}</span>
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            {formatAmount(item.amount)}
                            <span className="text-slate-500">{(item.share * 100).toFixed(1)}%</span>
                            <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {segmentScopeRows.length > 0 && activeSegment ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {activeSegment.label} 跨项目 / 餐厅明细排名
                    </p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                      {segmentScopeRows.length} 个下级单元
                    </Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {segmentScopeRows.map(({ child, row }) => (
                      <Link
                        key={`${activeSegment.key}-${child.slug}`}
                        href={drilldownWithSegmentHref(child.path, selectedMetric?.slug, activeSegment.key, activeSegment.label)}
                        className="group rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-primary/35 hover:bg-white/[0.08]"
                      >
                        <p className="text-sm font-medium text-white">{child.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {levelLabelMap[child.level] || child.level} · {child.projects} 项目 / {child.stores} 门店
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-300">
                          <p>收入 {formatAmount(row.revenue)}</p>
                          <p>食材 {formatAmount(row.foodCost)} · 人力 {formatAmount(row.laborCost)}</p>
                        </div>
                        <div className="mt-2 inline-flex items-center text-xs text-primary">
                          查看该单元明细
                          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>当前层级运营重点</CardTitle>
              <CardDescription className="text-slate-300">重点动作 Key Actions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-3">
              {scopeNode.focus.map((focus) => (
                <div key={focus} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-200">
                  {focus}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-2">
            {kpiGroups.map((group) => (
              <Card key={group.domain} className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{group.label} 指标组</CardTitle>
                  <CardDescription className="text-slate-300">指标任务 KPI Mission</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {group.kpis.map((kpi) => {
                    const isActiveKpi = requestedKpiKey === kpi.key
                    const isActiveMetric = selectedMetric?.slug === kpi.linkedMetricSlug
                    const isHighlighted = isActiveKpi || isActiveMetric
                    const content = (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-300">{kpi.level4Menu}</p>
                          <Badge
                            className={
                              kpi.priority === 'P0'
                                ? 'bg-primary/15 text-primary hover:bg-primary/15'
                                : 'bg-white/10 text-slate-200 hover:bg-white/10'
                            }
                          >
                            {kpi.priority}
                          </Badge>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-white">{formatExecutiveKpiValue(kpi)}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatExecutiveKpiTrend(kpi)}</p>
                      </>
                    )

                    return (
                      <Link
                        key={`${group.domain}-${kpi.key}`}
                        href={kpiDetailHref(kpi)}
                        className={`group rounded-xl border p-3 transition-all ${
                          isHighlighted
                            ? 'border-primary/45 bg-primary/12'
                            : 'border-white/10 bg-slate-950/35 hover:border-primary/35 hover:bg-white/[0.10]'
                        }`}
                      >
                        {content}
                        <div className="mt-2 inline-flex items-center text-xs text-primary">
                          {kpi.linkedMetricSlug ? '查看关联财务指标' : '查看指标详情'}
                          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>上市餐饮企业公开口径对标</CardTitle>
              <CardDescription className="text-slate-300">
                公开口径 Benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {LISTED_CATERING_BENCHMARK_BANDS.map((band) => {
                const scopedKpi = scopedKpiMap.get(band.key)
                const benchmarkContent = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{band.label}</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{band.fiscalYear}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      当前口径：{scopedKpi ? formatExecutiveKpiValue(scopedKpi) : '--'}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      对标区间：{band.low}
                      {band.unit} - {band.high}
                      {band.unit}（中位 {band.median}
                      {band.unit}）
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{band.samplePeers.join(' / ')}</p>
                  </>
                )

                if (scopedKpi) {
                  return (
                    <Link
                      key={band.key}
                      href={kpiDetailHref(scopedKpi)}
                      className="group rounded-xl border border-white/10 bg-slate-950/35 p-3 transition hover:border-primary/35 hover:bg-white/[0.08]"
                    >
                      {benchmarkContent}
                      <div className="mt-2 inline-flex items-center text-xs text-primary">
                        查看指标详情
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  )
                }

                return <div key={band.key} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">{benchmarkContent}</div>
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>一级 / 二级 / 三级 / 四级菜单结构</CardTitle>
              <CardDescription className="text-slate-300">
                层级菜单 Menu Hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {menuTree.map((level1) => (
                <div key={level1.name} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">{level1.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {level1.domains.map((domain) => (
                        <Badge key={`${level1.name}-${domain}`} className="bg-white/10 text-slate-200 hover:bg-white/10">
                          {EXECUTIVE_DOMAIN_META[domain].label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {level1.children.map((level2) => (
                      <div key={`${level1.name}-${level2.name}`} className="rounded-xl border border-white/10 bg-[#081538]/55 p-3">
                        <p className="text-sm font-medium text-slate-200">二级菜单：{level2.name}</p>
                        <div className="mt-2 grid gap-2 lg:grid-cols-2">
                          {level2.children.map((level3) => (
                            <div key={`${level2.name}-${level3.name}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-xs text-slate-300">三级菜单：{level3.name}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {level3.items.map((item) => (
                                  <Link
                                    key={`${level3.name}-${item.key}`}
                                    href={
                                      scopedKpiMap.get(item.key)
                                        ? kpiDetailHref(scopedKpiMap.get(item.key)!)
                                        : `/dashboard/executive/?scope=${encodeURIComponent(scopeNode.path.join('/'))}`
                                    }
                                    className="inline-flex items-center rounded-full border border-primary/35 bg-primary/12 px-2 py-1 text-xs text-primary transition hover:bg-primary/18"
                                    title={item.benchmarkReference}
                                  >
                                    四级指标：{item.level4Menu}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>下一层级菜单</CardTitle>
              <CardDescription className="text-slate-300">继续下钻 Continue Drilldown</CardDescription>
            </CardHeader>
            <CardContent>
              {children.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {children.map((child) => (
                    <Link
                      key={child.slug}
                      href={
                        activeSegment
                          ? drilldownWithSegmentHref(child.path, selectedMetric?.slug, activeSegment.key, activeSegment.label)
                          : buildScopeDrilldownHref(child.path, selectedMetric?.slug)
                      }
                      className="group rounded-xl border border-white/10 bg-slate-950/35 p-4 transition-all hover:border-primary/35 hover:bg-white/[0.10]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm text-white">
                          <MapPinned className="h-4 w-4 text-primary" />
                          {child.name}
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {levelLabelMap[child.level] || child.level} · {child.path.join(' / ')}
                      </p>
                      {child.owner ? (
                        <p className="mt-1 text-xs text-slate-300">
                          负责人 {child.owner}
                          {child.ownerTitle ? ` · ${child.ownerTitle}` : ''}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-slate-200">
                        {child.projects} 项目 · {child.stores} 门店
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
                  <p>已到最细层级 Leaf Level Reached</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={
                        activeSegment
                          ? metricWithSegmentHref(
                              (selectedMetric?.slug || 'revenue') as MetricSlug,
                              activeSegment.key,
                              activeSegment.label
                            )
                          : buildScopeMetricHref(selectedMetric?.slug || 'revenue', scopeNode.path)
                      }
                      className="inline-flex items-center rounded-lg border border-primary/35 bg-primary/15 px-3 py-2 text-xs text-primary hover:bg-primary/20"
                    >
                      查看当前颗粒指标
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm text-slate-300">
                保留当前口径继续分析 Keep Current Scope
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={
                    activeSegment
                      ? metricWithSegmentHref('revenue', activeSegment.key, activeSegment.label)
                      : buildScopeMetricHref('revenue', scopeNode.path)
                  }
                  className="inline-flex items-center rounded-lg border border-primary/35 bg-primary/15 px-3 py-2 text-xs text-primary hover:bg-primary/20"
                >
                  查看收入详情
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
                <Link
                  href={
                    activeSegment
                      ? metricWithSegmentHref('net-profit', activeSegment.key, activeSegment.label)
                      : buildScopeMetricHref('net-profit', scopeNode.path)
                  }
                  className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-slate-100 hover:bg-white/[0.10]"
                >
                  查看净利详情
                  <Store className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
