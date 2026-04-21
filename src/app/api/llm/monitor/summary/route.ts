import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireLlmManager } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import { readLlmAuditLogs, summarizeLlmAuditLogs } from '@/lib/server/llm-audit'

export const runtime = 'nodejs'

const summaryQuerySchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(24 * 30).optional().default(24),
})

export async function GET(request: NextRequest) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, summaryQuerySchema, '监控汇总查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }
  const windowHours = parsedQuery.data.windowHours
  const logs = readLlmAuditLogs(request)
  const summary = summarizeLlmAuditLogs(logs, windowHours)

  return NextResponse.json(summary)
}
