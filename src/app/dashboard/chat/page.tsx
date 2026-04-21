'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AccessGuard } from '@/components/access-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Calculator,
  Clapperboard,
  ClipboardCheck,
  FileAudio,
  FileText,
  GanttChartSquare,
  ImageIcon,
  Megaphone,
  Package,
  PenSquare,
  ScrollText,
  UtensilsCrossed,
  ChevronRight,
  Wifi,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AI_AGENT_CAPABILITY_LIBRARY,
  AiAgentCapabilityId,
  getAiAgentCapabilityById,
} from '@/lib/ai-agent-capabilities';
import { buildApiUrl, hasExplicitApiUrl } from '@/lib/runtime-config';
import { loadLlmControlPlane } from '@/lib/llm-control-plane';
import {
  LLM_PROVIDER_CATALOG,
  LLM_ROUTE_PROFILE_LIBRARY,
  LlmMediaType,
  LlmProviderId,
  LlmRouteProfileId,
  getProviderCatalogItem,
  getProviderDefaultModel,
  getProviderModelPresets,
  supportsProviderMediaType,
} from '@/lib/llm-catalog';
import { useAuthStore } from '@/store/auth';
import { LlmProviderConfig, LlmRouteProfileConfig } from '@/store/llm-control-plane';
import {
  AiWorkflowItem,
  AiWorkflowStatus,
  createAiWorkflow,
  fetchAiWorkflows,
  updateAiWorkflow,
} from '@/lib/ai-workflows';
import {
  downloadRecipeSkillExport,
  fetchRecipeSkillRecipes,
  generateRecipeSkill,
  RecipeSkillExportFormat,
  RecipeSkillGenerateResponse,
  RecipeSkillListItem,
  RecipeSkillPromptType,
} from '@/lib/recipe-skill';

interface MessageAttachment {
  mediaType: 'audio' | 'image' | 'video';
  mimeType?: string;
  url?: string;
  dataUrl?: string;
  status?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachment?: MessageAttachment;
}

type AssistantMode = 'live';
type WorkflowAction = '' | 'create' | 'refresh' | 'approve' | 'reject';

const workflowStatusLabel: Record<AiWorkflowStatus, string> = {
  draft: '草稿',
  submitted: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  executing: '执行中',
  completed: '已完成',
  failed: '失败',
}

const workflowStatusTone: Record<AiWorkflowStatus, string> = {
  draft: 'bg-white/10 text-slate-200 hover:bg-white/10',
  submitted: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  approved: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  rejected: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  executing: 'bg-[#7ea7ff]/20 text-[#c8dcff] hover:bg-[#7ea7ff]/20',
  completed: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  failed: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
}

const mediaCapabilityTypeMap: Partial<Record<AiAgentCapabilityId, 'audio' | 'image' | 'video'>> = {
  audio_generation: 'audio',
  image_generation: 'image',
  video_generation: 'video',
}

const mediaDefaultModelMap: Record<'audio' | 'image' | 'video', string> = {
  audio: 'gpt-4o-mini-tts',
  image: 'gpt-image-1',
  video: 'sora-2',
}

const mediaTypeLabelMap: Record<LlmMediaType, string> = {
  audio: '音频',
  image: '图片',
  video: '视频',
}

const capabilityIconMap: Record<AiAgentCapabilityId, typeof FileText> = {
  contract_review: ClipboardCheck,
  policy_generation: GanttChartSquare,
  tender_generation: ScrollText,
  report_summary: FileText,
  copywriting: PenSquare,
  product_generation: Package,
  menu_generation: UtensilsCrossed,
  audio_generation: FileAudio,
  image_generation: ImageIcon,
  video_generation: Clapperboard,
  social_content: Megaphone,
  other: Calculator,
}

const PRESET_QUESTIONS = AI_AGENT_CAPABILITY_LIBRARY.map((capability) => ({
  id: capability.id,
  icon: capabilityIconMap[capability.id],
  title: capability.shortTitle,
  desc: capability.description,
  prompt: capability.starterPrompt,
}))

const buildWelcomeText = (capabilityId?: AiAgentCapabilityId) => {
  if (!capabilityId) {
    return '你好！我是星厨AI助手，可以帮助你处理排班、库存、培训、食安等门店管理事务。有什么可以帮你的吗？'
  }
  const capability = getAiAgentCapabilityById(capabilityId)
  if (!capability) {
    return '你好！我是星厨AI助手。请告诉我你的目标，我会给出可执行方案。'
  }
  return `你好！我是星厨AI助手，当前已切换到「${capability.title}」能力。请粘贴你的原始资料或需求，我将按标准模板输出可直接执行的结果。`
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-[#7ea7ff] animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-[#7ea7ff] animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-[#7ea7ff] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

async function readSseResponse(
  response: Response,
  onChunk: (content: string) => void
) {
  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const event of events) {
      const lines = event
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      for (const line of lines) {
        if (!line.startsWith('data:')) continue

        const rawPayload = line.slice(5).trim()
        if (!rawPayload || rawPayload === '[DONE]') {
          return fullContent
        }

        let payload: Record<string, unknown> = {}
        try {
          payload = JSON.parse(rawPayload) as Record<string, unknown>
        } catch {
          continue
        }

        if (payload.error) {
          throw new Error(String(payload.error))
        }

        if (typeof payload.content === 'string' && payload.content) {
          fullContent += payload.content
          onChunk(fullContent)
        }

        if (payload.done) {
          return fullContent
        }
      }
    }
  }

  return fullContent
}

const resolveRouteTemplate = (routeId: LlmRouteProfileId) =>
  LLM_ROUTE_PROFILE_LIBRARY.find((item) => item.id === routeId) || LLM_ROUTE_PROFILE_LIBRARY[0]

const isProviderId = (value: string | null): value is LlmProviderId =>
  Boolean(value) && LLM_PROVIDER_CATALOG.some((item) => item.id === value)

const isRouteProfileId = (value: string | null): value is LlmRouteProfileId =>
  Boolean(value) && LLM_ROUTE_PROFILE_LIBRARY.some((item) => item.id === value)

const isCapabilityId = (value: string | null): value is AiAgentCapabilityId =>
  Boolean(value) && AI_AGENT_CAPABILITY_LIBRARY.some((item) => item.id === value)

