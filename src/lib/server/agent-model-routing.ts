import { normalizeAgentId } from '@/components/AgentLegion/types'
import { LlmProviderId, getProviderCatalogItem } from '@/lib/llm-catalog'
import {
  LlmControlPlaneSnapshot,
  LlmProviderConfig,
  resolveProviderRuntimeKey,
} from '@/lib/server/llm-control-plane-types'

export interface ResolvedAgentModelRuntime {
  provider: LlmProviderConfig
  catalog: ReturnType<typeof getProviderCatalogItem>
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  source: 'agent' | 'fallback'
}

const FALLBACK_PROVIDER_ORDER: LlmProviderId[] = [
  'deepseek',
  'moonshot',
  'openai',
  'anthropic',
  'openrouter',
  'ollama',
]

const DEFAULT_AGENT_TEMPERATURE = 0.2
const DEFAULT_AGENT_MAX_TOKENS = 1800

const readProviders = (snapshot: LlmControlPlaneSnapshot) =>
  (Array.isArray((snapshot as { providers?: unknown[] }).providers)
    ? (snapshot as { providers: LlmProviderConfig[] }).providers
    : []) as LlmProviderConfig[]

const readRoutes = (snapshot: LlmControlPlaneSnapshot) =>
  (Array.isArray((snapshot as { routes?: unknown[] }).routes)
    ? (snapshot as { routes: LlmControlPlaneSnapshot['routes'] }).routes
    : []) as LlmControlPlaneSnapshot['routes']

const readAgentRoutes = (snapshot: LlmControlPlaneSnapshot) =>
  (Array.isArray((snapshot as { agentRoutes?: unknown[] }).agentRoutes)
    ? (snapshot as { agentRoutes: LlmControlPlaneSnapshot['agentRoutes'] }).agentRoutes
    : []) as LlmControlPlaneSnapshot['agentRoutes']

const clip = (value: unknown, fallback: string, max = 120) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(min, Math.min(max, value))
}

const asRunnableProvider = (provider: LlmProviderConfig | undefined | null) => {
  if (!provider || !provider.enabled) return null
  const catalog = getProviderCatalogItem(provider.providerId)
  const runtimeKey = resolveProviderRuntimeKey(provider)
  if (!catalog.supportsKeyless && !runtimeKey.apiKey.trim()) return null
  return {
    provider,
    catalog,
    apiKey: runtimeKey.apiKey,
  }
}

const resolveFallbackRuntimeHints = (snapshot: LlmControlPlaneSnapshot) => {
  const route = readRoutes(snapshot).find((item) => item.routeId === 'agent')
  return {
    temperature: clampNumber(route?.temperature, DEFAULT_AGENT_TEMPERATURE, 0, 1),
    maxTokens: clampNumber(route?.maxTokens, DEFAULT_AGENT_MAX_TOKENS, 100, 8192),
  }
}

const buildFallbackProviderCandidates = (snapshot: LlmControlPlaneSnapshot) => {
  const providers = readProviders(snapshot)
  const known = new Set<LlmProviderId>()
  const candidates: LlmProviderId[] = []

  for (const providerId of FALLBACK_PROVIDER_ORDER) {
    known.add(providerId)
    candidates.push(providerId)
  }
  for (const provider of providers) {
    if (known.has(provider.providerId)) continue
    known.add(provider.providerId)
    candidates.push(provider.providerId)
  }
  return candidates
}

const resolveFallbackRuntime = (snapshot: LlmControlPlaneSnapshot): ResolvedAgentModelRuntime | null => {
  const hints = resolveFallbackRuntimeHints(snapshot)
  const candidates = buildFallbackProviderCandidates(snapshot)
  const providers = readProviders(snapshot)

  for (const providerId of candidates) {
    const provider = providers.find((item) => item.providerId === providerId)
    const runnable = asRunnableProvider(provider)
    if (!runnable) continue
    const catalogPresetModel = Array.isArray(runnable.catalog.models)
      ? clip(runnable.catalog.models[0]?.id, '', 120)
      : ''
    const fallbackModel = clip(
      runnable.provider.defaultModel,
      catalogPresetModel,
      120
    )
    if (!fallbackModel) continue

    return {
      ...runnable,
      model: fallbackModel,
      temperature: hints.temperature,
      maxTokens: hints.maxTokens,
      source: 'fallback',
    }
  }

  return null
}

export const resolveAgentModelRuntime = (
  snapshot: LlmControlPlaneSnapshot,
  agentId: string
): ResolvedAgentModelRuntime | null => {
  const normalizedAgentId = normalizeAgentId(agentId)
  const mappedRoute = readAgentRoutes(snapshot).find((item) => item.agentId === normalizedAgentId)
  if (mappedRoute) {
    const mappedProvider = readProviders(snapshot).find(
      (item) => item.providerId === mappedRoute.providerId
    )
    const runnable = asRunnableProvider(mappedProvider)
    const mappedModel = clip(mappedRoute.model, '', 120)
    if (runnable && mappedModel) {
      return {
        ...runnable,
        model: mappedModel,
        temperature: clampNumber(mappedRoute.temperature, DEFAULT_AGENT_TEMPERATURE, 0, 1),
        maxTokens: clampNumber(mappedRoute.maxTokens, DEFAULT_AGENT_MAX_TOKENS, 100, 8192),
        source: 'agent',
      }
    }
  }

  return resolveFallbackRuntime(snapshot)
}
