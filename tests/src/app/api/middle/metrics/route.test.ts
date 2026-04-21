import { describe, expect, it } from 'vitest'

describe('src/app/api/middle/metrics/route.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../../../../src/app/api/middle/metrics/route')
    expect(mod).toBeTruthy()
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.DELETE).toBe('function')
  })
})
