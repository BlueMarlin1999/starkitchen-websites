import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AGENT_PROFILES } from '@/components/AgentLegion/types'
import { getAgentDepartmentOwner, listAgentDepartmentOwners } from '@/lib/agent-department-map'
import { isStrictLiveMode } from '@/lib/live-mode'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  listImAgentChannels,
  listImIntegrationConfigs,
  upsertImAgentChannel,
  upsertImIntegrationConfig,
} from '@/lib/server/im-bridge-store'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { syncOaDirectoryFromGaia } from '@/lib/server/oa/gaia-directory-sync'
import { createOaRoom, findOaContactByEmployeeId } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const platformSchema = z.enum(['wecom', 'feishu'])
const modeSchema = z.enum(['group', 'direct'])
const directorySyncSchema = z.object({
  source: z.enum(['stored', 'auto', 'seed', 'gaia-api']).optional().default('stored'),
  strictRemote: z.boolean().optional().default(false),
  onlyActive: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(5000).optional(),
})

const querySchema = z.object({
  platform: platformSchema.optional(),
  agentId: z.string().trim().max(64).optional(),
  mode: modeSchema.optional(),
})

const postSchema = z.object({
  platform: platformSchema,
  integration: z
    .object({
      enabled: z.boolean().optional(),
      appId: z.string().trim().max(120).optional(),
      tenantId: z.string().trim().max(120).optional(),
      webhookTokenHint: z.string().trim().max(40).optional(),
    })
    .optional(),
  externalChats: z
    .array(
      z.object({
        agentId: z.string().trim().min(1).max(64),
        mode: modeSchema,
        externalChatId: z.string().trim().min(1).max(180),
        externalChatName: z.string().trim().max(180).optional(),
      })
    )
    .max(48)
    .optional()
    .default([]),
  directorySync: directorySyncSchema.optional(),
})

const clip = (value: string, max = 180) => value.trim().slice(0, max)

const buildExternalChatMap = (
  items: Array<{
    agentId: string
    mode: 'group' | 'direct'
    externalChatId: string
    externalChatName?: string
  }>
) =>
  new Map(
    items.map((item) => [
      `${item.agentId}:${item.mode}`,
      {
        externalChatId: clip(item.externalChatId, 180),
        externalChatName: clip(item.externalChatName || '', 180),
      },
    ])
  )

interface OwnerPlatformIdentity {
  wecomUserId: string
  feishuUserId: string
  feishuOpenId: string
}

const buildOwnerIdentityMap = async () => {
  const map = new Map<string, OwnerPlatformIdentity>()
  const ownerIds = Array.from(new Set(listAgentDepartmentOwners().map((item) => item.ownerEmployeeId)))
  for (const ownerEmployeeId of ownerIds) {
    const contact = await findOaContactByEmployeeId(ownerEmployeeId)
    map.set(ownerEmployeeId, {
      wecomUserId: clip(contact?.wecomUserId || '', 180),
      feishuUserId: clip(contact?.feishuUserId || '', 180),
      feishuOpenId: clip(contact?.feishuOpenId || '', 180),
    })
  }
  return map
}

const resolveDefaultExternalChatId = (input: {
  platform: 'wecom' | 'feishu'
  agentId: string
  mode: 'group' | 'direct'
  ownerEmployeeId: string
  ownerIdentity?: OwnerPlatformIdentity
}) => {
  if (input.mode === 'group') return `${input.platform}-group-${input.agentId}`
  if (input.platform === 'wecom') {
    return (
      clip(input.ownerIdentity?.wecomUserId || '', 180) ||
      clip(input.ownerEmployeeId, 180) ||
      `${input.platform}-direct-${input.agentId}-${input.ownerEmployeeId}`
    )
  }
  return (
    clip(input.ownerIdentity?.feishuOpenId || '', 180) ||
    clip(input.ownerIdentity?.feishuUserId || '', 180) ||
    `${input.platform}-direct-${input.agentId}-${input.ownerEmployeeId}`
  )
}

