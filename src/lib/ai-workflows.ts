import { buildApiUrl } from '@/lib/runtime-config'
import { AiAgentCapabilityId, getAiAgentCapabilityById } from '@/lib/ai-agent-capabilities'
import { LlmProviderId, LlmRouteProfileId } from '@/lib/llm-catalog'

export type AiWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed'

export type AiWorkflowOutputType = 'text' | 'audio' | 'image' | 'video' | 'mixed'

export interface AiWorkflowTimelineItem {
  at: string
  actor: string
  action: string
  note?: string
}

export interface AiWorkflowArtifact {
  mediaType: 'audio' | 'image' | 'video' | 'document' | 'other'
  url: string
  mimeType?: string
  title?: string
}

export interface AiWorkflowApproval {
  approver: string
  decision: 'approved' | 'rejected'
  decisionAt: string
  comment?: string
}

export interface AiWorkflowItem {
  id: string
  capabilityId: AiAgentCapabilityId
  title: string
  prompt: string
  status: AiWorkflowStatus
  outputType: AiWorkflowOutputType
  routeId: LlmRouteProfileId
  providerId: LlmProviderId
  model: string
  owner: string
  dueAt: string
  createdAt: string
  updatedAt: string
  createdBy: string
  artifacts: AiWorkflowArtifact[]
  approval?: AiWorkflowApproval
  timeline: AiWorkflowTimelineItem[]
}

export interface CreateAiWorkflowInput {
  capabilityId: AiAgentCapabilityId
  title?: string
  prompt: string
  outputType?: AiWorkflowOutputType
  routeId: LlmRouteProfileId
  providerId: LlmProviderId
  model: string
  owner?: string
  dueAt?: string
}

export interface UpdateAiWorkflowInput {
  status: AiWorkflowStatus
  note?: string
  approver?: string
}

const buildAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const inferOutputType = (capabilityId: AiAgentCapabilityId): AiWorkflowOutputType => {
  if (capabilityId === 'audio_generation') return 'audio'
  if (capabilityId === 'image_generation') return 'image'
  if (capabilityId === 'video_generation') return 'video'
  if (capabilityId === 'social_content') return 'mixed'
  return 'text'
}

export const buildWorkflowTitle = (capabilityId: AiAgentCapabilityId, fallbackTitle = '') => {
  const capability = getAiAgentCapabilityById(capabilityId)
  const normalized = fallbackTitle.trim()
  if (normalized) return normalized
  const prefix = capability?.title || 'AI 任务'
  return `${prefix} - ${new Date().toLocaleDateString('zh-CN')}`
}

export const fetchAiWorkflows = async (token?: string): Promise<AiWorkflowItem[]> => {
  const response = await fetch(buildApiUrl('/ai/workflows'), {
    method: 'GET',
    headers: buildAuthHeaders(token),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`读取 AI 工单失败 (${response.status})`)
  }
  const payload = await response.json()
  return Array.isArray(payload?.items) ? (payload.items as AiWorkflowItem[]) : []
}

export const createAiWorkflow = async (
  input: CreateAiWorkflowInput,
  token?: string
): Promise<AiWorkflowItem> => {
  const response = await fetch(buildApiUrl('/ai/workflows'), {
    method: 'POST',
    headers: buildAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({
      ...input,
      title: buildWorkflowTitle(input.capabilityId, input.title),
      outputType: input.outputType || inferOutputType(input.capabilityId),
    }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.message || `创建 AI 工单失败 (${response.status})`)
  }
  const payload = await response.json()
  return payload.item as AiWorkflowItem
}

export const updateAiWorkflow = async (
  workflowId: string,
  input: UpdateAiWorkflowInput,
  token?: string
): Promise<AiWorkflowItem> => {
  const response = await fetch(buildApiUrl(`/ai/workflows/${encodeURIComponent(workflowId)}`), {
    method: 'PATCH',
    headers: buildAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.message || `更新 AI 工单失败 (${response.status})`)
  }
  const payload = await response.json()
  return payload.item as AiWorkflowItem
}
