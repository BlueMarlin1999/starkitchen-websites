import Link from 'next/link'
import { ArrowRight, CalendarClock, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { WorkflowTaskList } from '@/components/workflow-task-list'
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

export default function HRPage() {
  const highestLaborWarning =
    HR_SHIFT_OPTIMIZATION_ITEMS.length > 0
      ? Math.max(...HR_SHIFT_OPTIMIZATION_ITEMS.map((item) => item.laborRate))
      : 0
  const headcount = HR_WORKFORCE_SNAPSHOT.headcount
  const onDuty = HR_WORKFORCE_SNAPSHOT.onDuty
  const vacancyRate = headcount > 0 ? ((headcount - onDuty) / headcount) * 100 : 0

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看人力系统模块">
        <div className="space-y-4">
          {HR_LIVE_REQUIRED ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，人力指标已禁用系统种子数据。请先在“系统集成中心”接入盖雅并完成同步后查看实时明细。
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                title: '在岗 / 编制',
                value: `${HR_WORKFORCE_SNAPSHOT.onDuty.toLocaleString()} / ${HR_WORKFORCE_SNAPSHOT.headcount.toLocaleString()}`,
                sub: `缺编率 ${vacancyRate.toFixed(1)}%`,
                href: '/dashboard/hr/staffing-gap/',
              },
              {
                title: '当日人工成本率',
                value: `${HR_WORKFORCE_SNAPSHOT.laborRate.toFixed(1)}%`,
                sub: `目标 ${HR_WORKFORCE_SNAPSHOT.laborRateTarget.toFixed(1)}%`,
                href: '/dashboard/hr/shift-optimization/',
              },
              {
                title: '排班异常门店',
                value: `${HR_WORKFORCE_SNAPSHOT.abnormalStores}`,
                sub: '建议今日内调整',
                href: '/dashboard/hr/shift-optimization/',
              },
              {
                title: '关键岗位缺口',
                value: `${HR_WORKFORCE_SNAPSHOT.keyRoleGap}`,
                sub: '厨师长 / 督导 / 采购',
                href: '/dashboard/hr/staffing-gap/',
              },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group block">
                <Card className={`${panelClassName} transition-all hover:border-primary/40 hover:bg-white/[0.09]`}>
                  <CardContent className="px-5 py-4">
                    <p className="text-xs text-slate-300">{item.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">{item.sub}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
            <Card id="shift-optimization" className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  班次与人工成本联动
                </CardTitle>
                <CardDescription className="text-slate-300">
                  排班优化 Shift Optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {HR_SHIFT_OPTIMIZATION_ITEMS.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/hr/shift-optimization/#${item.id}`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.store}</p>
                      <Badge className="bg-red-500/15 text-red-300 hover:bg-red-500/15">
                        {item.laborRate.toFixed(1)}% / 目标 {item.targetRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">建议动作: {item.suggestion}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{item.affectedShift}</span>
                      <span className="inline-flex items-center text-primary">
                        查看详情
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/hr/shift-optimization/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    查看完整排班优化清单
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/ai/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    调用 AI 生成明日排班方案
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card id="staffing-gap" className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  关键岗位缺编追踪
                </CardTitle>
                <CardDescription className="text-slate-300">缺编追踪 Staffing Gap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {HR_STAFFING_GAP_ITEMS.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/hr/staffing-gap/${item.id}/`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.role}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={staffingPriorityClassName[item.priority]}>
                          {item.priority === 'high' ? '高优先' : item.priority === 'medium' ? '中优先' : '低优先'}
                        </Badge>
                        <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                          缺 {item.gap} 人
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">区域: {item.area}</p>
                    <p className="mt-1 text-xs text-slate-400">候选人池 {item.candidatePipeline} 人 · 空缺 {item.openDays} 天</p>
                  </Link>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/admin/users/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <UserPlus className="mr-1 h-3.5 w-3.5" />
                    进入用户管理发起补岗
                  </Link>
                  <Link
                    href="/dashboard/admin/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    调整角色权限
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <WorkflowTaskList
            module="hr"
            title="人力异常待办"
            description="实时同步 Real-time Sync"
          />

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>管理者深度入口</CardTitle>
              <CardDescription className="text-slate-300">
                Deep-dive for Managers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/hr/overview/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                人力总览详情
              </Link>
              <Link
                href="/dashboard/hr/shift-optimization/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                排班优化详情
              </Link>
              <Link
                href="/dashboard/hr/gaia-roster/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                盖雅花名册全量明细
              </Link>
              <Link
                href="/dashboard/hr/projects/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                项目排班与个人成本
              </Link>
              <Link
                href="/dashboard/hr/staffing-gap/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                缺编追踪详情
              </Link>
              <Link
                href="/dashboard/hr/exception-center/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                异常中心与 SLA 看板
              </Link>
              <span className="text-xs text-slate-400">当前最高人工成本率 {highestLaborWarning.toFixed(1)}%</span>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
