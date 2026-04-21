import { LlmProviderId } from '@/lib/llm-catalog'

export interface ProviderChatRequest {
  providerId: LlmProviderId
  baseUrl: string
  apiKey: string
  organization?: string
  model: string
  prompt: string
  temperature: number
  maxTokens: number
}

export interface ProviderChatResult {
  content: string
  usage?: Record<string, unknown>
}

const DEFAULT_TIMEOUT_MS = 45_000

const clampTemperature = (value: unknown, fallback = 0.3) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(1, Math.max(0, value))
}

const clampMaxTokens = (value: unknown, fallback = 1200) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(8192, Math.max(100, Math.round(value)))
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const joinApiUrl = (baseUrl: string, path: string) =>
  `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`

const requestJson = async (
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
) => {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      signal: abortController.signal,
    })
    const raw = await response.text()
    let data: Record<string, unknown> = {}
    if (raw) {
      try {
        data = JSON.parse(raw) as Record<string, unknown>
      } catch {
        data = { raw }
      }
    }
    return { response, data }
  } finally {
    clearTimeout(timeout)
  }
}

const normalizeTextOutput = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return ''
        const record = item as { type?: unknown; text?: unknown }
        if (record.type === 'text' && typeof record.text === 'string') return record.text
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

const getApiErrorMessage = (data: Record<string, unknown>, fallback: string) => {
  const maybeMessage = (data as { error?: { message?: unknown } })?.error?.message
  return typeof maybeMessage === 'string' ? maybeMessage : fallback
}

const callOpenAiCompatible = async (request: ProviderChatRequest): Promise<ProviderChatResult> => {
  const { response, data } = await requestJson(joinApiUrl(request.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(request.apiKey ? { Authorization: `Bearer ${request.apiKey}` } : {}),
      ...(request.organization ? { 'OpenAI-Organization': request.organization } : {}),
    },
    body: JSON.stringify({
      model: request.model,
      messages: [{ role: 'user', content: request.prompt }],
      temperature: clampTemperature(request.temperature),
      max_tokens: clampMaxTokens(request.maxTokens),
      stream: false,
    }),
  })

  if (!response.ok) {
    const message = getApiErrorMessage(data, `模型接口异常 (${response.status})`)
    throw new Error(message)
  }

  const choices = Array.isArray((data as { choices?: unknown }).choices)
    ? ((data as { choices: unknown[] }).choices as unknown[])
    : []
  const firstChoice = choices[0] as { message?: { content?: unknown } } | undefined
  const content = normalizeTextOutput(firstChoice?.message?.content)
  if (!content.trim()) {
    throw new Error('模型返回为空')
  }

  return {
    content,
    usage:
      typeof (data as { usage?: unknown }).usage === 'object' &&
      (data as { usage?: unknown }).usage
        ? ((data as { usage: Record<string, unknown> }).usage as Record<string, unknown>)
        : undefined,
  }
}

const callAnthropic = async (request: ProviderChatRequest): Promise<ProviderChatResult> => {
  const { response, data } = await requestJson(joinApiUrl(request.baseUrl, '/messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: clampMaxTokens(request.maxTokens),
      temperature: clampTemperature(request.temperature),
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const message = getApiErrorMessage(data, `Claude 接口异常 (${response.status})`)
    throw new Error(message)
  }

  const content = normalizeTextOutput((data as { content?: unknown }).content)
  if (!content.trim()) {
    throw new Error('Claude 返回为空')
  }

  return {
    content,
    usage:
      typeof (data as { usage?: unknown }).usage === 'object' &&
      (data as { usage?: unknown }).usage
        ? ((data as { usage: Record<string, unknown> }).usage as Record<string, unknown>)
        : undefined,
  }
}

export const callProviderChat = async (request: ProviderChatRequest): Promise<ProviderChatResult> => {
  if (request.providerId === 'anthropic') {
    return callAnthropic(request)
  }

  return callOpenAiCompatible(request)
}
