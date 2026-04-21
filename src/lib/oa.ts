import { buildApiUrl } from '@/lib/runtime-config'

export type OaRoomType = 'group' | 'direct' | 'project'

export interface OaActorContext {
  employeeId: string
  displayName: string
  role: string
}

export interface OaRoom {
  id: string
  name: string
  type: OaRoomType
  members: string[]
  createdAt: string
  updatedAt: string
  lastMessageAt: string
}

export interface OaAttachment {
  fileId: string
  fileName: string
}

export interface OaMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  attachments: OaAttachment[]
  createdAt: string
}

export interface OaFileRecord {
  id: string
  roomId: string
  uploaderId: string
  uploaderName: string
  originalName: string
  storedName: string
  mimeType: string
  size: number
  uploadedAt: string
}

export type OaCallMode = 'voice' | 'video'

export interface OaCallSession {
  id: string
  mode: OaCallMode
  title: string
  roomId: string
  participants: string[]
  createdBy: string
  createdByName: string
  provider: 'jitsi'
  meetingCode: string
  joinUrl: string
  startedAt: string
}

export type OaMeetingStatus = 'scheduled' | 'live' | 'completed'

export interface OaMeetingSession {
  id: string
  title: string
  agenda: string
  roomId: string
  participants: string[]
  createdBy: string
  createdByName: string
  provider: 'jitsi'
  meetingCode: string
  joinUrl: string
  startsAt: string
  durationMinutes: number
  createdAt: string
  updatedAt: string
  status: OaMeetingStatus
}

export type OaContactStatus = 'active' | 'inactive'

export interface OaOrgUnit {
  id: string
  name: string
  parentId: string
  managerEmployeeId: string
  createdAt: string
  updatedAt: string
}

export interface OaContact {
  employeeId: string
  name: string
  title: string
  orgUnitId: string
  mobile: string
  email: string
  wecomUserId: string
  feishuUserId: string
  feishuOpenId: string
  status: OaContactStatus
  createdAt: string
  updatedAt: string
}

export type OaAuditAction =
  | 'room.create'
  | 'room.read'
  | 'chat.read'
  | 'chat.message.send'
  | 'contacts.read'
  | 'contacts.create'
  | 'contacts.sync'
  | 'contacts.delete'
  | 'org.read'
  | 'org.create'
  | 'org.delete'
  | 'file.upload'
  | 'file.read'
  | 'file.download'
  | 'call.create'
  | 'call.read'
  | 'meeting.create'
  | 'meeting.read'
  | 'im.channels.read'
  | 'im.channels.bootstrap'
  | 'im.webhook.receive'
  | 'im.history.read'
  | 'audit.read'

export type OaImPlatform = 'wecom' | 'feishu'
export type OaImChannelMode = 'group' | 'direct'

export interface OaImIntegrationConfig {
  platform: OaImPlatform
  enabled: boolean
  appId: string
  tenantId: string
  webhookTokenHint: string
  updatedAt: string
  createdAt: string
}

