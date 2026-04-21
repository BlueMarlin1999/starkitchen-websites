import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findFoodSafetyTask, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface FoodSafetyTaskDetailPageProps {
  params: {
    taskId: string
  }
}

const statusClassName = {
  待确认: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  整改中: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  已完成: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export async function generateStaticParams() {
  const dataset = await readSupplyLiveDataset()
  return dataset.foodSafetyTasks.map((task) => ({ taskId: task.id }))
}

export default async function FoodSafetyTaskDetailPage({ params }: FoodSafetyTaskDetailPageProps) {
  const dataset = await readSupplyLiveDataset()
  const task = findFoodSafetyTask(dataset, params.taskId)
  if (!task) notFound()

  const closureUrgency =
    task.status === '整改中' ? '高' : task.status === '待确认' ? '中' : '低'
  const complianceScore = task.status === '已完成' ? 98 : task.status === '待确认' ? 86 : 72

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看食安任务详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                食安闭环任务详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                Food Safety Task Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">门店/项目</p>
                <p className="mt-2 text-sm font-semibold text-white">{task.store}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">任务状态</p>
                <div className="mt-2">
                  <Badge className={statusClassName[task.status]}>{task.status}</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">闭环紧急度</p>
                <p className="mt-2 text-2xl font-semibold text-white">{closureUrgency}</p>
                <p className="mt-1 text-xs text-slate-400">责任人: {task.owner}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">合规评分</p>
                <p className="mt-2 text-2xl font-semibold text-white">{complianceScore}</p>
                <p className="mt-1 text-xs text-slate-400">目标 ≥ 95</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>问题说明与处置清单</CardTitle>
                <CardDescription className="text-slate-300">Issue & Checklist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">问题摘要</p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{task.issueSummary}</p>
                  <p className="mt-2 text-xs text-slate-400">截止: {task.deadline}</p>
                </div>

                {[
                  '补齐留样/温控/消杀原始记录',
                  '完成门店主管与督导双签复核',
                  '上传整改前后照片与巡检结论',
                ].map((step) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>联动动作</CardTitle>
                <CardDescription className="text-slate-300">Linked Actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">管理动作建议</p>
                  <p className="mt-2 text-xs text-slate-300">
                    {task.status === '整改中'
                      ? '建议由区域质量经理每日复核一次，确保在截止前闭环。'
                      : task.status === '待确认'
                        ? '建议当班督导在今日内完成现场核验并更新证据。'
                        : '任务已闭环，可进入周复盘样本。'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={task.scopeDrilldownHref}
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    查看项目经营穿透
                  </Link>
                  <Link
                    href="/dashboard/ai/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    AI 生成整改报告摘要
                  </Link>
                  <CreateOpsTaskButton
                    task={{
                      title: `${task.store} 食安闭环跟进`,
                      detail: `${task.issueSummary}（状态: ${task.status}）`,
                      module: 'inventory',
                      kind: 'food_safety',
                      severity: task.status === '整改中' ? 'high' : task.status === '待确认' ? 'medium' : 'low',
                      href: `/dashboard/supply/inventory/food-safety/${task.id}/`,
                      action: '查看食安任务详情',
                      owner: task.owner,
                      dueAt: task.status === '整改中' ? '今日 18:00' : '明日 10:00',
                      source: 'supply.food-safety.task-detail',
                    }}
                    className="h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/supply/inventory/food-safety/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回食安闭环列表
            </Link>
            <Link
              href="/dashboard/supply/inventory/alerts/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              库存预警联动
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
