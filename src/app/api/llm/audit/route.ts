import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireLlmManager } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import { readLlmAuditLogs } from '@/lib/server/llm-audit'

export const runtime = 'nodejs'

const llmAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  action: z.string().trim().max(120).optional().default(''),
  success: z.enum(['true', 'false']).optional(),
})

export async function GET(request: NextRequest) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, llmAuditQuerySchema, '审计查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }

  const logs = readLlmAuditLogs(request)
  const limit = parsedQuery.data.limit
  const action = parsedQuery.data.action || undefined
  const successFilter = parsedQuery.data.success

  let filtered = logs
  if (action) {
    filtered = filtered.filter((entry) => entry.action === action)
  }
  if (successFilter === 'true') {
    filtered = filtered.filter((entry) => entry.success)
  } else if (successFilter === 'false') {
    filtered = filtered.filter((entry) => !entry.success)
  }

  return NextResponse.json({
    items: filtered.slice(0, limit),
    total: filtered.length,
  })
}