export interface OaImAgentChannel {
  id: string
  platform: OaImPlatform
  agentId: string
  mode: OaImChannelMode
  ownerEmployeeId: string
  ownerName: string
  ownerTitle: string
  orgUnitId: string
  oaRoomId: string
  externalChatId: string
  externalChatName: string
  status: 'active' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface OaImBridgeMessageLog {
  id: string
  platform: OaImPlatform
  mode: OaImChannelMode
  channelId: string
  direction: 'inbound' | 'outbound'
  senderEmployeeId: string
  senderName: string
  externalChatId: string
  externalMessageId: string
  targetAgentId: string
  resolvedAgentId: string
  oaRoomId: string
  content: string
  status: 'success' | 'failed'
  error: string | null
  createdAt: string
}

export interface OaImBridgeFileLog {
  id: string
  platform: OaImPlatform
  mode: OaImChannelMode
  channelId: string
  senderEmployeeId: string
  senderName: string
  externalChatId: string
  externalMessageId: string
  targetAgentId: string
  oaRoomId: string
  fileName: string
  mimeType: string
  fileSize: number
  downloadUrl: string
  status: 'success' | 'failed'
  error: string | null
  createdAt: string
}

export interface OaAuditEvent {
  id: string
  timestamp: string
  action: OaAuditAction
  actorId: string
  actorName: string
  ipAddress: string
  geo: {
    country: string
    region: string
    city: string
  }
  userAgent: string
  path: string
  entityId: string
  success: boolean
  message: string
}

export interface OaAuditQueryResult {
  items: OaAuditEvent[]
  total: number
  page: number
  size: number
  summary: {
    uniqueIpCount: number
    uniqueActorCount: number
    failedCount: number
    todayCount: number
  }
}

export interface OaGaiaSyncResult {
  source: 'gaia-seed' | 'gaia-api'
  mode?: 'seed' | 'json' | 'csv'
  endpointHint?: string
  warnings?: string[]
  total: number
  imported: number
  created: number
  updated: number
  skipped: number
  orgCreated: number
  syncedAt: string
}

export type OaGaiaSyncSource = 'stored' | 'auto' | 'seed' | 'gaia-api'

export interface OaGaiaSyncInput {
  source?: Exclude<OaGaiaSyncSource, 'stored'>
  strictRemote?: boolean
  onlyActive?: boolean
  limit?: number
}

const safeJson = async (response: Response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const encodeHeaderValue = (value: unknown, max = 200) => {
  const normalized = clip(value, '', max)
  if (!normalized) return ''
  if (/^[\x20-\x7E]+$/.test(normalized)) return normalized
  return encodeURIComponent(normalized).slice(0, max)
}

const buildAuthHeaders = (token?: string, actor?: Partial<OaActorContext>) => {
  const employeeId = encodeHeaderValue(actor?.employeeId, 80)
  const displayName = encodeHeaderValue(actor?.displayName, 120)
  const role = encodeHeaderValue(actor?.role, 40)

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(employeeId ? { 'x-employee-id': employeeId } : {}),
    ...(displayName ? { 'x-actor-name': displayName } : {}),
    ...(role ? { 'x-user-role': role } : {}),
  }
}

const parseError = async (response: Response, fallback: string) => {
  const payload = await safeJson(response)
  return typeof payload?.message === 'string' && payload.message.trim() ? payload.message.trim() : fallback
}

export const fetchOaRooms = async (token?: string, actor?: Partial<OaActorContext>) => {
  const response = await fetch(buildApiUrl('/oa/chat/rooms'), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取会话失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaRoom[]
}

export const createOaRoom = async (
  input: { name: string; type: OaRoomType; members: string[] },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/chat/rooms'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建会话失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.room as OaRoom
}

export const fetchOaMessages = async (
  roomId: string,
  token?: string,
  actor?: Partial<OaActorContext>,
  limit = 120
) => {
  const params = new URLSearchParams()
  params.set('roomId', roomId)
  params.set('limit', String(limit))
  const response = await fetch(buildApiUrl(`/oa/chat/messages?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取消息失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaMessage[]
}

export const sendOaMessage = async (
  input: { roomId: string; content: string; attachments?: OaAttachment[] },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/chat/messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `发送消息失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.message as OaMessage
}

export const fetchOaOrgUnits = async (
  token?: string,
  actor?: Partial<OaActorContext>,
  sync?: OaGaiaSyncInput
) => {
  const params = new URLSearchParams()
  if (sync?.source) params.set('source', sync.source)
  if (sync?.strictRemote) params.set('strictRemote', 'true')
  if (sync?.onlyActive) params.set('onlyActive', 'true')
  if (typeof sync?.limit === 'number' && Number.isFinite(sync.limit)) {
    params.set('limit', String(Math.max(1, Math.min(5000, Math.round(sync.limit)))))
  }
  const query = params.toString()
  const response = await fetch(buildApiUrl(`/oa/org${query ? `?${query}` : ''}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取组织失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaOrgUnit[]
}

export const createOaOrgUnit = async (
  input: { name: string; parentId?: string; managerEmployeeId?: string },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/org'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建组织失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.orgUnit as OaOrgUnit
}

export const deleteOaOrgUnit = async (orgUnitId: string, token?: string, actor?: Partial<OaActorContext>) => {
  const params = new URLSearchParams()
  params.set('orgUnitId', orgUnitId)
  const response = await fetch(buildApiUrl(`/oa/org?${params.toString()}`), {
    method: 'DELETE',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `删除组织失败 (${response.status})`))
  }
}

export const fetchOaContacts = async (
  query: {
    search?: string
    orgUnitId?: string
    status?: OaContactStatus
    source?: OaGaiaSyncSource
    strictRemote?: boolean
    onlyActive?: boolean
    limit?: number
  },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.orgUnitId) params.set('orgUnitId', query.orgUnitId)
  if (query.status) params.set('status', query.status)
  if (query.source && query.source !== 'stored') params.set('source', query.source)
  if (query.strictRemote) params.set('strictRemote', 'true')
  if (query.onlyActive) params.set('onlyActive', 'true')
  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    params.set('limit', String(Math.max(1, Math.min(5000, Math.round(query.limit)))))
  }
  const response = await fetch(buildApiUrl(`/oa/contacts?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取联系人失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaContact[]
}

export const createOaContact = async (
  input: {
    employeeId: string
    name: string
    title?: string
    orgUnitId?: string
    mobile?: string
    email?: string
    wecomUserId?: string
    feishuUserId?: string
    feishuOpenId?: string
    status?: OaContactStatus
  },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/contacts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建联系人失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.contact as OaContact
}

export const deleteOaContact = async (employeeId: string, token?: string, actor?: Partial<OaActorContext>) => {
  const params = new URLSearchParams()
  params.set('employeeId', employeeId)
  const response = await fetch(buildApiUrl(`/oa/contacts?${params.toString()}`), {
    method: 'DELETE',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `删除联系人失败 (${response.status})`))
  }
}

export const syncOaContactsFromGaia = async (
  input: OaGaiaSyncInput = {},
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/contacts/sync'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `盖雅同步失败 (${response.status})`))
  }
  return await safeJson(response) as OaGaiaSyncResult
}

export const fetchOaFiles = async (
  token?: string,
  actor?: Partial<OaActorContext>,
  roomId?: string
) => {
  const params = new URLSearchParams()
  if (roomId) params.set('roomId', roomId)
  const query = params.toString()
  const response = await fetch(buildApiUrl(`/oa/files${query ? `?${query}` : ''}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取文件失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaFileRecord[]
}

export const fetchOaCalls = async (token?: string, actor?: Partial<OaActorContext>) => {
  const response = await fetch(buildApiUrl('/oa/calls'), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取通话记录失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaCallSession[]
}

export const createOaCall = async (
  input: { mode: OaCallMode; title?: string; roomId?: string; participants?: string[] },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/calls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建通话失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.session as OaCallSession
}

export const fetchOaMeetings = async (token?: string, actor?: Partial<OaActorContext>) => {
  const response = await fetch(buildApiUrl('/oa/meetings'), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取会议失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return (Array.isArray(payload?.items) ? payload.items : []) as OaMeetingSession[]
}

export const createOaMeeting = async (
  input: {
    title: string
    agenda?: string
    startsAt?: string
    durationMinutes?: number
    roomId?: string
    participants?: string[]
  },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/meetings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建会议失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload?.session as OaMeetingSession
}

export const uploadOaFile = async (
  input: { file: File; roomId?: string },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const formData = new FormData()
  formData.set('file', input.file)
  if (input.roomId) {
    formData.set('roomId', input.roomId)
  }

  const response = await fetch(buildApiUrl('/oa/files'), {
    method: 'POST',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
    body: formData,
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `上传文件失败 (${response.status})`))
  }
  const payload = await safeJson(response)
  return payload as {
    file: OaFileRecord
    linkedMessageId: string
  }
}

export const downloadOaFile = async (
  fileId: string,
  fileName: string,
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl(`/oa/files/${encodeURIComponent(fileId)}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `下载文件失败 (${response.status})`))
  }
  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName || `file-${fileId}`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export const fetchOaAudit = async (
  query: { page?: number; size?: number; actorId?: string; action?: OaAuditAction },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.size) params.set('size', String(query.size))
  if (query.actorId) params.set('actorId', query.actorId)
  if (query.action) params.set('action', query.action)
  const response = await fetch(buildApiUrl(`/oa/audit?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取审计失败 (${response.status})`))
  }
  return await safeJson(response) as OaAuditQueryResult
}

export const fetchOaImChannels = async (
  query: { platform?: OaImPlatform; agentId?: string; mode?: OaImChannelMode } = {},
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const params = new URLSearchParams()
  if (query.platform) params.set('platform', query.platform)
  if (query.agentId) params.set('agentId', query.agentId)
  if (query.mode) params.set('mode', query.mode)
  const response = await fetch(buildApiUrl(`/oa/im/channels?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取 IM 通道失败 (${response.status})`))
  }
  return await safeJson(response) as {
    channels: OaImAgentChannel[]
    integrations: OaImIntegrationConfig[]
    owners: Array<{
      agentId: string
      role: string
      ownerEmployeeId: string
      ownerName: string
      ownerTitle: string
      departmentName: string
      orgUnitId: string
    }>
    total: number
  }
}

export const bootstrapOaImChannels = async (
  input: {
    platform: OaImPlatform
    integration?: {
      enabled?: boolean
      appId?: string
      tenantId?: string
      webhookTokenHint?: string
    }
    externalChats?: Array<{
      agentId: string
      mode: OaImChannelMode
      externalChatId: string
      externalChatName?: string
    }>
    directorySync?: {
      source?: OaGaiaSyncSource
      strictRemote?: boolean
      onlyActive?: boolean
      limit?: number
    }
  },
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const response = await fetch(buildApiUrl('/oa/im/channels'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token, actor),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `创建 IM 通道失败 (${response.status})`))
  }
  return await safeJson(response) as {
    integration: OaImIntegrationConfig
    channels: OaImAgentChannel[]
    total: number
    directorySync?: OaGaiaSyncResult | null
  }
}

