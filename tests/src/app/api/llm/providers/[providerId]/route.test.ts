import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireLlmManagerMock = vi.fn(() => null)
const parseJsonWithSchemaMock = vi.fn()
const readControlPlaneSnapshotMock = vi.fn()
const sanitizeSnapshotForClientMock = vi.fn((value) => value)
const jsonWithControlPlaneSnapshotMock = vi.fn(
  (payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
)
const appendLlmAuditLogMock = vi.fn()

vi.mock('@/lib/server/llm-auth', () => ({
  requireLlmManager: (...args: unknown[]) => requireLlmManagerMock(...args),
}))

vi.mock('@/lib/server/input-validation', () => ({
  parseJsonWithSchema: (...args: unknown[]) => parseJsonWithSchemaMock(...args),
}))

vi.mock('@/lib/server/llm-control-plane-storage', () => ({
  readControlPlaneSnapshot: (...args: unknown[]) => readControlPlaneSnapshotMock(...args),
  jsonWithControlPlaneSnapshot: (...args: unknown[]) => jsonWithControlPlaneSnapshotMock(...args),
}))

vi.mock('@/lib/server/llm-control-plane-types', () => ({
  sanitizeSnapshotForClient: (...args: unknown[]) => sanitizeSnapshotForClientMock(...args),
}))

vi.mock('@/lib/server/llm-audit', () => ({
  appendLlmAuditLog: (...args: unknown[]) => appendLlmAuditLogMock(...args),
}))

vi.mock('@/lib/llm-catalog', () => ({
  LLM_PROVIDER_CATALOG: [
    {
      id: 'openai',
      label: 'OpenAI',
      defaultBaseUrl: 'https://api.openai.com/v1',
    },
  ],
  getProviderApiKeyEnvVar: () => 'OPENAI_API_KEY',
}))

const providerConfig = {
  providerId: 'openai',
  enabled: true,
  apiKey: 'old-key',
  keySource: 'cookie',
  keyEnvVar: 'OPENAI_API_KEY',
  keyConfigured: true,
  keyPreview: '****',
  baseUrl: 'https://proxy.example.com/v1',
  defaultModel: 'gpt-4o-mini',
  organization: 'org-existing',
  health: 'healthy',
  lastTestAt: null,
  updatedAt: '2026-04-01T00:00:00.000Z',
}

const makeRequest = () =>
  new Request('https://example.com/api/llm/providers/openai', {
    method: 'PUT',
    headers: {
      authorization: 'Bearer embedded-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  })

describe('src/app/api/llm/providers/[providerId]/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    parseJsonWithSchemaMock.mockResolvedValue({
      ok: true,
      data: { apiKey: 'new-key' },
    })
    readControlPlaneSnapshotMock.mockReturnValue({
      providers: [{ ...providerConfig }],
      routes: [],
    })
  })

  it('preserves enabled/baseUrl/organization when payload omits those fields', async () => {
    const mod = await import('../../../../../../../src/app/api/llm/providers/[providerId]/route')
    const response = await mod.PUT(makeRequest() as never, {
      params: { providerId: 'openai' },
    })

    expect(response.status).toBe(200)
    const upstreamPayload = jsonWithControlPlaneSnapshotMock.mock.calls[0]?.[1] as {
      providers: Array<typeof providerConfig>
    }
    const updated = upstreamPayload.providers[0]

    expect(updated.enabled).toBe(true)
    expect(updated.baseUrl).toBe('https://proxy.example.com/v1')
    expect(updated.organization).toBe('org-existing')
    expect(updated.apiKey).toBe('new-key')
  })

  it('applies explicit enabled=false update', async () => {
    parseJsonWithSchemaMock.mockResolvedValueOnce({
      ok: true,
      data: { enabled: false },
    })

    const mod = await import('../../../../../../../src/app/api/llm/providers/[providerId]/route')
    const response = await mod.PUT(makeRequest() as never, {
      params: { providerId: 'openai' },
    })

    expect(response.status).toBe(200)
    const upstreamPayload = jsonWithControlPlaneSnapshotMock.mock.calls[0]?.[1] as {
      providers: Array<typeof providerConfig>
    }
    expect(upstreamPayload.providers[0]?.enabled).toBe(false)
  })

  it('returns 404 for unknown provider id', async () => {
    const mod = await import('../../../../../../../src/app/api/llm/providers/[providerId]/route')
    const response = await mod.PUT(makeRequest() as never, {
      params: { providerId: 'unknown-provider' },
    })

    expect(response.status).toBe(404)
    expect(jsonWithControlPlaneSnapshotMock).not.toHaveBeenCalled()
  })
})
