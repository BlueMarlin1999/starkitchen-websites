import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { createOaRoom, listOaRooms } from '@/lib/server/oa/storage'
import { OaRoomType } from '@/lib/server/oa/types'

export const runtime = 'nodejs'

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(['direct', 'project', 'group']).optional(),
  members: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const rooms = await listOaRooms(actorId)
  await appendOaAuditByRequest(request, {
    action: 'room.read',
    success: true,
    message: `读取会话列表 ${rooms.length} 条`,
  })

  return NextResponse.json({
    items: rooms,
    total: rooms.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, createRoomSchema, '创建会话参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }

  const actorId = resolveOaActorId(request)
  const name = parsedPayload.data.name
  const type = (parsedPayload.data.type || 'group') as OaRoomType
  const members = Array.from(new Set(parsedPayload.data.members || []))

  try {
    const room = await createOaRoom({
      name,
      type,
      members,
      actorId,
    })
    await appendOaAuditByRequest(request, {
      action: 'room.create',
      success: true,
      entityId: room.id,
      message: `创建会话 ${room.name}`,
    })
    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建失败'
    await appendOaAuditByRequest(request, {
      action: 'room.create',
      success: false,
      message: `创建会话失败：${message}`,
    })
    return NextResponse.json({ message: '创建会话失败' }, { status: 500 })
  }
}
