import { describe, expect, it } from 'vitest'

describe('src/lib/server/im-bridge-store.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../src/lib/server/im-bridge-store')
    expect(mod).toBeTruthy()
  })
})
