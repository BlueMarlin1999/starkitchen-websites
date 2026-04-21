import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoFeatureEnabled } from '@/lib/live-mode'
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

const demoChatSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  session_id: z.string().trim().max(120).nullable().optional(),
})

export async function POST(request: NextRequest) {
  if (!isDemoFeatureEnabled()) {
    return NextResponse.json(
      {
        message: '演示模式已禁用。请使用真实模型接口。',
        code: 'DEMO_MODE_DISABLED',
      },
      { status: 410 }
    )
  }

  const parsedPayload = await parseJsonWithSchema(request, demoChatSchema, '演示对话参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  try {
    const upstream = await fetch(`${resolveApiBase()}/demo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedPayload.data),
    })

    const payload = await upstream
      .json()
      .catch(async () => ({ detail: await upstream.text().catch(() => '') }))

    return NextResponse.json(payload, { status: upstream.status })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '演示服务暂不可用',
        code: 'DEMO_UPSTREAM_UNAVAILABLE',
      },
      { status: 502 }
    )
  }
}
