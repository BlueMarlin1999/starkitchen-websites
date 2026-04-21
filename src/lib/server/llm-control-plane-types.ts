import {
  LLM_PROVIDER_CATALOG,
  LLM_ROUTE_PROFILE_LIBRARY,
  LlmProviderId,
  LlmRouteProfileId,
  getProviderApiKeyEnvVar,
  getProviderDefaultModel,
  maskApiKey,
} from '@/lib/llm-catalog'
import { AGENT_PROFILES, normalizeAgentId } from '@/components/AgentLegion/types'

export type LlmProviderHealth = 'unknown' | 'healthy' | 'error'
export type LlmProviderKeySource = 'cookie' | 'env'

export interface LlmProviderConfig {
  providerId: LlmProviderId
  enabled: boolean
  apiKey: string
  keySource: LlmProviderKeySource
  keyEnvVar: string
  keyConfigured: boolean
  keyPreview: string
  baseUrl: string
  defaultModel: string
  organization?: string
  health: LlmProviderHealth
  lastTestAt: string | null
  updatedAt: string
}

export interface LlmRouteProfileConfig {
  routeId: LlmRouteProfileId
  providerId: LlmProviderId
  model: string
  temperature: number
  maxTokens: number
}

export interface LlmAgentRouteConfig {
  agentId: string
  providerId: LlmProviderId
  model: string
  temperature: number
  maxTokens: number
}

export interface LlmControlPlaneSnapshot {
  providers: LlmProviderConfig[]
  routes: LlmRouteProfileConfig[]
  agentRoutes: LlmAgentRouteConfig[]
}

export interface LlmResolvedApiKey {
  apiKey: string
  source: 'cookie' | 'env' | 'none'
  envVar: string
}

const nowIso = () => new Date().toISOString()

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

const readEnvApiKey = (envVar: string) => {
  const raw = process.env[envVar]
  return typeof raw === 'string' ? raw.trim() : ''
}

const shouldAutoEnableProvider = (providerId: LlmProviderId, envVar: string) => {
  if (providerId === 'deepseek') return true
  return Boolean(readEnvApiKey(envVar))
}

export const buildDefaultProviders = (): LlmProviderConfig[] =>
  LLM_PROVIDER_CATALOG.map((item) => {
    const keyEnvVar = getProviderApiKeyEnvVar(item.id)
    return {
      providerId: item.id,
      enabled: shouldAutoEnableProvider(item.id, keyEnvVar),
      apiKey: '',
      keySource: 'cookie',
      keyEnvVar,
      keyConfigured: false,
      keyPreview: '',
      baseUrl: item.defaultBaseUrl,
      defaultModel: getProviderDefaultModel(item.id),
      organization: '',
      health: 'unknown',
      lastTestAt: null,
      updatedAt: nowIso(),
    }
  })

export const buildDefaultRoutes = (): LlmRouteProfileConfig[] =>
  LLM_ROUTE_PROFILE_LIBRARY.map((item) => ({
    routeId: item.id,
    providerId: item.defaultProviderId,
    model: item.defaultModel,
    temperature: item.defaultTemperature,
    maxTokens: item.defaultMaxTokens,
  }))

const AGENT_ROUTE_PROFILE_HINTS: Record<string, LlmRouteProfileId> = {
  cos_zhuge_liang: 'reasoning',
  ceo_zhang_wuji: 'reasoning',
  caio_alan_turing: 'reasoning',
  csco_ray_kroc: 'default',
  cfo_buffett: 'reasoning',
  coo_howard_schultz: 'default',
  cmo_philip_kotler: 'default',
  cco_escoffier: 'default',
  cpo_bei_yuming: 'reasoning',
  chro_peter_drucker: 'default',
  clo_napoleon: 'reasoning',
  cgo_elon_musk: 'reasoning',
}

const AGENT_ID_SET = new Set(AGENT_PROFILES.map((agent) => agent.id))

const resolveRouteTemplate = (routeId: LlmRouteProfileId) =>
  LLM_ROUTE_PROFILE_LIBRARY.find((item) => item.id === routeId) || LLM_ROUTE_PROFILE_LIBRARY[0]

