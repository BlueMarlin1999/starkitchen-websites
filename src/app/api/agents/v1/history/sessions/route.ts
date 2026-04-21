import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listSessionSummaries } from '@/lib/server/agents-history-store'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(30),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsed = parseQueryWithSchema(request, querySchema, '会话查询参数不合法。')
  if (!parsed.ok) return parsed.response

  const sessions = await listSessionSummaries(parsed.data.limit)
  return NextResponse.json({
    items: sessions,
    count: sessions.length,
  })
}
