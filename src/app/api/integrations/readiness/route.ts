import { NextRequest, NextResponse } from 'next/server'
import { isStrictLiveMode } from '@/lib/live-mode'
import { getFinanceLiveHealthSnapshot } from '@/lib/server/finance-live/health'
import { listHrGaiaRoster } from '@/lib/server/hr-gaia-roster-store'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { isPersistentJsonStoreEnabled, readPersistentJsonState } from '@/lib/server/persistent-json-store'
import { readSupplyLiveDataset } from '@/lib/server/supply-live-store'

export const runtime = 'nodejs'

type ReadinessState = 'ready' | 'partial' | 'missing'

interface ReadinessItem {
  key: string
  title: string
  state: ReadinessState
  message: string
  updatedAt: string
  details: Record<string, unknown>
}

interface OaStatePayload {
  rooms?: unknown[]
  messages?: unknown[]
  files?: unknown[]
  contacts?: unknown[]
  audits?: unknown[]
  updatedAt?: string
}

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 240) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const isRealSource = (value: string) => {
  const normalized = clip(value, '', 160).toLowerCase()
  if (!normalized) return false
  if (normalized.includes('seed')) return false
  if (normalized.includes('fallback')) return false
  if (normalized.includes('unconfigured')) return false
  if (normalized.includes('empty')) return false
  return true
}

const toArraySize = (value: unknown) => (Array.isArray(value) ? value.length : 0)

const resolveFinanceReadiness = async (): Promise<ReadinessItem> => {
  const health = await getFinanceLiveHealthSnapshot({ scope: 'global', thresholdMinutes: 120 })
  const hasRealScope = health.totalScopes > 0 && isRealSource(health.source)
  const state: ReadinessState = hasRealScope
    ? health.status === 'healthy' ? 'ready' : 'partial'
    : 'missing'
  return {
    key: 'finance',
    title: '财务实时数据',
    state,
    message: hasRealScope ? health.message : '尚未接入真实财务口径数据。',
    updatedAt: health.updatedAt,
    details: {
      totalScopes: health.totalScopes,
      realScopes: health.realScopes,
      realCoverageRate: health.realCoverageRate,
      source: health.source,
      health: health.status,
    },
  }
}

const resolveHrReadiness = async (): Promise<ReadinessItem> => {
  const roster = await listHrGaiaRoster()
  const total = roster.roster.length
  const source = roster.importSummary.source
  const updatedAt = roster.importSummary.importedAt || nowIso()
  const state: ReadinessState = total <= 0 ? 'missing' : source === 'gaia-api' ? 'ready' : 'partial'
  return {
    key: 'hr',
    title: '人力花名册（盖雅）',
    state,
    message:
      state === 'ready'
        ? `盖雅花名册已同步，当前 ${total} 人。`
        : state === 'partial'
          ? `当前有人力数据（${total} 人），但来源为 ${source}，建议切换到盖雅 API。`
          : '尚未导入人力花名册。',
    updatedAt,
    details: {
      totalEmployees: total,
      source,
      errorCount: roster.importSummary.errorCount,
    },
  }
}

const resolveSupplyReadiness = async (): Promise<ReadinessItem> => {
  const supply = await readSupplyLiveDataset()
  const recordCount =
    supply.orders.length +
    supply.dispatchTasks.length +
    supply.inventoryAlerts.length +
    supply.foodSafetyTasks.length
  const hasReal = recordCount > 0 && isRealSource(supply.source)
  const state: ReadinessState = recordCount <= 0 ? 'missing' : hasReal ? 'ready' : 'partial'
  return {
    key: 'supply',
    title: '供应链实时数据',
    state,
    message:
      state === 'ready'
        ? `供应链数据已接入，共 ${recordCount} 条。`
        : state === 'partial'
          ? `供应链已有 ${recordCount} 条记录，但来源 ${supply.source} 仍需替换为正式系统。`
          : '尚未接入供应链数据。',
    updatedAt: supply.updatedAt,
    details: {
      source: supply.source,
      orders: supply.orders.length,
      dispatchTasks: supply.dispatchTasks.length,
      inventoryAlerts: supply.inventoryAlerts.length,
      foodSafetyTasks: supply.foodSafetyTasks.length,
    },
  }
}

const resolveOaReadiness = async (): Promise<ReadinessItem> => {
  const durableStoreReady = isPersistentJsonStoreEnabled()
  const payload = (await readPersistentJsonState<OaStatePayload>('oa/state')) || {}
  const roomCount = toArraySize(payload.rooms)
  const contactCount = toArraySize(payload.contacts)
  const messageCount = toArraySize(payload.messages)
  const fileCount = toArraySize(payload.files)
  const baseState: ReadinessState =
    roomCount > 0 && contactCount > 0
      ? 'ready'
      : roomCount > 0 || contactCount > 0 || messageCount > 0 || fileCount > 0
        ? 'partial'
        : 'missing'
  const state: ReadinessState = durableStoreReady ? baseState : 'missing'
  const message = !durableStoreReady
    ? 'OA 未配置持久化存储（DATABASE_URL 或 Blob），会话/文件无法稳定留存。'
    : baseState === 'ready'
      ? `通讯录与会话已建成，联系人 ${contactCount}，会话 ${roomCount}。`
      : baseState === 'partial'
        ? 'OA 模块已有部分数据，建议补齐组织和联系人。'
        : 'OA 仍为空，需先同步组织与通讯录。'
  return {
    key: 'oa',
    title: '协同 OA / 通讯录',
    state,
    message,
    updatedAt: clip(payload.updatedAt, nowIso(), 80),
    details: {
      durableStoreReady,
      rooms: roomCount,
      contacts: contactCount,
      messages: messageCount,
      files: fileCount,
    },
  }
}

const resolveAgentsReadiness = (): ReadinessItem => {
  const apiUrl = clip(
    process.env.AGENTS_API_URL || process.env.NEXT_PUBLIC_AGENTS_API_URL,
    '',
    600
  )
  const state: ReadinessState = apiUrl ? 'ready' : 'missing'
  return {
    key: 'agents',
    title: 'AI Agent Legion',
    state,
    message: apiUrl ? 'Agents API 已配置，可用真实模型路由。' : '未配置 Agents API 地址。',
    updatedAt: nowIso(),
    details: {
      apiUrlConfigured: Boolean(apiUrl),
      strictLiveMode: isStrictLiveMode(),
    },
  }
}

const stateRank: Record<ReadinessState, number> = {
  ready: 2,
  partial: 1,
  missing: 0,
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const [finance, hr, supply, oa] = await Promise.all([
    resolveFinanceReadiness(),
    resolveHrReadiness(),
    resolveSupplyReadiness(),
    resolveOaReadiness(),
  ])
  const agents = resolveAgentsReadiness()

  const items = [finance, hr, supply, oa, agents]
  const score = items.length
    ? Number(
        (
          items.reduce((sum, item) => sum + stateRank[item.state], 0) /
          (items.length * stateRank.ready)
        ).toFixed(4)
      )
    : 0

  return NextResponse.json({
    strictLiveMode: isStrictLiveMode(),
    generatedAt: nowIso(),
    score,
    items,
  })
}
