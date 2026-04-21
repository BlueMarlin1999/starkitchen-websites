import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canManageLlmControlPlane, requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import { listAuthLoginAuditEvents } from '@/lib/server/auth-login-audit'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(9999).optional().default(1),
  size: z.coerce.number().int().min(1).max(200).optional().default(100),
  status: z.enum(['success', 'failed', 'blocked']).optional(),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  keyword: z.string().trim().max(120).optional().default(''),
})

const buildSummary = (items: Awaited<ReturnType<typeof listAuthLoginAuditEvents>>['items']) => {
  const uniqueIps = new Set(items.map((item) => item.ipAddress).filter(Boolean))
  const highRisk = items.filter((item) => item.risk === 'high').length
  const failed = items.filter((item) => item.status !== 'success').length
  return {
    uniqueIpCount: uniqueIps.size,
    highRiskCount: highRisk,
    failedCount: failed,
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  if (!canManageLlmControlPlane(request)) {
    return NextResponse.json({ message: '仅管理层可访问登录审计。' }, { status: 403 })
  }

  const parsed = parseQueryWithSchema(request, querySchema, '登录审计查询参数不合法。')
  if (!parsed.ok) return parsed.response

  const result = await listAuthLoginAuditEvents({
    page: parsed.data.page,
    size: parsed.data.size,
    status: parsed.data.status,
    risk: parsed.data.risk,
    keyword: parsed.data.keyword,
  })

  return NextResponse.json({
    ...result,
    summary: buildSummary(result.items),
  })
}
