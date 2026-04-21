import { describe, expect, it } from 'vitest'

describe('src/lib/server/oa/types.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/oa/types')
    expect(mod).toBeTruthy()
  })
})
