import { randomUUID } from 'node:crypto'
import { readPersistentJsonState, writePersistentJsonState } from '@/lib/server/persistent-json-store'

const MESSAGE_NAMESPACE = 'agents/history/messages'
const FILE_NAMESPACE = 'agents/history/files'
const DECISION_NAMESPACE = 'agents/history/decisions'

const MAX_MESSAGE_ITEMS = 8000
const MAX_FILE_ITEMS = 2000
const MAX_DECISION_ITEMS = 3000

export interface AgentHistoryMessageRecord {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  actor_id: string
  actor_role: string
  target_agent_id: string | null
  agent_id: string | null
  decision_level: number | null
  requires_human_review: boolean
  confidence_score: number | null
  request_id: string | null
  created_at: string
}

export interface AgentFileHistoryRecord {
  id: string
  session_id: string | null
  actor_id: string
  actor_role: string
  file_name: string
  mime_type: string
  file_size: number
  status: 'success' | 'failed'
  reason: string | null
  created_at: string
}

export interface AgentDecisionRecord {
  id: string
  session_id: string
  tenant_id: string
  title: string
  description: string
  decision_level: number
  source_agent_id: string
  assigned_to: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'critical' | 'high' | 'normal' | 'low'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface MessagePayload {
  items?: AgentHistoryMessageRecord[]
}

interface FilePayload {
  items?: AgentFileHistoryRecord[]
}

interface DecisionPayload {
  items?: AgentDecisionRecord[]
}

interface AppendChatTurnInput {
  sessionId: string
  actorId: string
  actorRole: string
  targetAgentId: string | null
  userMessage: string
  assistant: {
    agentId: string
    content: string
    decisionLevel: number
    requiresHumanReview: boolean
    confidenceScore: number | null
    requestId: string | null
  }
}

interface AppendFileRecordInput {
  sessionId?: string | null
  actorId: string
  actorRole: string
  fileName: string
  mimeType: string
  fileSize: number
  status: 'success' | 'failed'
  reason?: string | null
}

const safeTrim = (value: string, max = 8000) => value.trim().slice(0, max)
const safeRole = (value: string) => safeTrim(value || 'unknown', 40)
const nowIso = () => new Date().toISOString()

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const readMessageItems = async () => {
  const payload = (await readPersistentJsonState<MessagePayload>(MESSAGE_NAMESPACE)) || {}
  return Array.isArray(payload.items) ? payload.items : []
}

const writeMessageItems = async (items: AgentHistoryMessageRecord[]) => {
  await writePersistentJsonState(MESSAGE_NAMESPACE, {
    items: items.slice(-MAX_MESSAGE_ITEMS),
  })
}

const readFileItems = async () => {
  const payload = (await readPersistentJsonState<FilePayload>(FILE_NAMESPACE)) || {}
  return Array.isArray(payload.items) ? payload.items : []
}

const writeFileItems = async (items: AgentFileHistoryRecord[]) => {
  await writePersistentJsonState(FILE_NAMESPACE, {
    items: items.slice(-MAX_FILE_ITEMS),
  })
}

const readDecisionItems = async () => {
  const payload = (await readPersistentJsonState<DecisionPayload>(DECISION_NAMESPACE)) || {}
  return Array.isArray(payload.items) ? payload.items : []
}

const writeDecisionItems = async (items: AgentDecisionRecord[]) => {
  await writePersistentJsonState(DECISION_NAMESPACE, {
    items: items.slice(-MAX_DECISION_ITEMS),
  })
}

const findExistingDecision = (items: AgentDecisionRecord[], input: AppendChatTurnInput) =>
  items.find(
    (item) =>
      item.session_id === input.sessionId &&
      item.source_agent_id === input.assistant.agentId &&
      item.title.includes(safeTrim(input.userMessage, 36))
  )

const buildDecisionPriority = (input: AppendChatTurnInput): AgentDecisionRecord['priority'] => {
  if (input.assistant.requiresHumanReview && input.assistant.decisionLevel >= 4) return 'critical'
  if (input.assistant.requiresHumanReview) return 'high'
  if (input.assistant.decisionLevel >= 3) return 'normal'
  return 'low'
}

const buildDueDate = (decisionLevel: number) => {
  const hours = decisionLevel >= 4 ? 2 : decisionLevel >= 3 ? 8 : 24
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

const upsertDecisionFromTurn = async (input: AppendChatTurnInput) => {
  if (input.assistant.decisionLevel < 2 && !input.assistant.requiresHumanReview) return

  const now = nowIso()
  const decisionItems = await readDecisionItems()
  const existing = findExistingDecision(decisionItems, input)

  if (existing) {
    existing.updated_at = now
    existing.priority = buildDecisionPriority(input)
    await writeDecisionItems(decisionItems)
    return
  }

  const next: AgentDecisionRecord = {
    id: randomUUID(),
    session_id: input.sessionId,
    tenant_id: 'default',
    title: `【${input.assistant.agentId}】${safeTrim(input.userMessage, 36)}`,
    description: safeTrim(input.assistant.content, 400),
    decision_level: clamp(input.assistant.decisionLevel, 1, 4),
    source_agent_id: input.assistant.agentId,
    assigned_to: input.assistant.decisionLevel >= 4 ? 'CEO审批' : '相关CxO执行',
    status: 'pending',
    priority: buildDecisionPriority(input),
    due_date: buildDueDate(input.assistant.decisionLevel),
    completed_at: null,
    created_at: now,
    updated_at: now,
  }

  await writeDecisionItems([...decisionItems, next])
}

export async function appendChatTurn(input: AppendChatTurnInput) {
  const timestamp = nowIso()
  const items = await readMessageItems()

  const userRecord: AgentHistoryMessageRecord = {
    id: randomUUID(),
    session_id: safeTrim(input.sessionId, 120),
    role: 'user',
    content: safeTrim(input.userMessage, 8000),
    actor_id: safeTrim(input.actorId, 80),
    actor_role: safeRole(input.actorRole),
    target_agent_id: input.targetAgentId ? safeTrim(input.targetAgentId, 64) : null,
    agent_id: null,
    decision_level: null,
    requires_human_review: false,
    confidence_score: null,
    request_id: input.assistant.requestId ? safeTrim(input.assistant.requestId, 120) : null,
    created_at: timestamp,
  }

  const assistantRecord: AgentHistoryMessageRecord = {
    id: randomUUID(),
    session_id: safeTrim(input.sessionId, 120),
    role: 'assistant',
    content: safeTrim(input.assistant.content, 12000),
    actor_id: safeTrim(input.actorId, 80),
    actor_role: safeRole(input.actorRole),
    target_agent_id: input.targetAgentId ? safeTrim(input.targetAgentId, 64) : null,
    agent_id: safeTrim(input.assistant.agentId, 64),
    decision_level: clamp(input.assistant.decisionLevel, 1, 4),
    requires_human_review: input.assistant.requiresHumanReview,
    confidence_score:
      typeof input.assistant.confidenceScore === 'number'
        ? clamp(input.assistant.confidenceScore, 0, 1)
        : null,
    request_id: input.assistant.requestId ? safeTrim(input.assistant.requestId, 120) : null,
    created_at: timestamp,
  }

  await writeMessageItems([...items, userRecord, assistantRecord])
  await upsertDecisionFromTurn(input)
}

export interface SessionSummary {
  session_id: string
  updated_at: string
  latest_agent_id: string | null
  latest_preview: string
  message_count: number
}

export async function listSessionSummaries(limit = 30): Promise<SessionSummary[]> {
  const items = await readMessageItems()
  const grouped = new Map<string, SessionSummary>()

  for (const record of items) {
    const existing = grouped.get(record.session_id)
    if (!existing) {
      grouped.set(record.session_id, {
        session_id: record.session_id,
        updated_at: record.created_at,
        latest_agent_id: record.agent_id,
        latest_preview: safeTrim(record.content, 120),
        message_count: 1,
      })
      continue
    }

    existing.message_count += 1
    if (record.created_at >= existing.updated_at) {
      existing.updated_at = record.created_at
      existing.latest_agent_id = record.agent_id
      existing.latest_preview = safeTrim(record.content, 120)
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, clamp(limit, 1, 200))
}

export async function listSessionMessages(sessionId: string, limit = 200) {
  const normalizedSessionId = safeTrim(sessionId, 120)
  const items = await readMessageItems()
  return items
    .filter((item) => item.session_id === normalizedSessionId)
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .slice(-clamp(limit, 1, 1000))
}

export async function appendFileHistory(input: AppendFileRecordInput) {
  const timestamp = nowIso()
  const items = await readFileItems()

  const next: AgentFileHistoryRecord = {
    id: randomUUID(),
    session_id: input.sessionId ? safeTrim(input.sessionId, 120) : null,
    actor_id: safeTrim(input.actorId, 80),
    actor_role: safeRole(input.actorRole),
    file_name: safeTrim(input.fileName, 180),
    mime_type: safeTrim(input.mimeType, 120),
    file_size: clamp(input.fileSize || 0, 0, 1024 * 1024 * 1024),
    status: input.status,
    reason: input.reason ? safeTrim(input.reason, 280) : null,
    created_at: timestamp,
  }

  await writeFileItems([...items, next])
}

export async function listFileHistory(limit = 100, sessionId?: string) {
  const items = await readFileItems()
  const normalizedSessionId = sessionId ? safeTrim(sessionId, 120) : null
  return items
    .filter((item) => (normalizedSessionId ? item.session_id === normalizedSessionId : true))
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, clamp(limit, 1, 500))
}

export async function listDecisionHistory(
  filter: {
    status?: AgentDecisionRecord['status']
    priority?: AgentDecisionRecord['priority']
    agentId?: string
    limit?: number
  } = {}
) {
  const items = await readDecisionItems()
  const limit = clamp(filter.limit || 50, 1, 200)
  return items
    .filter((item) => (filter.status ? item.status === filter.status : true))
    .filter((item) => (filter.priority ? item.priority === filter.priority : true))
    .filter((item) => (filter.agentId ? item.source_agent_id === filter.agentId : true))
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, limit)
}

export async function updateDecisionHistoryStatus(
  decisionId: string,
  status: AgentDecisionRecord['status']
) {
  const items = await readDecisionItems()
  const target = items.find((item) => item.id === safeTrim(decisionId, 80))
  if (!target) return null

  target.status = status
  target.updated_at = nowIso()
  target.completed_at = status === 'completed' ? target.updated_at : null
  await writeDecisionItems(items)
  return target
}

export async function buildAgentLocalMetrics() {
  const items = await readMessageItems()
  const assistantItems = items.filter((item) => item.role === 'assistant')
  const userItems = items.filter((item) => item.role === 'user')

  const confidenceList = assistantItems
    .map((item) => item.confidence_score)
    .filter((value): value is number => typeof value === 'number')

  const confidenceSum = confidenceList.reduce((sum, value) => sum + value, 0)
  const avgConfidence = confidenceList.length ? confidenceSum / confidenceList.length : 0

  const reviewCount = assistantItems.filter((item) => item.requires_human_review).length
  const sessionSet = new Set(userItems.map((item) => item.session_id))

  return {
    totalRequests: userItems.length,
    avgConfidence,
    humanReviewRate: userItems.length ? reviewCount / userItems.length : 0,
    activeSessions: sessionSet.size,
    injectionBlocks: 0,
  }
}
