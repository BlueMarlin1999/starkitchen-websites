import { describe, expect, it } from 'vitest'

describe('src/lib/finance-granularity.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/finance-granularity')
    expect(mod).toBeTruthy()
  })
})
