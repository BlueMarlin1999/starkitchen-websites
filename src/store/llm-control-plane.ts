import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  LLM_PROVIDER_CATALOG,
  LLM_ROUTE_PROFILE_LIBRARY,
  LlmProviderId,
  LlmRouteProfileId,
  getProviderApiKeyEnvVar,
  getProviderDefaultModel,
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

interface LlmControlPlaneState {
  providers: LlmProviderConfig[]
  routes: LlmRouteProfileConfig[]
  agentRoutes: LlmAgentRouteConfig[]
  upsertProviderLocal: (
    providerId: LlmProviderId,
    patch: Partial<Omit<LlmProviderConfig, 'providerId'>>
  ) => void
  upsertRouteLocal: (
    routeId: LlmRouteProfileId,
    patch: Partial<Omit<LlmRouteProfileConfig, 'routeId'>>
  ) => void
  upsertAgentRouteLocal: (
    agentId: string,
    patch: Partial<Omit<LlmAgentRouteConfig, 'agentId'>>
  ) => void
  setProvidersLocal: (providers: LlmProviderConfig[]) => void
  setRoutesLocal: (routes: LlmRouteProfileConfig[]) => void
  setAgentRoutesLocal: (agentRoutes: LlmAgentRouteConfig[]) => void
  resetDefaults: () => void
}

const nowIso = () => new Date().toISOString()

const buildDefaultProviders = (): LlmProviderConfig[] =>
  LLM_PROVIDER_CATALOG.map((item) => ({
    providerId: item.id,
    enabled: item.id === 'deepseek',
    apiKey: '',
    keySource: 'cookie',
    keyEnvVar: getProviderApiKeyEnvVar(item.id),
    keyConfigured: false,
    keyPreview: '',
    baseUrl: item.defaultBaseUrl,
    defaultModel: item.models[0]?.id || '',
    organization: '',
    health: 'unknown',
    lastTestAt: null,
    updatedAt: nowIso(),
  }))

const buildDefaultRoutes = (): LlmRouteProfileConfig[] =>
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

const buildDefaultAgentRoutes = (): LlmAgentRouteConfig[] =>
  AGENT_PROFILES.map((agent) => {
    const defaults = resolveAgentDefaultRoute(agent.id)
    return {
      agentId: agent.id,
      providerId: defaults.defaultProviderId,
      model: defaults.defaultModel,
      temperature: defaults.defaultTemperature,
      maxTokens: defaults.defaultMaxTokens,
    }
  })

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

const toSafeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

const normalizeProvider = (value: unknown): LlmProviderConfig | null => {
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
    updatedAt: typeof record.updatedAt === 'string' && record.updatedAt.trim() ? record.updatedAt : nowIso(),
  }
}

const normalizeRoute = (value: unknown): LlmRouteProfileConfig | null => {
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
    temperature: toSafeNumber(record.temperature, template.defaultTemperature, 0, 1),
    maxTokens: toSafeNumber(record.maxTokens, template.defaultMaxTokens, 100, 8192),
  }
}

const normalizeAgentRoute = (value: unknown): LlmAgentRouteConfig | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<LlmAgentRouteConfig>
  const agentId = normalizeAgentIdValue(record.agentId)
  if (!agentId || !isProviderId(record.providerId)) return null
  const defaults = resolveAgentDefaultRoute(agentId)

  return {
    agentId,
    providerId: record.providerId,
    model:
      typeof record.model === 'string' && record.model.trim()
        ? record.model.trim()
        : defaults.defaultModel,
    temperature: toSafeNumber(record.temperature, defaults.defaultTemperature, 0, 1),
    maxTokens: toSafeNumber(record.maxTokens, defaults.defaultMaxTokens, 100, 8192),
  }
}

const mergeProvidersWithDefaults = (persisted: LlmProviderConfig[]) => {
  const defaultProviders = buildDefaultProviders()
  const persistedMap = new Map(persisted.map((item) => [item.providerId, item]))
  return defaultProviders.map((item) => persistedMap.get(item.providerId) || item)
}

const mergeRoutesWithDefaults = (persisted: LlmRouteProfileConfig[]) => {
  const defaultRoutes = buildDefaultRoutes()
  const persistedMap = new Map(persisted.map((item) => [item.routeId, item]))
  return defaultRoutes.map((item) => persistedMap.get(item.routeId) || item)
}

