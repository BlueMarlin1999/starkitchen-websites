import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AGENT_PROFILES, getAgentProfileById, normalizeAgentId } from '@/components/AgentLegion/types'
import { getAgentDepartmentOwner } from '@/lib/agent-department-map'
import { getMockRoleByEmployeeId, normalizeRole } from '@/lib/access'
import { createEmbeddedSessionToken } from '@/lib/server/auth-session'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  appendImBridgeFileLog,
  appendImBridgeMessageLog,
  findImAgentChannel,
  listImAgentChannels,
  upsertImAgentChannel,
} from '@/lib/server/im-bridge-store'
import { sendImReplyToPlatform } from '@/lib/server/im-platform-sender'
import { appendFileHistory } from '@/lib/server/agents-history-store'
import { appendOaAuditByRequest } from '@/lib/server/oa/context'
import { appendOaMessage, createOaRoom, findOaContactByPlatformIdentity } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const platformSchema = z.enum(['wecom', 'feishu'])
const modeSchema = z.enum(['group', 'direct'])

const challengeQuerySchema = z.object({
  challenge: z.string().trim().max(200).optional(),
  echostr: z.string().trim().max(200).optional(),
})

const webhookPayloadSchema = z
  .object({
    mode: modeSchema.optional(),
    externalChatId: z.string().trim().max(180).optional(),
    externalChatName: z.string().trim().max(180).optional(),
    externalMessageId: z.string().trim().max(180).optional(),
    senderEmployeeId: z.string().trim().max(80).optional(),
    senderName: z.string().trim().max(120).optional(),
    content: z.string().trim().max(12000).optional(),
    targetAgentId: z.string().trim().max(64).optional(),
    attachments: z
      .array(
        z.object({
          fileName: z.string().trim().min(1).max(220),
          mimeType: z.string().trim().max(120).optional(),
          fileSize: z.number().int().min(0).max(1024 * 1024 * 1024).optional(),
          downloadUrl: z.string().trim().max(800).optional(),
        })
      )
      .max(8)
      .optional()
      .default([]),
  })
  .passthrough()

interface NormalizedAttachment {
  fileName: string
  mimeType: string
  fileSize: number
  downloadUrl: string
}

interface NormalizedInboundPayload {
  mode: 'group' | 'direct'
  externalChatId: string
  externalChatName: string
  externalMessageId: string
  senderEmployeeId: string
  senderName: string
  targetAgentId: string
  content: string
  attachments: NormalizedAttachment[]
}

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const toInt = (value: unknown, fallback = 0, max = 1024 * 1024 * 1024) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(max, Math.round(value)))
}

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

const allowUnsignedWebhookByEnv = parseBooleanFlag(process.env.ALLOW_UNSIGNED_IM_WEBHOOK)
const ALLOW_UNSIGNED_WEBHOOK = allowUnsignedWebhookByEnv ?? process.env.NODE_ENV !== 'production'

const resolveExpectedWebhookToken = (platform: 'wecom' | 'feishu') =>
  platform === 'wecom'
    ? clip(process.env.WECOM_WEBHOOK_TOKEN, '', 200)
    : clip(process.env.FEISHU_WEBHOOK_TOKEN, '', 200)

const resolveProvidedWebhookToken = (request: NextRequest, platform: 'wecom' | 'feishu') => {
  const fromHeader = clip(request.headers.get('x-im-token'), '', 200)
  if (fromHeader) return fromHeader
  const platformHeader =
    platform === 'wecom'
      ? clip(request.headers.get('x-wecom-token'), '', 200)
      : clip(request.headers.get('x-feishu-token'), '', 200)
  if (platformHeader) return platformHeader
  return clip(request.nextUrl.searchParams.get('token'), '', 200)
}

const verifyWebhookToken = (request: NextRequest, platform: 'wecom' | 'feishu') => {
  const expected = resolveExpectedWebhookToken(platform)
  const provided = resolveProvidedWebhookToken(request, platform)
  if (expected) return expected === provided
  return ALLOW_UNSIGNED_WEBHOOK
}

const safeSessionSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

const buildSessionId = (platform: 'wecom' | 'feishu', chatId: string) =>
  safeSessionSegment(`im-${platform}-${chatId}`) || `im-${platform}-session`

const parseFeishuContent = (value: unknown) => {
  const raw = clip(value, '', 12000)
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { text?: unknown }
    return clip(parsed?.text, raw, 12000)
  } catch {
    return raw
  }
}

