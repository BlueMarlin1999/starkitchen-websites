'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { OpsTask, OpsTaskModule, isTaskOpen, useOpsTasksStore } from '@/store/ops-tasks'

const severityOrder = {
  high: 0,
  medium: 1,
  low: 2,
} as const

const severityLabel = {
  high: '高',
  medium: '中',
  low: '低',
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

const severityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const rankTasks = (a: OpsTask, b: OpsTask) => {
  const aResolved = a.status === 'resolved'
  const bResolved = b.status === 'resolved'

  if (aResolved !== bResolved) {
    return aResolved ? 1 : -1
  }

  const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
  if (severityDiff !== 0) return severityDiff

  return a.title.localeCompare(b.title, 'zh-CN')
}

interface WorkflowTaskListProps {
  title: string
  description: string
  module?: OpsTaskModule
  className?: string
  emptyHint?: string
}

interface WorkflowTaskRowProps {
  task: OpsTask
  onSetTaskStatus: (taskId: string, status: OpsTask['status']) => void
}

function TaskStatusActions({ task, onSetTaskStatus }: WorkflowTaskRowProps) {
  if (task.status === 'open') {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
        onClick={() => onSetTaskStatus(task.id, 'in_progress')}
      >
        开始处理
      </Button>
    )
  }

  if (task.status === 'in_progress') {
    return (
      <Button
        type="button"
        size="sm"
        className="h-8 gap-1 bg-emerald-500/90 text-white hover:bg-emerald-500"
        onClick={() => onSetTaskStatus(task.id, 'resolved')}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        标记已完成
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 border-white/15 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-white"
      onClick={() => onSetTaskStatus(task.id, 'open')}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      重新打开
    </Button>
  )
}

function WorkflowTaskRow({ task, onSetTaskStatus }: WorkflowTaskRowProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition-colors hover:bg-white/[0.08]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{task.title}</p>
        <div className="flex items-center gap-2">
          <Badge className={severityClassName[task.severity]}>{severityLabel[task.severity]}</Badge>
          <Badge className={statusClassName[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">{task.detail}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5 text-primary" />
          截止 {task.dueAt}
        </span>
        <span>责任团队: {task.owner}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={task.href}
          className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.08] hover:text-primary/90"
        >
          {task.action}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
        <TaskStatusActions task={task} onSetTaskStatus={onSetTaskStatus} />
      </div>
    </div>
  )
}

function WorkflowTaskListHeader({
  title,
  description,
  pendingCount,
}: {
  title: string
  description: string
  pendingCount: number
}) {
  return (
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">待处理 {pendingCount}</Badge>
          <Link
            href="/dashboard/tasks/"
            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.08] hover:text-primary/90"
          >
            行动中心
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <CardDescription className="text-slate-300">{description}</CardDescription>
    </CardHeader>
  )
}

export function WorkflowTaskList({
  title,
  description,
  module,
  className,
  emptyHint = '当前无待办 No Pending Tasks',
}: WorkflowTaskListProps) {
  const tasks = useOpsTasksStore((state) => state.tasks)
  const setTaskStatus = useOpsTasksStore((state) => state.setTaskStatus)
  const filteredTasks = (module ? tasks.filter((task) => task.module === module) : tasks)
    .slice()
    .sort(rankTasks)
  const pendingCount = filteredTasks.filter(isTaskOpen).length

  return (
    <Card className={cn(panelClassName, className)}>
      <WorkflowTaskListHeader title={title} description={description} pendingCount={pendingCount} />
      <CardContent className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-[#081538]/55 px-4 py-8 text-sm text-slate-400">
            {emptyHint}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <WorkflowTaskRow key={task.id} task={task} onSetTaskStatus={setTaskStatus} />
          ))
        )}
      </CardContent>
    </Card>
  )
}
