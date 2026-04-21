import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LLM_PROVIDER_CATALOG, getProviderDefaultModel } from '@/lib/llm-catalog'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { readControlPlaneSnapshot } from '@/lib/server/llm-control-plane-storage'
import {
  resolveProviderRuntimeKey,
  resolveRouteConfig,
} from '@/lib/server/llm-control-plane-types'
import { generateRecipeWithRetries } from '@/lib/server/recipe-skill/deepseek-client'
import { createAndSaveRecipeRecord } from '@/lib/server/recipe-skill/storage'
import { RecipePromptType } from '@/lib/server/recipe-skill/types'

export const runtime = 'nodejs'

const clip = (value: unknown, fallback = '', max = 8000) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const isPromptType = (value: string): value is RecipePromptType =>
  value === 'recipe' || value === 'menu_copy' || value === 'costing'

const isConfigurationError = (message: string) =>
  message.includes('当前未启用') || message.includes('尚未配置 API Key')

const recipeGenerateSchema = z.object({
  input: z.string().trim().max(8000).optional().default(''),
  message: z.string().trim().max(8000).optional().default(''),
  prompt_type: z.string().trim().max(40).optional().default(''),
  promptType: z.string().trim().max(40).optional().default(''),
  routeProfileId: z.string().trim().max(40).optional().default(''),
  provider: z.string().trim().max(40).optional().default(''),
  providerId: z.string().trim().max(40).optional().default(''),
  model: z.string().trim().max(120).optional().default(''),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(12000).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
})

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const actor = resolveAuditActor(request)
  const parsedPayload = await parseJsonWithSchema(request, recipeGenerateSchema, '菜谱生成参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data

  const userInput = clip(payload.input || payload.message, '', 8000)
  const promptTypeInput = clip(payload.prompt_type || payload.promptType, 'recipe', 40)
  const promptType = isPromptType(promptTypeInput) ? promptTypeInput : 'recipe'

  if (!userInput) {
    return NextResponse.json({ message: 'input 不能为空' }, { status: 400 })
  }

  const snapshot = readControlPlaneSnapshot(request)
  const route = resolveRouteConfig(snapshot.routes, clip(payload.routeProfileId, '', 40))
  const requestedProviderId = clip(payload.provider || payload.providerId, '', 40)
  const providerId = requestedProviderId || route?.providerId || 'deepseek'
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
  if (!catalog) {
    return NextResponse.json({ message: `未知模型提供商: ${providerId}` }, { status: 400 })
  }

  const provider =
    snapshot.providers.find((item) => item.providerId === providerId) || snapshot.providers[0]
  if (!provider?.enabled) {
    return NextResponse.json({ message: `${catalog.label} 当前未启用` }, { status: 400 })
  }
  const resolvedKey = resolveProviderRuntimeKey(provider)
  if (!catalog.supportsKeyless && !resolvedKey.apiKey.trim()) {
    return NextResponse.json({ message: `${catalog.label} 尚未配置 API Key` }, { status: 400 })
  }

  const model =
    clip(payload.model, '', 120) ||
    route?.model ||
    provider.defaultModel ||
    getProviderDefaultModel(catalog.id)

  const temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.3
  const maxTokens = typeof payload.maxTokens === 'number' ? payload.maxTokens : 4096
  const maxRetries = typeof payload.maxRetries === 'number' ? payload.maxRetries : 2

  try {
    const result = await generateRecipeWithRetries(userInput, promptType, {
      providerId: catalog.id,
      baseUrl: provider.baseUrl || catalog.defaultBaseUrl,
      apiKey: resolvedKey.apiKey,
      organization: provider.organization,
      model,
      temperature,
      maxTokens,
      maxRetries,
    })

    const validationStatus = result.validation.valid ? '通过' : '草稿'
    const saved = await createAndSaveRecipeRecord({
      promptType,
      userInput,
      data: result.data,
      validationStatus,
      tokensUsed: result.tokensUsed,
      createdBy: actor,
    })

    const response = NextResponse.json({
      recipe_id: saved.id,
      recipe_name: saved.name,
      prompt_type: saved.promptType,
      provider_id: catalog.id,
      model,
      tokens_used: saved.tokensUsed,
      validation: result.validation.message,
      attempts: result.attempts,
      created_at: saved.createdAt,
      data: saved.recipeJson,
    })

    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: true,
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      providerId: catalog.id,
      routeId: route?.routeId,
      model,
      message: `recipe-skill 生成成功: ${saved.name}`,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 生成失败'
    const statusCode = isConfigurationError(message) ? 400 : 502
    const response = NextResponse.json({ error: `AI 生成失败: ${message}` }, { status: statusCode })
    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: false,
      statusCode,
      latencyMs: Date.now() - startedAt,
      providerId: catalog.id,
      routeId: route?.routeId,
      model,
      message,
    })
    return response
  }
}
