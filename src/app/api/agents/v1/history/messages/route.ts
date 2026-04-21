import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listSessionMessages } from '@/lib/server/agents-history-store'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const querySchema = z.object({
  session_id: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(200),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsed = parseQueryWithSchema(request, querySchema, '消息查询参数不合法。')
  if (!parsed.ok) return parsed.response

  const items = await listSessionMessages(parsed.data.session_id, parsed.data.limit)
  return NextResponse.json({
    items,
    count: items.length,
  })
}
