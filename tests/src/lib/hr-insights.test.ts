import { describe, expect, it } from 'vitest'

describe('src/lib/hr-insights.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/hr-insights')
    expect(mod).toBeTruthy()
  })
})