const normalizeAttachmentList = (payload: Record<string, unknown>): NormalizedAttachment[] => {
  const rawList = Array.isArray(payload.attachments) ? payload.attachments : []
  return rawList
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      return {
        fileName: clip(record.fileName, 'unnamed.bin', 220),
        mimeType: clip(record.mimeType, 'application/octet-stream', 120),
        fileSize: toInt(record.fileSize, 0),
        downloadUrl: clip(record.downloadUrl, '', 800),
      }
    })
    .filter((item): item is NormalizedAttachment => Boolean(item))
}

interface InboundRefs {
  event: Record<string, unknown>
  message: Record<string, unknown>
  sender: Record<string, unknown>
  senderIdRecord: Record<string, unknown>
}

const buildInboundRefs = (payload: Record<string, unknown>): InboundRefs => {
  const event = (payload.event || payload.data || {}) as Record<string, unknown>
  const message = (event.message || payload.message || {}) as Record<string, unknown>
  const sender = (event.sender || payload.sender || {}) as Record<string, unknown>
  const senderIdRecord = (sender.sender_id || {}) as Record<string, unknown>
  return { event, message, sender, senderIdRecord }
}

const resolveExternalChatId = (payload: Record<string, unknown>, refs: InboundRefs) =>
  clip(payload.externalChatId, '', 180) ||
  clip(payload.chatid, '', 180) ||
  clip(payload.conversation_id, '', 180) ||
  clip(refs.message.chat_id, '', 180) ||
  clip(refs.event.chat_id, '', 180) ||
  `fallback-${Date.now().toString(36)}`

const resolveInboundContent = (payload: Record<string, unknown>, refs: InboundRefs) =>
  clip(payload.content, '', 12000) ||
  clip((payload.text as Record<string, unknown> | undefined)?.content, '', 12000) ||
  parseFeishuContent(refs.message.content) ||
  clip((payload.text as Record<string, unknown> | undefined)?.text, '', 12000)

const resolveInboundSender = (payload: Record<string, unknown>, refs: InboundRefs) => {
  const senderEmployeeId =
    clip(payload.senderEmployeeId, '', 80) ||
    clip(payload.user_id, '', 80) ||
    clip((payload.from as Record<string, unknown> | undefined)?.userid, '', 80) ||
    clip(refs.senderIdRecord.user_id, '', 80) ||
    clip(refs.senderIdRecord.open_id, '', 80) ||
    'external-user'
  const senderName =
    clip(payload.senderName, '', 120) ||
    clip((payload.from as Record<string, unknown> | undefined)?.name, '', 120) ||
    clip(refs.sender.sender_name, '', 120) ||
    senderEmployeeId
  return { senderEmployeeId, senderName }
}

const resolveInboundMessageId = (payload: Record<string, unknown>, refs: InboundRefs) =>
  clip(payload.externalMessageId, '', 180) ||
  clip(payload.msgid, '', 180) ||
  clip(payload.message_id, '', 180) ||
  clip(refs.message.message_id, '', 180) ||
  randomUUID()

const resolveInboundChatName = (
  platform: 'wecom' | 'feishu',
  payload: Record<string, unknown>,
  refs: InboundRefs
) => {
  const byPlatform =
    platform === 'wecom'
      ? clip(payload.chat_name, '', 180)
      : clip((refs.event.chat as Record<string, unknown> | undefined)?.name, '', 180)
  return clip(payload.externalChatName, byPlatform, 180)
}

const normalizeInboundPayload = (
  platform: 'wecom' | 'feishu',
  payload: Record<string, unknown>
): NormalizedInboundPayload => {
  const refs = buildInboundRefs(payload)
  const directFromRaw =
    clip(payload.mode, '', 20).toLowerCase() === 'direct' ||
    clip(refs.message.chat_type, '', 20).toLowerCase() === 'p2p'
  const sender = resolveInboundSender(payload, refs)

  return {
    mode: directFromRaw ? 'direct' : 'group',
    externalChatId: resolveExternalChatId(payload, refs),
    externalChatName: resolveInboundChatName(platform, payload, refs),
    externalMessageId: resolveInboundMessageId(payload, refs),
    senderEmployeeId: sender.senderEmployeeId,
    senderName: sender.senderName,
    targetAgentId: normalizeAgentId(clip(payload.targetAgentId, '', 64)),
    content: resolveInboundContent(payload, refs),
    attachments: normalizeAttachmentList(payload),
  }
}

