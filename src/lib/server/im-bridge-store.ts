import { randomUUID } from 'node:crypto'
import {
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'

export type ImPlatform = 'wecom' | 'feishu'
export type ImChannelMode = 'group' | 'direct'
export type ImBridgeDirection = 'inbound' | 'outbound'

export interface ImIntegrationConfig {
  platform: ImPlatform
  enabled: boolean
  appId: string
  tenantId: string
  webhookTokenHint: string
  updatedAt: string
  createdAt: string
}

export interface ImAgentChannelBinding {
  id: string
  platform: ImPlatform
  agentId: string
  mode: ImChannelMode
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

export interface ImBridgeMessageLog {
  id: string
  platform: ImPlatform
  mode: ImChannelMode
  channelId: string
  direction: ImBridgeDirection
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

export interface ImBridgeFileLog {
  id: string
  platform: ImPlatform
  mode: ImChannelMode
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

interface ImBridgeState {
  integrations: ImIntegrationConfig[]
  channels: ImAgentChannelBinding[]
  messages: ImBridgeMessageLog[]
  files: ImBridgeFileLog[]
}

interface ImBridgePayload {
  integrations?: ImIntegrationConfig[]
  channels?: ImAgentChannelBinding[]
  messages?: ImBridgeMessageLog[]
  files?: ImBridgeFileLog[]
}

const IM_BRIDGE_NAMESPACE = 'oa/im-bridge/state'
const MAX_CHANNELS = 300
const MAX_MESSAGES = 20000
const MAX_FILES = 12000

const nowIso = () => new Date().toISOString()
const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}
const safeId = (value: unknown, fallback = '') => {
  const normalized = clip(value, '', 120)
  if (/^[a-zA-Z0-9:_-]{2,120}$/.test(normalized)) return normalized
  return fallback
}
const clampNumber = (value: unknown, fallback = 0, max = 1024 * 1024 * 1024) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(max, Math.round(value)))
}

const normalizePlatform = (value: unknown): ImPlatform =>
  clip(value, '', 20).toLowerCase() === 'feishu' ? 'feishu' : 'wecom'

const normalizeMode = (value: unknown): ImChannelMode =>
  clip(value, '', 20).toLowerCase() === 'direct' ? 'direct' : 'group'

const normalizeDirection = (value: unknown): ImBridgeDirection =>
  clip(value, '', 20).toLowerCase() === 'outbound' ? 'outbound' : 'inbound'

const normalizeIntegration = (value: unknown): ImIntegrationConfig | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<ImIntegrationConfig>
  const platform = normalizePlatform(record.platform)
  const createdAt = clip(record.createdAt, nowIso(), 80)
  return {
    platform,
    enabled: record.enabled !== false,
    appId: clip(record.appId, '', 120),
    tenantId: clip(record.tenantId, '', 120),
    webhookTokenHint: clip(record.webhookTokenHint, '', 40),
    createdAt,
    updatedAt: clip(record.updatedAt, createdAt, 80),
  }
}

const normalizeChannel = (value: unknown): ImAgentChannelBinding | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<ImAgentChannelBinding>
  const id = safeId(record.id, '')
  if (!id) return null
  const createdAt = clip(record.createdAt, nowIso(), 80)
  return {
    id,
    platform: normalizePlatform(record.platform),
    agentId: safeId(record.agentId, ''),
    mode: normalizeMode(record.mode),
    ownerEmployeeId: safeId(record.ownerEmployeeId, ''),
    ownerName: clip(record.ownerName, '负责人', 120),
    ownerTitle: clip(record.ownerTitle, '', 120),
    orgUnitId: safeId(record.orgUnitId, ''),
    oaRoomId: safeId(record.oaRoomId, ''),
    externalChatId: clip(record.externalChatId, '', 180),
    externalChatName: clip(record.externalChatName, '', 180),
    status: clip(record.status, '', 20) === 'paused' ? 'paused' : 'active',
    createdAt,
    updatedAt: clip(record.updatedAt, createdAt, 80),
  }
}

