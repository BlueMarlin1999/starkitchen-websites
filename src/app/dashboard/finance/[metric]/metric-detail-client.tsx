'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { clampScopePathByRole, getRoleBaseScopePath, normalizeScopePath } from '@/lib/access'
import {
  MONTH_LABELS,
  MetricSlug,
  formatAmount,
  formatRate,
  getMetricBySlug,
  getMetricCityRows,
  getMoMRate,
  getRelatedMetrics,
  getScopeHierarchyChildren,
  getScopeHierarchyNodeByPath,
  getScopedFinancialMetric,
  getTrendTone,
} from '@/lib/business-metrics'
import { buildScopeDrilldownHref, getScopePathByName } from '@/lib/scope-drilldown'
import {
  getMetricComponentBreakdown,
  getScopeOperatingSegmentDetail,
  getScopeOperatingSegmentRows,
} from '@/lib/finance-granularity'
import {
  getLiveMetricComponentBreakdown,
  getLiveOperatingSegmentRows,
  getLiveSegmentDetail,
  loadFinanceLiveScope,
  mergeScopedMetricWithLive,
} from '@/lib/finance-live-client'
import { FinanceLiveScopeSnapshot } from '@/lib/finance-live-types'
import { isStrictLiveMode } from '@/lib/live-mode'

interface MetricDetailClientProps {
  metric: string
}

