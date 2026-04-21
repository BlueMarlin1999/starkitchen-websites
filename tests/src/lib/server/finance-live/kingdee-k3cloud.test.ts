import { afterEach, describe, expect, it, vi } from 'vitest'

const ENV_KEYS = [
  'KINGDEE_K3CLOUD_BASE_URL',
  'KINGDEE_K3CLOUD_ACCT_ID',
  'KINGDEE_K3CLOUD_USERNAME',
  'KINGDEE_K3CLOUD_APP_ID',
  'KINGDEE_K3CLOUD_APP_SECRET',
  'KINGDEE_K3CLOUD_FORM_ID',
  'KINGDEE_K3CLOUD_FIELD_KEYS',
] as const

const snapshotEnv = () =>
  Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<string, string | undefined>

const restoreEnv = (snapshot: Record<string, string | undefined>) => {
  for (const key of ENV_KEYS) {
    const value = snapshot[key]
    if (typeof value === 'string') process.env[key] = value
    else delete process.env[key]
  }
}

describe('src/lib/server/finance-live/kingdee-k3cloud.ts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key]
    }
  })

  it('returns not configured when required env is missing', async () => {
    const mod = await import('../../../../../../src/lib/server/finance-live/kingdee-k3cloud')
    expect(mod.isKingdeePullConfigured()).toBe(false)
    const summary = mod.getKingdeeConfigSummary()
    expect(summary.configured).toBe(false)
    expect(summary.fieldCount).toBe(0)
  })

  it('returns configured summary when required env is present', async () => {
    const envSnapshot = snapshotEnv()
    process.env.KINGDEE_K3CLOUD_BASE_URL = 'https://k3cloud.example.com'
    process.env.KINGDEE_K3CLOUD_ACCT_ID = '666'
    process.env.KINGDEE_K3CLOUD_USERNAME = 'api_user'
    process.env.KINGDEE_K3CLOUD_APP_ID = 'app-id'
    process.env.KINGDEE_K3CLOUD_APP_SECRET = 'app-secret'
    process.env.KINGDEE_K3CLOUD_FORM_ID = 'GL_Balance'
    process.env.KINGDEE_K3CLOUD_FIELD_KEYS = 'FRevenue,FFoodCost'

    const mod = await import('../../../../../../src/lib/server/finance-live/kingdee-k3cloud')
    expect(mod.isKingdeePullConfigured()).toBe(true)
    const summary = mod.getKingdeeConfigSummary()
    expect(summary.configured).toBe(true)
    expect(summary.formId).toBe('GL_Balance')
    expect(summary.baseUrlHint).toContain('k3cloud.example.com')
    expect(summary.fieldCount).toBeGreaterThanOrEqual(4)
    restoreEnv(envSnapshot)
  })

  it('fetches and maps kingdee rows into finance scopes', async () => {
    const envSnapshot = snapshotEnv()
    process.env.KINGDEE_K3CLOUD_BASE_URL = 'https://k3cloud.example.com'
    process.env.KINGDEE_K3CLOUD_ACCT_ID = '666'
    process.env.KINGDEE_K3CLOUD_USERNAME = 'api_user'
    process.env.KINGDEE_K3CLOUD_APP_ID = 'app-id'
    process.env.KINGDEE_K3CLOUD_APP_SECRET = 'app-secret'
    process.env.KINGDEE_K3CLOUD_FORM_ID = 'GL_Balance'
    process.env.KINGDEE_K3CLOUD_FIELD_KEYS = 'FScopePath,FOrgNumber,FRevenue,FFoodCost'

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            LoginResultType: '1',
            Context: { SessionId: 'session-1' },
            KDSVCSessionId: 'kd-1',
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            Result: [['global/china/east-china/shanghai/project-a', 'ORG001', '120.5', '33.4']],
          }),
          { status: 200 }
        )
      )

    const mod = await import('../../../../../../src/lib/server/finance-live/kingdee-k3cloud')
    const result = await mod.fetchKingdeeFinanceIngestPayload()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.probe.rowCount).toBe(1)
    expect(result.probe.scopeCount).toBe(1)
    expect(result.payload.scopes[0]?.scopePath).toEqual([
      'global',
      'china',
      'east-china',
      'shanghai',
      'project-a',
    ])
    expect(result.payload.scopes[0]?.metrics?.revenue?.value).toBe(120.5)
    expect(result.payload.scopes[0]?.metrics?.['food-cost']?.value).toBe(33.4)
    restoreEnv(envSnapshot)
  })
})
