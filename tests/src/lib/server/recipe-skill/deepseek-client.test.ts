import { describe, expect, it } from 'vitest'

describe('src/lib/server/recipe-skill/deepseek-client.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/recipe-skill/deepseek-client')
    expect(mod).toBeTruthy()
  })
})
