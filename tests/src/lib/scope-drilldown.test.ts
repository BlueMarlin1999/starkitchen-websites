import { describe, expect, it } from 'vitest'

describe('src/lib/scope-drilldown.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/scope-drilldown')
    expect(mod).toBeTruthy()
  })
})
