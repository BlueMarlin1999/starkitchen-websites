import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getStateMock = vi.fn(() => ({ token: 'session-token-123' }))
const EXPECTED_BASE_URL = '/api/agents/v1'

vi.mock('@/store/auth', () => ({
  useAuthStore: {
    getState: () => getStateMock(),
  },
}))

describe('src/lib/agents-api.ts', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
      writable: true,
    })
    process.env.AGENTS_API_URL = 'https://agents.example.com/api/v1'
    process.env.NEXT_PUBLIC_STRICT_LIVE_MODE = '0'
    process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE = '1'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    delete process.env.AGENTS_API_URL
    delete process.env.NEXT_PUBLIC_STRICT_LIVE_MODE
    delete process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE
  })

  it('sends chat request with bearer token from auth store', async () => {
    const { sendMessage } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        session_id: 's1',
        agent_id: 'cos_zhuge_liang',
        content: 'ok',
        confidence: {
          score: 0.97,
          tier: 'high',
          label_zh: '高置信',
          requires_human_review: false,
          must_pause: false,
        },
        decision_level: 1,
        requires_human_review: false,
        request_id: 'r1',
      }),
    } as Response)

    const response = await sendMessage({ message: '本月毛利率如何？', sessionId: 'demo-session' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/chat/`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
    expect(response.agent_id).toBe('cos_zhuge_liang')
  })

  it('throws typed error when backend returns non-2xx', async () => {
    const { sendMessage, AgentsAPIError } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ detail: '权限不足', code: 'FORBIDDEN' }),
    } as Response)

    await expect(sendMessage({ message: '测试' })).rejects.toBeInstanceOf(AgentsAPIError)
  })

  it('returns unknown health when health payload is invalid', async () => {
    const { checkHealth } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foo: 'bar' }),
    } as Response)

    await expect(checkHealth()).resolves.toEqual({
      status: 'unknown',
      version: 'unknown',
    })
  })

  it('submits feedback with auth token and normalized payload', async () => {
    const { submitFeedback } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'ok' }),
    } as Response)

    await submitFeedback({
      sessionId: '3ec5006f-6228-42f0-80b1-2d4c9f86935e',
      agentId: 'cos_zhuge_liang',
      rating: 1,
      comment: '很有帮助',
      confidenceScore: 0.92,
      decisionLevel: 2,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/feedback/`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
  })

  it('rejects feedback with invalid session id', async () => {
    const { submitFeedback, AgentsAPIError } = await import('../../../src/lib/agents-api')
    await expect(
      submitFeedback({
        sessionId: 'invalid-session',
        agentId: 'cos_zhuge_liang',
        rating: 1,
      })
    ).rejects.toBeInstanceOf(AgentsAPIError)
  })

  it('requests decisions list with auth token', async () => {
    const { listDecisions } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'd1',
          title: '测试决策',
          description: 'desc',
          source_agent_id: 'cos_zhuge_liang',
          assigned_to: 'COO',
          status: 'pending',
          priority: 'normal',
          decision_level: 2,
          due_date: null,
          created_at: new Date().toISOString(),
        },
      ],
    } as Response)

    const data = await listDecisions({ status: 'pending', limit: 20 })
    expect(data).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/decisions/?status=pending&limit=20`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
  })

  it('updates decision status through local proxy endpoint', async () => {
    const { updateDecisionStatus } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    await updateDecisionStatus('decision-1', 'completed')

    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/decisions/decision-1/`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
  })

  it('sends demo message without bearer token', async () => {
    const { sendDemoMessage } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        session_id: 's1',
        agent_id: 'cos_zhuge_liang',
        content: '演示回复',
        confidence: {
          score: 0.88,
          tier: 'medium',
          label_zh: '演示置信度',
          requires_human_review: false,
          must_pause: false,
        },
        decision_level: 1,
        requires_human_review: false,
        request_id: 'demo-1',
      }),
    } as Response)

    await sendDemoMessage('演示问题', 'demo-session')

    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/demo/chat/`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('loads chat session history with auth header', async () => {
    const { listChatSessions } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            session_id: 'session-1',
            updated_at: '2026-04-08T00:00:00.000Z',
            latest_agent_id: 'cos_zhuge_liang',
            latest_preview: 'preview',
            message_count: 2,
          },
        ],
      }),
    } as Response)

    const sessions = await listChatSessions(10)
    expect(sessions).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/history/sessions/?limit=10`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
  })

  it('loads file upload history with auth header', async () => {
    const { listFileUploadHistory } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'f1',
            session_id: 'session-1',
            actor_id: 'u1',
            actor_role: 'ceo',
            file_name: 'test.png',
            mime_type: 'image/png',
            file_size: 1204,
            status: 'success',
            reason: null,
            created_at: '2026-04-08T00:00:00.000Z',
          },
        ],
      }),
    } as Response)

    const files = await listFileUploadHistory({ limit: 20, sessionId: 'session-1' })
    expect(files).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/history/files/?session_id=session-1&limit=20`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
  })

  it('parses SSE stream events and triggers callbacks', async () => {
    const { sendMessageStream } = await import('../../../src/lib/agents-api')
    const fetchMock = vi.mocked(fetch)
    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: metadata\ndata: {"agent_id":"coo_ray_kroc","session_id":"s-stream","decision_level":2,"requires_human_review":false}\n\n'
          )
        )
        controller.enqueue(encoder.encode('event: token\ndata: {"content":"你好"}\n\n'))
        controller.enqueue(
          encoder.encode(
            'event: confidence\ndata: {"score":0.93,"tier":"high","label_zh":"高置信度","requires_human_review":false,"must_pause":false}\n\n'
          )
        )
        controller.enqueue(encoder.encode('event: done\ndata: {"ok":true}\n\n'))
        controller.close()
      },
    })

    fetchMock.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    )

    const events: string[] = []
    let streamedText = ''

    await sendMessageStream(
      { message: '流式测试', sessionId: 'stream-session' },
      {
        onMetadata: (data) => {
          events.push(`metadata:${data.agent_id}`)
        },
        onToken: (content) => {
          streamedText += content
          events.push('token')
        },
        onConfidence: () => {
          events.push('confidence')
        },
        onDone: () => {
          events.push('done')
        },
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `${EXPECTED_BASE_URL}/chat/stream/`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-123',
        }),
      })
    )
    expect(streamedText).toBe('你好')
    expect(events).toContain('metadata:coo_ray_kroc')
    expect(events).toContain('token')
    expect(events).toContain('confidence')
    expect(events).toContain('done')
  })

  it('falls back to persisted auth-storage token when store token is empty', async () => {
    getStateMock.mockReturnValueOnce({ token: '' })
    const getItemMock = vi.fn((key: string) => {
      if (key === 'auth-storage') {
        return JSON.stringify({ state: { token: 'persisted-auth-token' } })
      }
      return null
    })

    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: getItemMock,
        },
      },
      configurable: true,
      writable: true,
    })

    const { getAuthBearerToken } = await import('../../../src/lib/agents-api')
    expect(getAuthBearerToken()).toBe('persisted-auth-token')
  })

  it('falls back to legacy sk_access_token when auth-storage has no token', async () => {
    getStateMock.mockReturnValueOnce({ token: '' })
    const getItemMock = vi.fn((key: string) => {
      if (key === 'auth-storage') {
        return JSON.stringify({ state: {} })
      }
      if (key === 'sk_access_token') {
        return 'legacy-access-token'
      }
      return null
    })

    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: getItemMock,
        },
      },
      configurable: true,
      writable: true,
    })

    const { getAuthBearerToken } = await import('../../../src/lib/agents-api')
    expect(getAuthBearerToken()).toBe('legacy-access-token')
  })
})
