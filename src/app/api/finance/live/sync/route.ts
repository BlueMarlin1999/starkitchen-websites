import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canManageLlmControlPlane, resolveAuditActor } from '@/lib/server/llm-auth'
import { pullFinanceLiveFromRemote } from '@/lib/server/finance-live/storage'

export const runtime = 'nodejs'

const clip = (value: unknown, fallback = '', max = 400) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const readBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const syncTokenInputSchema = z.object({
  headerToken: z.string().trim().max(400).optional(),
  bearerToken: z.string().trim().max(400).optional(),
  queryToken: z.string().trim().max(400).optional(),
})

const readSyncToken = (request: NextRequest) => {
  const parsed = syncTokenInputSchema.safeParse({
    headerToken: request.headers.get('x-finance-ingest-token') || undefined,
    bearerToken: readBearerToken(request) || undefined,
    queryToken: request.nextUrl.searchParams.get('token') || undefined,
  })
  if (!parsed.success) return ''
  const { headerToken = '', bearerToken = '', queryToken = '' } = parsed.data
  return headerToken || bearerToken || queryToken
}

const readAllowedTokens = () => {
  const tokenSet = new Set<string>()
  const append = (value: string) => {
    const normalized = clip(value, '', 400)
    if (normalized) tokenSet.add(normalized)
  }
  append(process.env.FINANCE_LIVE_INGEST_TOKEN || '')
  append(process.env.FINANCE_LIVE_CRON_TOKEN || '')
  append(process.env.CRON_SECRET || '')
  ;(process.env.FINANCE_LIVE_INGEST_TOKENS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach(append)
  return tokenSet
}

const canTriggerSync = (request: NextRequest) => {
  if (canManageLlmControlPlane(request)) return true
  const requestToken = readSyncToken(request)
  if (!requestToken) return false
  return readAllowedTokens().has(requestToken)
}

const buildForbiddenResponse = () =>
  NextResponse.json(
    {
      ok: false,
      message: '无权触发财务实时同步。',
      code: 'FINANCE_SYNC_FORBIDDEN',
    },
    { status: 401 }
  )

const runSync = async (request: NextRequest, trigger: 'GET' | 'POST') => {
  if (!canTriggerSync(request)) return buildForbiddenResponse()
  try {
    const result = await pullFinanceLiveFromRemote()
    return NextResponse.json({
      ok: true,
      trigger,
      actor: resolveAuditActor(request),
      ...result,
      message: `远程同步成功，更新 ${result.upserted} 个范围。`,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json(
      {
        ok: false,
        trigger,
        actor: resolveAuditActor(request),
        message: `远程同步失败：${reason}`,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return runSync(request, 'GET')
}

export async function POST(request: NextRequest) {
  return runSync(request, 'POST')
}
