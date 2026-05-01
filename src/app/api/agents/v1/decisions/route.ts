import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listDecisionHistory } from '@/lib/server/agents-history-store'
import { getAgentsApiBaseUrl } from '@/lib/server/agents-endpoint'
import { requireAuthenticated } from '@/lib/server/llm-auth'

export const runtime = 'nodejs'

const readBearerToken = (request: NextRequest) => {
  const auth = request.headers.get('authorization') || ''
  const matched = auth.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const decisionQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  agent_id: z.string().trim().min(1).max(64).optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

const buildUpstreamUrl = (query: z.infer<typeof decisionQuerySchema>) => {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.agent_id) params.set('agent_id', query.agent_id)
  if (query.priority) params.set('priority', query.priority)
  if (query.limit) params.set('limit', String(query.limit))

  const suffix = params.size ? `?${params.toString()}` : ''
  return `${getAgentsApiBaseUrl()}/decisions${suffix}`
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsed = decisionQuerySchema.safeParse({
    status: request.nextUrl.searchParams.get('status') || undefined,
    agent_id: request.nextUrl.searchParams.get('agent_id') || undefined,
    priority: request.nextUrl.searchParams.get('priority') || undefined,
    limit: request.nextUrl.searchParams.get('limit') || undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { message: '决策筛选参数无效。', code: 'INVALID_QUERY' },
      { status: 400 }
    )
  }

  const token = readBearerToken(request)

  try {
    const upstreamUrl = buildUpstreamUrl(parsed.data)
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (upstream.ok) {
      const payload = await upstream
        .json()
        .catch(async () => ({ detail: await upstream.text().catch(() => '') }))
      return NextResponse.json(payload, { status: upstream.status })
    }
  } catch {
    // fallback to local persistent decision history
  }

  try {
    const localItems = await listDecisionHistory({
      status: parsed.data.status,
      priority: parsed.data.priority,
      agentId: parsed.data.agent_id,
      limit: parsed.data.limit,
    })
    return NextResponse.json(localItems, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '决策服务不可用',
        code: 'UPSTREAM_UNAVAILABLE',
      },
      { status: 502 }
    )
  }
}
