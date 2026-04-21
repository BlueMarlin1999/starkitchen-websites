'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { WorkflowTaskList } from '@/components/workflow-task-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  ChefHat,
  Percent,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { isTaskOpen, useOpsTasksStore } from '@/store/ops-tasks'
import { getRoleBaseScopePath } from '@/lib/access'
import {
  EXECUTIVE_DOMAIN_META,
  FINANCIAL_METRICS,
  MONTH_LABELS,
  MetricSlug,
  formatAmount,
  formatExecutiveKpiTrend,
  formatExecutiveKpiValue,
  formatRate,
  getMetricCityRows,
  getMoMRate,
  getScopeHierarchyChildren,
  getScopeHierarchyNodeByPath,
  getScopeExecutiveKpiGroups,
  getScopedFinancialMetric,
  getTrendTone,
} from '@/lib/business-metrics'
import { getCounterMetricsByScope } from '@/lib/counter-metrics'
import { buildExecutiveKpiHref } from '@/lib/executive-navigation'
import { loadFinanceLiveHealth, loadFinanceLiveScope, mergeScopedMetricWithLive } from '@/lib/finance-live-client'
import { FinanceLiveHealthSnapshot, FinanceLiveScopeSnapshot } from '@/lib/finance-live-types'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildScopeDrilldownHref, getScopePathByName } from '@/lib/scope-drilldown'
import { buildApiUrl } from '@/lib/runtime-config'
import { PRODUCT_CATEGORY_LIBRARY } from '@/lib/product-center'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
} from 'recharts'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const chartPalette = ['#9ecbff', '#7ca5ff', '#58dbff', '#7f72ff', '#8cffde', '#6d88ff', '#b8d8ff', '#78f3e0']

interface SupplyOverviewSnapshot {
  totalOrders: number
  delayedOrders: number
  onTimeRate: number
  pendingQc: number
  dispatchTasks: number
  pendingFoodSafetyTasks: number
  inventoryTurnoverDays: number | null
  wasteRatePercent: number | null
  coldChainComplianceRate: number | null
}