const buildRoomTitle = (input: {
  mode: 'group' | 'direct'
  agentRole: string
  agentName: string
  ownerName: string
  departmentName: string
}) =>
  input.mode === 'group'
    ? `${input.agentRole} · ${input.agentName} × ${input.departmentName}协同群`
    : `${input.agentRole} · ${input.agentName} 私聊 · ${input.ownerName}`

const createRoomIfNeeded = async (input: {
  roomId: string
  actorId: string
  mode: 'group' | 'direct'
  roomName: string
  ownerEmployeeId: string
  agentId: string
}) => {
  if (input.roomId) return input.roomId
  const room = await createOaRoom({
    name: input.roomName,
    type: input.mode === 'direct' ? 'direct' : 'group',
    members: [input.ownerEmployeeId, `agent:${input.agentId}`, 'Marlins'],
    actorId: input.actorId,
  })
  return room.id
}

const buildChannelExternal = (input: {
  platform: 'wecom' | 'feishu'
  agentId: string
  mode: 'group' | 'direct'
  ownerEmployeeId: string
  ownerIdentity?: OwnerPlatformIdentity
  externalChatId: string
  externalChatName: string
  roomTitle: string
}) => ({
  externalChatId:
    clip(input.externalChatId, 180) ||
    resolveDefaultExternalChatId({
      platform: input.platform,
      agentId: input.agentId,
      mode: input.mode,
      ownerEmployeeId: input.ownerEmployeeId,
      ownerIdentity: input.ownerIdentity,
    }),
  externalChatName: clip(input.externalChatName || input.roomTitle, 180),
})

const ensureChannel = async (input: {
  platform: 'wecom' | 'feishu'
  agentId: string
  mode: 'group' | 'direct'
  actorId: string
  ownerIdentityMap: Map<string, OwnerPlatformIdentity>
  existingOaRoomId?: string
  externalChatId?: string
  externalChatName?: string
}) => {
  const owner = getAgentDepartmentOwner(input.agentId)
  const agent = AGENT_PROFILES.find((item) => item.id === input.agentId) || AGENT_PROFILES[0]
  const roomTitle = buildRoomTitle({
    mode: input.mode,
    agentRole: agent.role,
    agentName: agent.name_zh,
    ownerName: owner.ownerName,
    departmentName: owner.departmentName,
  })
  const createdRoomId = await createRoomIfNeeded({
    roomId: input.existingOaRoomId || '',
    actorId: input.actorId,
    mode: input.mode,
    roomName: roomTitle,
    ownerEmployeeId: owner.ownerEmployeeId,
    agentId: agent.id,
  })
  const ownerIdentity = input.ownerIdentityMap.get(owner.ownerEmployeeId)
  const external = buildChannelExternal({
    platform: input.platform,
    agentId: agent.id,
    mode: input.mode,
    ownerEmployeeId: owner.ownerEmployeeId,
    ownerIdentity,
    externalChatId: input.externalChatId || '',
    externalChatName: input.externalChatName || '',
    roomTitle,
  })

  return upsertImAgentChannel({
    platform: input.platform,
    agentId: agent.id,
    mode: input.mode,
    ownerEmployeeId: owner.ownerEmployeeId,
    ownerName: owner.ownerName,
    ownerTitle: owner.ownerTitle,
    orgUnitId: owner.orgUnitId,
    oaRoomId: createdRoomId,
    externalChatId: external.externalChatId,
    externalChatName: external.externalChatName,
    status: 'active',
  })
}

const bootstrapAgentChannels = async (input: {
  platform: 'wecom' | 'feishu'
  actorId: string
  existing: Awaited<ReturnType<typeof listImAgentChannels>>
  channelMap: ReturnType<typeof buildExternalChatMap>
  ownerIdentityMap: Map<string, OwnerPlatformIdentity>
}) => {
  const nextChannels = []
  for (const agent of AGENT_PROFILES) {
    for (const mode of ['group', 'direct'] as const) {
      const owner = getAgentDepartmentOwner(agent.id)
      const current = input.existing.find(
        (item) =>
          item.agentId === agent.id &&
          item.mode === mode &&
          item.ownerEmployeeId === owner.ownerEmployeeId
      )
      const override = input.channelMap.get(`${agent.id}:${mode}`)
      const channel = await ensureChannel({
        platform: input.platform,
        agentId: agent.id,
        mode,
        actorId: input.actorId,
        ownerIdentityMap: input.ownerIdentityMap,
        existingOaRoomId: current?.oaRoomId,
        externalChatId: override?.externalChatId || current?.externalChatId,
        externalChatName: override?.externalChatName || current?.externalChatName,
      })
      nextChannels.push(channel)
    }
  }
  return nextChannels
}

