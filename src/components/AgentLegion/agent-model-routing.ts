import { getProviderDefaultModel, type LlmProviderId } from '@/lib/llm-catalog'
import type { LlmAgentRouteConfig } from '@/store/llm-control-plane'
import { AGENT_PROFILES, normalizeAgentId } from './types'

const DEFAULT_PROVIDER_ID: LlmProviderId = 'deepseek'
const DEFAULT_TEMPERATURE = 0.2
const DEFAULT_MAX_TOKENS = 1800
const AGENT_ORDER = AGENT_PROFILES.map((item) => item.id)
const AGENT_ID_SET = new Set(AGENT_ORDER)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const resolveKnownAgentId = (agentId?: string | null) => {
  const normalized = normalizeAgentId(agentId?.trim() || '')
  if (AGENT_ID_SET.has(normalized)) return normalized
  return AGENT_ORDER[0]
}

export const buildFallbackAgentRoute = (agentId?: string | null): LlmAgentRouteConfig => {
  const safeAgentId = resolveKnownAgentId(agentId)
  return {
    agentId: safeAgentId,
    providerId: DEFAULT_PROVIDER_ID,
    model: getProviderDefaultModel(DEFAULT_PROVIDER_ID),
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
  }
}

const normalizeAgentRouteDraft = (route: LlmAgentRouteConfig): LlmAgentRouteConfig => {
  const safeAgentId = resolveKnownAgentId(route.agentId)
  const model = route.model.trim() || getProviderDefaultModel(route.providerId)
  return {
    agentId: safeAgentId,
    providerId: route.providerId,
    model,
    temperature: clamp(route.temperature, 0, 1),
    maxTokens: clamp(Math.round(route.maxTokens), 100, 8192),
  }
}

export const resolveAgentRouteDraft = (
  agentId: string | null | undefined,
  routes: LlmAgentRouteConfig[]
) => {
  const safeAgentId = resolveKnownAgentId(agentId)
  const draft = routes.find((item) => normalizeAgentId(item.agentId) === safeAgentId)
  if (!draft) return buildFallbackAgentRoute(safeAgentId)
  return normalizeAgentRouteDraft(draft)
}

export const upsertAgentRouteDraft = (
  routes: LlmAgentRouteConfig[],
  nextRoute: LlmAgentRouteConfig
) => {
  const normalizedRoute = normalizeAgentRouteDraft(nextRoute)
  const byId = new Map<string, LlmAgentRouteConfig>()

  for (const route of routes) {
    const normalizedAgentId = resolveKnownAgentId(route.agentId)
    byId.set(normalizedAgentId, normalizeAgentRouteDraft(route))
  }

  byId.set(normalizedRoute.agentId, normalizedRoute)

  return AGENT_ORDER.map((agentId) => byId.get(agentId) || buildFallbackAgentRoute(agentId))
}
