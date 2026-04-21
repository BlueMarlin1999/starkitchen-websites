import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ArrowRight, Boxes, ClipboardList } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findInventoryAlert, findSupplyPurchaseOrder, readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface InventoryAlertDetailPageProps {
  params: {
    alertId: string
  }
}

const priorityClassName = {
  高: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  中: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  低: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export async function generateStaticParams() {
  const dataset = await readSupplyLiveDataset()
  return dataset.inventoryAlerts.map((item) => ({ alertId: item.id }))
}

export default async function InventoryAlertDetailPage({ params }: InventoryAlertDetailPageProps) {
  const dataset = await readSupplyLiveDataset()
  const alert = findInventoryAlert(dataset, params.alertId)
  if (!alert) notFound()

  const linkedOrder = findSupplyPurchaseOrder(dataset, alert.linkedOrderId)
  const stockGapDays = Math.max(0, alert.thresholdDays - alert.balanceDays)
  const riskScore = Math.max(0, Math.min(100, (stockGapDays * 16) + (alert.priority === '高' ? 36 : alert.priority === '中' ? 22 : 10)))

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看库存预警详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                {alert.item} 库存预警详情
              </CardTitle>
              <CardDescription className="text-slate-300">
                Inventory Alert Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">优先级</p>
                <div className="mt-2">
                  <Badge className={priorityClassName[alert.priority]}>{alert.priority} 优先级</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">库存天数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{alert.balanceDays} 天</p>
                <p className="mt-1 text-xs text-slate-400">安全阈值 {alert.thresholdDays} 天</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">缺口天数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stockGapDays} 天</p>
                <p className="mt-1 text-xs text-slate-400">建议先调拨后补货</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">风险分值</p>
                <p className="mt-2 text-2xl font-semibold text-white">{riskScore.toFixed(0)}</p>
                <p className="mt-1 text-xs text-slate-400">综合库存 + 优先级</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>风险解读</CardTitle>
                <CardDescription className="text-slate-300">Risk Interpretation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">当前动作建议</p>
                  <p className="mt-2 text-xs text-slate-300">{alert.action}</p>
                  <p className="mt-1 text-xs text-slate-400">建议在 24 小时内完成补货或跨仓调拨。</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">处置优先顺序</p>
                  {[
                    '确认门店日耗与现存可用量',
                    '优先检查可调拨同城仓',
                    '不足部分触发采购补单',
                  ].map((step) => (
                    <div key={step} className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>联动动作</CardTitle>
                <CardDescription className="text-slate-300">Linked Actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedOrder ? (
                  <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-sm font-medium text-white">关联采购单</p>
                    <p className="mt-2 text-xs text-slate-300">
                      {linkedOrder.po} · {linkedOrder.item} · {linkedOrder.status}
                    </p>
                    <Link
                      href={`/dashboard/supply/procurement/${linkedOrder.id}/`}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                      查看采购单详情
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-sm font-medium text-white">关联采购单</p>
                    <p className="mt-2 text-xs text-slate-400">暂无关联采购单，请手动创建补货任务。</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <CreateOpsTaskButton
                    task={{
                      title: `${alert.item} 库存预警闭环`,
                      detail: `库存 ${alert.balanceDays} 天，阈值 ${alert.thresholdDays} 天，建议 ${alert.action}。`,
                      module: 'inventory',
                      kind: 'inventory_alert',
                      severity: alert.priority === '高' ? 'high' : alert.priority === '中' ? 'medium' : 'low',
                      href: `/dashboard/supply/inventory/alerts/${alert.id}/`,
                      action: '查看库存预警详情',
                      owner: '库存管理中心',
                      dueAt: alert.priority === '高' ? '今日 18:00' : '明日 10:00',
                      source: 'supply.inventory.alert-detail',
                    }}
                    className="h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  />
                  <Link
                    href="/dashboard/supply/inventory/food-safety/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    查看食安闭环联动
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Link
            href="/dashboard/supply/inventory/alerts/"
            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            返回库存预警列表
          </Link>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
