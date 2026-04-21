import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  appendOaAuditByRequest,
  resolveOaActorId,
  resolveOaActorName,
} from '@/lib/server/oa/context'
import { createOaMeetingSession, listOaMeetings } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const createMeetingSchema = z.object({
  title: z.string().trim().min(1).max(160),
  agenda: z.string().trim().max(6000).optional().default(''),
  roomId: z.string().trim().max(80).optional().default(''),
  startsAt: z.string().trim().max(80).optional().default(''),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional().default(30),
  participants: z.array(z.string().trim().min(1).max(80)).max(120).optional().default([]),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const items = await listOaMeetings(actorId)
  await appendOaAuditByRequest(request, {
    action: 'meeting.read',
    success: true,
    message: `读取会议记录 ${items.length} 条`,
  })

  return NextResponse.json({
    items,
    total: items.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, createMeetingSchema, '创建会议参数不合法。')
  if (!parsedPayload.ok) {
    await appendOaAuditByRequest(request, {
      action: 'meeting.create',
      success: false,
      message: '创建会议失败：参数校验未通过',
    })
    return parsedPayload.response
  }

  const actorId = resolveOaActorId(request)
  const actorName = resolveOaActorName(request)
  const title = parsedPayload.data.title
  const agenda = parsedPayload.data.agenda
  const roomId = parsedPayload.data.roomId
  const startsAt = parsedPayload.data.startsAt
  const durationMinutes = parsedPayload.data.durationMinutes
  const participants = Array.from(new Set(parsedPayload.data.participants))

  try {
    const session = await createOaMeetingSession({
      title,
      agenda,
      roomId,
      participants,
      actorId,
      actorName,
      startsAt,
      durationMinutes,
    })
    await appendOaAuditByRequest(request, {
      action: 'meeting.create',
      success: true,
      entityId: session.id,
      message: `创建会议成功：${session.title}`,
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    const status = reason === 'ROOM_ACCESS_DENIED' ? 403 : 500
    await appendOaAuditByRequest(request, {
      action: 'meeting.create',
      success: false,
      message: `创建会议失败：${reason}`,
    })
    return NextResponse.json(
      {
        message: status === 403 ? '无权在该会话安排会议' : '创建会议失败',
      },
      { status }
    )
  }
}
