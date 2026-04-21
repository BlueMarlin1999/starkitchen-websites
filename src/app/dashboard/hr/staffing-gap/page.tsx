'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HR_LIVE_REQUIRED, HR_STAFFING_GAP_ITEMS } from '@/lib/hr-insights'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const priorityLabel = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
} as const

const priorityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export default function HrStaffingGapPage() {
  const getPipelineCoverage = (gap: number, pipeline: number) =>
    gap > 0 ? `${(pipeline / gap).toFixed(1)}x` : 'N/A'

  const totalGap = HR_STAFFING_GAP_ITEMS.reduce((sum, item) => sum + item.gap, 0)
  const urgentGap = HR_STAFFING_GAP_ITEMS.filter((item) => item.priority === 'high').reduce(
    (sum, item) => sum + item.gap,
    0
  )
  const avgOpenDays =
    HR_STAFFING_GAP_ITEMS.length > 0
      ? HR_STAFFING_GAP_ITEMS.reduce((sum, item) => sum + item.openDays, 0) / HR_STAFFING_GAP_ITEMS.length
      : 0
  const totalPipeline = HR_STAFFING_GAP_ITEMS.reduce((sum, item) => sum + item.candidatePipeline, 0)

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看缺编追踪详情">
        <div className="space-y-4">
          {HR_LIVE_REQUIRED ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，缺编追踪页面已禁用样例数据。请先完成盖雅实时同步后查看明细。
              </CardContent>
            </Card>
          ) : null}
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                关键岗位缺编追踪中心
              </CardTitle>
              <CardDescription className="text-slate-300">
                Role-level Staffing Gap
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">缺编总量</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totalGap}</p>
                <p className="mt-1 text-xs text-slate-400">按岗位汇总</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">高优先级缺口</p>
                <p className="mt-2 text-2xl font-semibold text-white">{urgentGap}</p>
                <p className="mt-1 text-xs text-slate-400">建议 72 小时内封口</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均空缺天数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{avgOpenDays.toFixed(1)} 天</p>
                <p className="mt-1 text-xs text-slate-400">招聘响应速度</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">在途候选人</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totalPipeline}</p>
                <p className="mt-1 text-xs text-slate-400">含面试与试岗阶段</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>岗位缺口明细</CardTitle>
              <CardDescription className="text-slate-300">
                Staffing Details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {HR_STAFFING_GAP_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/hr/staffing-gap/${item.id}/`}
                  className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{item.role}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityClassName[item.priority]}>{priorityLabel[item.priority]}</Badge>
                      <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                        缺 {item.gap} 人
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <p className="text-xs text-slate-300">区域: {item.area}</p>
                    <p className="text-xs text-slate-300">空缺时长: {item.openDays} 天</p>
                    <p className="text-xs text-slate-300">候选人池: {item.candidatePipeline} 人</p>
                    <p className="text-xs text-slate-300">
                      候选覆盖倍数: {getPipelineCoverage(item.gap, item.candidatePipeline)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">责任团队: {item.owner}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">动作计划: {item.actionPlan}</p>
                  <div className="mt-3 flex items-center justify-end text-xs text-primary">
                    查看岗位详情
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
              {HR_STAFFING_GAP_ITEMS.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  暂无实时缺编数据，请先同步盖雅花名册与岗位编制数据。
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>补岗执行入口</CardTitle>
              <CardDescription className="text-slate-300">
                Recruitment Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/admin/users/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                进入用户管理发起补岗
              </Link>
              <Link
                href="/dashboard/admin/users/?view=templates"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                配置岗位权限模板
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/admin/#governance-policy"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                校验权限隔离与审批链路
              </Link>
              <Link
                href="/dashboard/hr/gaia-roster/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看盖雅花名册并补齐缺岗
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
