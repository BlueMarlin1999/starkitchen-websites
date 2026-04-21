import { describe, expect, it } from 'vitest'

describe('src/lib/finance-live-types.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/finance-live-types')
    expect(mod).toBeTruthy()
  })
})
