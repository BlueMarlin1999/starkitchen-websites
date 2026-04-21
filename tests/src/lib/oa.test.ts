import { describe, expect, it } from 'vitest'

describe('src/lib/oa.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/oa')
    expect(mod).toBeTruthy()
  })
})