const resolveAgentDefaultRoute = (agentId: string) => {
  const routeId = AGENT_ROUTE_PROFILE_HINTS[agentId] || 'default'
  return resolveRouteTemplate(routeId)
}

const buildDefaultAgentRoute = (agentId: string): LlmAgentRouteConfig => {
  const defaults = resolveAgentDefaultRoute(agentId)
  return {
    agentId,
    providerId: defaults.defaultProviderId,
    model: defaults.defaultModel,
    temperature: defaults.defaultTemperature,
    maxTokens: defaults.defaultMaxTokens,
  }
}

export const buildDefaultAgentRoutes = (): LlmAgentRouteConfig[] =>
  AGENT_PROFILES.map((agent) => buildDefaultAgentRoute(agent.id))

const isProviderId = (value: unknown): value is LlmProviderId =>
  typeof value === 'string' &&
  LLM_PROVIDER_CATALOG.some((item) => item.id === value)

const isRouteId = (value: unknown): value is LlmRouteProfileId =>
  typeof value === 'string' &&
  LLM_ROUTE_PROFILE_LIBRARY.some((item) => item.id === value)

const normalizeAgentIdValue = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const normalized = normalizeAgentId(value.trim())
  return AGENT_ID_SET.has(normalized) ? normalized : ''
}

export const normalizeProviderConfig = (value: unknown): LlmProviderConfig | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LlmProviderConfig>
  if (!isProviderId(record.providerId)) return null
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === record.providerId)
  if (!catalog) return null

  return {
    providerId: record.providerId,
    enabled: record.enabled === true,
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : '',
    keySource: record.keySource === 'env' ? 'env' : 'cookie',
    keyEnvVar:
      typeof record.keyEnvVar === 'string' && record.keyEnvVar.trim()
        ? record.keyEnvVar.trim()
        : getProviderApiKeyEnvVar(record.providerId),
    keyConfigured: record.keyConfigured === true,
    keyPreview: typeof record.keyPreview === 'string' ? record.keyPreview : '',
    baseUrl:
      typeof record.baseUrl === 'string' && record.baseUrl.trim()
        ? record.baseUrl.trim()
        : catalog.defaultBaseUrl,
    defaultModel:
      typeof record.defaultModel === 'string' && record.defaultModel.trim()
        ? record.defaultModel.trim()
        : getProviderDefaultModel(record.providerId),
    organization: typeof record.organization === 'string' ? record.organization : '',
    health:
      record.health === 'healthy' || record.health === 'error' || record.health === 'unknown'
        ? record.health
        : 'unknown',
    lastTestAt:
      typeof record.lastTestAt === 'string' && record.lastTestAt.trim() ? record.lastTestAt : null,
    updatedAt:
      typeof record.updatedAt === 'string' && record.updatedAt.trim() ? record.updatedAt : nowIso(),
  }
}

export const normalizeRouteConfig = (value: unknown): LlmRouteProfileConfig | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LlmRouteProfileConfig>
  if (!isRouteId(record.routeId) || !isProviderId(record.providerId)) return null
  const template = LLM_ROUTE_PROFILE_LIBRARY.find((item) => item.id === record.routeId)
  if (!template) return null

  return {
    routeId: record.routeId,
    providerId: record.providerId,
    model:
      typeof record.model === 'string' && record.model.trim()
        ? record.model.trim()
        : template.defaultModel,
    temperature: clampNumber(record.temperature, template.defaultTemperature, 0, 1),
    maxTokens: clampNumber(record.maxTokens, template.defaultMaxTokens, 100, 8192),
  }
}

export const normalizeAgentRouteConfig = (value: unknown): LlmAgentRouteConfig | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LlmAgentRouteConfig>
  const agentId = normalizeAgentIdValue(record.agentId)
  if (!agentId || !isProviderId(record.providerId)) return null
  const defaults = buildDefaultAgentRoute(agentId)

  return {
    agentId,
    providerId: record.providerId,
    model:
      typeof record.model === 'string' && record.model.trim()
        ? record.model.trim()
        : defaults.model,
    temperature: clampNumber(record.temperature, defaults.temperature, 0, 1),
    maxTokens: clampNumber(record.maxTokens, defaults.maxTokens, 100, 8192),
  }
}

