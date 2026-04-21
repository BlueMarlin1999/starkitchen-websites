import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import { getFinanceLiveHealthSnapshot } from '@/lib/server/finance-live/health'

export const runtime = 'nodejs'

const querySchema = z.object({
  scope: z.string().trim().max(400).optional().default('global'),
  thresholdMinutes: z.coerce.number().int().min(5).max(24 * 60).optional(),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, querySchema, '财务健康检查参数不合法。')
  if (!parsedQuery.ok) return parsedQuery.response

  const health = await getFinanceLiveHealthSnapshot({
    scope: parsedQuery.data.scope,
    thresholdMinutes: parsedQuery.data.thresholdMinutes,
  })

  return NextResponse.json(health)
}
