import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  AiWorkflowApproval,
  AiWorkflowArtifact,
  AiWorkflowItem,
  AiWorkflowStatus,
  AiWorkflowTimelineItem,
} from '@/lib/ai-workflows'
import { AiAgentCapabilityId, AI_AGENT_CAPABILITY_LIBRARY } from '@/lib/ai-agent-capabilities'
import { LLM_PROVIDER_CATALOG, LLM_ROUTE_PROFILE_LIBRARY, LlmProviderId, LlmRouteProfileId } from '@/lib/llm-catalog'

const AI_WORKFLOW_COOKIE_NAME = 'sk_ai_workflow_v1'
const AI_WORKFLOW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16
const MAX_WORKFLOWS = 24
const MAX_TEXT_LENGTH = 4000
const MAX_TIMELINE_LENGTH = 20
const MAX_ARTIFACTS_LENGTH = 8

const DEFAULT_OWNER = 'AI 管理中心'

const isCapabilityId = (value: string): value is AiAgentCapabilityId =>
  AI_AGENT_CAPABILITY_LIBRARY.some((item) => item.id === value)

const isProviderId = (value: string): value is LlmProviderId =>
  LLM_PROVIDER_CATALOG.some((item) => item.id === value)

const isRouteId = (value: string): value is LlmRouteProfileId =>
  LLM_ROUTE_PROFILE_LIBRARY.some((item) => item.id === value)

const isWorkflowStatus = (value: string): value is AiWorkflowStatus =>
  ['draft', 'submitted', 'approved', 'rejected', 'executing', 'completed', 'failed'].includes(value)

const clip = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, MAX_TEXT_LENGTH)
}

const normalizeTimeline = (value: unknown): AiWorkflowTimelineItem[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Partial<AiWorkflowTimelineItem>
      if (!record.at || !record.actor || !record.action) return null
      return {
        at: clip(record.at),
        actor: clip(record.actor),
        action: clip(record.action),
        note: clip(record.note),
      } satisfies AiWorkflowTimelineItem
    })
    .filter(Boolean)
    .slice(0, MAX_TIMELINE_LENGTH) as AiWorkflowTimelineItem[]
}

const normalizeArtifacts = (value: unknown): AiWorkflowArtifact[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Partial<AiWorkflowArtifact>
      const mediaType = clip(record.mediaType)
      const url = clip(record.url)
      if (!mediaType || !url) return null
      return {
        mediaType:
          mediaType === 'audio' || mediaType === 'image' || mediaType === 'video' || mediaType === 'document'
            ? mediaType
            : 'other',
        url: url.slice(0, 2048),
        mimeType: clip(record.mimeType).slice(0, 120),
        title: clip(record.title).slice(0, 120),
      } satisfies AiWorkflowArtifact
    })
    .filter(Boolean)
    .slice(0, MAX_ARTIFACTS_LENGTH) as AiWorkflowArtifact[]
}

const normalizeApproval = (value: unknown): AiWorkflowApproval | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<AiWorkflowApproval>
  const decision = clip(record.decision)
  if (decision !== 'approved' && decision !== 'rejected') return undefined
  return {
    approver: clip(record.approver),
    decision,
    decisionAt: clip(record.decisionAt),
    comment: clip(record.comment),
  } satisfies AiWorkflowApproval
}

const normalizeWorkflowItem = (value: unknown): AiWorkflowItem | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<AiWorkflowItem>
  const capabilityId = clip(record.capabilityId)
  const status = clip(record.status)
  const providerId = clip(record.providerId)
  const routeId = clip(record.routeId)

  if (!record.id || !isCapabilityId(capabilityId) || !isWorkflowStatus(status) || !isProviderId(providerId) || !isRouteId(routeId)) {
    return null
  }

  return {
    id: clip(record.id).slice(0, 80),
    capabilityId,
    title: clip(record.title),
    prompt: clip(record.prompt),
    status,
    outputType:
      record.outputType === 'audio' ||
      record.outputType === 'image' ||
      record.outputType === 'video' ||
      record.outputType === 'mixed'
        ? record.outputType
        : 'text',
    routeId,
    providerId,
    model: clip(record.model),
    owner: clip(record.owner, DEFAULT_OWNER),
    dueAt: clip(record.dueAt, '待排期'),
    createdAt: clip(record.createdAt),
    updatedAt: clip(record.updatedAt),
    createdBy: clip(record.createdBy, 'manager'),
    artifacts: normalizeArtifacts(record.artifacts),
    approval: normalizeApproval(record.approval),
    timeline: normalizeTimeline(record.timeline),
  } satisfies AiWorkflowItem
}

const sortWorkflows = (items: AiWorkflowItem[]) =>
  [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

const getEncryptionSecret = () => {
  const configuredSecret =
    process.env.AI_WORKFLOW_SECRET || process.env.LLM_CONFIG_SECRET || process.env.AUTH_SECRET
  if (configuredSecret?.trim()) {
    return configuredSecret.trim()
  }

  const fallbackSeed = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.cwd(),
    'starkitchen-ai-workflow-fallback',
  ]
    .filter((item) => Boolean(item && item.trim()))
    .join('|')

  return createHash('sha256').update(fallbackSeed).digest('hex')
}

const deriveAesKey = (secret: string) => createHash('sha256').update(secret).digest()

const encryptPayload = (value: unknown) => {
  const iv = randomBytes(IV_BYTES)
  const key = deriveAesKey(getEncryptionSecret())
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
}

const decryptPayload = (value: string): unknown => {
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length <= IV_BYTES + AUTH_TAG_BYTES) {
    throw new Error('Invalid workflow cookie payload')
  }
  const iv = decoded.subarray(0, IV_BYTES)
  const authTag = decoded.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES)
  const encrypted = decoded.subarray(IV_BYTES + AUTH_TAG_BYTES)
  const key = deriveAesKey(getEncryptionSecret())
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  return JSON.parse(decrypted)
}

export const readAiWorkflowItems = (request: NextRequest): AiWorkflowItem[] => {
  const encrypted = request.cookies.get(AI_WORKFLOW_COOKIE_NAME)?.value
  if (!encrypted) return []
  try {
    const parsed = decryptPayload(encrypted)
    if (!Array.isArray(parsed)) return []
    const items = parsed.map((item) => normalizeWorkflowItem(item)).filter(Boolean) as AiWorkflowItem[]
    return sortWorkflows(items).slice(0, MAX_WORKFLOWS)
  } catch (error) {
    console.warn('Failed to parse AI workflow cookie, fallback to empty list.', error)
    return []
  }
}

export const writeAiWorkflowItems = (
  response: NextResponse,
  items: AiWorkflowItem[]
) => {
  const normalizedItems = sortWorkflows(items).slice(0, MAX_WORKFLOWS)
  const encrypted = encryptPayload(normalizedItems)
  response.cookies.set({
    name: AI_WORKFLOW_COOKIE_NAME,
    value: encrypted,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AI_WORKFLOW_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

export const jsonWithAiWorkflowItems = <T extends object>(
  payload: T,
  itemsToPersist?: AiWorkflowItem[],
  init?: ResponseInit
) => {
  const response = NextResponse.json(payload, init)
  if (itemsToPersist) {
    writeAiWorkflowItems(response, itemsToPersist)
  }
  return response
}
