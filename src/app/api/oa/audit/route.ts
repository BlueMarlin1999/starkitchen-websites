import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { canReadOaAudit, resolveOaRequestRole } from '@/lib/server/oa/permissions'
import { listOaAuditEvents } from '@/lib/server/oa/storage'
import { OaAuditAction } from '@/lib/server/oa/types'

export const runtime = 'nodejs'

const allowedActions: OaAuditAction[] = [
  'room.create',
  'room.read',
  'chat.read',
  'chat.message.send',
  'contacts.read',
  'contacts.create',
  'contacts.sync',
  'contacts.delete',
  'org.read',
  'org.create',
  'org.delete',
  'file.upload',
  'file.read',
  'file.download',
  'call.create',
  'call.read',
  'meeting.create',
  'meeting.read',
  'audit.read',
]

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(9999).optional().default(1),
  size: z.coerce.number().int().min(1).max(200).optional().default(50),
  actorId: z.string().trim().max(80).optional().default(''),
  action: z.enum(allowedActions as [OaAuditAction, ...OaAuditAction[]]).optional(),
})

const appendAuditReadResult = async (request: NextRequest, success: boolean, message: string) =>
  appendOaAuditByRequest(request, {
    action: 'audit.read',
    success,
    message,
  })

const buildAuditSummary = (items: Awaited<ReturnType<typeof listOaAuditEvents>>['items']) => {
  const uniqueIps = new Set(items.map((item) => item.ipAddress).filter(Boolean))
  const uniqueActors = new Set(items.map((item) => item.actorId).filter(Boolean))
  const failedCount = items.filter((item) => !item.success).length
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = items.filter((item) => item.timestamp.startsWith(today)).length
  return {
    uniqueIpCount: uniqueIps.size,
    uniqueActorCount: uniqueActors.size,
    failedCount,
    todayCount,
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canReadOaAudit(role, actorId)) {
    await appendAuditReadResult(request, false, '读取审计失败：权限不足')
    return NextResponse.json({ message: '仅管理层可查看审计日志' }, { status: 403 })
  }

  const parsedQuery = parseQueryWithSchema(request, auditQuerySchema, '审计查询参数不合法。')
  if (!parsedQuery.ok) {
    await appendAuditReadResult(request, false, '读取审计失败：查询参数不合法')
    return parsedQuery.response
  }

  const page = parsedQuery.data.page
  const size = parsedQuery.data.size
  const actorFilter = parsedQuery.data.actorId
  const actionFilter = parsedQuery.data.action

  const result = await listOaAuditEvents({
    page,
    size,
    actorId: actorFilter || undefined,
    action: actionFilter,
  })
  const summary = buildAuditSummary(result.items)
  await appendAuditReadResult(request, true, `读取审计日志 ${result.items.length} 条`)

  return NextResponse.json({
    ...result,
    summary,
  })
}
