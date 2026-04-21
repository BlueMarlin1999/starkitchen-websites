import { describe, expect, it } from 'vitest'

describe('src/lib/recipe-skill.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/recipe-skill')
    expect(mod).toBeTruthy()
  })
})
