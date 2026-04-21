import Link from 'next/link'
import { ArrowRight, ClipboardCheck, Truck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildSupplyOverview, readSupplyLiveDataset } from '@/lib/server/supply-live-store'
import type { SupplyPurchaseOrder } from '@/lib/supply-insights'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const getDelayedCost = (orders: SupplyPurchaseOrder[]) =>
  orders.filter((order) => order.status === '延迟').reduce(
    (sum, order) => sum + order.orderAmountWan,
    0
  )

const getStatusBadgeClassName = (status: SupplyPurchaseOrder['status']) => {
  if (status === '延迟') return 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
  if (status === '待质检') return 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
  return 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
}

function ProcurementSummaryCard({ delayedCost, overview }: { delayedCost: number; overview: ReturnType<typeof buildSupplyOverview> }) {
  return (
    <Card className={panelClassName}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          采购与到货明细中心
        </CardTitle>
        <CardDescription className="text-slate-300">Procurement and Receiving Detail</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <MetricTile label="在途订单" value={String(overview.totalOrders)} />
        <MetricTile label="延迟订单" value={String(overview.delayedOrders)} />
        <MetricTile label="待质检批次" value={String(overview.pendingQc)} />
        <MetricTile label="延迟金额影响" value={`${delayedCost.toFixed(1)} 万元`} />
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function OrderExecutionItem({ order }: { order: SupplyPurchaseOrder }) {
  return (
    <div id={order.id} className="scroll-mt-24 rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{order.po} · {order.item}</p>
        <Badge className={getStatusBadgeClassName(order.status)}>{order.status}</Badge>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <p className="text-xs text-slate-300">供应商: {order.supplier}</p>
        <p className="text-xs text-slate-300">ETA: {order.eta}</p>
        <p className="text-xs text-slate-300">订单金额: {order.orderAmountWan.toFixed(1)} 万元</p>
        <p className="text-xs text-slate-300">延迟时长: {order.delayHours} 小时</p>
      </div>
      <p className="mt-2 text-xs text-slate-400">收货项目: {order.receivingProjectName}</p>
      <OrderActions order={order} />
    </div>
  )
}

function OrderActions({ order }: { order: SupplyPurchaseOrder }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Link href={`/dashboard/supply/procurement/${order.id}/`} className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90">
        查看采购单详情
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
      <Link href={order.receivingDrilldownHref} className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90">
        查看收货项目经营穿透
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
      <CreateOpsTaskButton
        task={{
          title: `${order.po} 到货跟进`,
          detail: `${order.item} / ${order.supplier}，状态 ${order.status}，延迟 ${order.delayHours} 小时。`,
          module: 'supply',
          kind: 'procurement',
          severity: order.status === '延迟' ? 'high' : order.status === '待质检' ? 'medium' : 'low',
          href: `/dashboard/supply/procurement/${order.id}/`,
          action: '查看订单执行明细',
          owner: '供应链中心',
          dueAt: '今日 18:30',
          source: 'supply.procurement.detail',
        }}
      />
    </div>
  )
}

function OrderExecutionCard({ orders }: { orders: SupplyPurchaseOrder[] }) {
  return (
    <Card id="order-table" className={panelClassName}>
      <CardHeader>
        <CardTitle>订单执行明细</CardTitle>
        <CardDescription className="text-slate-300">PO-level Tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <OrderExecutionItem key={order.id} order={order} />
        ))}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
            暂无实时采购数据，请先在系统集成中心完成供应链接口同步。
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function QcActionsCard() {
  return (
    <Card id="qc-pending" className={panelClassName}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          质检联动动作
        </CardTitle>
        <CardDescription className="text-slate-300">QC Actions</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/supply/inventory/alerts/" className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90">
          查看库存风险联动
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
        <Link href="/dashboard/reports/" className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90">
          导出采购到货周报
        </Link>
      </CardContent>
    </Card>
  )
}

export default async function SupplyProcurementPage() {
  const supplyDataset = await readSupplyLiveDataset()
  const delayedCost = getDelayedCost(supplyDataset.orders)
  const overview = buildSupplyOverview(supplyDataset)
  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看采购到货详情">
        <div className="space-y-4">
          <ProcurementSummaryCard delayedCost={delayedCost} overview={overview} />
          <OrderExecutionCard orders={supplyDataset.orders} />
          <QcActionsCard />
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
