import { describe, expect, it } from 'vitest'

describe('src/lib/finance-live-client.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/finance-live-client')
    expect(mod).toBeTruthy()
  })
})
