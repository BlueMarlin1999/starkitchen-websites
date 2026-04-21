import Link from 'next/link'
import { ArrowRight, Clock3, ShieldCheck, Truck } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { WorkflowTaskList } from '@/components/workflow-task-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildSupplyOverview, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default async function SupplyPage() {
  const strictLiveMode = isStrictLiveMode()
  const supplyDataset = await readSupplyLiveDataset()
  const supplyOverview = buildSupplyOverview(supplyDataset)

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看供应链中心">
        <div className="space-y-4">
          {strictLiveMode && supplyOverview.totalOrders === 0 && supplyOverview.dispatchTasks === 0 ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，供应链页面已禁用样例数据。请先在系统集成中心接入供应链实时接口后再查看明细。
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                title: '待到货订单',
                value: `${supplyOverview.totalOrders}`,
                sub: `${supplyOverview.delayedOrders} 单延迟`,
                href: '/dashboard/supply/procurement/',
              },
              {
                title: '当日准时率',
                value: `${supplyOverview.onTimeRate.toFixed(1)}%`,
                sub: '目标 95%',
                href: '/dashboard/supply/dispatch/',
              },
              {
                title: '待质检批次',
                value: `${supplyOverview.pendingQc}`,
                sub: '需督导确认',
                href: '/dashboard/supply/procurement/',
              },
              {
                title: '调拨任务',
                value: `${supplyOverview.dispatchTasks}`,
                sub:
                  typeof supplyOverview.coldChainComplianceRate === 'number'
                    ? `冷链合规率 ${supplyOverview.coldChainComplianceRate.toFixed(1)}%`
                    : '待接入冷链合规率',
                href: '/dashboard/supply/dispatch/',
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

          <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
            <Card id="procurement-alerts" className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  采购与到货追踪
                </CardTitle>
                <CardDescription className="text-slate-300">到货优先 ETA First</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplyDataset.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/supply/procurement/${order.id}/`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">
                        {order.po} · {order.item}
                      </p>
                      <Badge
                        className={
                          order.status === '延迟'
                            ? 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                            : order.status === '待质检'
                              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                              : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">供应商: {order.supplier}</p>
                    <p className="mt-1 text-xs text-slate-400">ETA: {order.eta}</p>
                  </Link>
                ))}
                {supplyDataset.orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                    暂无实时采购数据，请先完成供应链接口同步。
                  </div>
                ) : null}
                <Link
                  href="/dashboard/supply/procurement/"
                  className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                >
                  查看完整采购到货明细
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  中央厨房配送任务
                </CardTitle>
                <CardDescription className="text-slate-300">配送履约 Dispatch SLA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplyDataset.dispatchTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/supply/dispatch/${task.id}/`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <p className="text-sm font-medium text-white">{task.route}</p>
                    <p className="mt-1 text-xs text-slate-300">履约率: {task.completion}%</p>
                    <p className="mt-1 text-xs text-slate-400">状态: {task.issue}</p>
                  </Link>
                ))}
                {supplyDataset.dispatchTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                    暂无实时配送数据，请先完成供应链接口同步。
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/supply/dispatch/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    查看配送履约详情
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/ai/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    AI 生成配送调整建议
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <WorkflowTaskList
            module="supply"
            title="供应链异常待办"
            description="异常闭环 Exception Loop"
          />
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
