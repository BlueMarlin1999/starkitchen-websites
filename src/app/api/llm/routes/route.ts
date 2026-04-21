import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireLlmManager } from '@/lib/server/llm-auth'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  jsonWithControlPlaneSnapshot,
  readControlPlaneSnapshot,
} from '@/lib/server/llm-control-plane-storage'
import {
  normalizeRouteConfig,
  sanitizeSnapshotForClient,
} from '@/lib/server/llm-control-plane-types'

export const runtime = 'nodejs'

const updateRoutesSchema = z.object({
  routes: z.array(z.unknown()).optional().default([]),
})

export async function PUT(request: NextRequest) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedPayload = await parseJsonWithSchema(request, updateRoutesSchema, '路由配置参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }

  const payload = parsedPayload.data
  const snapshot = readControlPlaneSnapshot(request)
  const routesInput = payload.routes

  const normalizedRoutes = routesInput
    .map((item: unknown) => normalizeRouteConfig(item))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeRouteConfig>> => Boolean(item))

  const nextSnapshot = {
    providers: snapshot.providers,
    routes: normalizedRoutes.length > 0 ? normalizedRoutes : snapshot.routes,
    agentRoutes: snapshot.agentRoutes,
  }
  const clientSnapshot = sanitizeSnapshotForClient(nextSnapshot)

  const response = jsonWithControlPlaneSnapshot(
    {
      providers: clientSnapshot.providers,
      routes: clientSnapshot.routes,
      agentRoutes: clientSnapshot.agentRoutes,
    },
    nextSnapshot
  )
  appendLlmAuditLog(response, request, {
    action: 'routes.update',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    message: `已更新 ${nextSnapshot.routes.length} 条路由策略`,
  })
  return response
}
