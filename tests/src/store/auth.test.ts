import { describe, expect, it } from 'vitest'

describe('src/store/auth.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/store/auth')
    expect(mod).toBeTruthy()
  })
})