interface ScopedCityRow {
  city: string
  value: number
  projects: number
  stores: number
  weight: number
  path: string[]
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

const getDeterministicNoise = (seed: string) => {
  const hash = seed.split('').reduce((acc, char, index) => {
    return (acc * 31 + char.charCodeAt(0) + index * 17) % 100_003
  }, 17)
  return 0.95 + (hash % 11) * 0.01
}

export function MetricDetailClient({ metric }: MetricDetailClientProps) {
  const { user, token } = useAuthStore()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const searchParams = useSearchParams()
  const baseMetric = getMetricBySlug(metric)
  const baseMetricSlug = baseMetric?.slug || ''
  const [activeQuickAction, setActiveQuickAction] = useState<'comparison' | 'alerts' | 'export'>('comparison')
  const requestedScopePath = normalizeScopePath(searchParams.get('scope'))
  const roleBasePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const roleScopedPath = clampScopePathByRole(
    user?.role,
    requestedScopePath.length ? requestedScopePath : roleBasePath,
    user?.scopePath
  )
  const roleScopeKey = roleScopedPath.join('/')
  const [liveScopeSnapshot, setLiveScopeSnapshot] = useState<FinanceLiveScopeSnapshot | null>(null)
  const [liveChildSnapshots, setLiveChildSnapshots] = useState<FinanceLiveScopeSnapshot[]>([])
  const [liveMode, setLiveMode] = useState<'live' | 'fallback'>('fallback')
  const [liveUpdatedAt, setLiveUpdatedAt] = useState('')

  useEffect(() => {
    let disposed = false
    const scopePathForFetch = roleScopeKey.split('/').filter(Boolean)

    if (!baseMetricSlug) {
      setLiveScopeSnapshot(null)
      setLiveChildSnapshots([])
      setLiveMode('fallback')
      setLiveUpdatedAt('')
      return () => {
        disposed = true
      }
    }

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
  }, [baseMetricSlug, roleScopeKey, token])

  if (!baseMetric) {
    return (
      <DashboardLayout>
        <Card className="border-slate-200 bg-white text-slate-900 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
          <CardHeader>
            <CardTitle>指标不存在</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              页面不存在 Page Not Found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/finance/" className="inline-flex items-center text-sm text-primary hover:text-primary/90">
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回经营指标总览
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
            <CardTitle>实时数据未接入</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-200">
              Strict Live Mode Enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              当前指标详情页已禁用估算数据。请先在系统集成中心完成财务实时数据接入与同步。
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
  const isScopeClamped =
    requestedScopePath.length > 0 && requestedScopePath.join('/') !== roleScopedPath.join('/')
  const scopeNode = getScopeHierarchyNodeByPath(roleScopedPath)
  const fallbackScopedMetric =
    getScopedFinancialMetric(baseMetric.slug, roleScopedPath) || {
      ...baseMetric,
      scopeName: scopeNode?.name || '当前口径',
      scopePath: roleScopedPath,
    }
  const scopedMetric =
    mergeScopedMetricWithLive(
      fallbackScopedMetric,
      liveScopeSnapshot,
      baseMetric.slug as MetricSlug
    ) || fallbackScopedMetric
  const Icon = scopedMetric.icon
  const momRate = getMoMRate(scopedMetric)
  const tone = getTrendTone(scopedMetric)
  const scopeQuery = encodeURIComponent(roleScopedPath.join('/'))
  const requestedSegment = searchParams.get('segment')?.trim().toLowerCase() || ''
  const requestedComponent = searchParams.get('component')?.trim().toLowerCase() || ''
  const requestedComponentType = searchParams.get('componentType')?.trim().toLowerCase() || ''
  const requestedSegmentLabel = searchParams.get('segmentLabel')?.trim() || ''
  const requestedComponentLabel = searchParams.get('componentLabel')?.trim() || ''
  const liveSegmentRows = getLiveOperatingSegmentRows(liveScopeSnapshot)
  const segmentRows = liveSegmentRows.length > 0 ? liveSegmentRows : getScopeOperatingSegmentRows(roleScopedPath)
  const totalSegmentRevenue = segmentRows.reduce((sum, segment) => sum + Math.max(0, segment.revenue), 0)
  const getSegmentMetricValue = (
    segment: (typeof segmentRows)[number],
    totalMetricValue: number,
    metricSlug: MetricSlug = scopedMetric.slug as MetricSlug,
    segmentRevenueTotal = totalSegmentRevenue
  ) => {
    if (metricSlug === 'revenue') return segment.revenue
    if (metricSlug === 'food-cost') return segment.foodCost
    if (metricSlug === 'labor-cost') return segment.laborCost
    if (metricSlug === 'operating-profit') return segment.operatingProfit

    const share =
      segmentRevenueTotal > 0
        ? segment.revenue / segmentRevenueTotal
        : Math.max(0, segment.revenueShare || 0)
    return Math.max(0, Number((totalMetricValue * share).toFixed(2)))
  }
  const activeSegment = segmentRows.find((item) => item.key === requestedSegment) || undefined
  const activeSegmentMetricValue = activeSegment
    ? getSegmentMetricValue(activeSegment, scopedMetric.value)
    : 0
  const activeSegmentDetail = activeSegment
    ? getLiveSegmentDetail(liveScopeSnapshot, activeSegment.key) ||
      getScopeOperatingSegmentDetail(roleScopedPath, activeSegment.key)
    : undefined
  const activeMetricComponentRows = activeSegmentDetail
    ? (() => {
        if (activeSegment) {
          const liveRows = getLiveMetricComponentBreakdown(
            scopedMetric.slug as MetricSlug,
            liveScopeSnapshot,
            activeSegment.key,
            activeSegmentMetricValue
          )
          if (liveRows.length > 0) return liveRows
        }
        return getMetricComponentBreakdown(
          scopedMetric.slug as MetricSlug,
          roleScopedPath,
          activeSegmentDetail
        )
      })()
    : []
  const activeComponent = activeMetricComponentRows.find((item) => item.id === requestedComponent) || undefined
  const componentContributionRate =
    activeComponent && scopedMetric.value > 0 ? (activeComponent.amount / scopedMetric.value) * 100 : 0
  const activeComponentMonthlyValues = activeComponent
    ? scopedMetric.monthlyValues.map((monthValue, index) => {
        if (scopedMetric.value <= 0) return 0
        const baseValue = (activeComponent.amount / scopedMetric.value) * monthValue
        return baseValue * getDeterministicNoise(`${roleScopedPath.join('/')}:${scopedMetric.slug}:${activeComponent.id}:${index}`)
      })
    : []
  const activeComponentMonthlyMax = Math.max(...activeComponentMonthlyValues, 1)
  const drilldownHref = appendQuery(
    `/dashboard/finance/drilldown/${roleScopedPath.join('/')}/?metric=${scopedMetric.slug}`,
    {
      segment: activeSegment?.key,
      segmentLabel: activeSegment?.label || requestedSegmentLabel,
    }
  )
  const thirdLevelMenus = [
    { anchor: 'trend', label: scopedMetric.subMenus[0] || '趋势分析', labelEn: 'Trend' },
    { anchor: 'city', label: scopedMetric.subMenus[1] || '范围分布', labelEn: 'Scope' },
    { anchor: 'segment', label: '餐段构成', labelEn: 'Segment' },
    { anchor: 'projects', label: scopedMetric.subMenus[2] || '关联指标', labelEn: 'Related' },
  ]

  const childScopes = getScopeHierarchyChildren(roleScopedPath)
  const liveChildScopeMap = new Map(
    liveChildSnapshots.map((snapshot) => [snapshot.scopePath.join('/'), snapshot])
  )
  const componentScopeRows =
    activeSegment && activeComponent
      ? childScopes
          .map((child) => {
            const childLiveScope = liveChildScopeMap.get(child.path.join('/')) || null
            const childMetricValue =
              childLiveScope?.metrics?.[scopedMetric.slug as MetricSlug]?.value ||
              getScopedFinancialMetric(scopedMetric.slug, child.path)?.value ||
              0
            const childSegmentRowsLive = getLiveOperatingSegmentRows(childLiveScope)
            const childSegmentRowsResolved =
              childSegmentRowsLive.length > 0
                ? childSegmentRowsLive
                : getScopeOperatingSegmentRows(child.path)
            const childTotalSegmentRevenue = childSegmentRowsResolved.reduce(
              (sum, segment) => sum + Math.max(0, segment.revenue),
              0
            )
            const childSegmentRow = childSegmentRowsResolved.find(
              (segment) => segment.key === activeSegment.key
            )
            const childSegmentMetricValue = childSegmentRow
              ? getSegmentMetricValue(
                  childSegmentRow,
                  childMetricValue,
                  scopedMetric.slug as MetricSlug,
                  childTotalSegmentRevenue
                )
              : childMetricValue
            const childSegmentDetail =
              getLiveSegmentDetail(childLiveScope, activeSegment.key) ||
              getScopeOperatingSegmentDetail(child.path, activeSegment.key)
            if (!childSegmentDetail) return null
            const childComponentRows =
              getLiveMetricComponentBreakdown(
                scopedMetric.slug as MetricSlug,
                childLiveScope,
                activeSegment.key,
                childSegmentMetricValue
              ) ||
              []
            const resolvedChildComponentRows =
              childComponentRows.length > 0
                ? childComponentRows
                : getMetricComponentBreakdown(
                    scopedMetric.slug as MetricSlug,
                    child.path,
                    childSegmentDetail
                  )
            const childComponent = resolvedChildComponentRows.find((item) => item.id === activeComponent.id)
            if (!childComponent) return null
            return {
              child,
              childMetricValue,
              childComponentAmount: childComponent.amount,
              childComponentShare: childComponent.share,
            }
          })
          .filter(
            (
              item
            ): item is {
              child: (typeof childScopes)[number]
              childMetricValue: number
              childComponentAmount: number
              childComponentShare: number
            } => Boolean(item)
          )
          .sort((left, right) => right.childComponentAmount - left.childComponentAmount)
      : []
  const cityRows: ScopedCityRow[] =
    scopeNode?.level === 'global' || scopeNode?.level === 'country'
      ? getMetricCityRows(scopedMetric.slug).map((row) => ({
          ...row,
          path: getScopePathByName(row.city, {
            preferredLevels: ['city'],
            fallbackPath: roleScopedPath,
          }),
        }))
      : childScopes.length > 0
        ? (() => {
            const scopedRows = childScopes
              .map((child) => ({
                city: child.name,
                value:
                  liveChildScopeMap.get(child.path.join('/'))?.metrics?.[scopedMetric.slug as MetricSlug]
                    ?.value ||
                  getScopedFinancialMetric(scopedMetric.slug, child.path)?.value ||
                  0,
                projects: child.projects,
                stores: child.stores,
                path: child.path,
              }))
              .sort((a, b) => b.value - a.value)

            const total = scopedRows.reduce((sum, row) => sum + row.value, 0)
            return scopedRows.map((row) => ({
              ...row,
              weight: total > 0 ? row.value / total : 1 / scopedRows.length,
            }))
          })()
        : [
            {
              city: scopeNode?.name || '当前范围',
              value: scopedMetric.value,
              projects: scopeNode?.projects || 0,
              stores: scopeNode?.stores || 0,
              weight: 1,
              path: roleScopedPath,
            },
          ]
  const liveUpdatedLabel = (() => {
    const timestamp = Date.parse(liveUpdatedAt)
    if (!Number.isFinite(timestamp)) return ''
    return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
  })()

  const metricHrefWithGranularity = (
    metricSlug: MetricSlug,
    params?: {
      segment?: string
      segmentLabel?: string
      componentType?: string
      component?: string
      componentLabel?: string
    }
  ) =>
    appendQuery(`/dashboard/finance/${metricSlug}/?scope=${scopeQuery}`, {
      segment: params?.segment,
      segmentLabel: params?.segmentLabel,
      componentType: params?.componentType,
      component: params?.component,
      componentLabel: params?.componentLabel,
    })

  const maxValue = Math.max(...scopedMetric.monthlyValues, 1)
  const relatedMetrics = getRelatedMetrics(scopedMetric.slug).map(
    (item) => getScopedFinancialMetric(item.slug, roleScopedPath) || item
  )
  const monthlyAverage =
    scopedMetric.monthlyValues.length > 0
      ? scopedMetric.monthlyValues.reduce((sum, value) => sum + value, 0) / scopedMetric.monthlyValues.length
      : scopedMetric.value
  const budgetValue = scopedMetric.value * (scopedMetric.category === 'cost' ? 1.03 : 0.98)
  const cityTopRows = cityRows.slice().sort((a, b) => b.value - a.value).slice(0, 3)

  const downloadMetricCsv = () => {
    const headers = ['月份', '指标', '金额', '口径']
    const rows = MONTH_LABELS.map((month, index) => [
      month,
      scopedMetric.name,
      String(scopedMetric.monthlyValues[index] || 0),
      scopeNode?.name || scopedMetric.scopeName,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${scopedMetric.name}_${scopeNode?.name || 'scope'}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看财务指标详情">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/finance/" className="inline-flex items-center text-sm text-primary hover:text-primary/90">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回经营指标总览
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
              当前口径：{scopeNode?.name || scopedMetric.scopeName}
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
                越权口径已自动裁剪
              </Badge>
            ) : null}
            {activeSegment ? (
              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                餐段：{activeSegment.label}
              </Badge>
            ) : null}
            {activeComponent ? (
              <Badge className="bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/15">
                分项：{requestedComponentLabel || activeComponent.label}
              </Badge>
            ) : null}
            {thirdLevelMenus.map((menu) => (
              <a
                key={menu.anchor}
                href={`#${menu.anchor}`}
                className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/15"
              >
                {menu.label}
              </a>
            ))}
          </div>
        </div>

        <Card className="mb-4 border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">快捷操作 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'comparison', label: '对比分析' },
                { key: 'alerts', label: '异常预警' },
                { key: 'export', label: '导出结果' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveQuickAction(tab.key as 'comparison' | 'alerts' | 'export')}
                  className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm transition-colors ${
                    activeQuickAction === tab.key
                      ? 'border-primary/35 bg-primary/15 text-primary'
                      : 'border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.10]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeQuickAction === 'comparison' && (
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-xl border border-white/12 bg-slate-950/35 p-3">
                  <p className="text-xs text-slate-400">当前值 Current</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatAmount(scopedMetric.value, scopedMetric.unit)}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-slate-950/35 p-3">
                  <p className="text-xs text-slate-400">月均值 Monthly Avg</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatAmount(monthlyAverage, scopedMetric.unit)}</p>
                </div>
                <div className="rounded-xl border border-white/12 bg-slate-950/35 p-3">
                  <p className="text-xs text-slate-400">预算值 Budget</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatAmount(budgetValue, scopedMetric.unit)}</p>
                </div>
              </div>
            )}

            {activeQuickAction === 'alerts' && (
              <div className="space-y-2">
                {cityTopRows.map((row) => (
                  <Link
                    key={`alert-${row.city}`}
                    href={appendQuery(buildScopeDrilldownHref(row.path, scopedMetric.slug), {
                      segment: activeSegment?.key,
                      segmentLabel: activeSegment?.label || requestedSegmentLabel,
                    })}
                    className="group block rounded-xl border border-white/12 bg-slate-950/35 px-3 py-2.5 transition hover:border-primary/35 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-white">{row.city}</span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        {formatAmount(row.value, scopedMetric.unit)}
                        <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
                <Link
                  href={drilldownHref}
                  className="inline-flex min-h-11 items-center rounded-lg border border-primary/35 bg-primary/15 px-3 text-sm text-primary hover:bg-primary/20"
                >
                  进入经营穿透
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {activeQuickAction === 'export' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadMetricCsv}
                  className="inline-flex min-h-11 items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-slate-100 hover:bg-white/[0.10]"
                >
                  导出 CSV
                </button>
                <Link
                  href="/dashboard/reports/"
                  className="inline-flex min-h-11 items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-slate-100 hover:bg-white/[0.10]"
                >
                  进入报表中心
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="segment" className="mb-4 border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <CardTitle>餐段经营构成</CardTitle>
            <CardDescription>Segment Breakdown & Drilldown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.05] text-xs text-slate-300">
                  <tr>
                    <th className="px-3 py-3">餐段</th>
                    <th className="px-3 py-3">{scopedMetric.name}</th>
                    <th className="px-3 py-3">收入</th>
                    <th className="px-3 py-3">食材成本</th>
                    <th className="px-3 py-3">人力成本</th>
                    <th className="px-3 py-3">营运利润</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentRows.map((segment) => {
                    const isCurrent = activeSegment?.key === segment.key
                    const metricValue = getSegmentMetricValue(segment, scopedMetric.value)
                    return (
                      <tr
                        key={`segment-row-${segment.key}`}
                        className={`border-b border-white/10 ${isCurrent ? 'bg-primary/10' : 'bg-slate-950/35'}`}
                      >
                        <td className="px-3 py-3">
                          <Link
                            href={metricHrefWithGranularity(scopedMetric.slug as MetricSlug, {
                              segment: segment.key,
                              segmentLabel: segment.label,
                            })}
                            className="group inline-flex items-center text-white hover:text-primary"
                          >
                            {segment.label}
                            <ArrowRight className="ml-1 h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </td>
                        <td className="px-3 py-3 font-medium text-white">{formatAmount(metricValue, scopedMetric.unit)}</td>
                        <td className="px-3 py-3 text-slate-200">{formatAmount(segment.revenue)}</td>
                        <td className="px-3 py-3 text-slate-200">{formatAmount(segment.foodCost)}</td>
                        <td className="px-3 py-3 text-slate-200">{formatAmount(segment.laborCost)}</td>
                        <td className="px-3 py-3 text-slate-200">{formatAmount(segment.operatingProfit)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {activeSegmentDetail ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    {activeSegmentDetail.segment.label} · {scopedMetric.name} 分项明细
                  </p>
                  <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                    {formatAmount(
                      getSegmentMetricValue(activeSegmentDetail.segment, scopedMetric.value),
                      scopedMetric.unit
                    )}
                  </Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {activeMetricComponentRows.map((component) => (
                    <Link
                      key={`segment-component-${component.id}`}
                      href={metricHrefWithGranularity(scopedMetric.slug as MetricSlug, {
                        segment: activeSegmentDetail.segment.key,
                        segmentLabel: activeSegmentDetail.segment.label,
                        componentType: requestedComponentType || scopedMetric.category,
                        component: component.id,
                        componentLabel: component.label,
                      })}
                      className={`group rounded-xl border px-3 py-2 transition ${
                        activeComponent?.id === component.id
                          ? 'border-primary/45 bg-primary/15'
                          : 'border-white/10 bg-white/[0.04] hover:border-primary/35 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-200">{component.label}</p>
                        <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">{formatAmount(component.amount, scopedMetric.unit)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{(component.share * 100).toFixed(1)}% 占比</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                点击上表任一餐段，即可下钻到该餐段分项明细。
              </div>
            )}

            {activeComponent && activeSegment ? (
              <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      分项细节 · {activeComponent.label}
                    </p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                      {formatAmount(activeComponent.amount, scopedMetric.unit)}
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                      <p className="text-[11px] text-slate-500">所在餐段</p>
                      <p className="mt-1 text-sm text-slate-100">{activeSegment.label}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                      <p className="text-[11px] text-slate-500">分项占当前指标</p>
                      <p className="mt-1 text-sm text-slate-100">{componentContributionRate.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                      <p className="text-[11px] text-slate-500">分项占餐段</p>
                      <p className="mt-1 text-sm text-slate-100">{(activeComponent.share * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {activeComponentMonthlyValues.map((value, index) => {
                      const width = activeComponentMonthlyMax > 0 ? (value / activeComponentMonthlyMax) * 100 : 0
                      return (
                        <div key={`component-month-${MONTH_LABELS[index]}-${activeComponent.id}`} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{MONTH_LABELS[index]}</span>
                            <span className="text-slate-200">{formatAmount(value, scopedMetric.unit)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-[#66a3ff] to-[#9ec1ff]"
                              style={{ width: `${Math.max(width, 4)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">分项跨项目/餐厅排名</p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                      {componentScopeRows.length} 个下级单元
                    </Badge>
                  </div>
                  {componentScopeRows.length > 0 ? (
                    <div className="space-y-1.5">
                      {componentScopeRows.map((row) => (
                        <Link
                          key={`component-scope-${row.child.slug}-${activeComponent.id}`}
                          href={appendQuery(buildScopeDrilldownHref(row.child.path, scopedMetric.slug), {
                            segment: activeSegment.key,
                            segmentLabel: activeSegment.label,
                            componentType: requestedComponentType || scopedMetric.category,
                            component: activeComponent.id,
                            componentLabel: activeComponent.label,
                          })}
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-200 transition hover:border-primary/35 hover:bg-white/[0.08]"
                        >
                          <span className="truncate pr-2">{row.child.name}</span>
                          <span className="inline-flex items-center gap-2 text-slate-300">
                            <span>{formatAmount(row.childComponentAmount, scopedMetric.unit)}</span>
                            <span className="text-slate-500">{(row.childComponentShare * 100).toFixed(1)}%</span>
                            <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-xs text-slate-400">
                      当前已是最细层级，暂无下级项目/餐厅可继续排名对比。
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{scopedMetric.name}</CardTitle>
                <CardDescription className="mt-1">指标说明 Metric Brief</CardDescription>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3 text-primary">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">当月数值</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatAmount(scopedMetric.value, scopedMetric.unit)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">环比变化</p>
              <p
                className={`mt-2 inline-flex items-center text-2xl font-semibold ${
                  tone === 'positive' ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                <ArrowUpRight className="mr-1 h-5 w-5" />
                {formatRate(momRate)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">指标归类</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {scopedMetric.category === 'revenue' ? '收入类' : scopedMetric.category === 'cost' ? '成本类' : '利润类'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
          <Card id="trend" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>月度趋势</CardTitle>
              <CardDescription>月度走势 Monthly Trend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scopedMetric.monthlyValues.map((value, index) => {
                const width = maxValue > 0 ? (value / maxValue) * 100 : 0
                return (
                  <div key={`${scopedMetric.slug}-${MONTH_LABELS[index]}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{MONTH_LABELS[index]}</span>
                      <span className="font-medium text-white">{formatAmount(value, scopedMetric.unit)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#4f7ceb] to-[#84a7ff]"
                        style={{ width: `${Math.max(width, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card id="city" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>范围分布</CardTitle>
              <CardDescription>范围贡献 Scope Contribution</CardDescription>
            </CardHeader>
              <CardContent className="space-y-2">
                {cityRows.map((row) => (
                  <Link
                    key={`${scopedMetric.slug}-${row.city}`}
                    href={appendQuery(buildScopeDrilldownHref(row.path, scopedMetric.slug), {
                      segment: activeSegment?.key,
                      segmentLabel: activeSegment?.label || requestedSegmentLabel,
                    })}
                    className="group block rounded-xl border border-white/10 bg-slate-950/35 p-3 transition hover:border-primary/35 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{row.city}</span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        {formatAmount(row.value, scopedMetric.unit)}
                        <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{(row.weight * 100).toFixed(1)}% 占比</span>
                      <span>{row.projects} 项目 / {row.stores} 门店</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card id="projects" className="mt-4 border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>相关指标子菜单</CardTitle>
              <CardDescription>联动指标 Related Metrics</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {relatedMetrics.map((item) => {
                const ItemIcon = item.icon
                const itemRate = getMoMRate(item)
                const itemTone = getTrendTone(item)
                return (
                  <Link
                    key={item.slug}
                    href={metricHrefWithGranularity(item.slug as MetricSlug, {
                      segment: activeSegment?.key,
                      segmentLabel: activeSegment?.label || requestedSegmentLabel,
                    })}
                    className="group rounded-xl border border-white/10 bg-slate-950/35 p-3 transition-all hover:border-primary/35 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300">{item.name}</p>
                      <ItemIcon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{formatAmount(item.value, item.unit)}</p>
                    <p className={`mt-1 text-xs ${itemTone === 'positive' ? 'text-emerald-300' : 'text-red-300'}`}>
                      环比 {formatRate(itemRate)}
                    </p>
                    <div className="mt-2 inline-flex items-center text-xs text-primary">
                      进入
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
      </AccessGuard>
    </DashboardLayout>
  )
}
