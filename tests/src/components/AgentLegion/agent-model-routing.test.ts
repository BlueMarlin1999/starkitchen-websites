import { describe, expect, it } from 'vitest'
import {
  buildFallbackAgentRoute,
  resolveAgentRouteDraft,
  upsertAgentRouteDraft,
} from '../../../../src/components/AgentLegion/agent-model-routing'
import { AGENT_PROFILES } from '../../../../src/components/AgentLegion/types'

describe('src/components/AgentLegion/agent-model-routing.ts', () => {
  it('resolves configured route for selected agent', () => {
    const draft = resolveAgentRouteDraft('cfo_buffett', [
      {
        agentId: 'cfo_buffett',
        providerId: 'moonshot',
        model: 'kimi-2.5',
        temperature: 0.2,
        maxTokens: 2200,
      },
    ])

    expect(draft.agentId).toBe('cfo_buffett')
    expect(draft.providerId).toBe('moonshot')
    expect(draft.model).toBe('kimi-2.5')
    expect(draft.temperature).toBe(0.2)
    expect(draft.maxTokens).toBe(2200)
  })

  it('returns fallback route when agent route is missing', () => {
    const fallback = resolveAgentRouteDraft('clo_napoleon', [])

    expect(fallback.agentId).toBe('clo_napoleon')
    expect(fallback.providerId).toBe('deepseek')
    expect(fallback.model).toBe('deepseek-chat')
  })

  it('normalizes alias agent id when building fallback route', () => {
    const fallback = buildFallbackAgentRoute('coo_ray_kroc')
    expect(fallback.agentId).toBe('coo_howard_schultz')
  })

  it('upserts a route and keeps a stable 12-agent list', () => {
    const next = upsertAgentRouteDraft(
      [
        {
          agentId: 'cfo_buffett',
          providerId: 'moonshot',
          model: 'kimi-2.5',
          temperature: 0.2,
          maxTokens: 2200,
        },
      ],
      {
        agentId: 'cfo_buffett',
        providerId: 'openai',
        model: 'gpt-4.1',
        temperature: 3,
        maxTokens: 99999,
      }
    )

    expect(next).toHaveLength(AGENT_PROFILES.length)
    const cfoRoute = next.find((item) => item.agentId === 'cfo_buffett')
    expect(cfoRoute?.providerId).toBe('openai')
    expect(cfoRoute?.temperature).toBe(1)
    expect(cfoRoute?.maxTokens).toBe(8192)
  })
})
