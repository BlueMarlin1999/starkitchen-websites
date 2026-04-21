import { describe, expect, it } from 'vitest'

describe('src/lib/llm-catalog.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/llm-catalog')
    expect(mod).toBeTruthy()
  })

  it('returns media capability support by provider', async () => {
    const mod = await import('../../../src/lib/llm-catalog')
    expect(mod.supportsProviderMediaType('openai', 'audio')).toBe(true)
    expect(mod.supportsProviderMediaType('openai', 'image')).toBe(true)
    expect(mod.supportsProviderMediaType('openai', 'video')).toBe(true)
    expect(mod.supportsProviderMediaType('deepseek', 'image')).toBe(false)
    expect(mod.supportsProviderMediaType('moonshot', 'audio')).toBe(false)
  })
})
