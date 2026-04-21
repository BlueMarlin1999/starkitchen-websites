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
  normalizeAgentRouteConfig,
  sanitizeSnapshotForClient,
} from '@/lib/server/llm-control-plane-types'

export const runtime = 'nodejs'

const updateAgentRoutesSchema = z.object({
  agentRoutes: z.array(z.unknown()).optional().default([]),
})

export async function PUT(request: NextRequest) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedPayload = await parseJsonWithSchema(
    request,
    updateAgentRoutesSchema,
    'Agent 路由配置参数不合法。'
  )
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }

  const snapshot = readControlPlaneSnapshot(request)
  const normalizedAgentRoutes = parsedPayload.data.agentRoutes
    .map((item: unknown) => normalizeAgentRouteConfig(item))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeAgentRouteConfig>> =>
      Boolean(item)
    )

  const nextSnapshot = {
    providers: snapshot.providers,
    routes: snapshot.routes,
    agentRoutes:
      normalizedAgentRoutes.length > 0 ? normalizedAgentRoutes : snapshot.agentRoutes,
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
    action: 'agent-routes.update',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    message: `已更新 ${nextSnapshot.agentRoutes.length} 条 Agent 模型策略`,
  })
  return response
}