const safeJson = async (response: Response) => {
  const cloned = response.clone()
  try {
    return await response.json()
  } catch {
    const rawText = await cloned.text().catch(() => '')
    if (!rawText.trim()) return {}
    return {
      detail: rawText.trim().slice(0, 320),
    }
  }
}

const resolveApiErrorMessage = (payload: unknown, statusCode: number, fallbackPrefix: string) => {
  const record = (payload || {}) as {
    message?: unknown
    detail?: unknown
    error?: unknown
  }

  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail.trim()
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim()
  return `${fallbackPrefix} (${statusCode})`
}

const resolveAiRecoveryHint = (message: string) => {
  const normalized = message.toLowerCase()
  if (message.includes('当前未启用')) {
    return '建议：前往「系统集成 → 模型接入」启用对应模型后重试。'
  }
  if (message.includes('API Key') || normalized.includes('api key')) {
    return '建议：前往「系统集成 → 模型接入」填写并保存 API Key，再执行连通性测试。'
  }
  if (message.includes('不支持') && (message.includes('图片') || message.includes('音频') || message.includes('视频'))) {
    return '建议：切换到支持该媒体类型的模型供应商后再执行。'
  }
  if (normalized.includes('timeout') || normalized.includes('timed out')) {
    return '建议：稍后重试，或切换到同能力的备用模型。'
  }
  return ''
}

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

const isRecipeSkillCapability = (capabilityId: AiAgentCapabilityId) =>
  capabilityId === 'product_generation' || capabilityId === 'menu_generation'

const resolveRecipePromptType = (capabilityId: AiAgentCapabilityId): RecipeSkillPromptType =>
  capabilityId === 'menu_generation' ? 'menu_copy' : 'recipe'

const resolveMediaExecutionModel = (
  mediaType: 'audio' | 'image' | 'video',
  providerId: LlmProviderId,
  model: string
) => {
  const normalizedModel = model.trim()
  if (!normalizedModel) return mediaDefaultModelMap[mediaType]
  if (providerId !== 'openai') return normalizedModel

  if (mediaType === 'audio') {
    return /tts|audio/i.test(normalizedModel)
      ? normalizedModel
      : mediaDefaultModelMap.audio
  }
  if (mediaType === 'image') {
    return /image/i.test(normalizedModel)
      ? normalizedModel
      : mediaDefaultModelMap.image
  }
  return /(sora|video)/i.test(normalizedModel)
    ? normalizedModel
    : mediaDefaultModelMap.video
}

const formatMoney = (value: number) => `¥${Number(value || 0).toFixed(2)}`

