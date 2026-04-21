import Link from 'next/link'
import { AlertTriangle, ArrowRight, Boxes, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { WorkflowTaskList } from '@/components/workflow-task-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildSupplyOverview, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const priorityClassName = {
  高: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  中: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  低: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const statusClassName = {
  待确认: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  整改中: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  已完成: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export default async function InventoryPage() {
  const supplyDataset = await readSupplyLiveDataset()
  const supplyOverview = buildSupplyOverview(supplyDataset)
  const inventoryTurnoverDays = supplyOverview.inventoryTurnoverDays
  const wasteRatePercent = supplyOverview.wasteRatePercent
  const pendingFoodSafetyCount = supplyOverview.pendingFoodSafetyTasks

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看供应链中心 / 库存中心">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                title: '库存周转天数',
                value:
                  typeof inventoryTurnoverDays === 'number'
                    ? inventoryTurnoverDays.toFixed(1)
                    : '--',
                sub:
                  typeof inventoryTurnoverDays === 'number'
                    ? '目标 ≤ 9 天'
                    : '未接入周转天数口径',
                href: '/dashboard/supply/inventory/alerts/',
              },
              {
                title: '临期批次',
                value: `${supplyDataset.inventoryAlerts.length}`,
                sub: '按优先级分级管理',
                href: '/dashboard/supply/inventory/alerts/',
              },
              {
                title: '当日损耗率',
                value:
                  typeof wasteRatePercent === 'number'
                    ? `${wasteRatePercent.toFixed(2)}%`
                    : '--',
                sub:
                  typeof wasteRatePercent === 'number'
                    ? '已接入实时损耗率'
                    : '未接入损耗率口径',
                href: '/dashboard/supply/inventory/alerts/',
              },
              {
                title: '食安待闭环',
                value: `${pendingFoodSafetyCount}`,
                sub: '需督导确认',
                href: '/dashboard/supply/inventory/food-safety/',
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
            <Card id="food-safety-loop" className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  原料库存与损耗预警
                </CardTitle>
                <CardDescription className="text-slate-300">库存预警 Stock Alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplyDataset.inventoryAlerts.map((row) => {
                  const linkedOrder = supplyDataset.orders.find((order) => order.id === row.linkedOrderId)
                  return (
                    <Link
                      key={row.id}
                      href={`/dashboard/supply/inventory/alerts/${row.id}/`}
                      className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">{row.item}</p>
                        <Badge className={priorityClassName[row.priority]}>{row.priority} 优先级</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        库存天数: {row.balanceDays} 天 · 安全阈值: {row.thresholdDays} 天
                      </p>
                      <p className="mt-1 text-xs text-slate-400">动作建议: {row.action}</p>
                      {linkedOrder ? (
                        <p className="mt-1 text-xs text-slate-500">关联采购单: {linkedOrder.po}</p>
                      ) : null}
                    </Link>
                  )
                })}
                {supplyDataset.inventoryAlerts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                    暂无实时库存预警数据，请先完成供应链接口同步。
                  </div>
                ) : null}
                <Link
                  href="/dashboard/supply/inventory/alerts/"
                  className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                >
                  查看完整库存预警明细
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  食安巡检闭环
                </CardTitle>
                <CardDescription className="text-slate-300">食安闭环 Food Safety Loop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplyDataset.foodSafetyTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/supply/inventory/food-safety/${task.id}/`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{task.store}</p>
                      <Badge className={statusClassName[task.status]}>{task.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">截止: {task.deadline}</p>
                    <p className="mt-1 text-xs text-slate-400">责任人: {task.owner}</p>
                  </Link>
                ))}
                {supplyDataset.foodSafetyTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                    暂无实时食安任务数据，请先完成供应链接口同步。
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/dashboard/reports/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                    导出巡检日报
                  </Link>
                  <Link
                    href="/dashboard/supply/procurement/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    联动采购补货
                  </Link>
                  <Link
                    href="/dashboard/ai/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    AI 生成整改建议
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <WorkflowTaskList
            module="inventory"
            title="食安与库存异常待办"
            description="当日闭环 Same-day Closure"
          />
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
