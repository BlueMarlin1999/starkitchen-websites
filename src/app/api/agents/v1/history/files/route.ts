import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listFileHistory } from '@/lib/server/agents-history-store'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  session_id: z.string().trim().min(1).max(120).optional(),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsed = parseQueryWithSchema(request, querySchema, '文件历史查询参数不合法。')
  if (!parsed.ok) return parsed.response

  const items = await listFileHistory(parsed.data.limit, parsed.data.session_id)
  return NextResponse.json({
    items,
    count: items.length,
  })
}
