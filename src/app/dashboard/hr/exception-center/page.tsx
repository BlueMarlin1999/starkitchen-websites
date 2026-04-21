'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Clock3, ShieldCheck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { WorkflowTaskList } from '@/components/workflow-task-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HR_LIVE_REQUIRED, HR_RESPONSE_SLA, HR_SHIFT_OPTIMIZATION_ITEMS, HR_STAFFING_GAP_ITEMS } from '@/lib/hr-insights'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function HrExceptionCenterPage() {
  const highRiskShiftItems = HR_SHIFT_OPTIMIZATION_ITEMS.filter(
    (item) => item.laborRate - item.targetRate >= 1.0
  ).length
  const highPriorityGapItems = HR_STAFFING_GAP_ITEMS.filter((item) => item.priority === 'high').length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看人力异常中心">
        <div className="space-y-4">
          {HR_LIVE_REQUIRED ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，异常中心统计已禁用样例数据。请先完成盖雅实时同步后查看明细。
              </CardContent>
            </Card>
          ) : null}
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                人力异常中心
              </CardTitle>
              <CardDescription className="text-slate-300">
                Manager Incident Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">排班高风险项</p>
                <p className="mt-2 text-2xl font-semibold text-white">{highRiskShiftItems}</p>
                <p className="mt-1 text-xs text-slate-400">{'偏差 >= 1.0pct'}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">关键岗位高优先缺口</p>
                <p className="mt-2 text-2xl font-semibold text-white">{highPriorityGapItems}</p>
                <p className="mt-1 text-xs text-slate-400">需 72 小时内封口</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">建议处理节奏</p>
                <p className="mt-2 text-2xl font-semibold text-white">日更</p>
                <p className="mt-1 text-xs text-slate-400">班前 1 次 + 班后 1 次复盘</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                响应 SLA 矩阵
              </CardTitle>
              <CardDescription className="text-slate-300">
                Incident Response Matrix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {HR_RESPONSE_SLA.map((item) => (
                <div key={item.level} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{item.level}</p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                      首响 {item.firstResponse} / 闭环 {item.closureTarget}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">场景: {item.scenario}</p>
                  <p className="mt-1 text-xs text-slate-400">责任团队: {item.owner}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <WorkflowTaskList
            module="hr"
            title="人力异常待办"
            description="实时同步 Real-time Sync"
          />

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>联动处置</CardTitle>
              <CardDescription className="text-slate-300">
                Linked Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/hr/shift-optimization/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看排班优化明细
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/hr/staffing-gap/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看缺编追踪明细
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/admin/#login-audit"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                查看高风险登录与权限审计
              </Link>
              <Link
                href="/dashboard/hr/projects/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看项目排班实时异常
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
