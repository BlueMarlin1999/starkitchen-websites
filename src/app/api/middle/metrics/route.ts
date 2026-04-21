import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hasPermission, normalizeRole } from '@/lib/access'
import {
  MiddleMetricCard,
  MiddleMetricsPayload,
  buildMiddleAutoMetricCards,
  buildMiddleScopePath,
  middleMetricKeySchema,
  toMiddleManualHistoryItems,
  applyMiddleManualOverrides,
} from '@/lib/middle-metrics'
import { verifyEmbeddedSessionToken } from '@/lib/server/auth-session'
import {
  appendMiddleManualMetricEntry,
  clearMiddleManualMetricEntries,
  listMiddleManualMetricEntries,
} from '@/lib/server/middle-manual-metrics-store'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { canManageLlmControlPlane, requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'

export const runtime = 'nodejs'

const MAX_HISTORY_ITEMS = 30

const readBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const writePayloadSchema = z.object({
  metricKey: middleMetricKeySchema,
  value: z.coerce.number().finite().min(-1_000_000_000).max(1_000_000_000),
  note: z.string().trim().max(240).optional().default(''),
})

const clearPayloadSchema = z.object({
  metricKey: middleMetricKeySchema,
})

const resolveRequestContext = (request: NextRequest) => {
  const token = readBearerToken(request)
  const claims = verifyEmbeddedSessionToken(token)
  const roleFromHeader = request.headers.get('x-user-role') || ''
  const role = normalizeRole(claims?.role || roleFromHeader)
  const scopePath = buildMiddleScopePath(role, claims?.scopePath)
  const actorId = claims?.employeeId || resolveAuditActor(request)
  const actorName = claims?.name || actorId

  return {
    role,
    scopePath,
    actorId,
    actorName,
  }
}

const canReadMiddleMetrics = (request: NextRequest, role: string) =>
  canManageLlmControlPlane(request) || hasPermission(role, 'view_dashboard')

const canWriteMiddleMetrics = (request: NextRequest, role: string) =>
  canManageLlmControlPlane(request) || hasPermission(role, 'view_dashboard')

const buildPayload = async (scopePath: string[]): Promise<MiddleMetricsPayload> => {
  const autoMetrics = buildMiddleAutoMetricCards(scopePath)
  const entries = await listMiddleManualMetricEntries()
  const history = toMiddleManualHistoryItems(entries).slice(0, MAX_HISTORY_ITEMS)
  const metrics = applyMiddleManualOverrides(autoMetrics, entries) as MiddleMetricCard[]

  return {
    scopePath,
    metrics,
    history,
    manualCount: entries.length,
    updatedAt: new Date().toISOString(),
  }
}

const buildForbiddenResponse = (message: string) =>
  NextResponse.json(
    {
      message,
      code: 'MIDDLE_METRICS_FORBIDDEN',
    },
    { status: 403 }
  )

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const context = resolveRequestContext(request)
  if (!canReadMiddleMetrics(request, context.role)) {
    return buildForbiddenResponse('当前账号没有读取中层经营数据的权限。')
  }

  const payload = await buildPayload(context.scopePath)
  return NextResponse.json(payload)
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const context = resolveRequestContext(request)
  if (!canWriteMiddleMetrics(request, context.role)) {
    return buildForbiddenResponse('当前账号没有手工录入中层经营数据的权限。')
  }

  const parsedPayload = await parseJsonWithSchema(request, writePayloadSchema, '手工录入参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  await appendMiddleManualMetricEntry({
    metricKey: parsedPayload.data.metricKey,
    value: parsedPayload.data.value,
    note: parsedPayload.data.note,
    actorId: context.actorId,
    actorName: context.actorName,
    actorRole: context.role,
  })

  const payload = await buildPayload(context.scopePath)
  return NextResponse.json({
    ok: true,
    message: '手工录入成功，已更新中层驾驶舱数据。',
    payload,
  })
}

export async function DELETE(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const context = resolveRequestContext(request)
  if (!canWriteMiddleMetrics(request, context.role)) {
    return buildForbiddenResponse('当前账号没有恢复系统自动数据的权限。')
  }

  const parsedPayload = await parseJsonWithSchema(
    request,
    clearPayloadSchema,
    '恢复系统自动参数不合法。'
  )
  if (!parsedPayload.ok) return parsedPayload.response

  const result = await clearMiddleManualMetricEntries(parsedPayload.data.metricKey)
  const payload = await buildPayload(context.scopePath)
  return NextResponse.json({
    ok: true,
    removed: result.removed,
    changed: result.changed,
    message: result.changed
      ? '已恢复为系统自动数据。'
      : '该指标暂无手工录入记录，无需恢复。',
    payload,
  })
}
