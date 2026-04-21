'use client'

import { Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CreateOpsTaskInput, useOpsTasksStore } from '@/store/ops-tasks'

interface CreateOpsTaskButtonProps {
  task: CreateOpsTaskInput
  label?: string
  className?: string
}

export function CreateOpsTaskButton({
  task,
  label = '加入行动中心',
  className,
}: CreateOpsTaskButtonProps) {
  const addTask = useOpsTasksStore((state) => state.addTask)
  const { toast } = useToast()

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className || 'h-8 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white'}
      onClick={() => {
        addTask(task)
        toast({
          title: '已加入行动中心',
          description: `${task.title} 已创建为管理任务。`,
        })
      }}
    >
      <Clipboard className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
