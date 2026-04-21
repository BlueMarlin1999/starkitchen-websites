import { describe, expect, it } from 'vitest'

describe('src/lib/brand.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/brand')
    expect(mod).toBeTruthy()
  })
})