export default function ChatPage() {
  const { token } = useAuthStore()
  const searchParams = useSearchParams()
  const initialCapabilityParam = searchParams.get('capability')
  const initialWorkflowId = searchParams.get('workflowId')?.trim() || ''
  const initialCapabilityId = isCapabilityId(initialCapabilityParam) ? initialCapabilityParam : 'other'
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcomeText(initialCapabilityId),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('live');
  const [controlPlaneMode, setControlPlaneMode] = useState<'remote' | 'local'>(
    hasExplicitApiUrl() ? 'remote' : 'local'
  );
  const [providerConfigs, setProviderConfigs] = useState<LlmProviderConfig[]>([]);
  const [routeConfigs, setRouteConfigs] = useState<LlmRouteProfileConfig[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<LlmRouteProfileId>('default');
  const [selectedProviderId, setSelectedProviderId] = useState<LlmProviderId>('deepseek');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-chat');
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<AiAgentCapabilityId>(initialCapabilityId);
  const [hasAppliedQuickEntryPreset, setHasAppliedQuickEntryPreset] = useState(false);
  const [workflowItems, setWorkflowItems] = useState<AiWorkflowItem[]>([])
  const [activeWorkflowId, setActiveWorkflowId] = useState(initialWorkflowId)
  const [workflowBusy, setWorkflowBusy] = useState<WorkflowAction>('')
  const [workflowError, setWorkflowError] = useState('')
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false)
  const [appliedWorkflowContextId, setAppliedWorkflowContextId] = useState('')
  const [recipeItems, setRecipeItems] = useState<RecipeSkillListItem[]>([])
  const [activeRecipeId, setActiveRecipeId] = useState('')
  const [recipePanelBusy, setRecipePanelBusy] = useState<'' | 'load' | 'generate' | 'export'>('')
  const [recipePanelError, setRecipePanelError] = useState('')
  const [latestRecipe, setLatestRecipe] = useState<RecipeSkillGenerateResponse | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    let disposed = false

    const bootstrap = async () => {
      const snapshot = await loadLlmControlPlane(token)
      if (disposed) return

      setControlPlaneMode(snapshot.mode)
      setProviderConfigs(snapshot.providers)
      setRouteConfigs(snapshot.routes)

      const defaultRoute = snapshot.routes.find((item) => item.routeId === 'default') || snapshot.routes[0]
      if (defaultRoute) {
        setActiveRouteId(defaultRoute.routeId)
        setSelectedProviderId(defaultRoute.providerId)
        setSelectedModel(defaultRoute.model)
      }
    }

    void bootstrap()

    return () => {
      disposed = true
    }
  }, [token])

  useEffect(() => {
    const route = routeConfigs.find((item) => item.routeId === activeRouteId)
    if (!route) return
    setSelectedProviderId(route.providerId)
    setSelectedModel(route.model)
  }, [activeRouteId, routeConfigs])

  useEffect(() => {
    let disposed = false

    const loadWorkflows = async () => {
      setIsWorkflowLoading(true)
      setWorkflowError('')
      try {
        const items = await fetchAiWorkflows(token)
        if (disposed) return
        setWorkflowItems(items)

        if (initialWorkflowId && items.some((item) => item.id === initialWorkflowId)) {
          setActiveWorkflowId(initialWorkflowId)
          return
        }
      } catch (error) {
        if (disposed) return
        const message = error instanceof Error ? error.message : '读取审批工单失败'
        setWorkflowError(message)
      } finally {
        if (!disposed) {
          setIsWorkflowLoading(false)
        }
      }
    }

    void loadWorkflows()

    return () => {
      disposed = true
    }
  }, [initialWorkflowId, token])

  useEffect(() => {
    if (hasAppliedQuickEntryPreset || routeConfigs.length === 0) return

    const capabilityParam = searchParams.get('capability')
    const routeParam = searchParams.get('route')
    const providerParam = searchParams.get('provider')
    const modelParam = searchParams.get('model')?.trim() || ''

    const normalizedCapabilityParam = isCapabilityId(capabilityParam) ? capabilityParam : null
    const normalizedRouteParam = isRouteProfileId(routeParam) ? routeParam : null
    const normalizedProviderParam = isProviderId(providerParam) ? providerParam : null
    const capabilityTemplate = normalizedCapabilityParam
      ? getAiAgentCapabilityById(normalizedCapabilityParam)
      : null
    const hasRouteParam = Boolean(normalizedRouteParam)
    const hasProviderParam = Boolean(normalizedProviderParam)
    const hasModelParam = Boolean(modelParam)
    const hasCapabilityParam = Boolean(capabilityTemplate)

    if (!hasRouteParam && !hasProviderParam && !hasModelParam && !hasCapabilityParam) {
      setHasAppliedQuickEntryPreset(true)
      return
    }

    if (capabilityTemplate) {
      setSelectedCapabilityId(capabilityTemplate.id)
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: buildWelcomeText(capabilityTemplate.id),
          timestamp: new Date(),
        },
      ])
      setInput(capabilityTemplate.starterPrompt)
    }

    let targetRouteId: LlmRouteProfileId = activeRouteId
    if (normalizedRouteParam && routeConfigs.some((item) => item.routeId === normalizedRouteParam)) {
      targetRouteId = normalizedRouteParam
    } else if (capabilityTemplate && routeConfigs.some((item) => item.routeId === capabilityTemplate.recommendedRoute)) {
      targetRouteId = capabilityTemplate.recommendedRoute
    }

    setRouteConfigs((previous) =>
      previous.map((item) => {
        if (item.routeId !== targetRouteId) return item
        const nextProviderId =
          normalizedProviderParam || capabilityTemplate?.recommendedProvider || item.providerId
        const nextModel = hasModelParam
          ? modelParam
          : normalizedProviderParam
            ? getProviderDefaultModel(normalizedProviderParam)
            : capabilityTemplate?.recommendedModel || item.model
        return {
          ...item,
          providerId: nextProviderId,
          model: nextModel,
        }
      })
    )

    setActiveRouteId(targetRouteId)
    setHasAppliedQuickEntryPreset(true)
  }, [activeRouteId, hasAppliedQuickEntryPreset, routeConfigs, searchParams])

  const activeRouteConfig =
    routeConfigs.find((item) => item.routeId === activeRouteId) || routeConfigs[0]
  const activeRouteTemplate = resolveRouteTemplate(activeRouteId)
  const activeProviderConfig =
    providerConfigs.find((item) => item.providerId === selectedProviderId) || providerConfigs[0]
  const activeProviderCatalog = getProviderCatalogItem(selectedProviderId)
  const modelPresets = getProviderModelPresets(selectedProviderId)
  const providerKeyReady =
    !!activeProviderConfig &&
    (activeProviderCatalog.supportsKeyless ||
      activeProviderConfig.keyConfigured ||
      Boolean(activeProviderConfig.apiKey?.trim()))
  const activeCapability =
    getAiAgentCapabilityById(selectedCapabilityId) ||
    AI_AGENT_CAPABILITY_LIBRARY[AI_AGENT_CAPABILITY_LIBRARY.length - 1]
  const activeWorkflow = useMemo(
    () => workflowItems.find((item) => item.id === activeWorkflowId) || null,
    [activeWorkflowId, workflowItems]
  )
  const activeMediaType = mediaCapabilityTypeMap[selectedCapabilityId] || null
  const providerSupportsActiveMedia = activeMediaType
    ? supportsProviderMediaType(selectedProviderId, activeMediaType)
    : true
  const providerStatusText =
    activeMediaType && !providerSupportsActiveMedia
      ? `不支持${mediaTypeLabelMap[activeMediaType]}`
      : providerKeyReady
        ? 'Key Ready'
        : 'Key Missing'

  const isProviderOperational = (providerId: LlmProviderId) => {
    const provider = providerConfigs.find((item) => item.providerId === providerId)
    if (!provider?.enabled) return false
    const catalog = getProviderCatalogItem(providerId)
    return catalog.supportsKeyless || provider.keyConfigured || Boolean(provider.apiKey?.trim())
  }

  const getMediaProviderHint = (mediaType: LlmMediaType) => {
    const labels = LLM_PROVIDER_CATALOG.filter((item) =>
      supportsProviderMediaType(item.id, mediaType)
    ).map((item) => item.label)
    return labels.length ? labels.join(' / ') : '暂无'
  }

  const isProviderOperationalForMedia = (
    providerId: LlmProviderId,
    mediaType: LlmMediaType
  ) => {
    if (!supportsProviderMediaType(providerId, mediaType)) return false
    return isProviderOperational(providerId)
  }

  const pickOperationalProvider = (preferredProviderId: LlmProviderId) => {
    if (isProviderOperational(preferredProviderId)) {
      return preferredProviderId
    }
    const fallback = providerConfigs.find((item) => isProviderOperational(item.providerId))
    return fallback?.providerId || preferredProviderId
  }

  const pickOperationalMediaProvider = (
    preferredProviderId: LlmProviderId,
    mediaType: LlmMediaType
  ) => {
    if (isProviderOperationalForMedia(preferredProviderId, mediaType)) {
      return preferredProviderId
    }
    const fallback = providerConfigs.find((item) =>
      isProviderOperationalForMedia(item.providerId, mediaType)
    )
    return fallback?.providerId || null
  }

  const operationalMediaProviderId = activeMediaType
    ? pickOperationalMediaProvider(selectedProviderId, activeMediaType)
    : null
  const hasOperationalMediaProvider = !activeMediaType || Boolean(operationalMediaProviderId)
  const mediaProviderHint = activeMediaType ? getMediaProviderHint(activeMediaType) : '暂无'

  const replaceWorkflowItem = (nextItem: AiWorkflowItem) => {
    setWorkflowItems((current) => {
      const hasItem = current.some((item) => item.id === nextItem.id)
      if (hasItem) {
        return current.map((item) => (item.id === nextItem.id ? nextItem : item))
      }
      return [nextItem, ...current]
    })
  }

  const refreshRecipeItems = async (focusRecipeId = '') => {
    setRecipePanelBusy('load')
    setRecipePanelError('')
    try {
      const payload = await fetchRecipeSkillRecipes(token, 1, 30)
      setRecipeItems(payload.recipes)
      if (focusRecipeId && payload.recipes.some((item) => item.id === focusRecipeId)) {
        setActiveRecipeId(focusRecipeId)
      } else if (payload.recipes.length && !activeRecipeId) {
        setActiveRecipeId(payload.recipes[0].id)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取菜谱列表失败'
      setRecipePanelError(message)
    } finally {
      setRecipePanelBusy('')
    }
  }

  const handleRecipeExport = async (format: RecipeSkillExportFormat) => {
    if (!activeRecipeId) {
      setRecipePanelError('请先选择菜谱后再导出。')
      return
    }
    setRecipePanelBusy('export')
    setRecipePanelError('')
    try {
      await downloadRecipeSkillExport(token, activeRecipeId, format)
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败'
      setRecipePanelError(message)
    } finally {
      setRecipePanelBusy('')
    }
  }

  const refreshWorkflowItems = async (focusWorkflowId = '') => {
    setWorkflowBusy('refresh')
    setWorkflowError('')
    try {
      const items = await fetchAiWorkflows(token)
      setWorkflowItems(items)
      if (focusWorkflowId && items.some((item) => item.id === focusWorkflowId)) {
        setActiveWorkflowId(focusWorkflowId)
        setAppliedWorkflowContextId('')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取审批工单失败'
      setWorkflowError(message)
    } finally {
      setWorkflowBusy('')
    }
  }

  useEffect(() => {
    if (!activeMediaType) return
    if (!operationalMediaProviderId) return

    const nextProviderId = operationalMediaProviderId
    const baseModel =
      nextProviderId === selectedProviderId ? selectedModel : getProviderDefaultModel(nextProviderId)
    const nextModel = resolveMediaExecutionModel(activeMediaType, nextProviderId, baseModel)
    const shouldUpdateProvider = selectedProviderId !== nextProviderId
    const shouldUpdateModel = selectedModel !== nextModel
    if (!shouldUpdateProvider && !shouldUpdateModel) return

    setSelectedProviderId(nextProviderId)
    setSelectedModel(nextModel)
    setRouteConfigs((previous) =>
      previous.map((item) =>
        item.routeId === activeRouteId
          ? {
              ...item,
              providerId: nextProviderId,
              model: nextModel,
            }
          : item
      )
    )
  }, [
    activeMediaType,
    activeRouteId,
    operationalMediaProviderId,
    selectedModel,
    selectedProviderId,
  ])

  useEffect(() => {
    let disposed = false
    if (!isRecipeSkillCapability(selectedCapabilityId)) return

    const loadRecipes = async () => {
      setRecipePanelBusy('load')
      setRecipePanelError('')
      try {
        const payload = await fetchRecipeSkillRecipes(token, 1, 30)
        if (disposed) return
        setRecipeItems(payload.recipes)
        if (payload.recipes.length) {
          setActiveRecipeId((current) =>
            current && payload.recipes.some((item) => item.id === current)
              ? current
              : payload.recipes[0].id
          )
        }
      } catch (error) {
        if (disposed) return
        const message = error instanceof Error ? error.message : '读取菜谱列表失败'
        setRecipePanelError(message)
      } finally {
        if (!disposed) {
          setRecipePanelBusy('')
        }
      }
    }

    void loadRecipes()

    return () => {
      disposed = true
    }
  }, [selectedCapabilityId, token])

  useEffect(() => {
    if (!activeWorkflow || appliedWorkflowContextId === activeWorkflow.id) return

    setSelectedCapabilityId(activeWorkflow.capabilityId)
    setActiveRouteId(activeWorkflow.routeId)
    setSelectedProviderId(activeWorkflow.providerId)
    setSelectedModel(activeWorkflow.model)
    setRouteConfigs((previous) =>
      previous.map((item) =>
        item.routeId === activeWorkflow.routeId
          ? {
              ...item,
              providerId: activeWorkflow.providerId,
              model: activeWorkflow.model,
            }
          : item
      )
    )
    setMessages([
      {
        id: `workflow-${activeWorkflow.id}`,
        role: 'assistant',
        content: `已加载审批工单「${activeWorkflow.title}」。你可以先补充需求，然后执行生成。`,
        timestamp: new Date(),
      },
    ])
    setInput(activeWorkflow.prompt)
    setAppliedWorkflowContextId(activeWorkflow.id)
  }, [activeWorkflow, appliedWorkflowContextId])

  const applyCapabilityPreset = (capabilityId: AiAgentCapabilityId, seedInput = true) => {
    const capability = getAiAgentCapabilityById(capabilityId)
    if (!capability) return
    const mediaType = mediaCapabilityTypeMap[capability.id]
    const isMediaCapability = Boolean(mediaType)
    const targetProviderId = isMediaCapability
      ? pickOperationalMediaProvider(capability.recommendedProvider, mediaType!) ||
        capability.recommendedProvider
      : pickOperationalProvider(capability.recommendedProvider)
    const targetModel =
      targetProviderId === capability.recommendedProvider
        ? capability.recommendedModel
        : getProviderDefaultModel(targetProviderId)

    setSelectedCapabilityId(capability.id)
    setActiveRouteId(capability.recommendedRoute)
    setSelectedProviderId(targetProviderId)
    setSelectedModel(targetModel)

    setRouteConfigs((previous) =>
      previous.map((item) =>
        item.routeId === capability.recommendedRoute
          ? {
              ...item,
              providerId: targetProviderId,
              model: targetModel,
            }
          : item
      )
    )

    if (seedInput) {
      setInput(capability.starterPrompt)
    }
  }

  const resolveWorkflowPromptSeed = () => {
    const normalizedInput = input.trim()
    if (normalizedInput) return normalizedInput
    const latestUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === 'user' && item.content.trim())
    if (latestUserMessage) return latestUserMessage.content
    return activeCapability.starterPrompt
  }

  const createApprovalWorkflow = async () => {
    const seedPrompt = resolveWorkflowPromptSeed().trim()
    if (!seedPrompt) {
      setWorkflowError('请先输入任务描述，再提交审批工单。')
      return
    }

    setWorkflowBusy('create')
    setWorkflowError('')
    try {
      const created = await createAiWorkflow(
        {
          capabilityId: selectedCapabilityId,
          prompt: seedPrompt,
          routeId: activeRouteId,
          providerId: selectedProviderId,
          model: selectedModel,
          owner: 'AI 会话发起',
        },
        token
      )
      replaceWorkflowItem(created)
      setActiveWorkflowId(created.id)
      setAppliedWorkflowContextId('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交审批工单失败'
      setWorkflowError(message)
    } finally {
      setWorkflowBusy('')
    }
  }

  const patchWorkflowStatus = async (status: AiWorkflowStatus, note: string) => {
    if (!activeWorkflow) return
    const action: WorkflowAction = status === 'approved' ? 'approve' : 'reject'
    setWorkflowBusy(action)
    setWorkflowError('')
    try {
      const updated = await updateAiWorkflow(
        activeWorkflow.id,
        {
          status,
          note,
          approver: 'AI 会话审批',
        },
        token
      )
      replaceWorkflowItem(updated)
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新审批状态失败'
      setWorkflowError(message)
    } finally {
      setWorkflowBusy('')
    }
  }

  const sendMessage = async (content: string) => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isLoading) return

    if (activeWorkflow?.status === 'submitted') {
      setWorkflowError('当前工单仍在待审批，请先审批通过再执行。')
      return
    }
    if (activeWorkflow?.status === 'rejected') {
      setWorkflowError('当前工单已驳回，请重新提交新工单后执行。')
      return
    }

    const executionProviderId =
      activeMediaType
        ? pickOperationalMediaProvider(selectedProviderId, activeMediaType) || selectedProviderId
        : pickOperationalProvider(selectedProviderId)
    const executionProviderConfig =
      providerConfigs.find((item) => item.providerId === executionProviderId) || activeProviderConfig
    const executionProviderCatalog = getProviderCatalogItem(executionProviderId)
    const executionProviderKeyReady =
      !!executionProviderConfig &&
      (executionProviderCatalog.supportsKeyless ||
        executionProviderConfig.keyConfigured ||
        Boolean(executionProviderConfig.apiKey?.trim()))

    if (activeMediaType && !supportsProviderMediaType(executionProviderId, activeMediaType)) {
      setWorkflowError(
        `${executionProviderCatalog.label} 当前不支持${mediaTypeLabelMap[activeMediaType]}生成，请切换到支持供应商（${getMediaProviderHint(activeMediaType)}）。`
      )
      return
    }

    if (!executionProviderConfig?.enabled) {
      if (activeMediaType) {
        setWorkflowError(
          `${executionProviderCatalog.label} 当前未启用，无法执行${mediaTypeLabelMap[activeMediaType]}生成。请先在模型配置中启用（支持供应商：${getMediaProviderHint(activeMediaType)}）。`
        )
      } else {
        setWorkflowError(`${executionProviderCatalog.label} 当前未启用，请先到模型配置中启用后再执行。`)
      }
      return
    }
    if (!executionProviderKeyReady) {
      if (activeMediaType) {
        setWorkflowError(
          `${executionProviderCatalog.label} API Key 缺失，无法执行${mediaTypeLabelMap[activeMediaType]}生成，请先到模型配置中填写并保存。`
        )
      } else {
        setWorkflowError(`${executionProviderCatalog.label} API Key 缺失，请先到模型配置中填写并保存。`)
      }
      return
    }

    const shouldSwitchProvider = executionProviderId !== selectedProviderId
    const defaultExecutionModel = getProviderDefaultModel(executionProviderId)
    const executionModel = activeMediaType
      ? resolveMediaExecutionModel(activeMediaType, executionProviderId, selectedModel)
      : shouldSwitchProvider || !selectedModel.trim()
        ? defaultExecutionModel
        : selectedModel

    const shouldSyncModel = executionModel !== selectedModel
    if (shouldSwitchProvider || shouldSyncModel) {
      if (shouldSwitchProvider) {
        setSelectedProviderId(executionProviderId)
      }
      if (shouldSyncModel) {
        setSelectedModel(executionModel)
      }
      setRouteConfigs((previous) =>
        previous.map((item) =>
          item.routeId === activeRouteId
            ? {
                ...item,
                providerId: executionProviderId,
                model: executionModel,
              }
            : item
        )
      )
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: normalizedContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setWorkflowError('')

    const loadingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ])

    let recipeGenerateTriggered = false
    try {
      if (isRecipeSkillCapability(selectedCapabilityId)) {
        recipeGenerateTriggered = true
        setRecipePanelBusy('generate')
        setRecipePanelError('')
        const promptType = resolveRecipePromptType(selectedCapabilityId)
        const result = await generateRecipeSkill(
          {
            input: normalizedContent,
            promptType,
            routeProfileId: activeRouteId,
            provider: executionProviderId,
            model: executionModel,
          },
          token
        )

        setAssistantMode('live')
        setLatestRecipe(result)
        setActiveRecipeId(result.recipe_id)

        try {
          const listPayload = await fetchRecipeSkillRecipes(token, 1, 30)
          setRecipeItems(listPayload.recipes)
        } catch (error) {
          console.warn('Failed to refresh recipe list.', error)
        }

        const ingredientCount = Array.isArray(result.data?.ingredients)
          ? result.data.ingredients.length
          : 0
        const stepCount = Array.isArray(result.data?.process_steps)
          ? result.data.process_steps.length
          : 0
        const summary = [
          `标准菜谱已生成：${result.recipe_name}`,
          `校验状态：${result.validation}（尝试 ${result.attempts} 次）`,
          `结构完整度：原料 ${ingredientCount} 项｜工艺 ${stepCount} 步`,
          `成本概览：原料 ${formatMoney(result.data.costing.total_material_cost)} ｜ 总成本 ${formatMoney(result.data.costing.total_cost)} ｜ 建议售价 ${formatMoney(result.data.costing.suggested_price)} ｜ 毛利率 ${(result.data.costing.gross_margin_rate * 100).toFixed(2)}%`,
          '上方“产品生成输出”面板可直接导出 Word / Excel / PDF(HTML) / 全量打包。',
        ].join('\n')

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingId
              ? {
                  ...msg,
                  content: summary,
                  isStreaming: false,
                }
              : msg
          )
        )
        return
      }

      if (activeMediaType) {
        const response = await fetch(buildApiUrl('/ai/media/generate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            prompt: normalizedContent,
            mediaType: activeMediaType,
            routeProfileId: activeRouteId,
            provider: executionProviderId,
            model: executionModel,
            workflowId: activeWorkflow?.id || undefined,
          }),
        })

        const payload = (await safeJson(response)) as {
          ok?: boolean
          message?: string
          result?: {
            mediaType?: 'audio' | 'image' | 'video'
            mimeType?: string
            url?: string
            dataUrl?: string
            status?: string
          }
          workflow?: AiWorkflowItem | null
        }

        if (!response.ok || !payload?.ok || !payload.result) {
          throw new Error(resolveApiErrorMessage(payload, response.status, '媒体生成失败'))
        }

        setAssistantMode('live')

        const result = payload.result
        const hasBinaryOutput = Boolean(result.url || result.dataUrl)
        const capabilityLabel = activeCapability.shortTitle
        const summary = hasBinaryOutput
          ? `已完成${capabilityLabel}，请在下方查看并下载生成结果。`
          : `已提交${capabilityLabel}任务，当前状态：${result.status || '处理中'}。`

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingId
              ? {
                  ...msg,
                  content: summary,
                  isStreaming: false,
                  attachment: {
                    mediaType: result.mediaType || activeMediaType,
                    mimeType: result.mimeType,
                    url: result.url,
                    dataUrl: result.dataUrl,
                    status: result.status,
                  },
                }
              : msg
          )
        )

        if (payload.workflow) {
          replaceWorkflowItem(payload.workflow)
        }
        return
      }

      let workflowSnapshot = activeWorkflow
      if (workflowSnapshot?.status === 'approved') {
        try {
          const nextWorkflow = await updateAiWorkflow(
            workflowSnapshot.id,
            {
              status: 'executing',
              note: 'AI 会话开始执行文本任务',
              approver: 'AI 会话系统',
            },
            token
          )
          replaceWorkflowItem(nextWorkflow)
          workflowSnapshot = nextWorkflow
        } catch (error) {
          console.warn('Failed to set workflow to executing.', error)
        }
      }

      const response = await fetch(buildApiUrl('/chat/completions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          message: normalizedContent,
          conversationId: 'temp',
          routeProfileId: activeRouteId,
          provider: executionProviderId,
          model: executionModel,
          modelConfig: {
            temperature: activeRouteConfig?.temperature ?? activeRouteTemplate.defaultTemperature,
            maxTokens: activeRouteConfig?.maxTokens ?? activeRouteTemplate.defaultMaxTokens,
          },
        }),
      })

      setAssistantMode('live')
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const payload = await safeJson(response)
        throw new Error(resolveApiErrorMessage(payload, response.status, 'API request failed'))
      }

      const streamedContent = await readSseResponse(response, (partialContent) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingId
              ? { ...msg, content: partialContent, isStreaming: false }
              : msg
          )
        )
      })

      if (!response.ok && !streamedContent.trim()) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: streamedContent || '抱歉，我现在无法回答这个问题。',
                isStreaming: false,
              }
            : msg
        )
      )

      if (workflowSnapshot && (workflowSnapshot.status === 'executing' || workflowSnapshot.status === 'approved')) {
        try {
          const completedWorkflow = await updateAiWorkflow(
            workflowSnapshot.id,
            {
              status: 'completed',
              note: 'AI 会话文本任务执行完成',
              approver: 'AI 会话系统',
            },
            token
          )
          replaceWorkflowItem(completedWorkflow)
        } catch (error) {
          console.warn('Failed to set workflow to completed.', error)
        }
      }
    } catch (error) {
      console.warn('Chat API request failed.', error)
      setAssistantMode('live')
      const errorText =
        error instanceof Error ? error.message : '模型调用失败，请检查供应商状态与 API Key 配置。'
      const recoveryHint = resolveAiRecoveryHint(errorText)
      const finalMessage = recoveryHint ? `${errorText}\n${recoveryHint}` : errorText

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: `模型调用失败：${finalMessage}`,
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      if (recipeGenerateTriggered) {
        setRecipePanelBusy('')
      }
      setIsLoading(false)
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <DashboardLayout>
    <AccessGuard permission="use_ai_chat" title="当前账号无权使用 AI 助手">
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-[#7ea7ff]/15 bg-[rgba(10,22,40,0.45)] shadow-[0_24px_80px_rgba(2,8,20,0.35)] backdrop-blur lg:h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#7ea7ff]/15"
        style={{ background: 'rgba(10, 22, 40, 0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)',
              border: '2px solid #7ea7ff',
              boxShadow: '0 0 15px rgba(126, 167, 255, 0.3)'
            }}
          >
            <Bot className="w-5 h-5 text-[#7ea7ff]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI超级助手</h1>
            <p className="text-xs text-white/40">
              已连接业务后端 · 可返回实时结果
              {' · '}
              能力: {activeCapability.shortTitle}
              {' · '}
              路由: {activeRouteTemplate.label}
              {' · '}
              控制平面: {controlPlaneMode === 'remote' ? '后端' : '本地'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">
            <div className="rounded-xl border border-[#7ea7ff]/20 bg-[#7ea7ff]/8 px-2 py-1">
              <p className="text-[10px] text-white/40">任务能力</p>
              <select
                value={selectedCapabilityId}
                onChange={(event) =>
                  applyCapabilityPreset(event.target.value as AiAgentCapabilityId)
                }
                className="h-7 max-w-[11rem] bg-transparent text-xs text-white outline-none"
              >
                {AI_AGENT_CAPABILITY_LIBRARY.map((capability) => (
                  <option key={capability.id} value={capability.id} className="bg-[#081538] text-white">
                    {capability.shortTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[#7ea7ff]/20 bg-[#7ea7ff]/8 px-2 py-1">
              <p className="text-[10px] text-white/40">路由档位</p>
              <select
                value={activeRouteId}
                onChange={(event) => setActiveRouteId(event.target.value as LlmRouteProfileId)}
                className="h-7 bg-transparent text-xs text-white outline-none"
              >
                {LLM_ROUTE_PROFILE_LIBRARY.map((route) => (
                  <option key={route.id} value={route.id} className="bg-[#081538] text-white">
                    {route.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[#7ea7ff]/20 bg-[#7ea7ff]/8 px-2 py-1">
              <p className="text-[10px] text-white/40">模型厂商</p>
              <select
                value={selectedProviderId}
                onChange={(event) => {
                  const nextProviderId = event.target.value as LlmProviderId;
                  const nextModel = activeMediaType
                    ? resolveMediaExecutionModel(
                        activeMediaType,
                        nextProviderId,
                        getProviderDefaultModel(nextProviderId)
                      )
                    : getProviderDefaultModel(nextProviderId);
                  setSelectedProviderId(nextProviderId);
                  setSelectedModel(nextModel);
                  setRouteConfigs((previous) =>
                    previous.map((item) =>
                      item.routeId === activeRouteId
                        ? { ...item, providerId: nextProviderId, model: nextModel }
                        : item
                    )
                  );
                }}
                className="h-7 max-w-[10rem] bg-transparent text-xs text-white outline-none"
              >
                {LLM_PROVIDER_CATALOG.map((provider) => {
                  const mediaUnsupported =
                    activeMediaType && !supportsProviderMediaType(provider.id, activeMediaType)
                  return (
                    <option
                      key={provider.id}
                      value={provider.id}
                      disabled={Boolean(mediaUnsupported)}
                      className="bg-[#081538] text-white"
                    >
                      {provider.label}
                      {mediaUnsupported ? `（不支持${mediaTypeLabelMap[activeMediaType]}）` : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="rounded-xl border border-[#7ea7ff]/20 bg-[#7ea7ff]/8 px-2 py-1">
              <p className="text-[10px] text-white/40">当前模型</p>
              <select
                value={selectedModel}
                onChange={(event) => {
                  const nextModel = event.target.value;
                  setSelectedModel(nextModel);
                  setRouteConfigs((previous) =>
                    previous.map((item) =>
                      item.routeId === activeRouteId ? { ...item, model: nextModel } : item
                    )
                  );
                }}
                className="h-7 max-w-[14rem] bg-transparent text-xs text-white outline-none"
              >
                {modelPresets.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[#081538] text-white">
                    {model.label}
                  </option>
                ))}
                {selectedModel && !modelPresets.some((model) => model.id === selectedModel) ? (
                  <option value={selectedModel} className="bg-[#081538] text-white">
                    自定义: {selectedModel}
                  </option>
                ) : null}
              </select>
            </div>
          </div>

          <div className="rounded-full border border-[#7ea7ff]/30 bg-[#7ea7ff]/10 px-3 py-1 text-xs text-[#c8dcff]">
            <span className="inline-flex items-center gap-1">
              {activeProviderCatalog.label} · {providerStatusText}
            </span>
          </div>

          <div className="rounded-full border border-[#7ea7ff]/30 bg-[#7ea7ff]/10 px-3 py-1 text-xs text-[#c8dcff]">
            <span className="inline-flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5" />
              实时模式
            </span>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-[#7ea7ff] hover:text-[#7ea7ff] hover:bg-[#7ea7ff]/10">
            <Link href="/dashboard/integrations/llm/">
              模型配置
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="text-[#7ea7ff] hover:text-[#7ea7ff] hover:bg-[#7ea7ff]/10">
            <Link href="/dashboard/ai/workflows/">
              审批台
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-[#7ea7ff] hover:text-[#7ea7ff] hover:bg-[#7ea7ff]/10"
            onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: buildWelcomeText(selectedCapabilityId),
                  timestamp: new Date(),
                },
              ])
              setInput(activeCapability.starterPrompt)
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            新对话
          </Button>
        </div>
      </div>

      <div
        className="border-b border-[#7ea7ff]/15 px-4 py-3"
        style={{ background: 'rgba(10, 22, 40, 0.64)' }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeWorkflowId}
              onChange={(event) => {
                setActiveWorkflowId(event.target.value)
                setAppliedWorkflowContextId('')
              }}
              className="min-h-11 min-w-[16rem] rounded-md border border-[#7ea7ff]/25 bg-[#071633]/80 px-3 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">未绑定审批工单（即时执行）</option>
              {workflowItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{workflowStatusLabel[item.status]}] {item.title}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
              disabled={workflowBusy !== '' || isWorkflowLoading}
              onClick={() => {
                void refreshWorkflowItems(activeWorkflowId)
              }}
            >
              <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', (workflowBusy === 'refresh' || isWorkflowLoading) && 'animate-spin')} />
              刷新工单
            </Button>

            <Button
              type="button"
              className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={workflowBusy !== ''}
              onClick={() => {
                void createApprovalWorkflow()
              }}
            >
              提交审批工单
            </Button>

            {activeWorkflow?.status === 'submitted' ? (
              <>
                <Button
                  type="button"
                  className="min-h-11 bg-emerald-500 text-white hover:bg-emerald-500/90"
                  disabled={workflowBusy !== ''}
                  onClick={() => {
                    void patchWorkflowStatus('approved', 'AI 会话页审批通过')
                  }}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  审批通过
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  disabled={workflowBusy !== ''}
                  onClick={() => {
                    void patchWorkflowStatus('rejected', 'AI 会话页审批驳回')
                  }}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  驳回
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {activeWorkflow ? (
              <>
                <Badge className={workflowStatusTone[activeWorkflow.status]}>
                  {workflowStatusLabel[activeWorkflow.status]}
                </Badge>
                <span>工单：{activeWorkflow.title}</span>
                <span>Owner：{activeWorkflow.owner}</span>
                <span>更新时间：{formatTime(activeWorkflow.updatedAt)}</span>
                <Link
                  href={`/dashboard/ai/workflows/`}
                  className="inline-flex items-center text-primary hover:text-primary/90"
                >
                  打开审批详情
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <span>建议先提交审批工单，形成“申请-审批-执行-留痕”闭环。</span>
            )}
          </div>

          {workflowError ? (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {workflowError}
            </div>
          ) : null}

          {activeMediaType && !hasOperationalMediaProvider ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              当前未检测到可执行{mediaTypeLabelMap[activeMediaType]}生成的模型。请前往模型配置启用并填写 API Key（支持供应商：{mediaProviderHint}）。
            </div>
          ) : null}
        </div>
      </div>

      {isRecipeSkillCapability(selectedCapabilityId) ? (
        <div
          className="border-b border-[#7ea7ff]/15 px-4 py-3"
          style={{ background: 'rgba(9, 24, 44, 0.68)' }}
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#7ea7ff]/35 bg-[#7ea7ff]/10 px-3 py-1 text-xs text-[#c8dcff]">
                产品生成输出
              </span>
              <select
                value={activeRecipeId}
                onChange={(event) => setActiveRecipeId(event.target.value)}
                className="min-h-10 min-w-[16rem] rounded-md border border-[#7ea7ff]/25 bg-[#071633]/80 px-3 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">请选择已生成菜谱</option>
                {recipeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.cuisine} · {item.validation_status}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                onClick={() => {
                  void refreshRecipeItems(activeRecipeId)
                }}
                disabled={recipePanelBusy !== ''}
              >
                <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', recipePanelBusy === 'load' && 'animate-spin')} />
                刷新菜谱
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                onClick={() => {
                  void handleRecipeExport('word')
                }}
                disabled={recipePanelBusy === 'export' || !activeRecipeId}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出 Word
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                onClick={() => {
                  void handleRecipeExport('excel')
                }}
                disabled={recipePanelBusy === 'export' || !activeRecipeId}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出 Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-10 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                onClick={() => {
                  void handleRecipeExport('pdf')
                }}
                disabled={recipePanelBusy === 'export' || !activeRecipeId}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出 PDF
              </Button>
              <Button
                type="button"
                className="min-h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  void handleRecipeExport('all')
                }}
                disabled={recipePanelBusy === 'export' || !activeRecipeId}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                全量打包
              </Button>
            </div>

            {latestRecipe ? (
              <div className="rounded-xl border border-[#7ea7ff]/20 bg-[#071633]/70 px-3 py-2 text-xs text-slate-200">
                最新生成：{latestRecipe.recipe_name} · 校验 {latestRecipe.validation} ·
                Token {latestRecipe.tokens_used} · 生成时间 {formatTime(latestRecipe.created_at)}
              </div>
            ) : null}

            {recipePanelError ? (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {recipePanelError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                message.role === 'user' 
                  ? 'bg-[#7ea7ff]' 
                  : 'bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] border-2 border-[#7ea7ff]'
              )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-[#0a1628]" />
                ) : (
                  <Bot className="w-4 h-4 text-[#7ea7ff]" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={cn(
                'max-w-[80%] px-4 py-3',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-[#6f98ff] to-[#4f7ceb] rounded-2xl rounded-tr-sm'
                  : 'bg-[rgba(30,58,95,0.6)] border border-[rgba(126,167,255,0.20)] rounded-2xl rounded-tl-sm'
              )}
              >
                {message.isStreaming ? (
                  <TypingIndicator />
                ) : (
                  <>
                    <div className={cn(
                      'text-sm leading-relaxed whitespace-pre-wrap',
                      message.role === 'user' ? 'text-[#0a1628]' : 'text-white/90'
                    )}>
                      {message.content}
                    </div>
                    {message.attachment?.mediaType === 'audio' ? (
                      <audio
                        controls
                        preload="none"
                        src={message.attachment.url || message.attachment.dataUrl}
                        className="mt-3 w-full min-w-[14rem]"
                      />
                    ) : null}
                    {message.attachment?.mediaType === 'image' ? (
                      <a
                        href={message.attachment.url || message.attachment.dataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachment.url || message.attachment.dataUrl}
                          alt="AI 生成图片"
                          className="max-h-[22rem] w-full rounded-lg border border-white/20 object-cover"
                        />
                      </a>
                    ) : null}
                    {message.attachment?.mediaType === 'video' ? (
                      <video
                        controls
                        preload="metadata"
                        src={message.attachment.url || message.attachment.dataUrl}
                        className="mt-3 max-h-[22rem] w-full rounded-lg border border-white/20"
                      />
                    ) : null}
                    {message.attachment?.status && !message.attachment.url && !message.attachment.dataUrl ? (
                      <p className="mt-2 text-xs text-slate-300">任务状态：{message.attachment.status}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Preset Questions - Show only when no messages or few messages */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 py-3 border-t border-[#7ea7ff]/15"
          style={{ background: 'rgba(10, 22, 40, 0.6)' }}
        >
          <p className="text-xs text-white/40 mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7ea7ff]" />
            智能体快捷能力
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  applyCapabilityPreset(q.id, false)
                  void sendMessage(q.prompt)
                }}
                className="text-left p-3 rounded-xl transition-all duration-200 hover:translate-y-[-2px] group"
                style={{
                  background: 'rgba(30, 58, 95, 0.4)',
                  border: '1px solid rgba(126, 167, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(126, 167, 255, 0.14)';
                  e.currentTarget.style.borderColor = 'rgba(126, 167, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 58, 95, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(126, 167, 255, 0.2)';
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(126, 167, 255, 0.15)' }}
                  >
                    <q.icon className="w-4 h-4 text-[#7ea7ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-[#7ea7ff] transition-colors">
                      {q.title}
                    </p>
                    <p className="text-xs text-white/40 truncate">{q.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#7ea7ff] transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-[#7ea7ff]/15"
        style={{ background: 'rgba(15, 37, 64, 0.95)', backdropFilter: 'blur(20px)' }}
      >
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`当前能力：${activeCapability.shortTitle}。输入你的需求或粘贴原始材料，Shift+Enter 换行，Enter 发送...`}
                className="min-h-[44px] max-h-[120px] pr-12 py-3 resize-none text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(30, 58, 95, 0.5)',
                  border: '1px solid rgba(126, 167, 255, 0.2)'
                }}
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 text-xs text-white/20">
                {input.length}/500
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || Boolean(activeMediaType && !hasOperationalMediaProvider)}
              className="h-11 w-11 p-0 flex-shrink-0 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6f98ff 0%, #4f7ceb 100%)'
              }}
            >
              <Send className="w-4 h-4 text-[#0a1628]" />
            </Button>
          </div>
          <p className="text-xs text-white/30 mt-2 text-left">
            当前能力包：{activeCapability.title} · 推荐路由 {activeCapability.recommendedRoute} · 推荐模型 {activeCapability.recommendedModel}
          </p>
          <p className="text-xs text-white/25 mt-1 text-left">
            当前工单：{activeWorkflow ? `${activeWorkflow.title}（${workflowStatusLabel[activeWorkflow.status]}）` : '未绑定'} ·
            输出模式：{activeMediaType ? `${activeMediaType.toUpperCase()} 媒体生成` : '文本推理'}
          </p>
          <p className="text-xs text-white/20 mt-1 text-center">
            AI生成的内容仅供参考，重要决策请以人工审核为准
          </p>
        </form>
      </div>
    </div>
    </AccessGuard>
    </DashboardLayout>
  );
}
