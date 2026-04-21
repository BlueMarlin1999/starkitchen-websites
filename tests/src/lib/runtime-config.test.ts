import { describe, expect, it } from 'vitest'

describe('src/lib/runtime-config.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/runtime-config')
    expect(mod).toBeTruthy()
  })
})
