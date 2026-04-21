import { describe, expect, it } from 'vitest'

describe('src/app/api/oa/contacts/sync/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../../src/app/api/oa/contacts/sync/route')
    expect(mod).toBeTruthy()
    expect(typeof mod.POST).toBe('function')
  })
})
