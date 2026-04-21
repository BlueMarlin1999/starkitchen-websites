import { describe, expect, it } from 'vitest'

describe('src/lib/server/auth-session.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../../src/lib/server/auth-session')
    expect(mod).toBeTruthy()
  })
})
