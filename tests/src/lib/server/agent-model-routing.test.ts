import { describe, expect, it } from 'vitest'
import { resolveAgentModelRuntime } from '../../../../src/lib/server/agent-model-routing'
import type { LlmControlPlaneSnapshot } from '../../../../src/lib/server/llm-control-plane-types'

const now = '2026-04-12T08:00:00.000Z'

const buildSnapshot = (overrides?: Partial<LlmControlPlaneSnapshot>): LlmControlPlaneSnapshot => ({
  providers: [
    {
      providerId: 'deepseek',
      enabled: true,
      apiKey: 'sk-deepseek-test',
      keySource: 'cookie',
      keyEnvVar: 'SK_LLM_DEEPSEEK_API_KEY',
      keyConfigured: true,
      keyPreview: 'sk-***',
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
      organization: '',
      health: 'healthy',
      lastTestAt: now,
      updatedAt: now,
    },
    {
      providerId: 'moonshot',
      enabled: true,
      apiKey: 'sk-moonshot-test',
      keySource: 'cookie',
      keyEnvVar: 'SK_LLM_MOONSHOT_API_KEY',
      keyConfigured: true,
      keyPreview: 'sk-***',
      baseUrl: 'https://api.moonshot.cn/v1',
      defaultModel: 'kimi-2.5',
      organization: '',
      health: 'healthy',
      lastTestAt: now,
      updatedAt: now,
    },
  ],
  routes: [
    {
      routeId: 'agent',
      providerId: 'openai',
      model: 'gpt-4.1',
      temperature: 0.2,
      maxTokens: 1800,
    },
    {
      routeId: 'default',
      providerId: 'deepseek',
      model: 'deepseek-chat',
      temperature: 0.3,
      maxTokens: 1200,
    },
  ],
  agentRoutes: [
    {
      agentId: 'cfo_buffett',
      providerId: 'moonshot',
      model: 'kimi-2.5',
      temperature: 0.15,
      maxTokens: 2400,
    },
  ],
  ...overrides,
})

describe('src/lib/server/agent-model-routing.ts', () => {
  it('uses agent specific model route when configured and runnable', () => {
    const snapshot = buildSnapshot()
    const runtime = resolveAgentModelRuntime(snapshot, 'cfo_buffett')
    expect(runtime).toBeTruthy()
    expect(runtime?.source).toBe('agent')
    expect(runtime?.provider.providerId).toBe('moonshot')
    expect(runtime?.model).toBe('kimi-2.5')
    expect(runtime?.temperature).toBe(0.15)
    expect(runtime?.maxTokens).toBe(2400)
  })

  it('falls back to global runnable provider when mapped provider is not available', () => {
    const snapshot = buildSnapshot({
      providers: [
        {
          providerId: 'deepseek',
          enabled: true,
          apiKey: 'sk-deepseek-test',
          keySource: 'cookie',
          keyEnvVar: 'SK_LLM_DEEPSEEK_API_KEY',
          keyConfigured: true,
          keyPreview: 'sk-***',
          baseUrl: 'https://api.deepseek.com/v1',
          defaultModel: 'deepseek-chat',
          organization: '',
          health: 'healthy',
          lastTestAt: now,
          updatedAt: now,
        },
        {
          providerId: 'moonshot',
          enabled: false,
          apiKey: '',
          keySource: 'cookie',
          keyEnvVar: 'SK_LLM_MOONSHOT_API_KEY',
          keyConfigured: false,
          keyPreview: '',
          baseUrl: 'https://api.moonshot.cn/v1',
          defaultModel: 'kimi-2.5',
          organization: '',
          health: 'error',
          lastTestAt: now,
          updatedAt: now,
        },
      ],
    })

    const runtime = resolveAgentModelRuntime(snapshot, 'cfo_buffett')
    expect(runtime).toBeTruthy()
    expect(runtime?.source).toBe('fallback')
    expect(runtime?.provider.providerId).toBe('deepseek')
    expect(runtime?.model).toBe('deepseek-chat')
  })

  it('returns null when no provider is runnable', () => {
    const snapshot = buildSnapshot({
      providers: [],
    })
    const runtime = resolveAgentModelRuntime(snapshot, 'cfo_buffett')
    expect(runtime).toBeNull()
  })
})
