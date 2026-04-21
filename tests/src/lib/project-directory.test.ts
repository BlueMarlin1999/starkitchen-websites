import { describe, expect, it } from 'vitest'

describe('src/lib/project-directory.ts', () => {
  it('loads module exports', async () => {
    const mod = await import('../../../src/lib/project-directory')
    expect(mod).toBeTruthy()
  })
})
