import { afterEach, describe, expect, it } from 'vitest'

describe('src/lib/server/agents-endpoint.ts', () => {
  afterEach(() => {
    delete process.env.AGENTS_API_URL
  })

  it('returns configured agents api base url without trailing slash', async () => {
    process.env.AGENTS_API_URL = 'https://agents.example.com/api/v1/'

    const mod = await import('../../../../../src/lib/server/agents-endpoint')

    expect(mod.getAgentsApiBaseUrl()).toBe('https://agents.example.com/api/v1')
  })

  it('throws when agents api url is missing', async () => {
    delete process.env.AGENTS_API_URL

    const mod = await import('../../../../../src/lib/server/agents-endpoint')

    expect(() => mod.getAgentsApiBaseUrl()).toThrow('AGENTS_API_URL environment variable is required')
  })
})
