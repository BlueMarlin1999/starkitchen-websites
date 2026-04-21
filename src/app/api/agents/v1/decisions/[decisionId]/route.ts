import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateDecisionHistoryStatus } from '@/lib/server/agents-history-store'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const DEFAULT_AGENTS_API_URL = 'https://api.starkitchen.works/api/v1'
const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')
const resolveApiBase = () =>
  normalizeBaseUrl(
    process.env.AGENTS_API_URL ||
      process.env.NEXT_PUBLIC_AGENTS_API_URL ||
      DEFAULT_AGENTS_API_URL
  )

const readBearerToken = (request: NextRequest) => {
  const auth = request.headers.get('authorization') || ''
  const matched = auth.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const routeParamsSchema = z.object({
  decisionId: z.string().trim().min(1).max(80),
})

const updateSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ decisionId: string }> }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const params = await context.params
  const parsedParams = routeParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json(
      { message: '决策 ID 不合法。', code: 'INVALID_DECISION_ID' },
      { status: 400 }
    )
  }

  const parsedBody = await parseJsonWithSchema(request, updateSchema, '状态参数不合法。')
  if (!parsedBody.ok) return parsedBody.response

  const token = readBearerToken(request)
  const upstreamUrl = `${resolveApiBase()}/decisions/${parsedParams.data.decisionId}`

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsedBody.data),
    })

    if (upstream.ok) {
      const payload = await upstream
        .json()
        .catch(async () => ({ detail: await upstream.text().catch(() => '') }))

      try {
        await updateDecisionHistoryStatus(parsedParams.data.decisionId, parsedBody.data.status)
      } catch {
        // Local mirror failure should not block successful upstream response.
      }

      return NextResponse.json(payload, { status: upstream.status })
    }
  } catch {
    // fallback to local persistent history update
  }

  try {
    const updated = await updateDecisionHistoryStatus(parsedParams.data.decisionId, parsedBody.data.status)
    if (!updated) {
      return NextResponse.json(
        { message: '未找到可更新的决策记录。', code: 'DECISION_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      decision: updated,
      source: 'local-history',
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '决策更新失败',
        code: 'UPSTREAM_UNAVAILABLE',
      },
      { status: 502 }
    )
  }
}
