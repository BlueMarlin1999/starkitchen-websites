import { describe, expect, it } from 'vitest'

describe('src/lib/server/recipe-skill/types.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/recipe-skill/types')
    expect(mod).toBeTruthy()
  })
})
