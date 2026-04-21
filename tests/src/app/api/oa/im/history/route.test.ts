import { describe, expect, it } from 'vitest'

describe('src/app/api/oa/im/history/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../../../src/app/api/oa/im/history/route')
    expect(mod).toBeTruthy()
  })
})
