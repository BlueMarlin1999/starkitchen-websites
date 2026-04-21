import { LlmProviderId } from '@/lib/llm-catalog'
import { getRecipeSkillPrompt } from '@/lib/server/recipe-skill/prompts'
import {
  RecipeGenerationResult,
  RecipePromptType,
  RecipeValidationResult,
} from '@/lib/server/recipe-skill/types'
import { validateRecipeSkill } from '@/lib/server/recipe-skill/schema-validator'

interface RecipeSkillRuntimeConfig {
  providerId: LlmProviderId
  baseUrl: string
  apiKey: string
  organization?: string
  model: string
  temperature?: number
  maxTokens?: number
  maxRetries?: number
}

interface CompletionResult {
  content: string
  totalTokens: number
}

const DEFAULT_TIMEOUT_MS = 60_000

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const joinApiUrl = (baseUrl: string, path: string) =>
  `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`

const parseTotalTokens = (usage: Record<string, unknown>) => {
  const total = usage.total_tokens
  if (typeof total === 'number' && Number.isFinite(total)) return Math.max(0, Math.round(total))
  const promptTokens = usage.prompt_tokens
  const completionTokens = usage.completion_tokens
  if (typeof promptTokens === 'number' && typeof completionTokens === 'number') {
    return Math.max(0, Math.round(promptTokens + completionTokens))
  }
  return 0
}

const requestJson = async (
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
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
    clearTimeout(timer)
  }
}

const normalizeOpenAiContent = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return ''
        const record = item as { type?: unknown; text?: unknown }
        return record.type === 'text' && typeof record.text === 'string' ? record.text : ''
      })
      .filter(Boolean)
      .join('\n')
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value)
  }
  return ''
}

const extractApiError = (data: Record<string, unknown>, fallback: string) => {
  const nested = (data.error as { message?: unknown } | undefined)?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
  return fallback
}

const callOpenAiCompatible = async (
  runtime: RecipeSkillRuntimeConfig,
  systemPrompt: string,
  userMessage: string
): Promise<CompletionResult> => {
  const { response, data } = await requestJson(joinApiUrl(runtime.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(runtime.apiKey ? { Authorization: `Bearer ${runtime.apiKey}` } : {}),
      ...(runtime.organization ? { 'OpenAI-Organization': runtime.organization } : {}),
    },
    body: JSON.stringify({
      model: runtime.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: typeof runtime.temperature === 'number' ? runtime.temperature : 0.3,
      max_tokens: typeof runtime.maxTokens === 'number' ? runtime.maxTokens : 4096,
      response_format: { type: 'json_object' },
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(extractApiError(data, `模型请求失败 (${response.status})`))
  }

  const choices = Array.isArray(data.choices) ? data.choices : []
  const firstChoice = choices[0] as { message?: { content?: unknown } } | undefined
  const content = normalizeOpenAiContent(firstChoice?.message?.content)
  if (!content.trim()) {
    throw new Error('模型返回为空')
  }

  const usage =
    data.usage && typeof data.usage === 'object'
      ? (data.usage as Record<string, unknown>)
      : {}

  return {
    content,
    totalTokens: parseTotalTokens(usage),
  }
}

const callAnthropic = async (
  runtime: RecipeSkillRuntimeConfig,
  systemPrompt: string,
  userMessage: string
): Promise<CompletionResult> => {
  const { response, data } = await requestJson(joinApiUrl(runtime.baseUrl, '/messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': runtime.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: runtime.model,
      system: systemPrompt,
      max_tokens: typeof runtime.maxTokens === 'number' ? runtime.maxTokens : 4096,
      temperature: typeof runtime.temperature === 'number' ? runtime.temperature : 0.3,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(extractApiError(data, `模型请求失败 (${response.status})`))
  }

  const content = normalizeOpenAiContent(data.content)
  if (!content.trim()) {
    throw new Error('模型返回为空')
  }

  const usage =
    data.usage && typeof data.usage === 'object'
      ? (data.usage as Record<string, unknown>)
      : {}

  return {
    content,
    totalTokens: parseTotalTokens(usage),
  }
}

const parseJsonObject = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    const firstBrace = value.indexOf('{')
    const lastBrace = value.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const scoped = value.slice(firstBrace, lastBrace + 1)
      return JSON.parse(scoped)
    }
    throw new Error('模型输出不是合法 JSON')
  }
}

const formatRetryInstruction = (
  promptType: RecipePromptType,
  validation: RecipeValidationResult
) =>
  [
    '上一轮输出未通过校验，请直接返回修正后的完整 JSON 对象。',
    `当前 prompt_type: ${promptType}`,
    `校验错误: ${validation.message}`,
    '不要解释，不要 markdown，只返回 JSON。',
  ].join('\n')

const completeJson = async (
  runtime: RecipeSkillRuntimeConfig,
  systemPrompt: string,
  userMessage: string
) => {
  if (runtime.providerId === 'anthropic') {
    return callAnthropic(runtime, systemPrompt, userMessage)
  }
  return callOpenAiCompatible(runtime, systemPrompt, userMessage)
}

export const generateRecipeWithRetries = async (
  userInput: string,
  promptType: RecipePromptType,
  runtime: RecipeSkillRuntimeConfig
): Promise<RecipeGenerationResult> => {
  const systemPrompt = getRecipeSkillPrompt(promptType)
  const maxRetries = Math.max(0, Math.min(4, runtime.maxRetries ?? 2))
  let totalTokensUsed = 0
  let currentInput = userInput.trim()
  let lastError = '生成失败'
  let lastValidation: RecipeValidationResult = {
    valid: false,
    message: '生成失败',
    errors: ['生成失败'],
  }

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      const completion = await completeJson(runtime, systemPrompt, currentInput)
      totalTokensUsed += completion.totalTokens
      const raw = parseJsonObject(completion.content)
      const { data, validation } = validateRecipeSkill(raw)
      lastValidation = validation
      if (validation.valid) {
        return {
          data,
          tokensUsed: totalTokensUsed,
          validation,
          attempts: attempt,
        }
      }
      lastError = validation.message
      currentInput = `${userInput.trim()}\n\n${formatRetryInstruction(promptType, validation)}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : '模型调用失败'
      currentInput = `${userInput.trim()}\n\n请按 JSON 规范重新输出。上次错误：${lastError}`
    }
  }

  throw new Error(lastError || lastValidation.message || 'AI 生成失败')
}

