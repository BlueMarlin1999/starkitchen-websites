import { LlmProviderId } from '@/lib/llm-catalog'

export type AiMediaType = 'audio' | 'image' | 'video'

export interface ProviderMediaRequest {
  mediaType: AiMediaType
  providerId: LlmProviderId
  baseUrl: string
  apiKey: string
  organization?: string
  prompt: string
  model: string
  voice?: string
  size?: string
  durationSeconds?: number
}

export interface ProviderMediaResult {
  mediaType: AiMediaType
  mimeType: string
  url?: string
  dataUrl?: string
  status?: string
  providerResponseId?: string
}

const DEFAULT_TIMEOUT_MS = 90_000

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const joinApiUrl = (baseUrl: string, path: string) =>
  `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`

const parseJsonSafe = async (response: Response) => {
  const raw = await response.text()
  if (!raw) return {} as Record<string, unknown>
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { raw }
  }
}

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
    const data = await parseJsonSafe(response)
    return { response, data }
  } finally {
    clearTimeout(timeout)
  }
}

const buildAuthHeaders = (request: ProviderMediaRequest) => ({
  'Content-Type': 'application/json',
  ...(request.apiKey.trim() ? { Authorization: `Bearer ${request.apiKey.trim()}` } : {}),
  ...(request.organization?.trim() ? { 'OpenAI-Organization': request.organization.trim() } : {}),
})

const asErrorMessage = (data: Record<string, unknown>, fallback: string) => {
  const nested = (data as { error?: { message?: unknown } })?.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested
  const plain = (data as { message?: unknown })?.message
  if (typeof plain === 'string' && plain.trim()) return plain
  return fallback
}

const toAudioMimeType = (format: string) => {
  if (format === 'wav') return 'audio/wav'
  if (format === 'aac') return 'audio/aac'
  if (format === 'flac') return 'audio/flac'
  if (format === 'opus') return 'audio/ogg'
  return 'audio/mpeg'
}

const callAudioGeneration = async (request: ProviderMediaRequest): Promise<ProviderMediaResult> => {
  const format = 'mp3'
  const response = await fetch(joinApiUrl(request.baseUrl, '/audio/speech'), {
    method: 'POST',
    headers: buildAuthHeaders(request),
    body: JSON.stringify({
      model: request.model || 'gpt-4o-mini-tts',
      input: request.prompt,
      voice: request.voice || 'alloy',
      format,
    }),
  })

  if (!response.ok) {
    const payload = await parseJsonSafe(response)
    throw new Error(asErrorMessage(payload, `音频生成失败 (${response.status})`))
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const mimeType = toAudioMimeType(format)
  return {
    mediaType: 'audio',
    mimeType,
    dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
  }
}

const callImageGeneration = async (request: ProviderMediaRequest): Promise<ProviderMediaResult> => {
  const size = request.size || '1024x1024'
  const { response, data } = await requestJson(joinApiUrl(request.baseUrl, '/images/generations'), {
    method: 'POST',
    headers: buildAuthHeaders(request),
    body: JSON.stringify({
      model: request.model || 'gpt-image-1',
      prompt: request.prompt,
      size,
      n: 1,
    }),
  })

  if (!response.ok) {
    throw new Error(asErrorMessage(data, `图片生成失败 (${response.status})`))
  }

  const firstItem = Array.isArray((data as { data?: unknown[] }).data)
    ? ((data as { data?: Record<string, unknown>[] }).data || [])[0]
    : null
  const imageUrl = typeof firstItem?.url === 'string' ? firstItem.url : ''
  const b64 = typeof firstItem?.b64_json === 'string' ? firstItem.b64_json : ''

  if (imageUrl) {
    return {
      mediaType: 'image',
      mimeType: 'image/png',
      url: imageUrl,
      providerResponseId: typeof (data as { created?: unknown }).created === 'string' ? (data as { created: string }).created : undefined,
    }
  }

  if (b64) {
    return {
      mediaType: 'image',
      mimeType: 'image/png',
      dataUrl: `data:image/png;base64,${b64}`,
      providerResponseId: typeof (data as { created?: unknown }).created === 'string' ? (data as { created: string }).created : undefined,
    }
  }

  throw new Error('图片生成返回为空，请检查模型是否支持图像生成。')
}

const callVideoGeneration = async (request: ProviderMediaRequest): Promise<ProviderMediaResult> => {
  if (request.providerId === 'openai') {
    const openAiVideoModel = /sora/i.test(request.model) ? request.model : 'sora-2'
    const requestedSeconds = request.durationSeconds || 8
    const seconds = requestedSeconds <= 4 ? '4' : requestedSeconds >= 12 ? '12' : '8'
    const { response, data } = await requestJson(
      joinApiUrl(request.baseUrl, '/videos'),
      {
        method: 'POST',
        headers: buildAuthHeaders(request),
        body: JSON.stringify({
          model: openAiVideoModel,
          prompt: request.prompt,
          seconds,
        }),
      },
      120_000
    )

    if (!response.ok) {
      throw new Error(
        asErrorMessage(data, `视频生成失败 (${response.status})，当前模型可能不支持视频生成。`)
      )
    }

    const status =
      typeof (data as { status?: unknown }).status === 'string'
        ? (data as { status: string }).status
        : 'queued'
    const requestId =
      typeof (data as { id?: unknown }).id === 'string'
        ? (data as { id: string }).id
        : undefined

    return {
      mediaType: 'video',
      mimeType: 'video/mp4',
      status,
      providerResponseId: requestId,
    }
  }

  const { response, data } = await requestJson(joinApiUrl(request.baseUrl, '/videos/generations'), {
    method: 'POST',
    headers: buildAuthHeaders(request),
    body: JSON.stringify({
      model: request.model,
      prompt: request.prompt,
      duration: request.durationSeconds || 6,
    }),
  })

  if (!response.ok) {
    throw new Error(
      asErrorMessage(data, `视频生成失败 (${response.status})，当前模型可能不支持视频生成 API。`)
    )
  }

  const firstItem = Array.isArray((data as { data?: unknown[] }).data)
    ? ((data as { data?: Record<string, unknown>[] }).data || [])[0]
    : null
  const videoUrl = typeof firstItem?.url === 'string' ? firstItem.url : ''
  const b64 = typeof firstItem?.b64_json === 'string' ? firstItem.b64_json : ''
  const status = typeof (data as { status?: unknown }).status === 'string' ? (data as { status: string }).status : 'completed'
  const requestId = typeof (data as { id?: unknown }).id === 'string' ? (data as { id: string }).id : undefined

  if (videoUrl) {
    return {
      mediaType: 'video',
      mimeType: 'video/mp4',
      url: videoUrl,
      status,
      providerResponseId: requestId,
    }
  }

  if (b64) {
    return {
      mediaType: 'video',
      mimeType: 'video/mp4',
      dataUrl: `data:video/mp4;base64,${b64}`,
      status,
      providerResponseId: requestId,
    }
  }

  if (requestId) {
    return {
      mediaType: 'video',
      mimeType: 'video/mp4',
      status,
      providerResponseId: requestId,
    }
  }

  throw new Error('视频任务已提交，但未返回可用媒体地址。请稍后在供应商控制台查看。')
}

export const callProviderMedia = async (
  request: ProviderMediaRequest
): Promise<ProviderMediaResult> => {
  if (request.mediaType === 'audio') {
    return callAudioGeneration(request)
  }
  if (request.mediaType === 'image') {
    return callImageGeneration(request)
  }
  return callVideoGeneration(request)
}