const normalizeMessage = (value: unknown): ImBridgeMessageLog | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<ImBridgeMessageLog>
  const id = safeId(record.id, '')
  if (!id) return null
  return {
    id,
    platform: normalizePlatform(record.platform),
    mode: normalizeMode((record as Partial<ImBridgeMessageLog>).mode),
    channelId: safeId((record as Partial<ImBridgeMessageLog>).channelId, ''),
    direction: normalizeDirection(record.direction),
    senderEmployeeId: safeId(record.senderEmployeeId, 'unknown'),
    senderName: clip(record.senderName, '未知用户', 120),
    externalChatId: clip(record.externalChatId, '', 180),
    externalMessageId: clip(record.externalMessageId, '', 180),
    targetAgentId: safeId(record.targetAgentId, 'cos_zhuge_liang'),
    resolvedAgentId: safeId(record.resolvedAgentId, 'cos_zhuge_liang'),
    oaRoomId: safeId(record.oaRoomId, ''),
    content: clip(record.content, '', 12000),
    status: clip(record.status, '', 20) === 'failed' ? 'failed' : 'success',
    error: clip(record.error, '', 260) || null,
    createdAt: clip(record.createdAt, nowIso(), 80),
  }
}

const normalizeFile = (value: unknown): ImBridgeFileLog | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<ImBridgeFileLog>
  const id = safeId(record.id, '')
  if (!id) return null
  return {
    id,
    platform: normalizePlatform(record.platform),
    mode: normalizeMode((record as Partial<ImBridgeFileLog>).mode),
    channelId: safeId((record as Partial<ImBridgeFileLog>).channelId, ''),
    senderEmployeeId: safeId(record.senderEmployeeId, 'unknown'),
    senderName: clip(record.senderName, '未知用户', 120),
    externalChatId: clip(record.externalChatId, '', 180),
    externalMessageId: clip(record.externalMessageId, '', 180),
    targetAgentId: safeId(record.targetAgentId, 'cos_zhuge_liang'),
    oaRoomId: safeId(record.oaRoomId, ''),
    fileName: clip(record.fileName, 'unnamed.bin', 220),
    mimeType: clip(record.mimeType, 'application/octet-stream', 140),
    fileSize: clampNumber(record.fileSize, 0),
    downloadUrl: clip(record.downloadUrl, '', 800),
    status: clip(record.status, '', 20) === 'failed' ? 'failed' : 'success',
    error: clip(record.error, '', 260) || null,
    createdAt: clip(record.createdAt, nowIso(), 80),
  }
}

const buildInitialState = (): ImBridgeState => ({
  integrations: [],
  channels: [],
  messages: [],
  files: [],
})

const normalizeState = (payload: unknown): ImBridgeState => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return buildInitialState()
  const record = payload as ImBridgePayload
  return {
    integrations: Array.isArray(record.integrations)
      ? record.integrations.map((item) => normalizeIntegration(item)).filter(Boolean) as ImIntegrationConfig[]
      : [],
    channels: Array.isArray(record.channels)
      ? record.channels.map((item) => normalizeChannel(item)).filter(Boolean) as ImAgentChannelBinding[]
      : [],
    messages: Array.isArray(record.messages)
      ? record.messages.map((item) => normalizeMessage(item)).filter(Boolean) as ImBridgeMessageLog[]
      : [],
    files: Array.isArray(record.files)
      ? record.files.map((item) => normalizeFile(item)).filter(Boolean) as ImBridgeFileLog[]
      : [],
  }
}

const readState = async () =>
  normalizeState((await readPersistentJsonState<ImBridgePayload>(IM_BRIDGE_NAMESPACE)) || {})

