import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

describe('src/lib/server/oa/permissions.ts', () => {
  it('resolves role by header when embedded claims are unavailable', async () => {
    const { resolveOaRequestRole } = await import('../../../../../../src/lib/server/oa/permissions')
    const request = new NextRequest('https://example.com/api/oa/contacts', {
      headers: {
        'x-user-role': 'director',
      },
    })
    expect(resolveOaRequestRole(request)).toBe('director')
  })

  it('supports directory manage role checks and audit visibility checks', async () => {
    const { canManageOaDirectory, canReadOaAudit } = await import(
      '../../../../../../src/lib/server/oa/permissions'
    )
    expect(canManageOaDirectory('ceo')).toBe(true)
    expect(canManageOaDirectory('supervisor')).toBe(false)
    expect(canReadOaAudit('director', 'u1001')).toBe(true)
    expect(canReadOaAudit('manager', 'u1001')).toBe(false)
    expect(canReadOaAudit('manager', 'admin-marlins')).toBe(true)
  })
})
