import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  appendOaAuditByRequest,
  resolveOaActorId,
  resolveOaActorName,
} from '@/lib/server/oa/context'
import { createOaCallSession, listOaCalls } from '@/lib/server/oa/storage'
import { OaCallMode } from '@/lib/server/oa/types'

export const runtime = 'nodejs'

const createCallSchema = z.object({
  mode: z.enum(['voice', 'video']).optional().default('video'),
  title: z.string().trim().max(160).optional().default(''),
  roomId: z.string().trim().max(80).optional().default(''),
  participants: z.array(z.string().trim().min(1).max(80)).max(120).optional().default([]),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const items = await listOaCalls(actorId)
  await appendOaAuditByRequest(request, {
    action: 'call.read',
    success: true,
    message: `读取通话记录 ${items.length} 条`,
  })
  return NextResponse.json({
    items,
    total: items.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, createCallSchema, '创建通话参数不合法。')
  if (!parsedPayload.ok) {
    await appendOaAuditByRequest(request, {
      action: 'call.create',
      success: false,
      message: '创建通话失败：参数校验未通过',
    })
    return parsedPayload.response
  }

  const actorId = resolveOaActorId(request)
  const actorName = resolveOaActorName(request)
  const mode = parsedPayload.data.mode as OaCallMode
  const title = parsedPayload.data.title
  const roomId = parsedPayload.data.roomId
  const participants = Array.from(new Set(parsedPayload.data.participants))

  try {
    const session = await createOaCallSession({
      mode,
      title,
      roomId,
      participants,
      actorId,
      actorName,
    })
    await appendOaAuditByRequest(request, {
      action: 'call.create',
      success: true,
      entityId: session.id,
      message: `创建${mode === 'voice' ? '语音' : '视频'}通话成功`,
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    const status = reason === 'ROOM_ACCESS_DENIED' ? 403 : 500
    await appendOaAuditByRequest(request, {
      action: 'call.create',
      success: false,
      message: `创建通话失败：${reason}`,
    })
    return NextResponse.json(
      {
        message: status === 403 ? '无权在该会话发起通话' : '创建通话失败',
      },
      { status }
    )
  }
}
