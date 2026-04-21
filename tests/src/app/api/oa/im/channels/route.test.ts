import { describe, expect, it } from 'vitest'

describe('src/app/api/oa/im/channels/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../../../src/app/api/oa/im/channels/route')
    expect(mod).toBeTruthy()
  })
})
