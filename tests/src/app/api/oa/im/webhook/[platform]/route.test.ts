import { describe, expect, it } from 'vitest'

describe('src/app/api/oa/im/webhook/[platform]/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../../../../src/app/api/oa/im/webhook/[platform]/route')
    expect(mod).toBeTruthy()
  })
})
