import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  appendOaAuditByRequest,
  resolveOaActorId,
  resolveOaActorName,
} from '@/lib/server/oa/context'
import { appendOaMessage, listOaMessages } from '@/lib/server/oa/storage'
import { OaAttachment } from '@/lib/server/oa/types'

export const runtime = 'nodejs'

const messageQuerySchema = z.object({
  roomId: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(300).optional(),
})

const messagePayloadSchema = z
  .object({
    roomId: z.string().trim().min(1).max(80),
    content: z.string().trim().max(5000).optional().default(''),
    attachments: z
      .array(
        z.object({
          fileId: z.string().trim().min(1).max(80),
          fileName: z.string().trim().max(220).optional().default('附件'),
        })
      )
      .max(8)
      .optional()
      .default([]),
  })
  .refine((payload) => payload.content.length > 0 || payload.attachments.length > 0, {
    message: '消息内容不能为空',
    path: ['content'],
  })

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, messageQuerySchema, '消息查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }

  const roomId = parsedQuery.data.roomId
  const limit = parsedQuery.data.limit ?? 120
  const actorId = resolveOaActorId(request)

  const items = await listOaMessages(roomId, actorId, limit)
  await appendOaAuditByRequest(request, {
    action: 'chat.read',
    success: true,
    entityId: roomId,
    message: `读取消息 ${items.length} 条`,
  })

  return NextResponse.json({
    items,
    total: items.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, messagePayloadSchema, '发送消息参数不合法。')
  if (!parsedPayload.ok) {
    await appendOaAuditByRequest(request, {
      action: 'chat.message.send',
      success: false,
      message: '发送消息失败：参数校验未通过',
    })
    return parsedPayload.response
  }

  const roomId = parsedPayload.data.roomId
  const content = parsedPayload.data.content
  const attachments = parsedPayload.data.attachments as OaAttachment[]
  const actorId = resolveOaActorId(request)
  const actorName = resolveOaActorName(request)

  try {
    const message = await appendOaMessage({
      roomId,
      actorId,
      actorName,
      content,
      attachments,
    })
    await appendOaAuditByRequest(request, {
      action: 'chat.message.send',
      success: true,
      entityId: roomId,
      message: '发送消息成功',
    })
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    const status = reason === 'ROOM_ACCESS_DENIED' ? 403 : 500
    await appendOaAuditByRequest(request, {
      action: 'chat.message.send',
      success: false,
      entityId: roomId,
      message: `发送消息失败：${reason}`,
    })
    return NextResponse.json(
      {
        message: status === 403 ? '无权访问该会话' : '发送消息失败',
      },
      { status }
    )
  }
}