const auditBootstrapFailure = (request: NextRequest) =>
  appendOaAuditByRequest(request, {
    action: 'im.channels.bootstrap',
    success: false,
    message: 'IM 通道创建失败：参数校验未通过',
  })

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, querySchema, 'IM 通道查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }

  const channels = await listImAgentChannels({
    platform: parsedQuery.data.platform,
    agentId: parsedQuery.data.agentId,
    mode: parsedQuery.data.mode,
  })
  const integrations = await listImIntegrationConfigs()
  const owners = listAgentDepartmentOwners()

  await appendOaAuditByRequest(request, {
    action: 'im.channels.read',
    success: true,
    message: `读取 IM 通道 ${channels.length} 条`,
  })

  return NextResponse.json({
    channels,
    integrations,
    owners,
    total: channels.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, postSchema, 'IM 通道创建参数不合法。')
  if (!parsedPayload.ok) {
    await auditBootstrapFailure(request)
    return parsedPayload.response
  }

  const payload = parsedPayload.data
  const actorId = resolveOaActorId(request)
  let directorySync: Awaited<ReturnType<typeof syncOaDirectoryFromGaia>> | null = null
  if (payload.directorySync?.source && payload.directorySync.source !== 'stored') {
    if (isStrictLiveMode() && payload.directorySync.source === 'seed') {
      return NextResponse.json(
        { message: '当前为严格真实模式，已禁用 seed 同步源。请配置并使用盖雅 API。' },
        { status: 400 }
      )
    }
    try {
      const strictRemote = isStrictLiveMode() ? true : payload.directorySync.strictRemote
      directorySync = await syncOaDirectoryFromGaia({
        source: payload.directorySync.source,
        strictRemote,
        onlyActive: payload.directorySync.onlyActive,
        limit: payload.directorySync.limit,
      })
      await appendOaAuditByRequest(request, {
        action: 'contacts.sync',
        success: true,
        entityId: actorId,
        message: `IM 通道初始化触发盖雅同步(${directorySync.source})：导入 ${directorySync.imported}，新增 ${directorySync.created}，更新 ${directorySync.updated}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GAIA_SYNC_FAILED'
      await appendOaAuditByRequest(request, {
        action: 'contacts.sync',
        success: false,
        entityId: actorId,
        message: `IM 通道初始化触发盖雅同步失败：${message}`,
      })
      return NextResponse.json({ message: '盖雅同步失败，请稍后重试。' }, { status: 500 })
    }
  }

  const existing = await listImAgentChannels({ platform: payload.platform })
  const channelMap = buildExternalChatMap(payload.externalChats)
  const ownerIdentityMap = await buildOwnerIdentityMap()

  const integration = await upsertImIntegrationConfig({
    platform: payload.platform,
    enabled: payload.integration?.enabled ?? true,
    appId: payload.integration?.appId,
    tenantId: payload.integration?.tenantId,
    webhookTokenHint: payload.integration?.webhookTokenHint,
  })

  const nextChannels = await bootstrapAgentChannels({
    platform: payload.platform,
    actorId,
    existing,
    channelMap,
    ownerIdentityMap,
  })

  await appendOaAuditByRequest(request, {
    action: 'im.channels.bootstrap',
    success: true,
    message: `完成 ${payload.platform} 通道映射：${nextChannels.length} 条`,
  })

  return NextResponse.json(
    {
      integration,
      channels: nextChannels,
      total: nextChannels.length,
      directorySync,
    },
    { status: 201 }
  )
}