const writeState = async (state: ImBridgeState) =>
  writePersistentJsonState(IM_BRIDGE_NAMESPACE, {
    integrations: state.integrations,
    channels: state.channels.slice(-MAX_CHANNELS),
    messages: state.messages.slice(-MAX_MESSAGES),
    files: state.files.slice(-MAX_FILES),
  })

const mutateState = async <T>(
  updater: (state: ImBridgeState) => { state: ImBridgeState; result: T }
) => {
  const current = await readState()
  const next = updater(current)
  await writeState(next.state)
  return next.result
}

export const listImIntegrationConfigs = async () => {
  const state = await readState()
  return [...state.integrations].sort((a, b) => a.platform.localeCompare(b.platform))
}

export const upsertImIntegrationConfig = async (input: {
  platform: ImPlatform
  enabled: boolean
  appId?: string
  tenantId?: string
  webhookTokenHint?: string
}) =>
  mutateState((state) => {
    const now = nowIso()
    const current = state.integrations.find((item) => item.platform === input.platform)
    const next: ImIntegrationConfig = current
      ? {
          ...current,
          enabled: input.enabled,
          appId: clip(input.appId, current.appId, 120),
          tenantId: clip(input.tenantId, current.tenantId, 120),
          webhookTokenHint: clip(input.webhookTokenHint, current.webhookTokenHint, 40),
          updatedAt: now,
        }
      : {
          platform: input.platform,
          enabled: input.enabled,
          appId: clip(input.appId, '', 120),
          tenantId: clip(input.tenantId, '', 120),
          webhookTokenHint: clip(input.webhookTokenHint, '', 40),
          createdAt: now,
          updatedAt: now,
        }
    return {
      state: {
        ...state,
        integrations: [...state.integrations.filter((item) => item.platform !== input.platform), next],
      },
      result: next,
    }
  })