const mergeProvidersWithDefaults = (persisted: LlmProviderConfig[]) => {
  const defaults = buildDefaultProviders()
  const persistedMap = new Map(persisted.map((item) => [item.providerId, item]))
  return defaults.map((item) => persistedMap.get(item.providerId) || item)
}

const mergeRoutesWithDefaults = (persisted: LlmRouteProfileConfig[]) => {
  const defaults = buildDefaultRoutes()
  const persistedMap = new Map(persisted.map((item) => [item.routeId, item]))
  return defaults.map((item) => persistedMap.get(item.routeId) || item)
}

const mergeAgentRoutesWithDefaults = (persisted: LlmAgentRouteConfig[]) => {
  const defaults = buildDefaultAgentRoutes()
  const persistedMap = new Map(persisted.map((item) => [item.agentId, item]))
  return defaults.map((item) => persistedMap.get(item.agentId) || item)
}

export const normalizeSnapshot = (value: unknown): LlmControlPlaneSnapshot => {
  if (!value || typeof value !== 'object') {
    return {
      providers: buildDefaultProviders(),
      routes: buildDefaultRoutes(),
      agentRoutes: buildDefaultAgentRoutes(),
    }
  }

  const record = value as {
    providers?: unknown
    routes?: unknown
    agentRoutes?: unknown
  }

  const providers = Array.isArray(record.providers)
    ? record.providers.map((item) => normalizeProviderConfig(item)).filter(Boolean) as LlmProviderConfig[]
    : []

  const routes = Array.isArray(record.routes)
    ? record.routes.map((item) => normalizeRouteConfig(item)).filter(Boolean) as LlmRouteProfileConfig[]
    : []

  const agentRoutes = Array.isArray(record.agentRoutes)
    ? record.agentRoutes
        .map((item) => normalizeAgentRouteConfig(item))
        .filter(Boolean) as LlmAgentRouteConfig[]
    : []

  return {
    providers: mergeProvidersWithDefaults(providers),
    routes: mergeRoutesWithDefaults(routes),
    agentRoutes: mergeAgentRoutesWithDefaults(agentRoutes),
  }
}

export const resolveRouteConfig = (routes: LlmRouteProfileConfig[], routeId?: string) =>
  routes.find((item) => item.routeId === routeId) || routes[0]

export const resolveProviderRuntimeKey = (provider: LlmProviderConfig): LlmResolvedApiKey => {
  const envVar =
    provider.keyEnvVar?.trim() || getProviderApiKeyEnvVar(provider.providerId)
  const cookieKey = provider.apiKey.trim()
  const envKey = readEnvApiKey(envVar)

  if (provider.keySource === 'env') {
    if (envKey) return { apiKey: envKey, source: 'env', envVar }
    if (cookieKey) return { apiKey: cookieKey, source: 'cookie', envVar }
    return { apiKey: '', source: 'none', envVar }
  }

  if (cookieKey) return { apiKey: cookieKey, source: 'cookie', envVar }
  if (envKey) return { apiKey: envKey, source: 'env', envVar }
  return { apiKey: '', source: 'none', envVar }
}

export const sanitizeProviderForClient = (provider: LlmProviderConfig): LlmProviderConfig => {
  const catalog = LLM_PROVIDER_CATALOG.find((item) => item.id === provider.providerId)
  const resolved = resolveProviderRuntimeKey(provider)
  const requiresKey = catalog ? !catalog.supportsKeyless : true
  const keyConfigured = requiresKey ? Boolean(resolved.apiKey) : true

  const keyPreview =
    !requiresKey
      ? 'Not required'
      : resolved.source === 'env'
        ? `ENV:${resolved.envVar}`
        : resolved.source === 'cookie'
          ? maskApiKey(resolved.apiKey)
          : ''

  return {
    ...provider,
    apiKey: '',
    keyConfigured,
    keyPreview,
    keyEnvVar: resolved.envVar,
  }
}

export const sanitizeSnapshotForClient = (
  snapshot: LlmControlPlaneSnapshot
): LlmControlPlaneSnapshot => ({
  providers: snapshot.providers.map((provider) => sanitizeProviderForClient(provider)),
  routes: snapshot.routes,
  agentRoutes: snapshot.agentRoutes,
})
