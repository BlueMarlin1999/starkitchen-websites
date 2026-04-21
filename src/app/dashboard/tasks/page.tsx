'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Filter, RefreshCw, Trash2 } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OpsTask, OpsTaskModule, isTaskOpen, useOpsTasksStore } from '@/store/ops-tasks'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const severityOrder = { high: 0, medium: 1, low: 2 } as const

const severityLabel = {
  high: '高优先',
  medium: '中优先',
  low: '低优先',
} as const

const severityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const statusLabel = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已完成',
} as const

const statusClassName = {
  open: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  in_progress: 'bg-[#7ca5ff]/20 text-[#b8d8ff] hover:bg-[#7ca5ff]/20',
  resolved: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const moduleLabel: Record<OpsTaskModule, string> = {
  stores: '门店',
  hr: '人力',
  supply: '供应链',
  inventory: '库存食安',
  finance: '财务',
  admin: '治理',
  cross: '跨部门',
}

const rankTasks = (a: OpsTask, b: OpsTask) => {
  const aResolved = a.status === 'resolved'
  const bResolved = b.status === 'resolved'
  if (aResolved !== bResolved) return aResolved ? 1 : -1

  const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
  if (severityDiff !== 0) return severityDiff

  const aCreatedAt = a.createdAt || '1970-01-01T00:00:00.000Z'
  const bCreatedAt = b.createdAt || '1970-01-01T00:00:00.000Z'
  return bCreatedAt.localeCompare(aCreatedAt)
}

export default function TasksPage() {
  const tasks = useOpsTasksStore((state) => state.tasks)
  const setTaskStatus = useOpsTasksStore((state) => state.setTaskStatus)
  const removeTask = useOpsTasksStore((state) => state.removeTask)
  const clearResolved = useOpsTasksStore((state) => state.clearResolved)
  const resetTasks = useOpsTasksStore((state) => state.resetTasks)

  const [moduleFilter, setModuleFilter] = useState<'all' | OpsTaskModule>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | OpsTask['status']>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | OpsTask['severity']>('all')

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => (moduleFilter === 'all' ? true : task.module === moduleFilter))
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (severityFilter === 'all' ? true : task.severity === severityFilter))
      .slice()
      .sort(rankTasks)
  }, [tasks, moduleFilter, statusFilter, severityFilter])

  const totalCount = tasks.length
  const openCount = tasks.filter((task) => task.status === 'open').length
  const processingCount = tasks.filter((task) => task.status === 'in_progress').length
  const highSeverityCount = tasks.filter((task) => task.severity === 'high' && isTaskOpen(task)).length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看管理者行动中心">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              { title: '任务总数', value: `${totalCount}`, sub: '全模块汇总' },
              { title: '待处理', value: `${openCount}`, sub: '需立即分派' },
              { title: '处理中', value: `${processingCount}`, sub: '跨团队协同中' },
              { title: '高优先级未闭环', value: `${highSeverityCount}`, sub: '建议今日闭环' },
            ].map((item) => (
              <Card key={item.title} className={panelClassName}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    管理者行动中心
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Manager Action Center
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                    onClick={() => clearResolved()}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    清理已完成
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                    onClick={() => resetTasks()}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    恢复默认任务
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <label className="text-xs text-slate-300">
                  模块
                  <select
                    className="mt-1 h-11 w-full rounded-lg border border-white/15 bg-[#081538]/70 px-3 text-sm text-white outline-none focus:border-primary"
                    value={moduleFilter}
                    onChange={(event) => setModuleFilter(event.target.value as 'all' | OpsTaskModule)}
                  >
                    <option value="all">全部模块</option>
                    <option value="stores">门店</option>
                    <option value="hr">人力</option>
                    <option value="supply">供应链</option>
                    <option value="inventory">库存食安</option>
                    <option value="finance">财务</option>
                    <option value="admin">治理</option>
                    <option value="cross">跨部门</option>
                  </select>
                </label>
                <label className="text-xs text-slate-300">
                  状态
                  <select
                    className="mt-1 h-11 w-full rounded-lg border border-white/15 bg-[#081538]/70 px-3 text-sm text-white outline-none focus:border-primary"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | OpsTask['status'])}
                  >
                    <option value="all">全部状态</option>
                    <option value="open">待处理</option>
                    <option value="in_progress">处理中</option>
                    <option value="resolved">已完成</option>
                  </select>
                </label>
                <label className="text-xs text-slate-300">
                  优先级
                  <select
                    className="mt-1 h-11 w-full rounded-lg border border-white/15 bg-[#081538]/70 px-3 text-sm text-white outline-none focus:border-primary"
                    value={severityFilter}
                    onChange={(event) => setSeverityFilter(event.target.value as 'all' | OpsTask['severity'])}
                  >
                    <option value="all">全部优先级</option>
                    <option value="high">高优先</option>
                    <option value="medium">中优先</option>
                    <option value="low">低优先</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition-colors hover:bg-white/[0.08]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-300">{task.detail}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={severityClassName[task.severity]}>{severityLabel[task.severity]}</Badge>
                          <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{moduleLabel[task.module]}</Badge>
                          <Badge className={statusClassName[task.status]}>{statusLabel[task.status]}</Badge>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>责任团队: {task.owner}</span>
                        <span>截止: {task.dueAt}</span>
                        <span>来源: {task.source || 'legacy'}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Link
                          href={task.href}
                          className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.08] hover:text-primary/90"
                        >
                          {task.action}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>

                        {task.status === 'open' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                            onClick={() => setTaskStatus(task.id, 'in_progress')}
                          >
                            开始处理
                          </Button>
                        ) : null}
                        {task.status === 'in_progress' ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 gap-1 bg-emerald-500/90 text-white hover:bg-emerald-500"
                            onClick={() => setTaskStatus(task.id, 'resolved')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            标记完成
                          </Button>
                        ) : null}
                        {task.status === 'resolved' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                            onClick={() => setTaskStatus(task.id, 'open')}
                          >
                            重新打开
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] hover:text-white"
                          onClick={() => removeTask(task.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-[#081538]/55 px-4 py-10 text-sm text-slate-300">
                    当前筛选条件下无任务。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
