import { describe, expect, it } from 'vitest'

describe('src/lib/global-search.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/global-search')
    expect(mod).toBeTruthy()
  })
})
