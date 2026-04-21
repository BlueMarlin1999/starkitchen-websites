import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LLM_PROVIDER_CATALOG, supportsProviderMediaType } from '@/lib/llm-catalog'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { readControlPlaneSnapshot } from '@/lib/server/llm-control-plane-storage'
import {
  resolveProviderRuntimeKey,
  resolveRouteConfig,
} from '@/lib/server/llm-control-plane-types'
import { callProviderMedia } from '@/lib/server/llm-media'
import {
  jsonWithAiWorkflowItems,
  readAiWorkflowItems,
} from '@/lib/server/ai-workflow-storage'

export const runtime = 'nodejs'

type MediaType = 'audio' | 'image' | 'video'

const clip = (value: unknown, fallback = '', max = 4000) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const isMediaType = (value: string): value is MediaType =>
  value === 'audio' || value === 'image' || value === 'video'

const defaultModelByMediaType: Record<MediaType, string> = {
  audio: 'gpt-4o-mini-tts',
  image: 'gpt-image-1',
  video: 'sora-2',
}

const mediaTypeLabelMap: Record<MediaType, string> = {
  audio: '音频',
  image: '图片',
  video: '视频',
}

const buildSupportedProviderHint = (mediaType: MediaType) => {
  const providers = LLM_PROVIDER_CATALOG.filter((item) =>
    supportsProviderMediaType(item.id, mediaType)
  )
  if (!providers.length) return '暂无可用供应商'
  return providers.map((item) => item.label).join(' / ')
}

const isMediaConfigurationError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    message.includes('当前未启用') ||
    message.includes('尚未配置 API Key') ||
    message.includes('仅支持') ||
    message.includes('不支持') ||
    message.includes('模型可能不支持') ||
    normalized.includes('invalid') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    normalized.includes('api key')
  )
}

const mediaGenerateSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  mediaType: z.enum(['audio', 'image', 'video']),
  routeProfileId: z.string().trim().max(80).optional().default(''),
  provider: z.string().trim().max(40).optional().default(''),
  providerId: z.string().trim().max(40).optional().default(''),
  model: z.string().trim().max(120).optional().default(''),
  workflowId: z.string().trim().max(80).optional().default(''),
  voice: z.string().trim().max(80).optional().default(''),
  size: z.string().trim().max(80).optional().default(''),
  durationSeconds: z.coerce.number().int().min(3).max(30).optional(),
})

