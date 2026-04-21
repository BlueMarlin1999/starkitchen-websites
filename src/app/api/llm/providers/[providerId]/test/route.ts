import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LLM_PROVIDER_CATALOG } from '@/lib/llm-catalog'
import { requireLlmManager } from '@/lib/server/llm-auth'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import {
  jsonWithControlPlaneSnapshot,
  readControlPlaneSnapshot,
} from '@/lib/server/llm-control-plane-storage'
import {
  resolveProviderRuntimeKey,
  sanitizeSnapshotForClient,
} from '@/lib/server/llm-control-plane-types'
import { callProviderChat } from '@/lib/server/llm-providers'

export const runtime = 'nodejs'

const providerTestSchema = z.object({
  model: z.string().trim().max(120).optional().default(''),
})

const parseProviderTestPayload = async (request: NextRequest) => {
  const rawText = await request.text()
  const normalized = rawText.trim()
  if (!normalized) {
    return {
      ok: true as const,
      data: providerTestSchema.parse({}),
    }
  }

  try {
    const rawPayload = JSON.parse(normalized)
    const parsedPayload = providerTestSchema.safeParse(rawPayload)
    if (!parsedPayload.success) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            message: '模型连通性测试参数不合法。',
            issues: parsedPayload.error.issues.map((issue) => ({
              path: issue.path.join('.') || '(root)',
              message: issue.message,
            })),
            code: 'INVALID_INPUT',
          },
          { status: 400 }
        ),
      }
    }
    return { ok: true as const, data: parsedPayload.data }
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: '模型连通性测试参数不合法。',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      ),
    }
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { providerId: string } }
) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const providerId = context.params.providerId
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
  if (!catalog) {
    return NextResponse.json({ ok: false, message: '未知模型提供商' }, { status: 404 })
  }

  const parsedPayload = await parseProviderTestPayload(request)
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data

  const snapshot = readControlPlaneSnapshot(request)
  const provider = snapshot.providers.find((item) => item.providerId === catalog.id)
  if (!provider) {
    return NextResponse.json({ ok: false, message: '缺少提供商配置' }, { status: 404 })
  }

  const model = payload.model.trim() ? payload.model.trim() : provider.defaultModel

  const startedAt = Date.now()
  let ok = false
  let message = '连通性测试通过'
  let statusCode = 200
  const resolvedKey = resolveProviderRuntimeKey(provider)

  try {
    if (!catalog.supportsKeyless && !resolvedKey.apiKey.trim()) {
      throw new Error('请先填写 API Key')
    }

    await callProviderChat({
      providerId: catalog.id,
      baseUrl: provider.baseUrl || catalog.defaultBaseUrl,
      apiKey: resolvedKey.apiKey,
      organization: provider.organization,
      model,
      prompt: '回复 OK',
      temperature: 0,
      maxTokens: 120,
    })
    ok = true
  } catch (error) {
    ok = false
    message = error instanceof Error ? error.message : '模型接口连通失败'
    statusCode = 502
  }

  const updatedAt = new Date().toISOString()
  const nextProviders = snapshot.providers.map((item) =>
    item.providerId === catalog.id
      ? {
          ...item,
          health: ok ? ('healthy' as const) : ('error' as const),
          lastTestAt: updatedAt,
          updatedAt,
        }
      : item
  )
  const nextSnapshot = {
    providers: nextProviders,
    routes: snapshot.routes,
    agentRoutes: snapshot.agentRoutes,
  }
  const clientSnapshot = sanitizeSnapshotForClient(nextSnapshot)

  const response = jsonWithControlPlaneSnapshot(
    {
      ok,
      message,
      latencyMs: Math.max(0, Date.now() - startedAt),
      providers: clientSnapshot.providers,
      routes: clientSnapshot.routes,
      agentRoutes: clientSnapshot.agentRoutes,
    },
    nextSnapshot,
    { status: statusCode }
  )
  appendLlmAuditLog(response, request, {
    action: 'provider.test',
    success: ok,
    statusCode,
    latencyMs: Date.now() - startedAt,
    providerId: catalog.id,
    model,
    message,
  })
  return response
}
