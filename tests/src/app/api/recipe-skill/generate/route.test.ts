import { describe, expect, it } from 'vitest'

describe('src/app/api/recipe-skill/generate/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../src/app/api/recipe-skill/generate/route')
    expect(mod).toBeTruthy()
  })
})
