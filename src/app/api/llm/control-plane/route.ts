import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { readControlPlaneSnapshot } from '@/lib/server/llm-control-plane-storage'
import { sanitizeSnapshotForClient } from '@/lib/server/llm-control-plane-types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const snapshot = readControlPlaneSnapshot(request)
  const clientSnapshot = sanitizeSnapshotForClient(snapshot)
  const response = NextResponse.json({
    providers: clientSnapshot.providers,
    routes: clientSnapshot.routes,
    agentRoutes: clientSnapshot.agentRoutes,
    mode: 'remote',
  })
  appendLlmAuditLog(response, request, {
    action: 'control-plane.read',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    message: '读取控制平面配置',
  })
  return response
}
