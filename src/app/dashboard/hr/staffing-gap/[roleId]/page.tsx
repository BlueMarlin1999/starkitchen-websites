import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ClipboardList, ShieldCheck, Users } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HR_STAFFING_GAP_ITEMS } from '@/lib/hr-insights'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const priorityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const priorityLabel = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
} as const

const addDays = (days: number) => {
  const target = new Date()
  target.setDate(target.getDate() + days)
  return target.toLocaleDateString('zh-CN')
}

interface HrStaffingGapRolePageProps {
  params: {
    roleId: string
  }
}

export function generateStaticParams() {
  return HR_STAFFING_GAP_ITEMS.map((item) => ({ roleId: item.id }))
}

export default function HrStaffingGapRolePage({ params }: HrStaffingGapRolePageProps) {
  const item = HR_STAFFING_GAP_ITEMS.find((entry) => entry.id === params.roleId)
  if (!item) notFound()

  const pipelineCoverage = item.gap > 0 ? item.candidatePipeline / item.gap : 0
  const weeklyRiskCostWan = item.gap * (item.priority === 'high' ? 1.1 : item.priority === 'medium' ? 0.8 : 0.5)
  const areaSegments = item.area.split('/').map((segment) => segment.trim()).filter(Boolean)
  const sourcePool = Math.max(item.candidatePipeline * 3, item.gap * 4)
  const screeningPool = Math.max(item.candidatePipeline * 2, item.gap * 3)
  const offerPool = Math.max(item.gap, Math.ceil(item.candidatePipeline * 0.6))

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看岗位缺口详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {item.role} 缺口详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                Role-level Gap Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">空缺人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.gap}</p>
                <p className="mt-1 text-xs text-slate-400">目标 14 天内补齐</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">候选覆盖倍数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{pipelineCoverage.toFixed(1)}x</p>
                <p className="mt-1 text-xs text-slate-400">候选池 {item.candidatePipeline} 人</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">空缺时长</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.openDays} 天</p>
                <p className="mt-1 text-xs text-slate-400">超过 10 天进入督办</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">周风险成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">{weeklyRiskCostWan.toFixed(1)} 万元</p>
                <p className="mt-1 text-xs text-slate-400">按岗位优先级估算</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>候选人漏斗</CardTitle>
                <CardDescription className="text-slate-300">
                  Candidate Funnel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: '来源池', value: sourcePool, note: '含内部推荐 + 社招渠道' },
                  { label: '初筛通过', value: screeningPool, note: '具备岗位硬性资质' },
                  { label: '面试在途', value: item.candidatePipeline, note: '当前在 Pipeline 中' },
                  { label: 'Offer 目标', value: offerPool, note: '结合到岗损耗预估' },
                ].map((stage, index) => (
                  <div key={stage.label} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{stage.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{stage.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-white">{stage.value}</p>
                        <p className="text-xs text-slate-400">阶段 {index + 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>管理动作与时限</CardTitle>
                <CardDescription className="text-slate-300">
                  Manager Checklist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityClassName[item.priority]}>{priorityLabel[item.priority]}</Badge>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">责任团队: {item.owner}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{item.actionPlan}</p>
                  <p className="mt-2 text-xs text-slate-400">覆盖区域: {areaSegments.join(' / ')}</p>
                </div>

                {[
                  { title: 'D+1 发布补岗任务', dueInDays: 1, owner: 'HRBP' },
                  { title: 'D+3 完成首轮面试', dueInDays: 3, owner: '招聘组 + 业务面试官' },
                  { title: 'D+7 完成到岗评估', dueInDays: 7, owner: '区域运营总监' },
                ].map((milestone) => (
                  <div key={milestone.title} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-sm font-medium text-white">{milestone.title}</p>
                    <p className="mt-1 text-xs text-slate-300">Owner: {milestone.owner}</p>
                    <p className="mt-1 text-xs text-primary">截止日期: {addDays(milestone.dueInDays)}</p>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/dashboard/admin/users/?role=${encodeURIComponent(item.role)}`}
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    查看候选人明细
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/admin/#governance-policy"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    查看审批与权限链路
                  </Link>
                  <CreateOpsTaskButton
                    task={{
                      title: `${item.role} 补岗闭环`,
                      detail: `${item.area} 缺 ${item.gap} 人，空缺 ${item.openDays} 天，需按里程碑推进。`,
                      module: 'hr',
                      kind: 'labor',
                      severity: item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low',
                      href: `/dashboard/hr/staffing-gap/${item.id}/`,
                      action: '查看岗位缺口详情',
                      owner: item.owner,
                      dueAt: addDays(item.priority === 'high' ? 1 : 3),
                      source: 'hr.staffing-gap.detail',
                    }}
                    className="h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Link
            href="/dashboard/hr/staffing-gap/"
            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            返回缺编追踪列表
          </Link>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
