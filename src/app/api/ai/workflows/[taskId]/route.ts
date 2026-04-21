import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parsePlainObjectWithSchema } from '@/lib/server/input-validation'
import { AiWorkflowStatus } from '@/lib/ai-workflows'
import {
  jsonWithAiWorkflowItems,
  readAiWorkflowItems,
} from '@/lib/server/ai-workflow-storage'

export const runtime = 'nodejs'

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 1200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const workflowStatusList: AiWorkflowStatus[] = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'executing',
  'completed',
  'failed',
]

const taskIdSchema = z.object({
  taskId: z.string().trim().min(1).max(80),
})

const updateWorkflowSchema = z.object({
  status: z.enum(workflowStatusList as [AiWorkflowStatus, ...AiWorkflowStatus[]]),
  note: z.string().trim().max(1200).optional().default(''),
  approver: z.string().trim().max(80).optional().default(''),
})

const isTerminalStatus = (status: AiWorkflowStatus) =>
  status === 'completed' || status === 'failed' || status === 'rejected'

export async function PATCH(
  request: NextRequest,
  context: { params: { taskId: string } }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedTask = parsePlainObjectWithSchema(context.params, taskIdSchema, '任务 ID 参数不合法。')
  if (!parsedTask.ok) {
    return parsedTask.response
  }
  const taskId = parsedTask.data.taskId

  const parsedPayload = await parseJsonWithSchema(request, updateWorkflowSchema, '工单更新参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data
  const status = payload.status

  const actor = resolveAuditActor(request)
  const note = clip(payload.note, '')
  const approver = clip(payload.approver, actor, 80)
  const now = nowIso()

  let updatedItemId = ''
  const nextItems = readAiWorkflowItems(request).map((item) => {
    if (item.id !== taskId) return item
    updatedItemId = item.id

    const nextItem = {
      ...item,
      status,
      updatedAt: now,
      timeline: [
        {
          at: now,
          actor,
          action: `状态变更为 ${status}`,
          note,
        },
        ...item.timeline,
      ].slice(0, 20),
      approval:
        status === 'approved' || status === 'rejected'
          ? {
              approver,
              decision: status,
              decisionAt: now,
              comment: note,
            }
          : status === 'submitted' || isTerminalStatus(status)
            ? item.approval
            : item.approval,
    }
    return nextItem
  })

  if (!updatedItemId) {
    return NextResponse.json({ message: '工单不存在' }, { status: 404 })
  }

  const updatedItem = nextItems.find((item) => item.id === updatedItemId) || null
  const response = jsonWithAiWorkflowItems(
    {
      ok: true,
      item: updatedItem,
      items: nextItems,
    },
    nextItems
  )

  appendLlmAuditLog(response, request, {
    action: 'chat.completion',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    providerId: updatedItem?.providerId,
    routeId: updatedItem?.routeId,
    model: updatedItem?.model,
    message: `更新 AI 工单 ${updatedItemId} 为 ${status}`,
  })

  return response
}