const applyInboundSenderContactMapping = async (input: {
  platform: 'wecom' | 'feishu'
  normalized: NormalizedInboundPayload
}) => {
  const contact = await findOaContactByPlatformIdentity({
    platform: input.platform,
    identity: input.normalized.senderEmployeeId,
  })
  if (!contact) return input.normalized
  return {
    ...input.normalized,
    senderEmployeeId: contact.employeeId,
    senderName: contact.name || input.normalized.senderName,
  }
}

const resolveAgentByMessage = (input: {
  targetAgentId: string
  fallbackAgentId: string
  content: string
}) => {
  if (getAgentProfileById(input.targetAgentId)) return input.targetAgentId
  if (getAgentProfileById(input.fallbackAgentId)) return input.fallbackAgentId

  const lowered = input.content.toLowerCase()
  const matched = AGENT_PROFILES.find((agent) => {
    const keywords = [agent.role, agent.name_zh, agent.name_en, agent.domain]
    return keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))
  })
  return matched?.id || 'cos_zhuge_liang'
}

const ensureChannelBinding = async (input: {
  platform: 'wecom' | 'feishu'
  mode: 'group' | 'direct'
  externalChatId: string
  externalChatName: string
  senderEmployeeId: string
  targetAgentId: string
}) => {
  const current = await findImAgentChannel({
    platform: input.platform,
    externalChatId: input.externalChatId,
    mode: input.mode,
  })
  if (current) return current

  const targetAgent = resolveAgentByMessage({
    targetAgentId: input.targetAgentId,
    fallbackAgentId: '',
    content: '',
  })
  const owner = getAgentDepartmentOwner(targetAgent)
  const room = await createOaRoom({
    name:
      clip(input.externalChatName, '', 180) ||
      `${input.platform.toUpperCase()} · ${targetAgent} · ${input.mode === 'group' ? '群聊' : '私聊'}`,
    type: input.mode === 'direct' ? 'direct' : 'group',
    members: [owner.ownerEmployeeId, input.senderEmployeeId, `agent:${targetAgent}`, 'Marlins'],
    actorId: owner.ownerEmployeeId || 'Marlins',
  })

  return upsertImAgentChannel({
    platform: input.platform,
    agentId: targetAgent,
    mode: input.mode,
    ownerEmployeeId: owner.ownerEmployeeId,
    ownerName: owner.ownerName,
    ownerTitle: owner.ownerTitle,
    orgUnitId: owner.orgUnitId,
    oaRoomId: room.id,
    externalChatId: input.externalChatId,
    externalChatName: clip(input.externalChatName, room.name, 180),
    status: 'active',
  })
}

const appendInboundRoomMessage = async (input: {
  roomId: string
  senderEmployeeId: string
  senderName: string
  ownerEmployeeId: string
  content: string
  attachments: NormalizedAttachment[]
}) => {
  const attachmentHint = input.attachments.length
    ? `\n\n附件：${input.attachments.map((item) => item.fileName).join('，')}`
    : ''
  const messageContent = `${input.content || '（空消息）'}${attachmentHint}`

  try {
    await appendOaMessage({
      roomId: input.roomId,
      actorId: input.senderEmployeeId,
      actorName: input.senderName,
      content: messageContent,
      attachments: [],
    })
  } catch {
    await appendOaMessage({
      roomId: input.roomId,
      actorId: input.ownerEmployeeId,
      actorName: input.ownerEmployeeId,
      content: `【${input.senderName}】${messageContent}`,
      attachments: [],
    })
  }
}

const resolveInternalAuthToken = (input: { senderEmployeeId: string; senderName: string; senderRole: string }) => {
  const embedded = createEmbeddedSessionToken({
    sub: `im-${input.senderEmployeeId}`,
    employeeId: input.senderEmployeeId,
    name: input.senderName,
    role: input.senderRole,
    scopePath: ['global'],
  })
  if (embedded) return embedded
  return (
    clip(process.env.LLM_ADMIN_TOKEN, '', 300) ||
    clip(process.env.LOCAL_ADMIN_TOKEN, '', 300)
  )
}