export default function DashboardPage() {
  const [isClientReady, setIsClientReady] = useState(false)
  const [isCompactMobile, setIsCompactMobile] = useState(false)
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const { user, token } = useAuthStore()
  const [liveScopeSnapshot, setLiveScopeSnapshot] = useState<FinanceLiveScopeSnapshot | null>(null)
  const [liveChildSnapshots, setLiveChildSnapshots] = useState<FinanceLiveScopeSnapshot[]>([])
  const [liveHealth, setLiveHealth] = useState<FinanceLiveHealthSnapshot | null>(null)
  const [liveMode, setLiveMode] = useState<'live' | 'fallback'>('fallback')
  const [liveUpdatedAt, setLiveUpdatedAt] = useState('')
  const [supplyOverview, setSupplyOverview] = useState<SupplyOverviewSnapshot | null>(null)
  const tasks = useOpsTasksStore((state) => state.tasks)
  const displayName = user?.nickname?.trim() || user?.name || '管理层用户'
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const roleScopeKey = roleScopePath.join('/')
  const roleScopeNode = getScopeHierarchyNodeByPath(roleScopePath)
  const scopeLabel = roleScopeNode?.name || '当前权限'
  const scopeQuery = encodeURIComponent(roleScopePath.join('/'))
  const scopeChildren = getScopeHierarchyChildren(roleScopePath)
  const executiveGroups = getScopeExecutiveKpiGroups(roleScopePath)
  const liveChildScopeMap = useMemo(
    () => new Map(liveChildSnapshots.map((snapshot) => [snapshot.scopePath.join('/'), snapshot])),
    [liveChildSnapshots]
  )

  useEffect(() => {
    let disposed = false
    const scopePathForFetch = roleScopeKey.split('/').filter(Boolean)
    const loadLiveSnapshot = async () => {
      try {
        const [response, health] = await Promise.all([
          loadFinanceLiveScope(scopePathForFetch, {
            includeChildren: true,
            token,
          }),
          loadFinanceLiveHealth(scopePathForFetch, {
            thresholdMinutes: 30,
            token,
          }),
        ])
        if (disposed) return
        setLiveScopeSnapshot(response.snapshot)
        setLiveChildSnapshots(response.children || [])
        setLiveMode(response.mode)
        setLiveUpdatedAt(response.updatedAt || '')
        setLiveHealth(health)
      } catch {
        if (disposed) return
        setLiveScopeSnapshot(null)
        setLiveChildSnapshots([])
        setLiveHealth(null)
        setLiveMode('fallback')
        setLiveUpdatedAt('')
      }
    }
    void loadLiveSnapshot()
    return () => {
      disposed = true
    }
  }, [roleScopeKey, token])

  useEffect(() => {
    let disposed = false
    const loadSupplyOverview = async () => {
      try {
        const response = await fetch(buildApiUrl('/supply/live'), {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string'
              ? payload.message
              : `读取供应链概览失败 (${response.status})`
          )
        }
        const overview =
          payload?.overview && typeof payload.overview === 'object'
            ? (payload.overview as SupplyOverviewSnapshot)
            : null
        if (!disposed) {
          setSupplyOverview(overview)
        }
      } catch {
        if (!disposed) {
          setSupplyOverview(null)
        }
      }
    }
    void loadSupplyOverview()
    return () => {
      disposed = true
    }
  }, [token])

  const resolveLiveScopeByPath = (scopePath: string[]) => {
    const scopeKey = scopePath.join('/')
    if (scopeKey === roleScopeKey) return liveScopeSnapshot
    return liveChildScopeMap.get(scopeKey) || null
  }

  const getMergedScopedMetric = (slug: MetricSlug, scopePath: string[]) => {
    const template = getScopedFinancialMetric(slug, scopePath)
    if (!template) return null
    const merged = mergeScopedMetricWithLive(template, resolveLiveScopeByPath(scopePath), slug)
    if (strictLiveMode) {
      return merged || null
    }
    return merged || template
  }

  const scopedMetricList = FINANCIAL_METRICS.map((metric) => getMergedScopedMetric(metric.slug, roleScopePath))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
  const scopedMetricMap = new Map(scopedMetricList.map((metric) => [metric.slug, metric]))
  const revenueMetric = scopedMetricMap.get('revenue')
  const laborCostMetric = scopedMetricMap.get('labor-cost')
  const netProfitMetric = scopedMetricMap.get('net-profit')

  const unresolvedTasks = tasks.filter(isTaskOpen)
  const unreportedStoreCount = tasks.filter((task) => task.kind === 'reporting' && isTaskOpen(task)).length
  const reportingRate = 94.6
  const abnormalStoreCount = 7
  const pendingCount = unresolvedTasks.length
  const laborCostRate =
    revenueMetric && revenueMetric.value > 0
      ? ((laborCostMetric?.value || 0) / revenueMetric.value) * 100
      : 0
  const netMargin =
    revenueMetric && revenueMetric.value > 0
      ? ((netProfitMetric?.value || 0) / revenueMetric.value) * 100
      : 0

  const trendData = MONTH_LABELS.map((month, index) => ({
    month: month.slice(5),
    revenue: revenueMetric?.monthlyValues[index] || 0,
    labor: laborCostMetric?.monthlyValues[index] || 0,
    netProfit: netProfitMetric?.monthlyValues[index] || 0,
  }))

  const costMix = scopedMetricList.filter(
    (metric) => metric.category === 'cost' && metric.slug !== 'management-cost'
  ).map((metric) => ({
    name: metric.name,
    value: metric.value,
  }))

  const cityRevenueData =
    roleScopeNode?.level === 'global' || roleScopeNode?.level === 'country'
      ? getMetricCityRows('revenue')
          .slice(0, 6)
          .map((row) => {
            const scopePath = getScopePathByName(row.city, {
              preferredLevels: ['city'],
              fallbackPath: roleScopePath,
            })
            const liveRevenue = getMergedScopedMetric('revenue', scopePath)?.value || 0
            return {
              city: row.city,
              revenue: strictLiveMode ? liveRevenue : liveRevenue > 0 ? liveRevenue : row.value,
              stores: row.stores,
              scopePath,
            }
          })
      : scopeChildren.length > 0
        ? scopeChildren.map((node) => ({
            city: node.name,
            revenue: getMergedScopedMetric('revenue', node.path)?.value || 0,
            stores: node.stores,
            scopePath: node.path,
          }))
        : [
            {
              city: scopeLabel,
              revenue: revenueMetric?.value || 0,
              stores: roleScopeNode?.stores || 0,
              scopePath: roleScopePath,
            },
          ]
  const cityDrilldownRows = cityRevenueData.map((row) => ({
    ...row,
    href: buildScopeDrilldownHref(row.scopePath, 'revenue'),
  }))
  const isFinanceLiveConnected = liveMode === 'live' && Boolean(liveScopeSnapshot)
  const financeDataSourceLabel = strictLiveMode
    ? isFinanceLiveConnected
      ? '实时'
      : '未接入'
    : liveMode === 'live'
      ? '实时'
      : '估算'

  const getMetricValue = (slug: string) =>
    scopedMetricMap.get(slug as (typeof FINANCIAL_METRICS)[number]['slug'])?.value || 0

  const budgetMultiplierByMetric: Partial<Record<(typeof FINANCIAL_METRICS)[number]['slug'], number>> = {
    revenue: 0.985,
    'food-cost': 1.03,
    'labor-cost': 1.02,
    energy: 0.96,
    tax: 1.01,
    interest: 0.95,
    'depreciation-amortization': 1.04,
    'operating-profit': 0.98,
    'management-cost': 1.05,
    'net-profit': 0.97,
  }

  const formatDeltaPercent = (value: number) => {
    const normalizedValue = Math.abs(value) < 0.05 ? 0 : value
    return `${normalizedValue >= 0 ? '+' : ''}${normalizedValue.toFixed(1)}%`
  }

  const revenueAmount = getMetricValue('revenue')
  const financialHeadlineItems = [
    { title: '营业额', titleEn: 'Revenue', metricSlug: 'revenue' as const },
    { title: '食材成本', titleEn: 'Food Cost', metricSlug: 'food-cost' as const },
    { title: '人工成本', titleEn: 'Labor Cost', metricSlug: 'labor-cost' as const },
    { title: '能耗费', titleEn: 'Energy Cost', metricSlug: 'energy' as const },
    { title: '税金', titleEn: 'Tax', metricSlug: 'tax' as const },
    { title: '利息', titleEn: 'Interest', metricSlug: 'interest' as const },
    {
      title: '折旧摊销',
      titleEn: 'Depreciation & Amortization',
      metricSlug: 'depreciation-amortization' as const,
    },
    { title: '营运利润', titleEn: 'Operating Profit', metricSlug: 'operating-profit' as const },
    { title: '管理费用', titleEn: 'Management Cost', metricSlug: 'management-cost' as const },
    { title: '净利润', titleEn: 'Net Profit', metricSlug: 'net-profit' as const },
  ].map((item) => {
    const scopedMetric = scopedMetricMap.get(item.metricSlug)
    const value = scopedMetric?.value || getMetricValue(item.metricSlug)
    const monthlyValues = scopedMetric?.monthlyValues || []
    const monthlyAverage =
      monthlyValues.length > 0
        ? monthlyValues.reduce((sum, current) => sum + current, 0) / monthlyValues.length
        : value
    const budgetMultiplier = budgetMultiplierByMetric[item.metricSlug] || 1
    const budgetValue = value * budgetMultiplier
    const varianceVsMonthlyAverage = monthlyAverage > 0 ? ((value - monthlyAverage) / monthlyAverage) * 100 : 0
    const varianceVsBudget = budgetValue > 0 ? ((value - budgetValue) / budgetValue) * 100 : 0

    return {
      ...item,
      value,
      ratio: revenueAmount > 0 ? (value / revenueAmount) * 100 : 0,
      varianceVsMonthlyAverage,
      varianceVsBudget,
      level2Href: `/dashboard/finance/${item.metricSlug}/?scope=${scopeQuery}`,
    }
  })

  const quickCards = [
    {
      title: '门店填报率',
      value: `${reportingRate.toFixed(1)}%`,
      sub: unreportedStoreCount > 0 ? `${unreportedStoreCount} 家未填报待跟进` : '全部门店已填报',
      href: '/dashboard/stores/',
    },
    {
      title: '人工成本率',
      value: `${laborCostRate.toFixed(1)}%`,
      sub: '目标 32.0%',
      href: '/dashboard/hr/',
    },
    {
      title: '异常门店数',
      value: `${abnormalStoreCount}`,
      sub: '人工/库存/食安异常',
      href: '/dashboard/stores/',
    },
    {
      title: '待处理事项',
      value: `${pendingCount}`,
      sub: '建议先看异常中心',
      href: '/dashboard/tasks/',
    },
    {
      title: 'AI 助手入口',
      value: '在线',
      sub: '策略问答与经营建议',
      href: '/dashboard/ai/',
    },
    {
      title: 'OA 协同入口',
      value: '已启用',
      sub: '聊天 / 文件 / 审计',
      href: '/dashboard/oa/',
    },
  ]

  const specialtyModules = useMemo(
    () => [
      {
        title: '门店填报追踪卡',
        value:
          unreportedStoreCount > 0
            ? `${unreportedStoreCount} 家待补录`
            : '全部已填报',
        description: '填报状态 Reporting Status',
        href: '/dashboard/stores/',
        icon: Building2,
      },
      {
        title: '菜品销量 / 损耗分析卡',
        value:
          typeof supplyOverview?.wasteRatePercent === 'number'
            ? `损耗率 ${supplyOverview.wasteRatePercent.toFixed(2)}%`
            : '损耗率 未接入',
        description: '损耗联动 Waste Linkage',
        href: '/dashboard/supply/inventory/',
        icon: ChefHat,
      },
      {
        title: '产品中心分类管理卡',
        value: `${PRODUCT_CATEGORY_LIBRARY.length} 大类`,
        description: '产品库 Product Center',
        href: '/dashboard/products/',
        icon: Boxes,
      },
      {
        title: '中央厨房出品效率卡',
        value:
          typeof supplyOverview?.coldChainComplianceRate === 'number'
            ? `${supplyOverview.coldChainComplianceRate.toFixed(1)}%`
            : '未接入',
        description: '履约效率 Fulfillment',
        href: '/dashboard/supply/',
        icon: Truck,
      },
      {
        title: '食安巡检状态卡',
        value: `${supplyOverview?.pendingFoodSafetyTasks ?? 0} 项待确认`,
        description: '食安闭环 Food Safety',
        href: '/dashboard/supply/inventory/',
        icon: ShieldCheck,
      },
      {
        title: '班次与人工成本联动卡',
        value: `${laborCostRate.toFixed(1)}%`,
        description: '班次成本 Shift vs Labor',
        href: '/dashboard/hr/',
        icon: Users,
      },
    ],
    [laborCostRate, supplyOverview, unreportedStoreCount]
  )

  const counterPerformance = getCounterMetricsByScope(roleScopePath).map((item) => {
    const monthlyAverage =
      item.monthlyValues.length > 0
        ? item.monthlyValues.reduce((sum, value) => sum + value, 0) / item.monthlyValues.length
        : item.revenue
    const deltaVsMonthlyAverage = monthlyAverage > 0 ? ((item.revenue - monthlyAverage) / monthlyAverage) * 100 : 0
    const deltaVsBudget = item.budgetRevenue > 0 ? ((item.revenue - item.budgetRevenue) / item.budgetRevenue) * 100 : 0

    return {
      ...item,
      deltaVsMonthlyAverage,
      deltaVsBudget,
      detailHref: `/dashboard/stores/counters/${item.slug}/?scope=${scopeQuery}`,
    }
  })

  const counterRevenueChartData = counterPerformance.map((item) => ({
    counter: item.counter,
    revenue: item.revenue,
    detailHref: item.detailHref,
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewportMode = () => {
      const compactByWidth = window.innerWidth <= 900
      const compactByPointer = window.matchMedia('(pointer: coarse)').matches
      setIsCompactMobile(compactByWidth || compactByPointer)
      setIsClientReady(true)
    }

    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
    return () => window.removeEventListener('resize', updateViewportMode)
  }, [])

  const shouldUseCompactLayout = !isClientReady || isCompactMobile

  if (shouldUseCompactLayout) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <Card className={panelClassName}>
            <CardContent className="flex flex-col gap-2 px-5 py-4">
              <p className="text-sm text-slate-200">欢迎回来，{displayName}</p>
              <p className="text-xs text-slate-400">
                当前口径 {scopeLabel} · 门店 {roleScopeNode?.stores || 0} 家 · 数据源{' '}
                {financeDataSourceLabel}
              </p>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>核心财务指标</CardTitle>
              <CardDescription className="text-slate-300">移动端精简视图 Mobile Safe View</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {financialHeadlineItems.slice(0, 6).map((item) => (
                <Link
                  key={`compact-${item.title}`}
                  href={item.level2Href}
                  className="rounded-xl border border-white/15 bg-[#081538]/55 px-3 py-2.5 transition hover:border-primary/45 hover:bg-white/[0.08]"
                >
                  <p className="text-xs text-slate-400">{item.title}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatAmount(item.value)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    月均 {formatDeltaPercent(item.varianceVsMonthlyAverage)} · 预算 {formatDeltaPercent(item.varianceVsBudget)}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {quickCards.map((item) => (
              <Link
                key={`compact-quick-${item.title}`}
                href={item.href}
                className="rounded-xl border border-white/15 bg-[#081538]/55 px-3 py-2.5 transition hover:border-primary/45 hover:bg-white/[0.08]"
              >
                <p className="text-xs text-slate-400">{item.title}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
              </Link>
            ))}
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>城市营收入口</CardTitle>
              <CardDescription className="text-slate-300">City Drilldown Links</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {cityDrilldownRows.map((row) => (
                <Link
                  key={`compact-city-${row.city}`}
                  href={row.href}
                  className="group inline-flex min-h-11 items-center justify-between rounded-lg border border-white/12 bg-[#081538]/55 px-3 py-2 text-sm text-slate-200 transition hover:border-primary/45 hover:bg-white/[0.09]"
                >
                  <span>{row.city}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <WorkflowTaskList
            title="待办 / 异常中心"
            description={isClientReady ? '移动端稳定模式 Mobile Safe Mode' : '正在加载驾驶舱...'}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        <Card className={panelClassName}>
          <CardContent className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="truncate">欢迎回来，{displayName}。当前口径：{scopeLabel} Scope.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 md:justify-end">
              <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                {roleScopeNode?.projects || 0} 个项目
              </Badge>
              <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                {roleScopeNode?.stores || 0} 家门店
              </Badge>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">净利率 {netMargin.toFixed(1)}%</Badge>
              <Badge
                className={
                  isFinanceLiveConnected
                    ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15'
                    : strictLiveMode
                      ? 'bg-red-500/15 text-red-200 hover:bg-red-500/15'
                      : 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/15'
                }
              >
                数据源 {financeDataSourceLabel}
              </Badge>
              {liveUpdatedAt ? (
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                  更新 {new Date(liveUpdatedAt).toLocaleTimeString('zh-CN', { hour12: false })}
                </Badge>
              ) : null}
              {liveHealth ? (
                <Badge
                  className={
                    liveHealth.status === 'healthy'
                      ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15'
                      : liveHealth.status === 'stale'
                        ? 'bg-red-500/15 text-red-200 hover:bg-red-500/15'
                        : 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/15'
                  }
                >
                  健康 {liveHealth.status === 'healthy' ? '正常' : liveHealth.status === 'stale' ? '过期' : '降级'}
                </Badge>
              ) : null}
              {liveHealth?.ageMinutes !== null && typeof liveHealth?.ageMinutes === 'number' ? (
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                  时延 {liveHealth.ageMinutes}m
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle>核心财务指标 Core Financial KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {financialHeadlineItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.level2Href}
                  aria-label={`${item.title} 详情`}
                  className="group block cursor-pointer rounded-2xl border border-white/15 bg-[#081538]/55 p-3.5 transition-all hover:border-primary/45 hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-200">{item.title}</p>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                      {item.title === '营业额' ? '100.0%' : `${item.ratio.toFixed(1)}%`}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-2xl font-semibold text-white">{formatAmount(item.value)}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        占营业额 {item.title === '营业额' ? '100.0%' : `${item.ratio.toFixed(1)}%`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      <span
                        className={
                          item.varianceVsMonthlyAverage >= 0
                            ? 'inline-flex rounded-md border border-[#8cb4ff]/35 bg-[#8cb4ff]/15 px-2 py-0.5 text-[#9ecbff]'
                            : 'inline-flex rounded-md border border-[#ff6b7b]/35 bg-[#ff6b7b]/15 px-2 py-0.5 text-[#ff8d9a]'
                        }
                      >
                        月均 {formatDeltaPercent(item.varianceVsMonthlyAverage)}
                      </span>
                      <span
                        className={
                          item.varianceVsBudget >= 0
                            ? 'inline-flex rounded-md border border-[#8cb4ff]/35 bg-[#8cb4ff]/15 px-2 py-0.5 text-[#9ecbff]'
                            : 'inline-flex rounded-md border border-[#ff6b7b]/35 bg-[#ff6b7b]/15 px-2 py-0.5 text-[#ff8d9a]'
                        }
                      >
                        预算 {formatDeltaPercent(item.varianceVsBudget)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
          {quickCards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group"
            >
              <Card className={`${panelClassName} h-full transition-all hover:border-primary/45 hover:bg-white/[0.09]`}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{item.sub}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              高管协同经营指标（{scopeLabel}口径）
            </CardTitle>
            <CardDescription className="text-slate-300">
              高管联动指标 Executive KPI Stack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {executiveGroups.map((group) => {
                const groupHref = `/dashboard/executive/?domain=${encodeURIComponent(group.domain)}&scope=${scopeQuery}`
                return (
                  <div key={group.domain} className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{EXECUTIVE_DOMAIN_META[group.domain].label}</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{group.kpis.length} 指标</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">域重点 Domain Focus</p>
                    <div className="mt-2">
                      <Link
                        href={groupHref}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/90"
                      >
                        全部指标
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="mt-3 space-y-2">
                      {group.kpis.slice(0, 2).map((kpi) => (
                        <Link
                          key={`${group.domain}-${kpi.key}`}
                          href={buildExecutiveKpiHref(kpi, roleScopePath)}
                          className="group block rounded-xl border border-white/10 bg-white/[0.05] p-2.5 transition-all hover:border-primary/45 hover:bg-white/[0.1]"
                        >
                          <p className="text-[11px] text-slate-400">{kpi.level4Menu}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatExecutiveKpiValue(kpi)}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-400">{formatExecutiveKpiTrend(kpi)}</p>
                            <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                核心经营趋势
              </CardTitle>
              <CardDescription className="text-slate-300">
                趋势优先 Trend First
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="revenueFillCommand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9ecbff" stopOpacity={0.58} />
                      <stop offset="100%" stopColor="#9ecbff" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2d4170" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#c3d3f6', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#c3d3f6', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050f2b',
                      border: '1px solid rgba(157,194,255,0.35)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('zh-CN')} 万元`, '']}
                  />
                  <Area type="monotone" dataKey="revenue" name="营业收入" stroke="#9ecbff" strokeWidth={2.5} fill="url(#revenueFillCommand)" />
                  <Line type="monotone" dataKey="labor" name="人工成本" stroke="#7f72ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="netProfit" name="净利润" stroke="#8cffde" strokeWidth={2.2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div id="workflow-center">
            <WorkflowTaskList
              title="待办 / 异常中心"
              description="异常优先 Exception First"
              className="xl:sticky xl:top-24 xl:h-fit"
            />
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                成本结构占比
              </CardTitle>
              <CardDescription className="text-slate-300">成本结构 Cost Mix</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={108}
                    paddingAngle={2}
                    stroke="rgba(8,19,47,0.9)"
                    strokeWidth={2}
                  >
                    {costMix.map((item, index) => (
                      <Cell key={item.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050f2b',
                      border: '1px solid rgba(157,194,255,0.35)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('zh-CN')} 万元`, '金额']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                城市营收排行
              </CardTitle>
              <CardDescription className="text-slate-300">区域排序 Region Ranking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityRevenueData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid stroke="#2d4170" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#c3d3f6', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="city" width={56} tick={{ fill: '#f1f5f9', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050f2b',
                        border: '1px solid rgba(157,194,255,0.35)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(value: number, name: string) =>
                        name === 'revenue'
                          ? [`${value.toLocaleString('zh-CN')} 万元`, '营业收入']
                          : [value, '门店数']
                      }
                    />
                    <Bar dataKey="revenue" fill="#7ca5ff" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {cityDrilldownRows.map((row) => (
                  <Link
                    key={`city-drilldown-${row.city}`}
                    href={row.href}
                    className="group inline-flex min-h-11 items-center justify-between rounded-lg border border-white/12 bg-[#081538]/55 px-3 py-2 text-sm text-slate-200 transition hover:border-primary/45 hover:bg-white/[0.09]"
                  >
                    <span>{row.city}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                当口经营分析 Counter Performance
              </CardTitle>
              <CardDescription className="text-slate-300">
                营收优先 Revenue First
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={counterRevenueChartData} margin={{ left: 10, right: 10, top: 6, bottom: 4 }}>
                  <CartesianGrid stroke="#2d4170" vertical={false} />
                  <XAxis
                    dataKey="counter"
                    tick={{ fill: '#d7e3ff', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis tick={{ fill: '#c3d3f6', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050f2b',
                      border: '1px solid rgba(157,194,255,0.35)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('zh-CN')} 万元`, '营业额']}
                  />
                  <Bar dataKey="revenue" fill="#8cb4ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>当口关键对比 Counter KPI Snapshot</CardTitle>
              <CardDescription className="text-slate-300">毛利 / 损耗 / 偏差 Margin / Waste / Variance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {counterPerformance.map((item) => (
                <Link
                  key={item.counter}
                  href={item.detailHref}
                  className="group block rounded-xl border border-white/12 bg-[#081538]/55 px-3 py-2.5 transition-all hover:border-primary/40 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{item.counter}</p>
                    <div className="inline-flex items-center gap-1 text-xs text-slate-300">
                      营收 {item.revenue.toLocaleString('zh-CN')} 万元
                      <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">毛利率 {item.grossMarginRate.toFixed(1)}%</Badge>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">损耗率 {item.wasteRate.toFixed(1)}%</Badge>
                    <Badge className={item.deltaVsMonthlyAverage >= 0 ? 'bg-primary/15 text-primary hover:bg-primary/15' : 'bg-[#ff6b7b]/15 text-[#ff8d9a] hover:bg-[#ff6b7b]/15'}>
                      较月均 {item.deltaVsMonthlyAverage >= 0 ? '上浮' : '下降'} {Math.abs(item.deltaVsMonthlyAverage).toFixed(1)}%
                    </Badge>
                    <Badge className={item.deltaVsBudget >= 0 ? 'bg-[#7ca5ff]/15 text-[#9fc2ff] hover:bg-[#7ca5ff]/15' : 'bg-[#ff6b7b]/15 text-[#ff8d9a] hover:bg-[#ff6b7b]/15'}>
                      较预算 {item.deltaVsBudget >= 0 ? '上浮' : '下降'} {Math.abs(item.deltaVsBudget).toFixed(1)}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              餐饮特色组件
            </CardTitle>
            <CardDescription className="text-slate-300">
              差异化组件 Specialty Components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {specialtyModules.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.10]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-white">{module.title}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{module.value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{module.description}</p>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle>经营指标下钻入口</CardTitle>
            <CardDescription className="text-slate-300">
              指标下钻 Metric Drilldown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {scopedMetricList.map((metric) => {
                const Icon = metric.icon
                const momRate = getMoMRate(metric)
                const tone = getTrendTone(metric)

                return (
                  <Link
                    key={metric.slug}
                    href={`/dashboard/finance/${metric.slug}/?scope=${scopeQuery}`}
                    className="group rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition-all hover:border-primary/45 hover:bg-white/[0.10]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300">{metric.name}</p>
                      <div className="rounded-lg border border-white/10 bg-white/[0.08] p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{formatAmount(metric.value, metric.unit)}</p>
                    <div className={`mt-2 inline-flex items-center text-xs ${tone === 'positive' ? 'text-emerald-300' : 'text-red-300'}`}>
                      <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                      环比 {formatRate(momRate)}
                    </div>
                    <div className="mt-3 flex items-center text-xs text-primary">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
