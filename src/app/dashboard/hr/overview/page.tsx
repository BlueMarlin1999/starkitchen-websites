import Link from 'next/link'
import { ArrowRight, CalendarClock, TrendingUp, UserPlus, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HR_LIVE_REQUIRED,
  HR_SHIFT_OPTIMIZATION_ITEMS,
  HR_STAFFING_GAP_ITEMS,
  HR_WORKFORCE_SNAPSHOT,
} from '@/lib/hr-insights'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const staffingPriorityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export default function HrOverviewPage() {
  const headcountGap = HR_WORKFORCE_SNAPSHOT.headcount - HR_WORKFORCE_SNAPSHOT.onDuty
  const gapRate = HR_WORKFORCE_SNAPSHOT.headcount > 0
    ? (headcountGap / HR_WORKFORCE_SNAPSHOT.headcount) * 100
    : 0

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看人力总览">
        <div className="space-y-4">
          {HR_LIVE_REQUIRED ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，人力总览已禁用样例数据。请完成盖雅实时同步后查看明细。
              </CardContent>
            </Card>
          ) : null}
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>人力总览</CardTitle>
              <CardDescription className="text-slate-300">
                Workforce Snapshot & Operational Risks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: '在岗 / 编制',
                  value: `${HR_WORKFORCE_SNAPSHOT.onDuty.toLocaleString()} / ${HR_WORKFORCE_SNAPSHOT.headcount.toLocaleString()}`,
                  hint: `缺编 ${headcountGap} 人 (${gapRate.toFixed(1)}%)`,
                },
                {
                  title: '人工成本率',
                  value: `${HR_WORKFORCE_SNAPSHOT.laborRate.toFixed(1)}%`,
                  hint: `目标 ${HR_WORKFORCE_SNAPSHOT.laborRateTarget.toFixed(1)}%`,
                },
                {
                  title: '异常门店',
                  value: `${HR_WORKFORCE_SNAPSHOT.abnormalStores}`,
                  hint: '建议当日闭环',
                },
                {
                  title: '关键岗位缺口',
                  value: `${HR_WORKFORCE_SNAPSHOT.keyRoleGap}`,
                  hint: '厨师长 / 督导 / 采购',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  排班风险 Top 5
                </CardTitle>
                <CardDescription className="text-slate-300">Shift Risk Priorities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {HR_SHIFT_OPTIMIZATION_ITEMS.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/hr/shift-optimization/#${item.id}`}
                    className="group block rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-2.5 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.store}</p>
                      <Badge className="bg-red-500/15 text-red-300 hover:bg-red-500/15">
                        {item.laborRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{item.suggestion}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  缺编追踪 Top 5
                </CardTitle>
                <CardDescription className="text-slate-300">Staffing Gap Priorities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {HR_STAFFING_GAP_ITEMS.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/hr/staffing-gap/${item.id}/`}
                    className="group block rounded-xl border border-white/10 bg-[#081538]/55 px-3 py-2.5 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.role}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={staffingPriorityClassName[item.priority]}>
                          {item.priority === 'high' ? '高优先' : item.priority === 'medium' ? '中优先' : '低优先'}
                        </Badge>
                        <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">缺 {item.gap} 人</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{item.area}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription className="text-slate-300">Manager Shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/hr/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                返回人力系统总览
              </Link>
              <Link
                href="/dashboard/hr/gaia-roster/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                进入盖雅花名册
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/admin/users/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                发起补岗流程
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