export const fetchOaImHistory = async (
  query: {
    platform?: OaImPlatform
    mode?: OaImChannelMode
    direction?: 'inbound' | 'outbound'
    agentId?: string
    senderEmployeeId?: string
    channelId?: string
    externalChatId?: string
    status?: 'success' | 'failed'
    limit?: number
  } = {},
  token?: string,
  actor?: Partial<OaActorContext>
) => {
  const params = new URLSearchParams()
  if (query.platform) params.set('platform', query.platform)
  if (query.mode) params.set('mode', query.mode)
  if (query.direction) params.set('direction', query.direction)
  if (query.agentId) params.set('agentId', query.agentId)
  if (query.senderEmployeeId) params.set('senderEmployeeId', query.senderEmployeeId)
  if (query.channelId) params.set('channelId', query.channelId)
  if (query.externalChatId) params.set('externalChatId', query.externalChatId)
  if (query.status) params.set('status', query.status)
  if (query.limit) params.set('limit', String(query.limit))

  const response = await fetch(buildApiUrl(`/oa/im/history?${params.toString()}`), {
    method: 'GET',
    headers: buildAuthHeaders(token, actor),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseError(response, `读取 IM 历史失败 (${response.status})`))
  }
  return await safeJson(response) as {
    messages: OaImBridgeMessageLog[]
    files: OaImBridgeFileLog[]
    total: {
      messages: number
      files: number
    }
  }
}