const mergeAgentRoutesWithDefaults = (persisted: LlmAgentRouteConfig[]) => {
  const defaultAgentRoutes = buildDefaultAgentRoutes()
  const persistedMap = new Map(persisted.map((item) => [item.agentId, item]))
  return defaultAgentRoutes.map((item) => persistedMap.get(item.agentId) || item)
}

const parsePersistedState = (persistedState: unknown) => {
  const snapshot = (persistedState || {}) as {
    providers?: unknown
    routes?: unknown
    agentRoutes?: unknown
  }

  const providers = Array.isArray(snapshot.providers)
    ? snapshot.providers.map((item) => normalizeProvider(item)).filter(Boolean) as LlmProviderConfig[]
    : []
  const routes = Array.isArray(snapshot.routes)
    ? snapshot.routes.map((item) => normalizeRoute(item)).filter(Boolean) as LlmRouteProfileConfig[]
    : []
  const agentRoutes = Array.isArray(snapshot.agentRoutes)
    ? snapshot.agentRoutes
        .map((item) => normalizeAgentRoute(item))
        .filter(Boolean) as LlmAgentRouteConfig[]
    : []

  return {
    providers: mergeProvidersWithDefaults(providers),
    routes: mergeRoutesWithDefaults(routes),
    agentRoutes: mergeAgentRoutesWithDefaults(agentRoutes),
  }
}

export const useLlmControlPlaneStore = create<LlmControlPlaneState>()(
  persist(
    (set) => ({
      providers: buildDefaultProviders(),
      routes: buildDefaultRoutes(),
      agentRoutes: buildDefaultAgentRoutes(),
      upsertProviderLocal: (providerId, patch) =>
        set((state) => ({
          providers: state.providers.map((item) =>
            item.providerId === providerId
              ? {
                  ...item,
                  ...patch,
                  providerId,
                  updatedAt: nowIso(),
                }
              : item
          ),
        })),
      upsertRouteLocal: (routeId, patch) =>
        set((state) => ({
          routes: state.routes.map((item) =>
            item.routeId === routeId
              ? {
                  ...item,
                  ...patch,
                  routeId,
                  temperature: toSafeNumber(
                    patch.temperature ?? item.temperature,
                    item.temperature,
                    0,
                    1
                  ),
                  maxTokens: toSafeNumber(
                    patch.maxTokens ?? item.maxTokens,
                    item.maxTokens,
                    100,
                    8192
                  ),
                }
              : item
          ),
        })),
      upsertAgentRouteLocal: (agentId, patch) =>
        set((state) => ({
          agentRoutes: state.agentRoutes.map((item) =>
            item.agentId === normalizeAgentIdValue(agentId)
              ? {
                  ...item,
                  ...patch,
                  agentId: item.agentId,
                  temperature: toSafeNumber(
                    patch.temperature ?? item.temperature,
                    item.temperature,
                    0,
                    1
                  ),
                  maxTokens: toSafeNumber(
                    patch.maxTokens ?? item.maxTokens,
                    item.maxTokens,
                    100,
                    8192
                  ),
                }
              : item
          ),
        })),
      setProvidersLocal: (providers) =>
        set({
          providers: mergeProvidersWithDefaults(
            providers.map((item) => normalizeProvider(item)).filter(Boolean) as LlmProviderConfig[]
          ),
        }),
      setRoutesLocal: (routes) =>
        set({
          routes: mergeRoutesWithDefaults(
            routes.map((item) => normalizeRoute(item)).filter(Boolean) as LlmRouteProfileConfig[]
          ),
        }),
      setAgentRoutesLocal: (agentRoutes) =>
        set({
          agentRoutes: mergeAgentRoutesWithDefaults(
            agentRoutes
              .map((item) => normalizeAgentRoute(item))
              .filter(Boolean) as LlmAgentRouteConfig[]
          ),
        }),
      resetDefaults: () =>
        set({
          providers: buildDefaultProviders(),
          routes: buildDefaultRoutes(),
          agentRoutes: buildDefaultAgentRoutes(),
        }),
    }),
    {
      name: 'llm-control-plane',
      partialize: (state) => ({
        providers: state.providers,
        routes: state.routes,
        agentRoutes: state.agentRoutes,
      }),
      version: 2,
      migrate: (persistedState) => parsePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedState(persistedState),
      }),
    }
  )
)
