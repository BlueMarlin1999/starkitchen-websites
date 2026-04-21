import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OpsTaskModule = 'stores' | 'hr' | 'supply' | 'inventory' | 'finance' | 'admin' | 'cross'
export type OpsTaskKind =
  | 'reporting'
  | 'procurement'
  | 'dispatch'
  | 'inventory_alert'
  | 'food_safety'
  | 'labor'
export type OpsTaskSeverity = 'high' | 'medium' | 'low'
export type OpsTaskStatus = 'open' | 'in_progress' | 'resolved'

export interface OpsTask {
  id: string
  title: string
  detail: string
  module: OpsTaskModule
  kind: OpsTaskKind
  severity: OpsTaskSeverity
  status: OpsTaskStatus
  href: string
  action: string
  owner: string
  dueAt: string
  createdAt: string
  createdBy: string
  source: string
  note?: string
}

export interface CreateOpsTaskInput {
  id?: string
  title: string
  detail: string
  module: OpsTaskModule
  kind: OpsTaskKind
  severity: OpsTaskSeverity
  href: string
  action: string
  owner: string
  dueAt: string
  createdBy?: string
  source?: string
  note?: string
}

export const createOpsTaskId = () =>
  `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const initialOpsTasks: OpsTask[] = [
  {
    id: 'task-reporting-001',
    title: '3 家门店未填报',
    detail: '蓝枪鱼上海碧云店、A-bj055-北京汇川、A-sz046-亿腾医药待补录日报。',
    module: 'stores',
    kind: 'reporting',
    severity: 'high',
    status: 'open',
    href: '/dashboard/stores/#reporting-tracker',
    action: '查看填报追踪',
    owner: '区域运营中心',
    dueAt: '今日 18:00',
    createdAt: '2026-04-04T00:00:00.000Z',
    createdBy: 'system',
    source: 'seed',
  },
  {
    id: 'task-supply-001',
    title: '2 个采购单延迟',
    detail: '禽类与冻品到货延后，建议调整中央厨房备货计划。',
    module: 'supply',
    kind: 'procurement',
    severity: 'medium',
    status: 'open',
    href: '/dashboard/supply/procurement/po-2051/',
    action: '查看采购异常',
    owner: '供应链中心',
    dueAt: '今日 17:30',
    createdAt: '2026-04-04T00:00:00.000Z',
    createdBy: 'system',
    source: 'seed',
  },
  {
    id: 'task-food-safety-001',
    title: '1 个食安待确认',
    detail: '无锡区域巡检闭环未完成，需督导今日内完成复核。',
    module: 'inventory',
    kind: 'food_safety',
    severity: 'high',
    status: 'open',
    href: '/dashboard/supply/inventory/food-safety/task-a-wx005-cuntian/',
    action: '进入食安中心',
    owner: '食安督导组',
    dueAt: '今日 17:30',
    createdAt: '2026-04-04T00:00:00.000Z',
    createdBy: 'system',
    source: 'seed',
  },
  {
    id: 'task-labor-001',
    title: '1 家门店人工成本超标',
    detail: 'A-bj055-北京汇川人工成本率 34.8%，高于目标 32.0%。',
    module: 'hr',
    kind: 'labor',
    severity: 'medium',
    status: 'open',
    href: '/dashboard/hr/shift-optimization/#shift-a-bj055-huichuan',
    action: '查看排班建议',
    owner: '人力运营组',
    dueAt: '今日 19:00',
    createdAt: '2026-04-04T00:00:00.000Z',
    createdBy: 'system',
    source: 'seed',
  },
]

interface OpsTaskState {
  tasks: OpsTask[]
  addTask: (input: CreateOpsTaskInput) => OpsTask
  setTaskStatus: (taskId: string, status: OpsTaskStatus) => void
  removeTask: (taskId: string) => void
  clearResolved: () => void
  resetTasks: () => void
}

export const useOpsTasksStore = create<OpsTaskState>()(
  persist(
    (set) => ({
      tasks: initialOpsTasks,
      addTask: (input) => {
        const now = new Date().toISOString()
        const nextTask: OpsTask = {
          id: input.id?.trim() || createOpsTaskId(),
          title: input.title.trim(),
          detail: input.detail.trim(),
          module: input.module,
          kind: input.kind,
          severity: input.severity,
          status: 'open',
          href: input.href.trim(),
          action: input.action.trim(),
          owner: input.owner.trim(),
          dueAt: input.dueAt.trim(),
          createdAt: now,
          createdBy: input.createdBy?.trim() || 'manager',
          source: input.source?.trim() || 'manual',
          note: input.note?.trim() || undefined,
        }

        set((state) => ({
          tasks: [nextTask, ...state.tasks],
        }))

        return nextTask
      },
      setTaskStatus: (taskId, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          ),
        })),
      removeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        })),
      clearResolved: () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.status !== 'resolved'),
        })),
      resetTasks: () => set({ tasks: initialOpsTasks }),
    }),
    {
      name: 'ops-task-center',
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
)

export const isTaskOpen = (task: OpsTask) => task.status !== 'resolved'
