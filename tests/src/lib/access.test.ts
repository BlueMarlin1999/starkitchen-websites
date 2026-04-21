import { describe, expect, it } from 'vitest'

describe('src/lib/access.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/access')
    expect(mod).toBeTruthy()
  })
})
