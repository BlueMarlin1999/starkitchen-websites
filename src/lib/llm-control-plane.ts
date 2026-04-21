import {
  LlmProviderId,
  LlmRouteProfileId,
  getProviderCatalogItem,
  maskApiKey,
  getProviderDefaultModel,
} from '@/lib/llm-catalog'
import { buildApiUrl } from '@/lib/runtime-config'
import {
  LlmAgentRouteConfig,
  LlmProviderConfig,
  LlmProviderKeySource,
  LlmRouteProfileConfig,
  useLlmControlPlaneStore,
} from '@/store/llm-control-plane'
import { isStrictLiveMode } from '@/lib/live-mode'

export type LlmControlPlaneMode = 'remote' | 'local'

export interface LlmControlPlaneSnapshot {
  providers: LlmProviderConfig[]
  routes: LlmRouteProfileConfig[]
  agentRoutes: LlmAgentRouteConfig[]
  mode: LlmControlPlaneMode
}

export interface LlmProviderTestResult {
  ok: boolean
  message: string
  latencyMs: number | null
}

export interface LlmAuditLogItem {
  id: string
  timestamp: string
  actor: string
  action: string
  success: boolean
  statusCode: number
  latencyMs: number | null
  providerId?: string
  routeId?: string
  model?: string
  message: string
  path: string
}

export interface LlmAuditSummaryBucket {
  id: string
  count: number
  errorCount: number
  avgLatencyMs: number | null
}

export interface LlmMonitorSummary {
  windowHours: number
  totalEvents: number
  successCount: number
  errorCount: number
  successRate: number
  avgLatencyMs: number | null
  p95LatencyMs: number | null
  byAction: LlmAuditSummaryBucket[]
  byProvider: LlmAuditSummaryBucket[]
  recentErrors: LlmAuditLogItem[]
}

export interface UpdateLlmProviderPayload {
  enabled: boolean
  apiKey: string
  keySource: LlmProviderKeySource
  keyEnvVar: string
  clearApiKey?: boolean
  baseUrl: string
  defaultModel: string
  organization?: string
}

const readLocalSnapshot = (): LlmControlPlaneSnapshot => {
  const state = useLlmControlPlaneStore.getState()
  return {
    providers: state.providers,
    routes: state.routes,
    agentRoutes: state.agentRoutes,
    mode: 'local',
  }
}

const readPersistedSnapshot = (mode: LlmControlPlaneMode): LlmControlPlaneSnapshot => {
  const state = useLlmControlPlaneStore.getState()
  return {
    providers: state.providers,
    routes: state.routes,
    agentRoutes: state.agentRoutes,
    mode,
  }
}

const buildAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const updateProviderHealthLocal = (
  providerId: LlmProviderId,
  patch: Partial<LlmProviderConfig>
) => {
  useLlmControlPlaneStore.getState().upsertProviderLocal(providerId, patch)
}

const extractApiErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => ({}))
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim()
  }
  return fallback
}

const shouldFallbackToLocalMode = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  )
}

const strictLiveMode = isStrictLiveMode()

const throwIfStrictLiveMode = (error: unknown, fallbackMessage: string) => {
  if (!strictLiveMode) return
  if (error instanceof Error && error.message.trim()) {
    throw error
  }
  throw new Error(fallbackMessage)
}