const updateWorkflowStatus = (
  workflows: ReturnType<typeof readAiWorkflowItems>,
  workflowId: string,
  status: 'executing' | 'completed' | 'failed',
  actor: string,
  note: string,
  artifactUrl = '',
  artifactMimeType = ''
) => {
  const now = new Date().toISOString()
  return workflows.map((item) => {
    if (item.id !== workflowId) return item
    const artifactMediaType: 'audio' | 'video' | 'image' | 'document' =
      artifactMimeType.startsWith('audio/')
        ? 'audio'
        : artifactMimeType.startsWith('video/')
          ? 'video'
          : artifactMimeType.startsWith('image/')
            ? 'image'
            : 'document'
    return {
      ...item,
      status,
      updatedAt: now,
      artifacts:
        status === 'completed' && artifactUrl
          ? [
              {
                mediaType: artifactMediaType,
                mimeType: artifactMimeType,
                url: artifactUrl,
                title: 'AI 生成产物',
              },
              ...item.artifacts,
            ].slice(0, 8)
          : item.artifacts,
      timeline: [
        {
          at: now,
          actor,
          action: `媒体生成${status === 'completed' ? '完成' : status === 'failed' ? '失败' : '开始'}`,
          note,
        },
        ...item.timeline,
      ].slice(0, 20),
    }
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const startedAt = Date.now()
  const parsedPayload = await parseJsonWithSchema(request, mediaGenerateSchema, '媒体生成参数不合法。')
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }

  const payload = parsedPayload.data
  const prompt = clip(payload.prompt, '', 8000)
  const mediaTypeInput = clip(payload.mediaType, '')
  const mediaType = isMediaType(mediaTypeInput) ? mediaTypeInput : null
  const actor = resolveAuditActor(request)

  if (!mediaType) {
    return NextResponse.json({ message: 'mediaType 仅支持 audio / image / video' }, { status: 400 })
  }

  const snapshot = readControlPlaneSnapshot(request)
  const route = resolveRouteConfig(snapshot.routes, clip(payload.routeProfileId, ''))
  const requestedProviderId = clip(payload.provider, '') || clip(payload.providerId, '')
  const hasExplicitProvider = Boolean(requestedProviderId)
  let providerId = requestedProviderId || route?.providerId || 'openai'
  const requestedCatalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
  const pickFallbackProvider = (excludeProviderId = '') =>
    snapshot.providers.find((item) => {
      if (excludeProviderId && item.providerId === excludeProviderId) return false
      if (!supportsProviderMediaType(item.providerId, mediaType)) return false
      if (!item.enabled) return false
      const providerCatalog = LLM_PROVIDER_CATALOG.find(
        (catalogItem) => catalogItem.id === item.providerId
      )
      if (!providerCatalog) return false
      const providerKey = resolveProviderRuntimeKey(item)
      return providerCatalog.supportsKeyless || Boolean(providerKey.apiKey.trim())
    })

  if (
    !hasExplicitProvider &&
    (!requestedCatalog || !supportsProviderMediaType(requestedCatalog.id, mediaType))
  ) {
    const fallbackProvider = pickFallbackProvider(providerId)
    if (fallbackProvider) {
      providerId = fallbackProvider.providerId
    }
  }

  let catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
  if (!catalog || !supportsProviderMediaType(catalog.id, mediaType)) {
    const fallbackProvider = pickFallbackProvider(providerId)
    if (fallbackProvider) {
      providerId = fallbackProvider.providerId
      catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
    }
  }

  if (!catalog) {
    return NextResponse.json({ message: `未知提供商: ${providerId}` }, { status: 400 })
  }

  if (!supportsProviderMediaType(catalog.id, mediaType)) {
    return NextResponse.json(
      {
        message: `${catalog.label} 当前不支持${mediaTypeLabelMap[mediaType]}生成，请切换至支持该能力的模型提供商（${buildSupportedProviderHint(mediaType)}）。`,
      },
      { status: 400 }
    )
  }

  let provider = snapshot.providers.find((item) => item.providerId === providerId) || null
  let resolvedKey = provider ? resolveProviderRuntimeKey(provider) : { apiKey: '', source: 'none', envVar: '' }

  if (
    !provider ||
    !provider.enabled ||
    (!catalog.supportsKeyless && !resolvedKey.apiKey.trim())
  ) {
    const fallbackProvider = pickFallbackProvider(providerId)
    if (fallbackProvider) {
      providerId = fallbackProvider.providerId
      provider = fallbackProvider
      catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId) || catalog
      resolvedKey = resolveProviderRuntimeKey(provider)
    }
  }

  if (!provider?.enabled) {
    return NextResponse.json(
      {
        message: `${catalog.label} 当前未启用，无法生成${mediaTypeLabelMap[mediaType]}。请先在模型配置中启用（支持供应商：${buildSupportedProviderHint(mediaType)}）。`,
      },
      { status: 400 }
    )
  }

  if (!catalog.supportsKeyless && !resolvedKey.apiKey.trim()) {
    return NextResponse.json(
      {
        message: `${catalog.label} 尚未配置 API Key，无法生成${mediaTypeLabelMap[mediaType]}。`,
      },
      { status: 400 }
    )
  }

  const model =
    clip(payload.model, '') ||
    (mediaType === 'audio' || mediaType === 'image'
      ? defaultModelByMediaType[mediaType]
      : provider.defaultModel || defaultModelByMediaType.video)

  const workflowId = clip(payload.workflowId, '', 80)
  let workflows = readAiWorkflowItems(request)
  if (workflowId) {
    workflows = updateWorkflowStatus(
      workflows,
      workflowId,
      'executing',
      actor,
      `开始生成 ${mediaType} 产物`
    )
  }

  try {
    const result = await callProviderMedia({
      mediaType,
      providerId: catalog.id,
      baseUrl: provider.baseUrl || catalog.defaultBaseUrl,
      apiKey: resolvedKey.apiKey,
      organization: provider.organization,
      prompt,
      model,
      voice: clip(payload.voice, ''),
      size: clip(payload.size, ''),
      durationSeconds:
        typeof payload.durationSeconds === 'number' && payload.durationSeconds > 0
          ? Math.min(30, Math.max(3, Math.round(payload.durationSeconds)))
          : undefined,
    })

    if (workflowId) {
      workflows = updateWorkflowStatus(
        workflows,
        workflowId,
        'completed',
        actor,
        `${mediaType} 产物生成成功`,
        result.url ? result.url.slice(0, 2048) : '',
        result.mimeType
      )
    }

    const response = jsonWithAiWorkflowItems(
      {
        ok: true,
        mediaType,
        providerId: catalog.id,
        model,
        result,
        workflow: workflowId ? workflows.find((item) => item.id === workflowId) || null : null,
      },
      workflows
    )
    appendLlmAuditLog(response, request, {
      action: 'chat.completion',
      success: true,
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      providerId: catalog.id,
      routeId: route?.routeId,
      model,
      message: `${mediaType} 生成成功`,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : `${mediaType} 生成失败`
    if (workflowId) {
      workflows = updateWorkflowStatus(workflows, workflowId, 'failed', actor, message)
    }
    const statusCode = isMediaConfigurationError(message) ? 400 : 502
    const response = jsonWithAiWorkflowItems(
      {
        ok: false,
        mediaType,
        providerId: catalog.id,
        model,
        message,
        workflow: workflowId ? workflows.find((item) => item.id === workflowId) || null : null,
      },
      workflows,
      { status: statusCode }
    )
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
