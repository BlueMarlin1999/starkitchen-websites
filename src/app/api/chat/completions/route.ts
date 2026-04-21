import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LLM_PROVIDER_CATALOG, getProviderDefaultModel } from '@/lib/llm-catalog'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { readControlPlaneSnapshot } from '@/lib/server/llm-control-plane-storage'
import {
  resolveProviderRuntimeKey,
  resolveRouteConfig,
} from '@/lib/server/llm-control-plane-types'
import { callProviderChat } from '@/lib/server/llm-providers'

export const runtime = 'nodejs'

const encoder = new TextEncoder()

const buildSseStream = (payloads: Record<string, unknown>[]) =>
  new ReadableStream({
    start(controller) {
      payloads.forEach((payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      })
      controller.close()
    },
  })

const asNonEmptyString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : ''

const isConfigurationError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    message.includes('当前未启用') ||
    message.includes('尚未配置 API Key') ||
    message.includes('不支持') ||
    normalized.includes('invalid api key') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    normalized.includes('model') && normalized.includes('not') && normalized.includes('found')
  )
}

const buildSseResponse = (
  payloads: Record<string, unknown>[],
  status = 200
) =>
  new NextResponse(buildSseStream(payloads), {
    status,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })

const chatPayloadSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  routeProfileId: z.string().trim().max(80).optional().default(''),
  provider: z.string().trim().max(40).optional().default(''),
  model: z.string().trim().max(120).optional().default(''),
  modelConfig: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(1).max(12000).optional(),
    })
    .optional()
    .default({}),
})

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedPayload = await parseJsonWithSchema(request, chatPayloadSchema, '对话请求参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data
  const message = asNonEmptyString(payload.message)

  const snapshot = readControlPlaneSnapshot(request)
  const route = resolveRouteConfig(snapshot.routes, asNonEmptyString(payload.routeProfileId))

  const requestedProviderId = asNonEmptyString(payload.provider)
  const providerId = requestedProviderId || route?.providerId || 'deepseek'
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)

  if (!catalog) {
    const response = buildSseResponse(
      [{ error: `不支持的模型提供商: ${providerId}` }, { done: true }],
      400
    )
    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: false,
      statusCode: 400,
      latencyMs: Date.now() - startedAt,
      providerId,
      message: `不支持的模型提供商: ${providerId}`,
    })
    return response
  }

  const providerConfig =
    snapshot.providers.find((item) => item.providerId === catalog.id) ||
    snapshot.providers[0]

  const model =
    asNonEmptyString(payload.model) ||
    route?.model ||
    providerConfig?.defaultModel ||
    getProviderDefaultModel(catalog.id)

  const rawTemperature =
    typeof payload.modelConfig?.temperature === 'number'
      ? payload.modelConfig.temperature
      : route?.temperature ?? 0.3
  const rawMaxTokens =
    typeof payload.modelConfig?.maxTokens === 'number'
      ? payload.modelConfig.maxTokens
      : route?.maxTokens ?? 1200

  const resolvedKey = providerConfig
    ? resolveProviderRuntimeKey(providerConfig)
    : { apiKey: '', source: 'none' as const, envVar: '' }

  try {
    if (!providerConfig?.enabled) {
      throw new Error(`${catalog.label} 当前未启用`)
    }

    if (!catalog.supportsKeyless && !resolvedKey.apiKey.trim()) {
      throw new Error(`${catalog.label} 尚未配置 API Key`)
    }

    const result = await callProviderChat({
      providerId: catalog.id,
      baseUrl: providerConfig.baseUrl || catalog.defaultBaseUrl,
      apiKey: resolvedKey.apiKey,
      organization: providerConfig.organization,
      model,
      prompt: message,
      temperature: rawTemperature,
      maxTokens: rawMaxTokens,
    })

    const response = buildSseResponse([
      { content: result.content },
      { done: true, provider: catalog.id, model, usage: result.usage || null },
    ])
    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: true,
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      providerId: catalog.id,
      routeId: route?.routeId,
      model,
      message: '模型推理成功',
    })
    return response
  } catch (error) {
    const messageText = error instanceof Error ? error.message : '模型调用失败'
    const statusCode = isConfigurationError(messageText) ? 400 : 502
    const response = buildSseResponse([{ error: messageText }, { done: true }], statusCode)
    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: false,
      statusCode,
      latencyMs: Date.now() - startedAt,
      providerId: catalog.id,
      routeId: route?.routeId,
      model,
      message: messageText,
    })
    return response
  }
}
