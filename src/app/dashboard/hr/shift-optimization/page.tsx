'use client'

import Link from 'next/link'
import { ArrowRight, CalendarClock, Target, TrendingDown, Wallet } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { CreateOpsTaskButton } from '@/components/create-ops-task-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canAccessScopePath } from '@/lib/access'
import { HR_LIVE_REQUIRED, HR_SHIFT_OPTIMIZATION_ITEMS } from '@/lib/hr-insights'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function HrShiftOptimizationPage() {
  const { user } = useAuthStore()

  const visibleItems = HR_SHIFT_OPTIMIZATION_ITEMS.filter((item) =>
    canAccessScopePath(user?.role, item.scopePath, user?.scopePath)
  )

  const maxLaborRate = visibleItems.length > 0 ? Math.max(...visibleItems.map((item) => item.laborRate)) : 0
  const averageGap =
    visibleItems.length > 0
      ? visibleItems.reduce((sum, item) => sum + (item.laborRate - item.targetRate), 0) / visibleItems.length
      : 0
  const recoverableCost =
    visibleItems.length > 0 ? visibleItems.reduce((sum, item) => sum + item.recoverableCostWan, 0) : 0

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看排班优化详情">
        <div className="space-y-4">
          {HR_LIVE_REQUIRED ? (
            <Card className="border-red-400/30 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">
                当前为严格真实模式，排班优化页面已禁用样例数据。请先完成盖雅实时同步后查看明细。
              </CardContent>
            </Card>
          ) : null}
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                排班优化深度看板
              </CardTitle>
              <CardDescription className="text-slate-300">
                按门店和班段追踪人工成本偏差，支持逐条下钻到财务穿透
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">异常门店数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{visibleItems.length}</p>
                <p className="mt-1 text-xs text-slate-400">按当前权限口径自动过滤</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">最高人工成本率</p>
                <p className="mt-2 text-2xl font-semibold text-white">{maxLaborRate.toFixed(1)}%</p>
                <p className="mt-1 text-xs text-slate-400">高于目标需优先处理</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">预计可回收成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">{recoverableCost.toFixed(1)} 万元/月</p>
                <p className="mt-1 text-xs text-slate-400">平均偏差 {averageGap.toFixed(2)} pct</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>门店异常明细</CardTitle>
              <CardDescription className="text-slate-300">
                Store-level Labor Variance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleItems.length > 0 ? (
                visibleItems.map((item) => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 scroll-mt-24"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.store}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{item.city}</Badge>
                        <Badge className="bg-red-500/15 text-red-300 hover:bg-red-500/15">
                          {item.laborRate.toFixed(1)}% / 目标 {item.targetRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <p className="text-xs text-slate-300">
                        班段影响: {item.affectedShift}
                      </p>
                      <p className="text-xs text-slate-300">
                        根因: {item.rootCause}
                      </p>
                      <p className="text-xs text-slate-300">
                        责任人: {item.owner} / {item.ownerTitle}
                      </p>
                      <p className="text-xs text-slate-300">
                        预计回收: {item.recoverableCostWan.toFixed(1)} 万元/月
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">建议动作: {item.suggestion}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={item.projectDrilldownHref}
                        className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                      >
                        <TrendingDown className="mr-1 h-3.5 w-3.5" />
                        经营穿透查看项目成本
                      </Link>
                      <Link
                        href={item.laborMetricHref}
                        className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                      >
                        <Target className="mr-1 h-3.5 w-3.5" />
                        查看人工成本指标详情
                      </Link>
                      <CreateOpsTaskButton
                        task={{
                          title: `${item.store} 人工成本整改`,
                          detail: `${item.suggestion}（当前 ${item.laborRate.toFixed(1)}%，目标 ${item.targetRate.toFixed(1)}%）`,
                          module: 'hr',
                          kind: 'labor',
                          severity: item.laborRate - item.targetRate >= 1.5 ? 'high' : 'medium',
                          href: item.projectDrilldownHref,
                          action: '跟进整改明细',
                          owner: `${item.owner} / ${item.ownerTitle}`,
                          dueAt: '今日 20:00',
                          source: 'hr.shift-optimization',
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  当前权限下暂无排班异常门店。
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>处置动作</CardTitle>
              <CardDescription className="text-slate-300">
                Execution Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/ai/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                <Wallet className="mr-1 h-3.5 w-3.5" />
                调用 AI 生成一周排班优化方案
              </Link>
              <Link
                href="/dashboard/reports/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                导出班次与人工成本复盘报告
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/hr/projects/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看项目排班与个人成本详情
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
