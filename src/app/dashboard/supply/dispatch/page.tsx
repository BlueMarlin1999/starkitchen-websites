import Link from 'next/link'
import { ArrowRight, Clock3, Thermometer } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default async function SupplyDispatchPage() {
  const supplyDataset = await readSupplyLiveDataset()
  const dispatchTasks = supplyDataset.dispatchTasks
  const averageCompletion =
    dispatchTasks.length > 0
      ? dispatchTasks.reduce((sum, item) => sum + item.completion, 0) / dispatchTasks.length
      : 0
  const riskRoutes = dispatchTasks.filter((item) => item.issue !== '正常').length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看配送履约详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                配送履约详情中心
              </CardTitle>
              <CardDescription className="text-slate-300">
                Dispatch SLA Center
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均履约率</p>
                <p className="mt-2 text-2xl font-semibold text-white">{averageCompletion.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">风险路线</p>
                <p className="mt-2 text-2xl font-semibold text-white">{riskRoutes}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">建议巡检频率</p>
                <p className="mt-2 text-2xl font-semibold text-white">每 2 小时</p>
              </div>
            </CardContent>
          </Card>

          <Card id="dispatch-board" className={panelClassName}>
            <CardHeader>
              <CardTitle>路线明细</CardTitle>
              <CardDescription className="text-slate-300">
                Route-level Dispatch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispatchTasks.map((task) => (
                <div
                  key={task.id}
                  id={task.id}
                  className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{task.route}</p>
                    <Badge
                      className={
                        task.issue === '正常'
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                          : task.issue === '待补货'
                            ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                            : 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                      }
                    >
                      {task.issue}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <p className="text-xs text-slate-300">履约率: {task.completion}%</p>
                    <p className="text-xs text-slate-300">ETA 偏差: {task.etaVarianceMinutes} 分钟</p>
                    <p className="text-xs text-slate-300">冷链温度: {task.coldChainTemp}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/dashboard/supply/dispatch/${task.id}/`}
                      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      查看路线详情
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={task.targetDrilldownHref}
                      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      <Thermometer className="mr-1 h-3.5 w-3.5" />
                      查看目标项目经营穿透
                    </Link>
                    <Link
                      href="/dashboard/supply/inventory/alerts/"
                      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      联动库存预警
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                    <CreateOpsTaskButton
                      task={{
                        title: `${task.targetStoreName} 配送履约闭环`,
                        detail: `${task.route} 履约率 ${task.completion}% ，ETA 偏差 ${task.etaVarianceMinutes} 分钟。`,
                        module: 'supply',
                        kind: 'dispatch',
                        severity: task.issue === '冷链预警' ? 'high' : task.issue === '待补货' ? 'medium' : 'low',
                        href: `/dashboard/supply/dispatch/${task.id}/`,
                        action: '查看配送路线详情',
                        owner: '供应链调度中心',
                        dueAt: task.issue === '冷链预警' ? '今日 17:30' : '今日 20:00',
                        source: 'supply.dispatch.detail',
                      }}
                    />
                  </div>
                </div>
              ))}
              {dispatchTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                  暂无实时配送数据，请先在系统集成中心完成供应链接口同步。
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card id="dispatch-sla" className={panelClassName}>
            <CardHeader>
              <CardTitle>履约处置动作</CardTitle>
              <CardDescription className="text-slate-300">
                Dispatch Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/ai/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                AI 生成配送重排建议
              </Link>
              <Link
                href="/dashboard/reports/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                导出配送履约周报
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
