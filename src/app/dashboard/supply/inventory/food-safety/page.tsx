import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const statusClassName = {
  待确认: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  整改中: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  已完成: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export default async function FoodSafetyCenterPage() {
  const supplyDataset = await readSupplyLiveDataset()
  const pendingCount = supplyDataset.foodSafetyTasks.filter((task) => task.status !== '已完成').length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看食安闭环详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                食安闭环详情中心
              </CardTitle>
              <CardDescription className="text-slate-300">
                Food Safety Closure Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">待闭环任务</p>
                <p className="mt-2 text-2xl font-semibold text-white">{pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">总任务数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{supplyDataset.foodSafetyTasks.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">复盘节奏</p>
                <p className="mt-2 text-2xl font-semibold text-white">每日 18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>巡检任务明细</CardTitle>
              <CardDescription className="text-slate-300">
                Inspection Tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {supplyDataset.foodSafetyTasks.map((task) => (
                <div
                  key={task.id}
                  id={task.id}
                  className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{task.store}</p>
                    <Badge className={statusClassName[task.status]}>{task.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">截止: {task.deadline}</p>
                  <p className="mt-1 text-xs text-slate-300">责任人: {task.owner}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">问题说明: {task.issueSummary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/dashboard/supply/inventory/food-safety/${task.id}/`}
                      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      查看食安任务详情
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={task.scopeDrilldownHref}
                      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      查看项目经营穿透
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                        source: 'supply.food-safety.list',
                      }}
                    />
                  </div>
                </div>
              ))}
              {supplyDataset.foodSafetyTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                  暂无实时食安任务数据，请先完成供应链接口同步。
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
