import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LLM_PROVIDER_CATALOG, getProviderApiKeyEnvVar } from '@/lib/llm-catalog'
import { requireLlmManager } from '@/lib/server/llm-auth'
import { appendLlmAuditLog } from '@/lib/server/llm-audit'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  jsonWithControlPlaneSnapshot,
  readControlPlaneSnapshot,
} from '@/lib/server/llm-control-plane-storage'
import {
  LlmProviderConfig,
  sanitizeSnapshotForClient,
} from '@/lib/server/llm-control-plane-types'

export const runtime = 'nodejs'

const providerUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  apiKey: z.string().max(400).optional(),
  clearApiKey: z.boolean().optional().default(false),
  baseUrl: z.string().trim().max(300).optional(),
  keySource: z.enum(['env', 'cookie']).optional(),
  keyEnvVar: z.string().trim().max(120).optional(),
  defaultModel: z.string().trim().max(120).optional(),
  organization: z.string().trim().max(120).optional(),
})

export async function PUT(
  request: NextRequest,
  context: { params: { providerId: string } }
) {
  const denied = requireLlmManager(request)
  if (denied) return denied

  const startedAt = Date.now()
  const providerId = context.params.providerId
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === providerId)
  if (!catalog) {
    return NextResponse.json({ message: '未知模型提供商' }, { status: 404 })
  }

  const parsedPayload = await parseJsonWithSchema(
    request,
    providerUpdateSchema,
    '模型提供商更新参数不合法。'
  )
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data

  const snapshot = readControlPlaneSnapshot(request)
  const now = new Date().toISOString()

  const nextProviders = snapshot.providers.map((item): LlmProviderConfig => {
    if (item.providerId !== catalog.id) return item
    const incomingApiKey = payload.apiKey?.trim() || ''
    const clearApiKey = payload.clearApiKey === true
    const apiKey = clearApiKey ? '' : incomingApiKey || item.apiKey
    const baseUrl =
      payload.baseUrl?.trim()
        ? payload.baseUrl.trim()
        : item.baseUrl || catalog.defaultBaseUrl
    const keySource = payload.keySource === 'env' ? 'env' : payload.keySource === 'cookie' ? 'cookie' : item.keySource
    const keyEnvVar =
      payload.keyEnvVar?.trim()
        ? payload.keyEnvVar.trim()
        : item.keyEnvVar || getProviderApiKeyEnvVar(catalog.id)
    const defaultModel =
      payload.defaultModel?.trim()
        ? payload.defaultModel.trim()
        : item.defaultModel
    const organization = payload.organization?.trim()

    return {
      ...item,
      enabled: typeof payload.enabled === 'boolean' ? payload.enabled : item.enabled,
      apiKey,
      keySource,
      keyEnvVar,
      keyConfigured: false,
      keyPreview: '',
      baseUrl,
      defaultModel,
      organization: typeof organization === 'string' ? organization : item.organization,
      health: 'unknown',
      updatedAt: now,
    }
  })

  const nextSnapshot = {
    providers: nextProviders,
    routes: snapshot.routes,
    agentRoutes: snapshot.agentRoutes,
  }
  const clientSnapshot = sanitizeSnapshotForClient(nextSnapshot)

  const response = jsonWithControlPlaneSnapshot(
    {
      providers: clientSnapshot.providers,
      routes: clientSnapshot.routes,
      agentRoutes: clientSnapshot.agentRoutes,
    },
    nextSnapshot
  )
  appendLlmAuditLog(response, request, {
    action: 'provider.update',
    success: true,
    statusCode: 200,
    latencyMs: Date.now() - startedAt,
    providerId: catalog.id,
    message: `已更新 ${catalog.label} 配置`,
  })
  return response
}
