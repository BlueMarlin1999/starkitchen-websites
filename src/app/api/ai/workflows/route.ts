import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AI_AGENT_CAPABILITY_LIBRARY,
  AiAgentCapabilityId,
  getAiAgentCapabilityById,
} from '@/lib/ai-agent-capabilities'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { AiWorkflowItem } from '@/lib/ai-workflows'
import {
  jsonWithAiWorkflowItems,
  readAiWorkflowItems,
} from '@/lib/server/ai-workflow-storage'

export const runtime = 'nodejs'

const isCapabilityId = (value: string): value is AiAgentCapabilityId =>
  AI_AGENT_CAPABILITY_LIBRARY.some((item) => item.id === value)

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 2000) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const createWorkflowSchema = z.object({
  capabilityId: z.string().trim().min(1).max(120),
  prompt: z.string().trim().max(6000).optional().default(''),
  message: z.string().trim().max(6000).optional().default(''),
  title: z.string().trim().max(120).optional().default(''),
  outputType: z.enum(['text', 'audio', 'image', 'video', 'mixed']).optional(),
  routeId: z.string().trim().max(60).optional().default(''),
  providerId: z.string().trim().max(60).optional().default(''),
  model: z.string().trim().max(120).optional().default(''),
  owner: z.string().trim().max(80).optional().default(''),
  dueAt: z.string().trim().max(64).optional().default(''),
  note: z.string().trim().max(2000).optional().default(''),
})

const inferOutputType = (capabilityId: AiAgentCapabilityId) => {
  if (capabilityId === 'audio_generation') return 'audio' as const
  if (capabilityId === 'image_generation') return 'image' as const
  if (capabilityId === 'video_generation') return 'video' as const
  if (capabilityId === 'social_content') return 'mixed' as const
  return 'text' as const
}

const buildWorkflowId = () => `awf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const items = readAiWorkflowItems(request)
  const response = NextResponse.json({
    items,
    total: items.length,
  })
  appendLlmAuditLog(response, request, {
    action: 'control-plane.read',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    message: '读取 AI 工单列表',
  })
  return response
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedPayload = await parseJsonWithSchema(request, createWorkflowSchema, '创建工单参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data

  const capabilityId = clip(payload.capabilityId, '')

  if (!isCapabilityId(capabilityId)) {
    return NextResponse.json({ message: '能力类型非法' }, { status: 400 })
  }

  const capability = getAiAgentCapabilityById(capabilityId)
  if (!capability) {
    return NextResponse.json({ message: '能力配置不存在' }, { status: 400 })
  }

  const prompt = clip(payload.prompt || payload.message, '', 6000)
  if (!prompt) {
    return NextResponse.json({ message: '请输入任务描述或原始资料' }, { status: 400 })
  }

  const createdAt = nowIso()
  const actor = resolveAuditActor(request)
  const item: AiWorkflowItem = {
    id: buildWorkflowId(),
    capabilityId,
    title: clip(payload?.title, `${capability.title} - ${new Date().toLocaleDateString('zh-CN')}`, 120),
    prompt,
    status: 'submitted',
    outputType:
      payload?.outputType === 'audio' ||
      payload?.outputType === 'image' ||
      payload?.outputType === 'video' ||
      payload?.outputType === 'mixed'
        ? payload.outputType
        : inferOutputType(capabilityId),
    routeId: clip(payload?.routeId, capability.recommendedRoute, 60) as AiWorkflowItem['routeId'],
    providerId: clip(payload?.providerId, capability.recommendedProvider, 60) as AiWorkflowItem['providerId'],
    model: clip(payload?.model, capability.recommendedModel, 120),
    owner: clip(payload?.owner, 'AI 管理中心', 80),
    dueAt: clip(payload?.dueAt, '待排期', 64),
    createdAt,
    updatedAt: createdAt,
    createdBy: actor,
    artifacts: [],
    timeline: [
      {
        at: createdAt,
        actor,
        action: '提交审批',
        note: clip(payload?.note, ''),
      },
    ],
  }

  const items = [item, ...readAiWorkflowItems(request)].slice(0, 24)
  const response = jsonWithAiWorkflowItems(
    {
      ok: true,
      item,
      items,
    },
    items,
    { status: 201 }
  )
  appendLlmAuditLog(response, request, {
    action: 'chat.completion',
    success: true,
    statusCode: 201,
    latencyMs: Date.now() - startedAt,
    providerId: item.providerId,
    routeId: item.routeId,
    model: item.model,
    message: `创建 AI 工单 ${item.id}`,
  })
  return response
}
