import { describe, expect, it } from 'vitest'

describe('src/lib/server/llm-providers.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../src/lib/server/llm-providers')
    expect(mod).toBeTruthy()
  })
})
