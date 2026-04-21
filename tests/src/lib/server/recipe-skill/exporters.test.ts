import { describe, expect, it } from 'vitest'

describe('src/lib/server/recipe-skill/exporters.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/recipe-skill/exporters')
    expect(mod).toBeTruthy()
  })
})
