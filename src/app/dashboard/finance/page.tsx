'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Building2, Layers3 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { getRoleBaseScopePath } from '@/lib/access'
import {
  CITY_PROJECTS,
  EXECUTIVE_DOMAIN_META,
  FINANCIAL_METRICS,
  MetricSlug,
  formatAmount,
  formatExecutiveKpiTrend,
  formatExecutiveKpiValue,
  formatRate,
  getMoMRate,
  getScopeExecutiveKpiGroups,
  getScopeHierarchyChildren,
  getScopeHierarchyNodeByPath,
  getScopedFinancialMetric,
  getTrendTone,
} from '@/lib/business-metrics'
import { loadFinanceLiveHealth, loadFinanceLiveScope, mergeScopedMetricWithLive } from '@/lib/finance-live-client'
import { FinanceLiveHealthSnapshot, FinanceLiveScopeSnapshot } from '@/lib/finance-live-types'
import { isStrictLiveMode } from '@/lib/live-mode'
import { getScopePathByName } from '@/lib/scope-drilldown'

const levelLabelMap: Record<string, string> = {
  global: '全球',
  country: '国家',
  region: '区域',
  province: '省级',
  city: '城市',
  site: '门店/项目',
}

export default function FinanceOverviewPage() {
  const { user, token } = useAuthStore()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const [liveScopeSnapshot, setLiveScopeSnapshot] = useState<FinanceLiveScopeSnapshot | null>(null)
  const [liveChildSnapshots, setLiveChildSnapshots] = useState<FinanceLiveScopeSnapshot[]>([])
  const [liveHealth, setLiveHealth] = useState<FinanceLiveHealthSnapshot | null>(null)
  const [liveMode, setLiveMode] = useState<'live' | 'fallback'>('fallback')
  const [liveUpdatedAt, setLiveUpdatedAt] = useState('')
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const roleScopeKey = roleScopePath.join('/')
  const roleScopeNode = getScopeHierarchyNodeByPath(roleScopePath)
  const scopeLabel = roleScopeNode?.name || '当前权限'
  const scopeLevelLabel = roleScopeNode ? levelLabelMap[roleScopeNode.level] || roleScopeNode.level : '口径'
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

  const resolveLiveScopeByPath = (scopePath: string[]) => {
    const scopeKey = scopePath.join('/')
    if (scopeKey === roleScopeKey) return liveScopeSnapshot
    return liveChildScopeMap.get(scopeKey) || null
  }

  const getMergedScopedMetric = (slug: MetricSlug, scopePath: string[]) => {
    const template = getScopedFinancialMetric(slug, scopePath)
    if (!template) return null
    const merged = mergeScopedMetricWithLive(template, resolveLiveScopeByPath(scopePath), slug)
    if (strictLiveMode) return merged || null
    return merged || template
  }

  const scopedMetrics = FINANCIAL_METRICS.map((metric) => getMergedScopedMetric(metric.slug, roleScopePath))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))

  const coverageRows =
    roleScopeNode?.level === 'global' || roleScopeNode?.level === 'country'
      ? CITY_PROJECTS.map((city) => ({
          name: city.city,
          projects: city.projects,
          stores: city.stores,
          path: getScopePathByName(city.city, {
            preferredLevels: ['city'],
            fallbackPath: roleScopePath,
          }),
        }))
      : scopeChildren.length > 0
        ? scopeChildren.map((node) => ({
            name: node.name,
            projects: node.projects,
            stores: node.stores,
            path: node.path,
          }))
        : [
            {
              name: scopeLabel,
              projects: roleScopeNode?.projects || 0,
              stores: roleScopeNode?.stores || 0,
              path: roleScopePath,
            },
          ]
  const isFinanceLiveConnected = liveMode === 'live' && Boolean(liveScopeSnapshot)
  const financeDataSourceLabel = strictLiveMode
    ? isFinanceLiveConnected
      ? '实时'
      : '未接入'
    : liveMode === 'live'
      ? '实时'
      : '估算'

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看财务分析">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>覆盖范围 Scope</CardDescription>
              <CardTitle className="text-3xl">{scopeLabel}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              {scopeLevelLabel}口径 · {roleScopeNode?.projects || 0} 项目 · {roleScopeNode?.stores || 0} 门店
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur md:col-span-2">
            <CardHeader>
              <CardTitle>经营指标总览</CardTitle>
              <CardDescription>
                权限口径 Scope by Role
              </CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                    更新 {new Date(liveUpdatedAt).toLocaleString('zh-CN', { hour12: false })}
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
            </CardHeader>
          </Card>
        </div>

        {strictLiveMode && !isFinanceLiveConnected ? (
          <Card className="mt-4 border-red-300 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
            <CardContent className="p-4 text-sm">
              当前为严格真实模式，财务实时数据尚未接入或同步失败。请在系统集成中心完成财务数据源配置后再查看明细。
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-4 border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              经营穿透
            </CardTitle>
            <CardDescription>
              多级下钻 Drilldown by Scope
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {roleScopePath.map((segment, index) => (
                <Badge key={`${segment}-${index}`} className="bg-white/10 text-slate-200 hover:bg-white/10">
                  {segment}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
          {executiveGroups.map((group) => (
            <Card key={group.domain} className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{EXECUTIVE_DOMAIN_META[group.domain].label}</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  域重点 Domain Focus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.kpis.slice(0, 3).map((kpi) => (
                  <div key={`${group.domain}-${kpi.key}`} className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
                    <p className="text-xs text-slate-400">{kpi.level4Menu}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatExecutiveKpiValue(kpi)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatExecutiveKpiTrend(kpi)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {scopedMetrics.map((metric) => {
            const Icon = metric.icon
            const momRate = getMoMRate(metric)
            const tone = getTrendTone(metric)

            return (
              <Link
                key={metric.slug}
                href={`/dashboard/finance/${metric.slug}/?scope=${scopeQuery}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white backdrop-blur transition-all hover:border-primary/35 hover:bg-white/[0.09]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">{metric.name}</p>
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold">{formatAmount(metric.value, metric.unit)}</p>
                <div
                  className={`mt-2 inline-flex items-center text-xs ${
                    tone === 'positive' ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
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

        <Card className="mt-4 border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <CardTitle>范围清单</CardTitle>
            <CardDescription>可见组织 Visible Units</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {coverageRows.map((row) => (
              <Link
                key={row.name}
                href={`/dashboard/finance/drilldown/${row.path.join('/')}/`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
              >
                <div className="flex items-center text-sm">
                  <Building2 className="mr-2 h-4 w-4 text-primary" />
                  {row.name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{row.projects} 项目</Badge>
                  <Badge className="bg-primary/12 text-primary hover:bg-primary/12">{row.stores} 门店</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </AccessGuard>
    </DashboardLayout>
  )
}
