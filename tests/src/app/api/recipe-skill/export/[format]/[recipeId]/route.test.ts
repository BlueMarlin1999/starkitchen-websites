import { describe, expect, it } from 'vitest'

describe('src/app/api/recipe-skill/export/[format]/[recipeId]/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../../src/app/api/recipe-skill/export/[format]/[recipeId]/route')
    expect(mod).toBeTruthy()
  })
})