const callInternalAgentChat = async (input: {
  request: NextRequest
  senderEmployeeId: string
  senderName: string
  senderRole: string
  sessionId: string
  targetAgentId: string
  content: string
}) => {
  const authToken = resolveInternalAuthToken({
    senderEmployeeId: input.senderEmployeeId,
    senderName: input.senderName,
    senderRole: input.senderRole,
  })
  if (!authToken) {
    throw new Error('AGENT_CHAT_TOKEN_MISSING')
  }

  const response = await fetch(`${input.request.nextUrl.origin}/api/agents/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'x-user-role': input.senderRole,
      'x-employee-id': input.senderEmployeeId,
      'x-actor-name': encodeURIComponent(input.senderName),
    },
    body: JSON.stringify({
      message: input.content || '请根据上下文推进任务并反馈结果。',
      session_id: input.sessionId,
      high_stakes: false,
      target_agent_id: input.targetAgentId,
    }),
  })

  const payload = await response
    .json()
    .catch(async () => ({ message: await response.text().catch(() => '上游响应异常') }))
  if (!response.ok) {
    throw new Error(clip(payload?.message, `AGENT_CHAT_FAILED_${response.status}`, 260))
  }

  return {
    agentId: normalizeAgentId(clip(payload?.agent_id, 'cos_zhuge_liang', 64)),
    content: clip(payload?.content, '暂未生成回复，请稍后重试。', 12000),
    decisionLevel: typeof payload?.decision_level === 'number' ? payload.decision_level : 1,
    requiresHumanReview: payload?.requires_human_review === true,
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { platform: string } }
) {
  const parsedPlatform = platformSchema.safeParse(context.params.platform)
  if (!parsedPlatform.success) {
    return NextResponse.json({ message: '不支持的 IM 平台' }, { status: 404 })
  }
  const platform = parsedPlatform.data

  if (!verifyWebhookToken(request, platform)) {
    return NextResponse.json({ message: 'Webhook token 校验失败' }, { status: 401 })
  }

  const parsedQuery = parseQueryWithSchema(request, challengeQuerySchema, 'Webhook 验证参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }

  const challenge = clip(parsedQuery.data.challenge || parsedQuery.data.echostr || '', '', 200)
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return NextResponse.json({
    ok: true,
    platform,
    message: 'Webhook endpoint is ready',
  })
}

const resolveChannelForInbound = async (input: {
  platform: 'wecom' | 'feishu'
  normalized: NormalizedInboundPayload
}) => {
  const byChatId = await findImAgentChannel({
    platform: input.platform,
    externalChatId: input.normalized.externalChatId,
    mode: input.normalized.mode,
  })
  if (byChatId) return byChatId

  if (input.normalized.targetAgentId) {
    const byAgent = await listImAgentChannels({
      platform: input.platform,
      agentId: input.normalized.targetAgentId,
      mode: input.normalized.mode,
    })
    if (byAgent[0]) return byAgent[0]
  }

  return ensureChannelBinding({
    platform: input.platform,
    mode: input.normalized.mode,
    externalChatId: input.normalized.externalChatId,
    externalChatName: input.normalized.externalChatName,
    senderEmployeeId: input.normalized.senderEmployeeId,
    targetAgentId: input.normalized.targetAgentId || 'cos_zhuge_liang',
  })
}

const recordInboundArtifacts = async (input: {
  platform: 'wecom' | 'feishu'
  normalized: NormalizedInboundPayload
  resolvedAgentId: string
  channelId: string
  mode: 'group' | 'direct'
  oaRoomId: string
  sessionId: string
  senderRole: string
}) => {
  await appendImBridgeMessageLog({
    platform: input.platform,
    mode: input.mode,
    channelId: input.channelId,
    direction: 'inbound',
    senderEmployeeId: input.normalized.senderEmployeeId,
    senderName: input.normalized.senderName,
    externalChatId: input.normalized.externalChatId,
    externalMessageId: input.normalized.externalMessageId,
    targetAgentId: input.normalized.targetAgentId || input.resolvedAgentId,
    resolvedAgentId: input.resolvedAgentId,
    oaRoomId: input.oaRoomId,
    content: input.normalized.content || '（空消息）',
    status: 'success',
    error: null,
  })

  for (const file of input.normalized.attachments) {
    await appendImBridgeFileLog({
      platform: input.platform,
      mode: input.mode,
      channelId: input.channelId,
      senderEmployeeId: input.normalized.senderEmployeeId,
      senderName: input.normalized.senderName,
      externalChatId: input.normalized.externalChatId,
      externalMessageId: input.normalized.externalMessageId,
      targetAgentId: input.resolvedAgentId,
      oaRoomId: input.oaRoomId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      downloadUrl: file.downloadUrl,
      status: 'success',
      error: null,
    })
    await appendFileHistory({
      sessionId: input.sessionId,
      actorId: input.normalized.senderEmployeeId,
      actorRole: input.senderRole,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      status: 'success',
      reason: null,
    })
  }
}

const recordOutboundSuccess = async (input: {
  platform: 'wecom' | 'feishu'
  normalized: NormalizedInboundPayload
  resolvedAgentId: string
  channelId: string
  oaRoomId: string
  chatResult: Awaited<ReturnType<typeof callInternalAgentChat>>
  request: NextRequest
}) => {
  const agentProfile = getAgentProfileById(input.chatResult.agentId) || AGENT_PROFILES[0]
  await appendImBridgeMessageLog({
    platform: input.platform,
    mode: input.normalized.mode,
    channelId: input.channelId,
    direction: 'outbound',
    senderEmployeeId: `agent:${input.chatResult.agentId}`,
    senderName: `${agentProfile.role} · ${agentProfile.name_zh}`,
    externalChatId: input.normalized.externalChatId,
    externalMessageId: randomUUID(),
    targetAgentId: input.resolvedAgentId,
    resolvedAgentId: input.chatResult.agentId,
    oaRoomId: input.oaRoomId,
    content: input.chatResult.content,
    status: 'success',
    error: null,
  })
  await appendOaMessage({
    roomId: input.oaRoomId,
    actorId: `agent:${input.chatResult.agentId}`,
    actorName: `${agentProfile.role} · ${agentProfile.name_zh}`,
    content: input.chatResult.content,
    attachments: [],
  })
  await appendOaAuditByRequest(input.request, {
    action: 'im.webhook.receive',
    success: true,
    entityId: input.channelId,
    message: `${input.platform} webhook 处理成功，智能体：${input.chatResult.agentId}`,
  })
  return {
    agentId: input.chatResult.agentId,
    reply: input.chatResult.content,
    decisionLevel: input.chatResult.decisionLevel,
    requiresHumanReview: input.chatResult.requiresHumanReview,
  }
}

const recordOutboundFailure = async (input: {
  platform: 'wecom' | 'feishu'
  normalized: NormalizedInboundPayload
  resolvedAgentId: string
  channelId: string
  oaRoomId: string
  reason: string
  request: NextRequest
}) => {
  await appendImBridgeMessageLog({
    platform: input.platform,
    mode: input.normalized.mode,
    channelId: input.channelId,
    direction: 'outbound',
    senderEmployeeId: `agent:${input.resolvedAgentId}`,
    senderName: `agent:${input.resolvedAgentId}`,
    externalChatId: input.normalized.externalChatId,
    externalMessageId: randomUUID(),
    targetAgentId: input.resolvedAgentId,
    resolvedAgentId: input.resolvedAgentId,
    oaRoomId: input.oaRoomId,
    content: '',
    status: 'failed',
    error: input.reason,
  })
  await appendOaAuditByRequest(input.request, {
    action: 'im.webhook.receive',
    success: false,
    entityId: input.channelId,
    message: `${input.platform} webhook 调用智能体失败：${input.reason}`,
  })
}

const processWebhookPayload = async (input: {
  request: NextRequest
  platform: 'wecom' | 'feishu'
  payload: Record<string, unknown>
}) => {
  const normalizedRaw = normalizeInboundPayload(input.platform, input.payload)
  const normalized = await applyInboundSenderContactMapping({
    platform: input.platform,
    normalized: normalizedRaw,
  })
  const channel = await resolveChannelForInbound({ platform: input.platform, normalized })
  const resolvedAgentId = resolveAgentByMessage({
    targetAgentId: normalized.targetAgentId,
    fallbackAgentId: channel.agentId,
    content: normalized.content,
  })
  const sessionId = buildSessionId(input.platform, normalized.externalChatId)
  const senderRole = normalizeRole(getMockRoleByEmployeeId(normalized.senderEmployeeId))
  await recordInboundArtifacts({
    platform: input.platform,
    normalized,
    resolvedAgentId,
    channelId: channel.id,
    mode: channel.mode,
    oaRoomId: channel.oaRoomId,
    sessionId,
    senderRole,
  })
  await appendInboundRoomMessage({
    roomId: channel.oaRoomId,
    senderEmployeeId: normalized.senderEmployeeId,
    senderName: normalized.senderName,
    ownerEmployeeId: channel.ownerEmployeeId,
    content: normalized.content,
    attachments: normalized.attachments,
  })
  return { normalized, channel, resolvedAgentId, sessionId, senderRole }
}

const auditUnauthorizedWebhook = (request: NextRequest, platform: 'wecom' | 'feishu') =>
  appendOaAuditByRequest(request, {
    action: 'im.webhook.receive',
    success: false,
    message: `${platform} webhook token 校验失败`,
  })

const auditInvalidWebhookPayload = (request: NextRequest, platform: 'wecom' | 'feishu') =>
  appendOaAuditByRequest(request, {
    action: 'im.webhook.receive',
    success: false,
    message: `${platform} webhook 参数不合法`,
  })

const resolveWebhookPlatform = (platform: string) => {
  const parsed = platformSchema.safeParse(platform)
  if (!parsed.success) return null
  return parsed.data
}

const buildWebhookSuccessResponse = (input: {
  platform: 'wecom' | 'feishu'
  contextData: Awaited<ReturnType<typeof processWebhookPayload>>
  outbound: {
    agentId: string
    reply: string
    decisionLevel: number
    requiresHumanReview: boolean
  }
  platformDelivery: Awaited<ReturnType<typeof sendImReplyToPlatform>>
}) =>
  NextResponse.json({
    ok: true,
    platform: input.platform,
    channelId: input.contextData.channel.id,
    oaRoomId: input.contextData.channel.oaRoomId,
    sessionId: input.contextData.sessionId,
    platformDelivery: input.platformDelivery,
    ...input.outbound,
  })

const executeWebhookChat = async (input: {
  request: NextRequest
  platform: 'wecom' | 'feishu'
  contextData: Awaited<ReturnType<typeof processWebhookPayload>>
}) => {
  try {
    const chatResult = await callInternalAgentChat({
      request: input.request,
      senderEmployeeId: input.contextData.normalized.senderEmployeeId,
      senderName: input.contextData.normalized.senderName,
      senderRole: input.contextData.senderRole,
      sessionId: input.contextData.sessionId,
      targetAgentId: input.contextData.resolvedAgentId,
      content:
        input.contextData.normalized.content ||
        `请处理来自 ${input.contextData.normalized.senderName} 的任务，并给出执行计划。`,
    })
    const outbound = await recordOutboundSuccess({
      request: input.request,
      platform: input.platform,
      normalized: input.contextData.normalized,
      resolvedAgentId: input.contextData.resolvedAgentId,
      channelId: input.contextData.channel.id,
      oaRoomId: input.contextData.channel.oaRoomId,
      chatResult,
    })
    const platformDelivery = await sendImReplyToPlatform({
      platform: input.platform,
      mode: input.contextData.channel.mode,
      externalChatId: input.contextData.channel.externalChatId,
      senderEmployeeId: input.contextData.normalized.senderEmployeeId,
      reply: outbound.reply,
    })
    return buildWebhookSuccessResponse({ platform: input.platform, contextData: input.contextData, outbound, platformDelivery })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    await recordOutboundFailure({
      request: input.request,
      platform: input.platform,
      normalized: input.contextData.normalized,
      resolvedAgentId: input.contextData.resolvedAgentId,
      channelId: input.contextData.channel.id,
      oaRoomId: input.contextData.channel.oaRoomId,
      reason,
    })
    return NextResponse.json({ message: `智能体处理失败：${reason}` }, { status: 502 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { platform: string } }
) {
  const platform = resolveWebhookPlatform(context.params.platform)
  if (!platform) {
    return NextResponse.json({ message: '不支持的 IM 平台' }, { status: 404 })
  }

  if (!verifyWebhookToken(request, platform)) {
    await auditUnauthorizedWebhook(request, platform)
    return NextResponse.json({ message: 'Webhook token 校验失败' }, { status: 401 })
  }

  const parsedPayload = await parseJsonWithSchema(request, webhookPayloadSchema, 'Webhook 消息参数不合法。')
  if (!parsedPayload.ok) {
    await auditInvalidWebhookPayload(request, platform)
    return parsedPayload.response
  }

  const contextData = await processWebhookPayload({
    request,
    platform,
    payload: parsedPayload.data as Record<string, unknown>,
  })
  return executeWebhookChat({ request, platform, contextData })
}
