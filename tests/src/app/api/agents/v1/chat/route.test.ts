import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAuthenticatedMock = vi.fn(() => null)
const parseJsonWithSchemaMock = vi.fn()
const hasPermissionMock = vi.fn()
const normalizeRoleMock = vi.fn((role?: string) => role || 'supervisor')
const canRoleAccessMinRoleMock = vi.fn()
const verifyEmbeddedSessionTokenMock = vi.fn()
const readControlPlaneSnapshotMock = vi.fn()
const getProviderCatalogItemMock = vi.fn()
const resolveProviderRuntimeKeyMock = vi.fn()
const callProviderChatMock = vi.fn()
const appendChatTurnMock = vi.fn()

vi.mock('@/lib/server/llm-auth', () => ({
  requireAuthenticated: (...args: unknown[]) => requireAuthenticatedMock(...args),
}))

vi.mock('@/lib/server/input-validation', () => ({
  parseJsonWithSchema: (...args: unknown[]) => parseJsonWithSchemaMock(...args),
}))

vi.mock('@/lib/access', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
  normalizeRole: (...args: unknown[]) => normalizeRoleMock(...args),
}))

vi.mock('@/lib/agent-legion-permissions', () => ({
  canRoleAccessMinRole: (...args: unknown[]) => canRoleAccessMinRoleMock(...args),
}))

vi.mock('@/lib/server/auth-session', () => ({
  verifyEmbeddedSessionToken: (...args: unknown[]) => verifyEmbeddedSessionTokenMock(...args),
}))

vi.mock('@/lib/server/llm-control-plane-storage', () => ({
  readControlPlaneSnapshot: (...args: unknown[]) => readControlPlaneSnapshotMock(...args),
}))

vi.mock('@/lib/llm-catalog', () => ({
  getProviderCatalogItem: (...args: unknown[]) => getProviderCatalogItemMock(...args),
}))

vi.mock('@/lib/server/llm-control-plane-types', () => ({
  resolveProviderRuntimeKey: (...args: unknown[]) => resolveProviderRuntimeKeyMock(...args),
}))

vi.mock('@/lib/server/llm-providers', () => ({
  callProviderChat: (...args: unknown[]) => callProviderChatMock(...args),
}))

vi.mock('@/lib/server/agents-history-store', () => ({
  appendChatTurn: (...args: unknown[]) => appendChatTurnMock(...args),
}))

const basePayload = {
  message: '本月经营如何？',
  session_id: null,
  high_stakes: false,
  target_agent_id: 'coo_howard_schultz',
}

const makeRequest = () =>
  new Request('https://example.com/api/agents/v1/chat', {
    method: 'POST',
    headers: {
      authorization: 'Bearer embedded-token',
      'content-type': 'application/json',
      'x-user-role': 'manager',
    },
    body: JSON.stringify(basePayload),
  })

describe('src/app/api/agents/v1/chat/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    parseJsonWithSchemaMock.mockResolvedValue({
      ok: true,
      data: { ...basePayload },
    })
    hasPermissionMock.mockReturnValue(true)
    canRoleAccessMinRoleMock.mockReturnValue(true)
    verifyEmbeddedSessionTokenMock.mockReturnValue({
      employeeId: 'Marlins',
      role: 'manager',
    })
    readControlPlaneSnapshotMock.mockReturnValue({
      providers: [
        {
          providerId: 'deepseek',
          enabled: true,
          defaultModel: 'deepseek-chat',
          baseUrl: 'https://api.deepseek.com',
          organization: '',
        },
      ],
    })
    getProviderCatalogItemMock.mockReturnValue({
      supportsKeyless: false,
      defaultBaseUrl: 'https://api.deepseek.com',
    })
    resolveProviderRuntimeKeyMock.mockReturnValue({
      apiKey: 'provider-key',
    })
    callProviderChatMock.mockResolvedValue({
      content: '建议聚焦午餐毛利和排班结构。',
    })
    appendChatTurnMock.mockResolvedValue(undefined)
  })

  it('returns 403 when user lacks use_ai_chat permission', async () => {
    hasPermissionMock.mockReturnValue(false)
    const mod = await import('../../../../../../../../src/app/api/agents/v1/chat/route')

    const response = await mod.POST(makeRequest() as never)
    expect(response.status).toBe(403)

    const body = await response.json()
    expect(body.code).toBe('AI_CHAT_FORBIDDEN')
    expect(callProviderChatMock).not.toHaveBeenCalled()
  })

  it('routes to COS permission message when direct talk is not allowed', async () => {
    canRoleAccessMinRoleMock.mockReturnValue(false)
    const mod = await import('../../../../../../../../src/app/api/agents/v1/chat/route')

    const response = await mod.POST(makeRequest() as never)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.agent_id).toBe('cos_zhuge_liang')
    expect(String(body.content)).toContain('暂不支持直连')
    expect(callProviderChatMock).not.toHaveBeenCalled()
    expect(appendChatTurnMock).toHaveBeenCalledTimes(1)
  })

  it('returns 503 when no active provider can be resolved', async () => {
    readControlPlaneSnapshotMock.mockReturnValue({
      providers: [
        {
          providerId: 'deepseek',
          enabled: false,
          defaultModel: 'deepseek-chat',
          baseUrl: 'https://api.deepseek.com',
          organization: '',
        },
      ],
    })
    const mod = await import('../../../../../../../../src/app/api/agents/v1/chat/route')

    const response = await mod.POST(makeRequest() as never)
    expect(response.status).toBe(503)

    const body = await response.json()
    expect(body.code).toBe('LLM_PROVIDER_UNAVAILABLE')
  })

  it('returns provider chat result for allowed direct talk', async () => {
    const mod = await import('../../../../../../../../src/app/api/agents/v1/chat/route')
    const response = await mod.POST(makeRequest() as never)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.agent_id).toBe('coo_howard_schultz')
    expect(String(body.content)).toContain('排班结构')
    expect(callProviderChatMock).toHaveBeenCalledTimes(1)
    expect(appendChatTurnMock).toHaveBeenCalledTimes(1)
  })
})