export const loadLlmControlPlane = async (token?: string): Promise<LlmControlPlaneSnapshot> => {
  try {
    const response = await fetch(buildApiUrl('/llm/control-plane'), {
      method: 'GET',
      headers: buildAuthHeaders(token),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to load LLM control plane: ${response.status}`)
    }

    const payload = await response.json()
    if (Array.isArray(payload?.providers)) {
      useLlmControlPlaneStore.getState().setProvidersLocal(payload.providers as LlmProviderConfig[])
    }
    if (Array.isArray(payload?.routes)) {
      useLlmControlPlaneStore.getState().setRoutesLocal(payload.routes as LlmRouteProfileConfig[])
    }
    if (Array.isArray(payload?.agentRoutes)) {
      useLlmControlPlaneStore
        .getState()
        .setAgentRoutesLocal(payload.agentRoutes as LlmAgentRouteConfig[])
    }

    return readPersistedSnapshot('remote')
  } catch (error) {
    throwIfStrictLiveMode(error, 'LLM 控制平面不可用，请先恢复后端服务。')
    console.warn('LLM control plane backend unavailable, fallback to local storage.', error)
    return readLocalSnapshot()
  }
}

export const saveLlmProviderConfig = async (
  providerId: LlmProviderId,
  payload: UpdateLlmProviderPayload,
  token?: string
): Promise<LlmControlPlaneSnapshot> => {
  try {
    const response = await fetch(buildApiUrl(`/llm/providers/${providerId}`), {
      method: 'PUT',
      headers: buildAuthHeaders(token),
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    if (!response.ok) {
      const message = await extractApiErrorMessage(
        response,
        `保存供应商配置失败 (${response.status})`
      )
      throw new Error(message)
    }

    const result = await response.json()

    if (Array.isArray(result?.providers)) {
      useLlmControlPlaneStore.getState().setProvidersLocal(result.providers as LlmProviderConfig[])
    } else {
      useLlmControlPlaneStore.getState().upsertProviderLocal(providerId, payload)
    }

    if (Array.isArray(result?.routes)) {
      useLlmControlPlaneStore.getState().setRoutesLocal(result.routes as LlmRouteProfileConfig[])
    }
    if (Array.isArray(result?.agentRoutes)) {
      useLlmControlPlaneStore
        .getState()
        .setAgentRoutesLocal(result.agentRoutes as LlmAgentRouteConfig[])
    }

    return readPersistedSnapshot('remote')
  } catch (error) {
    throwIfStrictLiveMode(error, '保存失败：后端控制平面不可用，严格模式已禁用本地降级。')
    if (!shouldFallbackToLocalMode(error)) {
      throw error
    }
    console.warn('Save provider config failed due to network issue, fallback to local.', error)
    useLlmControlPlaneStore.getState().upsertProviderLocal(providerId, {
      ...payload,
      keyConfigured: Boolean(payload.apiKey.trim()),
      keyPreview: payload.apiKey.trim() ? maskApiKey(payload.apiKey.trim()) : '',
    })
    return readLocalSnapshot()
  }
}

export const saveLlmRouteProfiles = async (
  routes: LlmRouteProfileConfig[],
  token?: string
): Promise<LlmControlPlaneSnapshot> => {
  try {
    const response = await fetch(buildApiUrl('/llm/routes'), {
      method: 'PUT',
      headers: buildAuthHeaders(token),
      body: JSON.stringify({ routes }),
      credentials: 'include',
    })

    if (!response.ok) {
      const message = await extractApiErrorMessage(
        response,
        `保存路由策略失败 (${response.status})`
      )
      throw new Error(message)
    }

    const result = await response.json()
    if (Array.isArray(result?.routes)) {
      useLlmControlPlaneStore.getState().setRoutesLocal(result.routes as LlmRouteProfileConfig[])
    } else {
      useLlmControlPlaneStore.getState().setRoutesLocal(routes)
    }

    if (Array.isArray(result?.providers)) {
      useLlmControlPlaneStore.getState().setProvidersLocal(result.providers as LlmProviderConfig[])
    }
    if (Array.isArray(result?.agentRoutes)) {
      useLlmControlPlaneStore
        .getState()
        .setAgentRoutesLocal(result.agentRoutes as LlmAgentRouteConfig[])
    }

    return readPersistedSnapshot('remote')
  } catch (error) {
    throwIfStrictLiveMode(error, '保存失败：后端控制平面不可用，严格模式已禁用本地降级。')
    if (!shouldFallbackToLocalMode(error)) {
      throw error
    }
    console.warn('Save route profiles failed due to network issue, fallback to local.', error)
    useLlmControlPlaneStore.getState().setRoutesLocal(routes)
    return readLocalSnapshot()
  }
}

export const saveLlmAgentRoutes = async (
  agentRoutes: LlmAgentRouteConfig[],
  token?: string
): Promise<LlmControlPlaneSnapshot> => {
  try {
    const response = await fetch(buildApiUrl('/llm/agent-routes'), {
      method: 'PUT',
      headers: buildAuthHeaders(token),
      body: JSON.stringify({ agentRoutes }),
      credentials: 'include',
    })

    if (!response.ok) {
      const message = await extractApiErrorMessage(
        response,
        `保存 Agent 路由策略失败 (${response.status})`
      )
      throw new Error(message)
    }

    const result = await response.json()
    if (Array.isArray(result?.agentRoutes)) {
      useLlmControlPlaneStore
        .getState()
        .setAgentRoutesLocal(result.agentRoutes as LlmAgentRouteConfig[])
    } else {
      useLlmControlPlaneStore.getState().setAgentRoutesLocal(agentRoutes)
    }

    if (Array.isArray(result?.providers)) {
      useLlmControlPlaneStore.getState().setProvidersLocal(result.providers as LlmProviderConfig[])
    }
    if (Array.isArray(result?.routes)) {
      useLlmControlPlaneStore.getState().setRoutesLocal(result.routes as LlmRouteProfileConfig[])
    }

    return readPersistedSnapshot('remote')
  } catch (error) {
    throwIfStrictLiveMode(error, '保存失败：后端控制平面不可用，严格模式已禁用本地降级。')
    if (!shouldFallbackToLocalMode(error)) {
      throw error
    }
    console.warn('Save agent routes failed due to network issue, fallback to local.', error)
    useLlmControlPlaneStore.getState().setAgentRoutesLocal(agentRoutes)
    return readLocalSnapshot()
  }
}

const applyControlPlanePayloadToLocalState = (payload: any) => {
  if (Array.isArray(payload?.providers)) {
    useLlmControlPlaneStore.getState().setProvidersLocal(payload.providers as LlmProviderConfig[])
  }
  if (Array.isArray(payload?.routes)) {
    useLlmControlPlaneStore.getState().setRoutesLocal(payload.routes as LlmRouteProfileConfig[])
  }
  if (Array.isArray(payload?.agentRoutes)) {
    useLlmControlPlaneStore
      .getState()
      .setAgentRoutesLocal(payload.agentRoutes as LlmAgentRouteConfig[])
  }
}

const buildRemoteProviderTestResult = (
  response: Response,
  payload: any,
  startedAt: number
): LlmProviderTestResult => {
  const ok = response.ok && payload?.ok !== false
  return {
    ok,
    message:
      typeof payload?.message === 'string'
        ? payload.message
        : ok
          ? '连通性测试通过'
          : `连通性测试失败 (${response.status})`,
    latencyMs:
      typeof payload?.latencyMs === 'number' ? payload.latencyMs : Math.max(0, Date.now() - startedAt),
  }
}

const buildLocalFallbackProviderTestResult = (
  providerId: LlmProviderId,
  provider: LlmProviderConfig
): LlmProviderTestResult => {
  const catalog = getProviderCatalogItem(providerId)
  const hasKey = provider.keyConfigured || Boolean(provider.apiKey.trim())
  const ok = catalog.supportsKeyless || hasKey
  return {
    ok,
    message: ok ? '后端不可用，已按本地配置通过基础检查' : '后端不可用，且本地 API Key 缺失',
    latencyMs: null,
  }
}

export const testLlmProviderConnection = async (
  providerId: LlmProviderId,
  token?: string
): Promise<{ snapshot: LlmControlPlaneSnapshot; result: LlmProviderTestResult }> => {
  const provider = useLlmControlPlaneStore
    .getState()
    .providers.find((item) => item.providerId === providerId)

  if (!provider) {
    const snapshot = readLocalSnapshot()
    return {
      snapshot,
      result: { ok: false, message: '未找到提供商配置', latencyMs: null },
    }
  }

  const startedAt = Date.now()
  try {
    const response = await fetch(buildApiUrl(`/llm/providers/${providerId}/test`), {
      method: 'POST',
      headers: buildAuthHeaders(token),
      body: JSON.stringify({ model: provider.defaultModel || getProviderDefaultModel(providerId) }),
      credentials: 'include',
    })

    const payload = await response.json().catch(() => ({}))
    const result = buildRemoteProviderTestResult(response, payload, startedAt)
    updateProviderHealthLocal(providerId, {
      health: result.ok ? 'healthy' : 'error',
      lastTestAt: new Date().toISOString(),
    })

    applyControlPlanePayloadToLocalState(payload)

    return {
      snapshot: readPersistedSnapshot('remote'),
      result,
    }
  } catch (error) {
    throwIfStrictLiveMode(error, '连通性测试失败：后端控制平面不可用。')
    console.warn('Provider test failed, fallback to local check.', error)
    const result = buildLocalFallbackProviderTestResult(providerId, provider)
    updateProviderHealthLocal(providerId, {
      health: result.ok ? 'healthy' : 'error',
      lastTestAt: new Date().toISOString(),
    })
    return {
      snapshot: readLocalSnapshot(),
      result,
    }
  }
}

export const resolveRouteProfile = (
  routes: LlmRouteProfileConfig[],
  routeId: LlmRouteProfileId
) => routes.find((item) => item.routeId === routeId) || routes[0]

export const loadLlmAuditLogs = async (
  limit = 50,
  token?: string
): Promise<{ items: LlmAuditLogItem[]; total: number }> => {
  try {
    const response = await fetch(buildApiUrl(`/llm/audit?limit=${Math.max(1, Math.min(200, limit))}`), {
      method: 'GET',
      headers: buildAuthHeaders(token),
      credentials: 'include',
    })
    if (!response.ok) throw new Error(`Failed to load audit logs: ${response.status}`)
    const payload = await response.json()
    return {
      items: Array.isArray(payload?.items) ? (payload.items as LlmAuditLogItem[]) : [],
      total: typeof payload?.total === 'number' ? payload.total : 0,
    }
  } catch (error) {
    throwIfStrictLiveMode(error, '读取审计日志失败：后端控制平面不可用。')
    console.warn('Failed to load LLM audit logs.', error)
    return { items: [], total: 0 }
  }
}

export const loadLlmMonitorSummary = async (
  windowHours = 24,
  token?: string
): Promise<LlmMonitorSummary> => {
  const fallback: LlmMonitorSummary = {
    windowHours,
    totalEvents: 0,
    successCount: 0,
    errorCount: 0,
    successRate: 0,
    avgLatencyMs: null,
    p95LatencyMs: null,
    byAction: [],
    byProvider: [],
    recentErrors: [],
  }

  try {
    const response = await fetch(
      buildApiUrl(`/llm/monitor/summary?windowHours=${Math.max(1, Math.min(24 * 30, windowHours))}`),
      {
        method: 'GET',
        headers: buildAuthHeaders(token),
        credentials: 'include',
      }
    )
    if (!response.ok) throw new Error(`Failed to load monitor summary: ${response.status}`)
    const payload = await response.json()
    return {
      ...fallback,
      ...payload,
    } as LlmMonitorSummary
  } catch (error) {
    throwIfStrictLiveMode(error, '读取监控汇总失败：后端控制平面不可用。')
    console.warn('Failed to load LLM monitor summary.', error)
    return fallback
  }
}