export const listImAgentChannels = async (filter?: {
  platform?: ImPlatform
  agentId?: string
  mode?: ImChannelMode
}) => {
  const state = await readState()
  return state.channels
    .filter((item) => (filter?.platform ? item.platform === filter.platform : true))
    .filter((item) => (filter?.agentId ? item.agentId === filter.agentId : true))
    .filter((item) => (filter?.mode ? item.mode === filter.mode : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const findImAgentChannel = async (filter: {
  platform: ImPlatform
  externalChatId: string
  mode: ImChannelMode
}) => {
  const state = await readState()
  return (
    state.channels.find(
      (item) =>
        item.platform === filter.platform &&
        item.externalChatId === filter.externalChatId &&
        item.mode === filter.mode
    ) || null
  )
}

export const upsertImAgentChannel = async (input: {
  platform: ImPlatform
  agentId: string
  mode: ImChannelMode
  ownerEmployeeId: string
  ownerName: string
  ownerTitle: string
  orgUnitId: string
  oaRoomId: string
  externalChatId: string
  externalChatName: string
  status?: 'active' | 'paused'
}) =>
  mutateState((state) => {
    const now = nowIso()
    const existing = state.channels.find(
      (item) =>
        item.platform === input.platform &&
        item.agentId === input.agentId &&
        item.mode === input.mode &&
        item.ownerEmployeeId === input.ownerEmployeeId
    )
    const next: ImAgentChannelBinding = existing
      ? {
          ...existing,
          ownerName: clip(input.ownerName, existing.ownerName, 120),
          ownerTitle: clip(input.ownerTitle, existing.ownerTitle, 120),
          orgUnitId: safeId(input.orgUnitId, existing.orgUnitId),
          oaRoomId: safeId(input.oaRoomId, existing.oaRoomId),
          externalChatId: clip(input.externalChatId, existing.externalChatId, 180),
          externalChatName: clip(input.externalChatName, existing.externalChatName, 180),
          status: input.status || existing.status,
          updatedAt: now,
        }
      : {
          id: `imc-${randomUUID()}`,
          platform: input.platform,
          agentId: safeId(input.agentId, 'cos_zhuge_liang'),
          mode: input.mode,
          ownerEmployeeId: safeId(input.ownerEmployeeId, 'unknown'),
          ownerName: clip(input.ownerName, '负责人', 120),
          ownerTitle: clip(input.ownerTitle, '', 120),
          orgUnitId: safeId(input.orgUnitId, ''),
          oaRoomId: safeId(input.oaRoomId, ''),
          externalChatId: clip(input.externalChatId, '', 180),
          externalChatName: clip(input.externalChatName, '', 180),
          status: input.status || 'active',
          createdAt: now,
          updatedAt: now,
        }
    return {
      state: {
        ...state,
        channels: [...state.channels.filter((item) => item.id !== next.id), next].slice(-MAX_CHANNELS),
      },
      result: next,
    }
  })

export const appendImBridgeMessageLog = async (input: Omit<ImBridgeMessageLog, 'id' | 'createdAt'>) =>
  mutateState((state) => {
    const next: ImBridgeMessageLog = {
      id: `imm-${randomUUID()}`,
      createdAt: nowIso(),
      ...input,
    }
    return {
      state: {
        ...state,
        messages: [...state.messages, next].slice(-MAX_MESSAGES),
      },
      result: next,
    }
  })

export const appendImBridgeFileLog = async (input: Omit<ImBridgeFileLog, 'id' | 'createdAt'>) =>
  mutateState((state) => {
    const next: ImBridgeFileLog = {
      id: `imf-${randomUUID()}`,
      createdAt: nowIso(),
      ...input,
    }
    return {
      state: {
        ...state,
        files: [...state.files, next].slice(-MAX_FILES),
      },
      result: next,
    }
  })

export const listImBridgeMessageLogs = async (filter?: {
  platform?: ImPlatform
  mode?: ImChannelMode
  direction?: ImBridgeDirection
  agentId?: string
  senderEmployeeId?: string
  channelId?: string
  externalChatId?: string
  status?: 'success' | 'failed'
  limit?: number
}) => {
  const state = await readState()
  const limit = Math.max(1, Math.min(500, Math.round(filter?.limit || 100)))
  return state.messages
    .filter((item) => (filter?.platform ? item.platform === filter.platform : true))
    .filter((item) => (filter?.mode ? item.mode === filter.mode : true))
    .filter((item) => (filter?.direction ? item.direction === filter.direction : true))
    .filter((item) => (filter?.agentId ? item.resolvedAgentId === filter.agentId : true))
    .filter((item) => (filter?.senderEmployeeId ? item.senderEmployeeId === filter.senderEmployeeId : true))
    .filter((item) => (filter?.channelId ? item.channelId === filter.channelId : true))
    .filter((item) => (filter?.externalChatId ? item.externalChatId === filter.externalChatId : true))
    .filter((item) => (filter?.status ? item.status === filter.status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export const listImBridgeFileLogs = async (filter?: {
  platform?: ImPlatform
  mode?: ImChannelMode
  agentId?: string
  senderEmployeeId?: string
  channelId?: string
  externalChatId?: string
  status?: 'success' | 'failed'
  limit?: number
}) => {
  const state = await readState()
  const limit = Math.max(1, Math.min(500, Math.round(filter?.limit || 100)))
  return state.files
    .filter((item) => (filter?.platform ? item.platform === filter.platform : true))
    .filter((item) => (filter?.mode ? item.mode === filter.mode : true))
    .filter((item) => (filter?.agentId ? item.targetAgentId === filter.agentId : true))
    .filter((item) => (filter?.senderEmployeeId ? item.senderEmployeeId === filter.senderEmployeeId : true))
    .filter((item) => (filter?.channelId ? item.channelId === filter.channelId : true))
    .filter((item) => (filter?.externalChatId ? item.externalChatId === filter.externalChatId : true))
    .filter((item) => (filter?.status ? item.status === filter.status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}
