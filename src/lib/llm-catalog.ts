export type LlmProviderId =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'moonshot'
  | 'openrouter'
  | 'ollama'

export type LlmRouteProfileId = 'default' | 'reasoning' | 'long_context' | 'low_cost' | 'agent'
export type LlmMediaType = 'audio' | 'image' | 'video'

export interface LlmModelPreset {
  id: string
  label: string
  category: 'closed' | 'open'
}

export interface LlmProviderCatalogItem {
  id: LlmProviderId
  label: string
  subtitle: string
  defaultBaseUrl: string
  defaultApiKeyEnvVar: string
  apiKeyLabel: string
  apiKeyPlaceholder: string
  supportsKeyless: boolean
  supportedMediaTypes?: LlmMediaType[]
  models: LlmModelPreset[]
}

export interface LlmRouteProfileTemplate {
  id: LlmRouteProfileId
  label: string
  description: string
  defaultProviderId: LlmProviderId
  defaultModel: string
  defaultTemperature: number
  defaultMaxTokens: number
}

export const LLM_PROVIDER_CATALOG: LlmProviderCatalogItem[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    subtitle: '推理与通用问答',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultApiKeyEnvVar: 'SK_LLM_DEEPSEEK_API_KEY',
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-***',
    supportsKeyless: false,
    supportedMediaTypes: [],
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', category: 'open' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', category: 'open' },
    ],
  },
  {
    id: 'moonshot',
    label: 'Kimi 2.5 (Moonshot)',
    subtitle: '长上下文与中文场景',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultApiKeyEnvVar: 'SK_LLM_MOONSHOT_API_KEY',
    apiKeyLabel: 'Kimi / Moonshot API Key',
    apiKeyPlaceholder: 'sk-***',
    supportsKeyless: false,
    supportedMediaTypes: [],
    models: [
      { id: 'kimi-2.5', label: 'Kimi 2.5', category: 'open' },
      { id: 'moonshot-v1-128k', label: 'Moonshot 128K', category: 'open' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    subtitle: 'GPT 系列闭源模型',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultApiKeyEnvVar: 'SK_LLM_OPENAI_API_KEY',
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-***',
    supportsKeyless: false,
    supportedMediaTypes: ['audio', 'image', 'video'],
    models: [
      { id: 'gpt-4.1', label: 'GPT-4.1', category: 'closed' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', category: 'closed' },
      { id: 'o4-mini', label: 'o4-mini', category: 'closed' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    subtitle: 'Claude 闭源模型',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultApiKeyEnvVar: 'SK_LLM_ANTHROPIC_API_KEY',
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-***',
    supportsKeyless: false,
    supportedMediaTypes: [],
    models: [
      { id: 'claude-3-7-sonnet-latest', label: 'Claude Sonnet', category: 'closed' },
      { id: 'claude-3-5-haiku-latest', label: 'Claude Haiku', category: 'closed' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (Gemma / Llama)',
    subtitle: '多家开源模型聚合网关',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultApiKeyEnvVar: 'SK_LLM_OPENROUTER_API_KEY',
    apiKeyLabel: 'OpenRouter API Key',
    apiKeyPlaceholder: 'sk-or-***',
    supportsKeyless: false,
    supportedMediaTypes: [],
    models: [
      { id: 'google/gemma-4-27b-it', label: 'Gemma 4 27B Instruct', category: 'open' },
      { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', category: 'open' },
      { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct', category: 'open' },
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama (自托管)',
    subtitle: '本地/私有部署开源模型',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    defaultApiKeyEnvVar: 'SK_LLM_OLLAMA_API_KEY',
    apiKeyLabel: 'Ollama Token (可选)',
    apiKeyPlaceholder: '可留空',
    supportsKeyless: true,
    supportedMediaTypes: [],
    models: [
      { id: 'gemma4:latest', label: 'Gemma 4 (self-hosted)', category: 'open' },
      { id: 'llama3.1:70b-instruct', label: 'Llama 3.1 70B', category: 'open' },
      { id: 'qwen2.5:72b-instruct', label: 'Qwen 2.5 72B', category: 'open' },
    ],
  },
]

export const LLM_ROUTE_PROFILE_LIBRARY: LlmRouteProfileTemplate[] = [
  {
    id: 'default',
    label: '默认对话',
    description: '日常经营问答与策略建议',
    defaultProviderId: 'deepseek',
    defaultModel: 'deepseek-chat',
    defaultTemperature: 0.3,
    defaultMaxTokens: 1500,
  },
  {
    id: 'reasoning',
    label: '复杂推理',
    description: '多约束方案分析与反事实推理',
    defaultProviderId: 'deepseek',
    defaultModel: 'deepseek-reasoner',
    defaultTemperature: 0.2,
    defaultMaxTokens: 2200,
  },
  {
    id: 'long_context',
    label: '长上下文',
    description: '长报表、多文档合并分析',
    defaultProviderId: 'moonshot',
    defaultModel: 'moonshot-v1-128k',
    defaultTemperature: 0.2,
    defaultMaxTokens: 2600,
  },
  {
    id: 'low_cost',
    label: '成本优先',
    description: '高频任务与批量生成',
    defaultProviderId: 'openrouter',
    defaultModel: 'google/gemma-4-27b-it',
    defaultTemperature: 0.4,
    defaultMaxTokens: 1200,
  },
  {
    id: 'agent',
    label: '智能体执行',
    description: '跨模块任务编排与执行建议',
    defaultProviderId: 'openai',
    defaultModel: 'gpt-4.1',
    defaultTemperature: 0.2,
    defaultMaxTokens: 2000,
  },
]

export const getProviderCatalogItem = (providerId: LlmProviderId) =>
  LLM_PROVIDER_CATALOG.find((item) => item.id === providerId) || LLM_PROVIDER_CATALOG[0]

export const getProviderModelPresets = (providerId: LlmProviderId) =>
  getProviderCatalogItem(providerId).models

export const getProviderApiKeyEnvVar = (providerId: LlmProviderId) =>
  getProviderCatalogItem(providerId).defaultApiKeyEnvVar

export const getProviderDefaultModel = (providerId: LlmProviderId) =>
  getProviderCatalogItem(providerId).models[0]?.id || ''

export const supportsProviderMediaType = (providerId: LlmProviderId, mediaType: LlmMediaType) => {
  const provider = getProviderCatalogItem(providerId)
  return Boolean(provider.supportedMediaTypes?.includes(mediaType))
}

export const maskApiKey = (apiKey: string) => {
  const value = apiKey.trim()
  if (!value) return ''
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`
}
