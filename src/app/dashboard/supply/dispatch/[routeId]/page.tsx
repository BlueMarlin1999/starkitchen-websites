import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ClipboardList, Thermometer, Truck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findSupplyDispatchTask, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface DispatchRouteDetailPageProps {
  params: {
    routeId: string
  }
}

const issueClassName = {
  正常: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  待补货: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  冷链预警: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
} as const

const parseTemperature = (value: string) => {
  const numeric = Number.parseFloat(value.replace('°C', '').trim())
  return Number.isFinite(numeric) ? numeric : 0
}

export async function generateStaticParams() {
  const dataset = await readSupplyLiveDataset()
  return dataset.dispatchTasks.map((task) => ({ routeId: task.id }))
}

export default async function DispatchRouteDetailPage({ params }: DispatchRouteDetailPageProps) {
  const dataset = await readSupplyLiveDataset()
  const task = findSupplyDispatchTask(dataset, params.routeId)
  if (!task) notFound()

  const coldChainTemp = parseTemperature(task.coldChainTemp)
  const slaGap = Math.max(0, 95 - task.completion)
  const tempRiskLevel = coldChainTemp >= 7 ? '高' : coldChainTemp >= 5 ? '中' : '低'
  const delayRiskLevel = task.etaVarianceMinutes >= 40 ? '高' : task.etaVarianceMinutes >= 20 ? '中' : '低'

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看配送路线详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                配送路线详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                Dispatch Route Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">路线</p>
                <p className="mt-2 text-sm font-semibold text-white">{task.route}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">履约率</p>
                <p className="mt-2 text-2xl font-semibold text-white">{task.completion.toFixed(1)}%</p>
                <p className="mt-1 text-xs text-slate-400">距目标差 {slaGap.toFixed(1)} pct</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">ETA 偏差</p>
                <p className="mt-2 text-2xl font-semibold text-white">{task.etaVarianceMinutes} 分钟</p>
                <p className="mt-1 text-xs text-slate-400">延时风险 {delayRiskLevel}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">路线状态</p>
                <div className="mt-2">
                  <Badge className={issueClassName[task.issue]}>{task.issue}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">冷链风险 {tempRiskLevel}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>温控与时效记录</CardTitle>
                <CardDescription className="text-slate-300">SLA Timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">冷链温度实时值</p>
                    <span className="text-sm text-primary">{task.coldChainTemp}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">温控阈值: 2°C - 6°C</p>
                  <p className="mt-1 text-xs text-slate-400">超过阈值建议触发二次抽检。</p>
                </div>

                {[
                  { phase: '装车出发', detail: '已完成，按计划发车' },
                  { phase: '在途追踪', detail: task.etaVarianceMinutes > 20 ? '发生延迟，建议动态改道' : '在 SLA 监控窗内' },
                  { phase: '到店签收', detail: task.issue === '待补货' ? '存在缺货，需补配' : '正常签收流程' },
                ].map((row) => (
                  <div key={row.phase} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                    <p className="text-xs text-slate-200">{row.phase}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>联动处置</CardTitle>
                <CardDescription className="text-slate-300">Linked Actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">目标项目</p>
                  <p className="mt-2 text-xs text-slate-300">{task.targetStoreName}</p>
                  <p className="mt-1 text-xs text-slate-400">可下钻查看该项目经营与成本联动。</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={task.targetDrilldownHref}
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    查看目标项目经营穿透
                  </Link>
                  <Link
                    href="/dashboard/supply/inventory/alerts/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <Thermometer className="mr-1 h-3.5 w-3.5" />
                    联动库存与温控预警
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
                      source: 'supply.dispatch.route-detail',
                    }}
                    className="h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/supply/dispatch/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回配送履约列表
            </Link>
            <Link
              href="/dashboard/supply/procurement/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              采购到货联动
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
