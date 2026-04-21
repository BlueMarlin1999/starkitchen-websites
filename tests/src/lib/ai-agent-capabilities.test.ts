import { describe, expect, it } from 'vitest'

describe('src/lib/ai-agent-capabilities.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/ai-agent-capabilities')
    expect(mod).toBeTruthy()
  })
})
