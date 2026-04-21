import { describe, expect, it } from 'vitest'

describe('src/lib/server/recipe-skill/schema-validator.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/recipe-skill/schema-validator')
    expect(mod).toBeTruthy()
  })
})
