'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowRight, ChefHat, Percent, ShieldCheck, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { clampScopePathByRole, getRoleBaseScopePath } from '@/lib/access'
import { MONTH_LABELS, getScopeHierarchyNodeByPath } from '@/lib/business-metrics'
import { getCounterMetricBySlug } from '@/lib/counter-metrics'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function CounterDetailClient() {
  const params = useParams<{ counter: string }>()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const requestedScope = searchParams.get('scope') || roleScopePath.join('/')
  const effectiveScopePath = clampScopePathByRole(user?.role, requestedScope, user?.scopePath)
  const scopeNode = getScopeHierarchyNodeByPath(effectiveScopePath)
  const counterSlug = params.counter
  const metric = getCounterMetricBySlug(counterSlug, effectiveScopePath)

  if (!metric) {
    return (
      <DashboardLayout>
        <AccessGuard permission="view_dashboard" title="当前账号无权查看当口详情">
          <Card className={panelClassName}>
            <CardContent className="px-5 py-8 text-sm text-slate-300">
              未找到对应当口数据 Counter Not Found.
            </CardContent>
          </Card>
        </AccessGuard>
      </DashboardLayout>
    )
  }

  const monthlyAverage =
    metric.monthlyValues.length > 0
      ? metric.monthlyValues.reduce((sum, value) => sum + value, 0) / metric.monthlyValues.length
      : metric.revenue
  const deltaVsMonthlyAverage = monthlyAverage > 0 ? ((metric.revenue - monthlyAverage) / monthlyAverage) * 100 : 0
  const deltaVsBudget = metric.budgetRevenue > 0 ? ((metric.revenue - metric.budgetRevenue) / metric.budgetRevenue) * 100 : 0

  const trendData = MONTH_LABELS.map((month, index) => ({
    month: month.slice(5),
    revenue: metric.monthlyValues[index] || 0,
    budget: metric.budgetRevenue,
  }))

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看当口详情">
        <div className="space-y-3">
          <Card className={panelClassName}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm text-slate-200">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                当前口径 Scope：{scopeNode?.name || '当前范围'}
              </div>
              <div className="inline-flex items-center gap-2">
                <Link
                  href={`/dashboard/stores/counters/?scope=${encodeURIComponent(effectiveScopePath.join('/'))}`}
                  className="inline-flex items-center rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-slate-200 hover:bg-white/[0.10]"
                >
                  返回当口列表
                </Link>
                <Link
                  href={`/dashboard/finance/revenue/?scope=${encodeURIComponent(effectiveScopePath.join('/'))}`}
                  className="inline-flex items-center rounded-md border border-primary/35 bg-primary/15 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  查看财务联动
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                {metric.counter} · {metric.counterEn}
              </CardTitle>
              <CardDescription className="text-slate-300">Counter Drilldown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {[
                  ['营业额 Revenue', `${metric.revenue.toLocaleString('zh-CN')} 万元`],
                  ['预算 Budget', `${metric.budgetRevenue.toLocaleString('zh-CN')} 万元`],
                  ['毛利率 Gross Margin', `${metric.grossMarginRate.toFixed(1)}%`],
                  ['损耗率 Waste', `${metric.wasteRate.toFixed(1)}%`],
                  ['较月均 Delta vs Avg', `${deltaVsMonthlyAverage >= 0 ? '上浮' : '下降'} ${Math.abs(deltaVsMonthlyAverage).toFixed(1)}%`],
                ].map(([title, value]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-3">
                    <p className="text-xs text-slate-400">{title}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  当口营收趋势
                </CardTitle>
                <CardDescription className="text-slate-300">Revenue Trend vs Budget</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="counterRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9ecbff" stopOpacity={0.55} />
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
                      formatter={(value: number, name: string) =>
                        name === 'revenue'
                          ? [`${value.toLocaleString('zh-CN')} 万元`, '营业额']
                          : [`${value.toLocaleString('zh-CN')} 万元`, '预算']
                      }
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#9ecbff" strokeWidth={2.4} fill="url(#counterRevenueFill)" />
                    <Line type="monotone" dataKey="budget" stroke="#8cffde" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  偏差快照
                </CardTitle>
                <CardDescription className="text-slate-300">Variance Snapshot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-3">
                  <p className="text-xs text-slate-400">较月均 Delta vs Monthly Average</p>
                  <p className={`mt-2 text-lg font-semibold ${deltaVsMonthlyAverage >= 0 ? 'text-primary' : 'text-emerald-300'}`}>
                    {deltaVsMonthlyAverage >= 0 ? '上浮' : '下降'} {Math.abs(deltaVsMonthlyAverage).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-3">
                  <p className="text-xs text-slate-400">较预算 Delta vs Budget</p>
                  <p className={`mt-2 text-lg font-semibold ${deltaVsBudget >= 0 ? 'text-[#9fc2ff]' : 'text-emerald-300'}`}>
                    {deltaVsBudget >= 0 ? '上浮' : '下降'} {Math.abs(deltaVsBudget).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-3 text-xs text-slate-300">
                  当前策略建议 Recommendation：{deltaVsBudget < 0 ? '优先优化原料利用率与班次配置，先补毛利。' : '维持当口供给结构，放大高毛利套餐。'}
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-3 text-xs text-primary">
                  数据下钻 Drill Path：全球 → 中国 → 华东 → 江苏 → 苏州 → A-sz011-碧迪二厂
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
