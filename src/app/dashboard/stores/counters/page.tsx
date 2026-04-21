'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, ChefHat, Percent, ShieldCheck } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { getRoleBaseScopePath } from '@/lib/access'
import { MONTH_LABELS, getScopeHierarchyNodeByPath } from '@/lib/business-metrics'
import { getCounterMetricsByScope } from '@/lib/counter-metrics'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function StoreCountersPage() {
  const { user } = useAuthStore()
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const roleScopeNode = getScopeHierarchyNodeByPath(roleScopePath)
  const scopeQuery = encodeURIComponent(roleScopePath.join('/'))
  const counters = getCounterMetricsByScope(roleScopePath).map((item) => {
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

  const totalRevenue = counters.reduce((sum, item) => sum + item.revenue, 0)
  const averageMargin = counters.length > 0 ? counters.reduce((sum, item) => sum + item.grossMarginRate, 0) / counters.length : 0
  const averageWaste = counters.length > 0 ? counters.reduce((sum, item) => sum + item.wasteRate, 0) / counters.length : 0
  const belowBudgetCount = counters.filter((item) => item.deltaVsBudget < 0).length

  const revenueByCounter = counters.map((item) => ({
    counter: item.counter,
    revenue: item.revenue,
  }))

  const totalTrend = MONTH_LABELS.map((month, index) => ({
    month: month.slice(5),
    revenue: counters.reduce((sum, counter) => sum + (counter.monthlyValues[index] || 0), 0),
  }))

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看当口分析模块">
        <div className="space-y-3">
          <Card className={panelClassName}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm text-slate-200">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                当前口径 Scope：{roleScopeNode?.name || '当前范围'}
              </div>
              <div className="inline-flex items-center gap-2">
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{counters.length} 个当口</Badge>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">低于预算 {belowBudgetCount} 个</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              ['当口总数', `${counters.length}`, 'Active Counters'],
              ['总营业额', `${totalRevenue.toLocaleString('zh-CN')} 万元`, 'Total Counter Revenue'],
              ['平均毛利率', `${averageMargin.toFixed(1)}%`, 'Average Gross Margin'],
              ['平均损耗率', `${averageWaste.toFixed(1)}%`, 'Average Waste Rate'],
            ].map(([title, value, sub]) => (
              <Card key={title} className={panelClassName}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-xs text-slate-400">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  当口营收排行
                </CardTitle>
                <CardDescription className="text-slate-300">Counter Revenue Ranking</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCounter} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid stroke="#2d4170" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#c3d3f6', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="counter" width={120} tick={{ fill: '#f1f5f9', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050f2b',
                        border: '1px solid rgba(157,194,255,0.35)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('zh-CN')} 万元`, '营业额']}
                    />
                    <Bar dataKey="revenue" fill="#8cb4ff" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  当口总营收趋势
                </CardTitle>
                <CardDescription className="text-slate-300">Monthly Revenue Trend</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalTrend}>
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
                      formatter={(value: number) => [`${value.toLocaleString('zh-CN')} 万元`, '月营收']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#8cffde" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                当口明细列表
              </CardTitle>
              <CardDescription className="text-slate-300">Click for Level-3 Detail</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-y border-white/10 bg-white/[0.05] text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">当口</th>
                      <th className="px-4 py-3 font-medium">营业额</th>
                      <th className="px-4 py-3 font-medium">毛利率</th>
                      <th className="px-4 py-3 font-medium">损耗率</th>
                      <th className="px-4 py-3 font-medium">较月均</th>
                      <th className="px-4 py-3 font-medium">较预算</th>
                      <th className="px-4 py-3 font-medium">详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counters.map((item) => (
                      <tr key={item.slug} className="border-b border-white/10 text-sm text-slate-200">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{item.counter}</div>
                          <div className="mt-1 text-[11px] text-slate-400">{item.counterEn}</div>
                        </td>
                        <td className="px-4 py-3">{item.revenue.toLocaleString('zh-CN')} 万元</td>
                        <td className="px-4 py-3">{item.grossMarginRate.toFixed(1)}%</td>
                        <td className="px-4 py-3">{item.wasteRate.toFixed(1)}%</td>
                        <td className={`px-4 py-3 text-xs ${item.deltaVsMonthlyAverage >= 0 ? 'text-primary' : 'text-emerald-300'}`}>
                          {item.deltaVsMonthlyAverage >= 0 ? '上浮' : '下降'} {Math.abs(item.deltaVsMonthlyAverage).toFixed(1)}%
                        </td>
                        <td className={`px-4 py-3 text-xs ${item.deltaVsBudget >= 0 ? 'text-[#9fc2ff]' : 'text-emerald-300'}`}>
                          {item.deltaVsBudget >= 0 ? '上浮' : '下降'} {Math.abs(item.deltaVsBudget).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={item.detailHref}
                            className="inline-flex items-center rounded-md border border-primary/35 bg-primary/15 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                          >
                            三级详情
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
