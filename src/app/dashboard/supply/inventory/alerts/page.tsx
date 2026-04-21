import Link from 'next/link'
import { ArrowRight, Boxes } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { readSupplyLiveDataset } from '@/lib/server/supply-live-store'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const priorityClassName = {
  高: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  中: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  低: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

export default async function InventoryAlertsPage() {
  const supplyDataset = await readSupplyLiveDataset()
  const highPriorityCount = supplyDataset.inventoryAlerts.filter((item) => item.priority === '高').length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看库存预警详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                库存预警明细中心
              </CardTitle>
              <CardDescription className="text-slate-300">
                Inventory Alert Detail
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">预警条目</p>
                <p className="mt-2 text-2xl font-semibold text-white">{supplyDataset.inventoryAlerts.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">高优先级</p>
                <p className="mt-2 text-2xl font-semibold text-white">{highPriorityCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">建议处置时限</p>
                <p className="mt-2 text-2xl font-semibold text-white">24 小时</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>原料预警明细</CardTitle>
              <CardDescription className="text-slate-300">
                Item-level Alerts
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-3">
              {supplyDataset.inventoryAlerts.map((item) => {
                const linkedOrder = supplyDataset.orders.find((order) => order.id === item.linkedOrderId)
                return (
                  <div
                    key={item.id}
                    id={item.id}
                    className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 scroll-mt-24"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.item}</p>
                      <Badge className={priorityClassName[item.priority]}>{item.priority} 优先级</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      库存天数 {item.balanceDays} 天 / 阈值 {item.thresholdDays} 天
                    </p>
                    <p className="mt-1 text-xs text-slate-300">动作建议: {item.action}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/supply/inventory/alerts/${item.id}/`}
                        className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                      >
                        查看预警详情
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                      {linkedOrder ? (
                        <Link
                          href={`/dashboard/supply/procurement/${linkedOrder.id}/`}
                          className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                        >
                          关联采购单 {linkedOrder.po}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      <CreateOpsTaskButton
                        task={{
                          title: `${item.item} 库存预警闭环`,
                          detail: `库存 ${item.balanceDays} 天，阈值 ${item.thresholdDays} 天，建议 ${item.action}。`,
                          module: 'inventory',
                          kind: 'inventory_alert',
                          severity: item.priority === '高' ? 'high' : item.priority === '中' ? 'medium' : 'low',
                          href: `/dashboard/supply/inventory/alerts/${item.id}/`,
                          action: '查看库存预警详情',
                          owner: '库存管理中心',
                          dueAt: item.priority === '高' ? '今日 18:00' : '明日 10:00',
                          source: 'supply.inventory.alert-list',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {supplyDataset.inventoryAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/40 p-4 text-xs text-slate-300">
                  暂无实时库存预警数据，请先完成供应链接口同步。
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
