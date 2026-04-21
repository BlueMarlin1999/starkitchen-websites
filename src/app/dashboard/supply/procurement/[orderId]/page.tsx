import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ArrowRight, ClipboardList, ShieldCheck, Truck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findSupplyPurchaseOrder, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface ProcurementOrderDetailPageProps {
  params: {
    orderId: string
  }
}

const statusClassName = {
  在途: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  延迟: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  待质检: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
} as const

export async function generateStaticParams() {
  const dataset = await readSupplyLiveDataset()
  return dataset.orders.map((order) => ({ orderId: order.id }))
}

export default async function ProcurementOrderDetailPage({ params }: ProcurementOrderDetailPageProps) {
  const dataset = await readSupplyLiveDataset()
  const order = findSupplyPurchaseOrder(dataset, params.orderId)
  if (!order) notFound()

  const linkedAlerts = dataset.inventoryAlerts.filter((item) => item.linkedOrderId === order.id)
  const etaConfidence = Math.max(30, 98 - order.delayHours * 6)
  const scheduleRisk =
    order.status === '延迟' ? '高' : order.status === '待质检' ? '中' : '低'
  const potentialImpactWan = order.orderAmountWan * (order.status === '延迟' ? 0.26 : order.status === '待质检' ? 0.12 : 0.04)

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看采购单详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {order.po} 采购执行详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                PO-level Tracking & Risk
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">订单状态</p>
                <div className="mt-2">
                  <Badge className={statusClassName[order.status]}>{order.status}</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">ETA 可信度</p>
                <p className="mt-2 text-2xl font-semibold text-white">{etaConfidence.toFixed(0)}%</p>
                <p className="mt-1 text-xs text-slate-400">延迟 {order.delayHours} 小时</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">订单金额</p>
                <p className="mt-2 text-2xl font-semibold text-white">{order.orderAmountWan.toFixed(1)} 万元</p>
                <p className="mt-1 text-xs text-slate-400">收货项目: {order.receivingProjectName}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">潜在影响</p>
                <p className="mt-2 text-2xl font-semibold text-white">{potentialImpactWan.toFixed(2)} 万元</p>
                <p className="mt-1 text-xs text-slate-400">排产/库存联动估算</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>订单画像</CardTitle>
                <CardDescription className="text-slate-300">Order Profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">{order.po} · {order.item}</p>
                  <p className="mt-2 text-xs text-slate-300">供应商: {order.supplier}</p>
                  <p className="mt-1 text-xs text-slate-300">预计到货: {order.eta}</p>
                  <p className="mt-1 text-xs text-slate-300">调度风险等级: {scheduleRisk}</p>
                  <p className="mt-1 text-xs text-slate-400">若延迟持续，建议触发跨仓调拨 + 替代品补位。</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">执行里程碑</p>
                  {[
                    { title: '采购下发', note: '已完成 / 系统自动同步' },
                    { title: '在途追踪', note: order.status === '延迟' ? '异常 / 需供应商确认到港时点' : '正常' },
                    { title: '到货质检', note: order.status === '待质检' ? '待执行 / 需质控组确认' : '按计划执行' },
                  ].map((step) => (
                    <div key={step.title} className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                      <p className="text-xs text-slate-200">{step.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{step.note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>管理动作</CardTitle>
                <CardDescription className="text-slate-300">Manager Actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">关联库存预警</p>
                  {linkedAlerts.length > 0 ? (
                    linkedAlerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/dashboard/supply/inventory/alerts/${alert.id}/`}
                        className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-200 hover:text-primary"
                      >
                        <span>{alert.item} · {alert.priority}优先级</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">当前采购单暂无库存预警联动项。</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={order.receivingDrilldownHref}
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    查看收货项目经营穿透
                  </Link>
                  <Link
                    href="/dashboard/supply/inventory/alerts/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    联动库存预警中心
                  </Link>
                  <CreateOpsTaskButton
                    task={{
                      title: `${order.po} 供应执行闭环`,
                      detail: `${order.item} / ${order.supplier}，状态 ${order.status}，延迟 ${order.delayHours} 小时。`,
                      module: 'supply',
                      kind: 'procurement',
                      severity: order.status === '延迟' ? 'high' : order.status === '待质检' ? 'medium' : 'low',
                      href: `/dashboard/supply/procurement/${order.id}/`,
                      action: '查看采购单详情',
                      owner: '供应链中心',
                      dueAt: order.status === '延迟' ? '今日 18:00' : '明日 10:00',
                      source: 'supply.procurement.order-detail',
                    }}
                    className="h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/supply/procurement/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回采购到货列表
            </Link>
            <Link
              href="/dashboard/supply/dispatch/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              查看配送联动风险
            </Link>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
