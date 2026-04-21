import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'
import { buildScopeDrilldownHref } from '@/lib/scope-drilldown'
import { readPersistentJsonState, writePersistentJsonState } from '@/lib/server/persistent-json-store'
import type {
  DispatchIssue,
  FoodSafetyStatus,
  FoodSafetyTask,
  InventoryAlertItem,
  InventoryPriority,
  SupplyDispatchTask,
  SupplyPurchaseOrder,
  SupplyStatus,
} from '@/lib/supply-insights'

const SUPPLY_NAMESPACE = 'supply/live/v1'

const supplyStatusValues: SupplyStatus[] = ['在途', '延迟', '待质检']
const dispatchIssueValues: DispatchIssue[] = ['正常', '待补货', '冷链预警']
const inventoryPriorityValues: InventoryPriority[] = ['高', '中', '低']
const foodSafetyStatusValues: FoodSafetyStatus[] = ['待确认', '整改中', '已完成']

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const toNumber = (value: unknown, fallback = 0, min = 0, max = 10_000_000) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, value))
  }
  const parsed = Number.parseFloat(String(value ?? ''))
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const toNullableNumber = (value: unknown, min = 0, max = 10_000_000): number | null => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(parsed)) return null
  const normalized = Math.max(min, Math.min(max, parsed))
  return Number(normalized.toFixed(2))
}

const toStringArray = (value: unknown, fallback: string[] = []) => {
  if (!Array.isArray(value)) return fallback
  const next = value.map((item) => clip(item, '', 120).toLowerCase()).filter(Boolean)
  return next.length > 0 ? next : fallback
}

const parseEnumValue = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => {
  const normalized = clip(value, '', 50)
  return (allowed.find((item) => item === normalized) || fallback) as T
}

const normalizeProjectMeta = (projectSlugValue: unknown) => {
  const projectSlug = clip(projectSlugValue, '', 120).toLowerCase()
  const project = REAL_CATERING_PROJECTS.find((item) => item.siteSlug === projectSlug)
  if (!project) {
    return {
      projectSlug,
      projectName: clip(projectSlugValue, '未命名项目', 120) || '未命名项目',
      scopePath: ['global', 'china'],
      drilldownHref: '/dashboard/finance/',
    }
  }
  return {
    projectSlug: project.siteSlug,
    projectName: project.name,
    scopePath: project.scopePath,
    drilldownHref: buildScopeDrilldownHref(project.scopePath, 'revenue'),
  }
}

const normalizeOrder = (value: unknown): SupplyPurchaseOrder | null => {
  const row = (value as Record<string, unknown>) || {}
  const id = clip(row.id, '', 120).toLowerCase()
  if (!id) return null
  const projectMeta = normalizeProjectMeta(row.receivingProjectSlug || row.receivingProjectName)
  return {
    id,
    po: clip(row.po, id.toUpperCase(), 120) || id.toUpperCase(),
    item: clip(row.item, '未命名物料', 120) || '未命名物料',
    supplier: clip(row.supplier, '未命名供应商', 120) || '未命名供应商',
    eta: clip(row.eta, '待确认', 120) || '待确认',
    status: parseEnumValue(row.status, supplyStatusValues, '在途'),
    delayHours: Math.round(toNumber(row.delayHours, 0, 0, 24 * 30)),
    orderAmountWan: Number(toNumber(row.orderAmountWan, 0, 0, 1_000_000).toFixed(2)),
    receivingProjectSlug: projectMeta.projectSlug,
    receivingProjectName: clip(row.receivingProjectName, projectMeta.projectName, 120) || projectMeta.projectName,
    receivingScopePath: toStringArray(row.receivingScopePath, projectMeta.scopePath),
    receivingDrilldownHref: clip(row.receivingDrilldownHref, projectMeta.drilldownHref, 260) || projectMeta.drilldownHref,
  }
}

const normalizeDispatchTask = (value: unknown): SupplyDispatchTask | null => {
  const row = (value as Record<string, unknown>) || {}
  const id = clip(row.id, '', 120).toLowerCase()
  if (!id) return null
  const projectMeta = normalizeProjectMeta(row.targetStoreSlug || row.targetStoreName)
  return {
    id,
    route: clip(row.route, '未命名路线', 180) || '未命名路线',
    completion: Number(toNumber(row.completion, 0, 0, 100).toFixed(1)),
    issue: parseEnumValue(row.issue, dispatchIssueValues, '正常'),
    etaVarianceMinutes: Math.round(toNumber(row.etaVarianceMinutes, 0, 0, 24 * 60)),
    coldChainTemp: clip(row.coldChainTemp, '0.0°C', 40) || '0.0°C',
    targetStoreSlug: projectMeta.projectSlug,
    targetStoreName: clip(row.targetStoreName, projectMeta.projectName, 120) || projectMeta.projectName,
    targetScopePath: toStringArray(row.targetScopePath, projectMeta.scopePath),
    targetDrilldownHref: clip(row.targetDrilldownHref, projectMeta.drilldownHref, 260) || projectMeta.drilldownHref,
  }
}

const normalizeInventoryAlert = (value: unknown): InventoryAlertItem | null => {
  const row = (value as Record<string, unknown>) || {}
  const id = clip(row.id, '', 120).toLowerCase()
  if (!id) return null
  return {
    id,
    item: clip(row.item, '未命名物料', 120) || '未命名物料',
    balanceDays: Math.round(toNumber(row.balanceDays, 0, 0, 10_000)),
    thresholdDays: Math.round(toNumber(row.thresholdDays, 0, 0, 10_000)),
    action: clip(row.action, '待处理', 200) || '待处理',
    priority: parseEnumValue(row.priority, inventoryPriorityValues, '中'),
    linkedOrderId: clip(row.linkedOrderId, '', 120).toLowerCase(),
  }
}

const normalizeFoodSafetyTask = (value: unknown): FoodSafetyTask | null => {
  const row = (value as Record<string, unknown>) || {}
  const id = clip(row.id, '', 120).toLowerCase()
  if (!id) return null
  const projectMeta = normalizeProjectMeta(row.storeSlug || row.store)
  return {
    id,
    storeSlug: projectMeta.projectSlug,
    store: clip(row.store, projectMeta.projectName, 120) || projectMeta.projectName,
    status: parseEnumValue(row.status, foodSafetyStatusValues, '待确认'),
    deadline: clip(row.deadline, '待确认', 120) || '待确认',
    owner: clip(row.owner, '食安负责人', 120) || '食安负责人',
    issueSummary: clip(row.issueSummary, '待补充问题描述', 500) || '待补充问题描述',
    scopePath: toStringArray(row.scopePath, projectMeta.scopePath),
    scopeDrilldownHref: clip(row.scopeDrilldownHref, projectMeta.drilldownHref, 260) || projectMeta.drilldownHref,
  }
}

const supplyStateSchema = z
  .object({
    orders: z.array(z.unknown()).optional().default([]),
    dispatchTasks: z.array(z.unknown()).optional().default([]),
    inventoryAlerts: z.array(z.unknown()).optional().default([]),
    foodSafetyTasks: z.array(z.unknown()).optional().default([]),
    overviewMetrics: z.record(z.string(), z.unknown()).optional(),
    source: z.string().trim().max(120).optional(),
    updatedAt: z.string().trim().max(80).optional(),
  })
  .passthrough()

export interface SupplyOverviewMetrics {
  inventoryTurnoverDays: number | null
  wasteRatePercent: number | null
  coldChainComplianceRate: number | null
}

export interface SupplyLiveDataset {
  orders: SupplyPurchaseOrder[]
  dispatchTasks: SupplyDispatchTask[]
  inventoryAlerts: InventoryAlertItem[]
  foodSafetyTasks: FoodSafetyTask[]
  overviewMetrics: SupplyOverviewMetrics
  source: string
  updatedAt: string
}

const normalizeOverviewMetrics = (
  value: unknown,
  fallback?: SupplyOverviewMetrics
): SupplyOverviewMetrics => {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return {
    inventoryTurnoverDays:
      toNullableNumber(source.inventoryTurnoverDays, 0, 365) ??
      fallback?.inventoryTurnoverDays ??
      null,
    wasteRatePercent:
      toNullableNumber(source.wasteRatePercent, 0, 100) ??
      fallback?.wasteRatePercent ??
      null,
    coldChainComplianceRate:
      toNullableNumber(source.coldChainComplianceRate, 0, 100) ??
      fallback?.coldChainComplianceRate ??
      null,
  }
}

const emptyDataset = (source: string): SupplyLiveDataset => ({
  orders: [],
  dispatchTasks: [],
  inventoryAlerts: [],
  foodSafetyTasks: [],
  overviewMetrics: {
    inventoryTurnoverDays: null,
    wasteRatePercent: null,
    coldChainComplianceRate: null,
  },
  source,
  updatedAt: new Date(0).toISOString(),
})

const normalizeDataset = (payload: unknown): SupplyLiveDataset | null => {
  const parsed = supplyStateSchema.safeParse(payload)
  if (!parsed.success) return null
  const source = clip(parsed.data.source, 'manual-ingest', 120) || 'manual-ingest'
  const updatedAt = clip(parsed.data.updatedAt, new Date().toISOString(), 80) || new Date().toISOString()
  return {
    orders: parsed.data.orders.map((item) => normalizeOrder(item)).filter((item): item is SupplyPurchaseOrder => Boolean(item)),
    dispatchTasks: parsed.data.dispatchTasks
      .map((item) => normalizeDispatchTask(item))
      .filter((item): item is SupplyDispatchTask => Boolean(item)),
    inventoryAlerts: parsed.data.inventoryAlerts
      .map((item) => normalizeInventoryAlert(item))
      .filter((item): item is InventoryAlertItem => Boolean(item)),
    foodSafetyTasks: parsed.data.foodSafetyTasks
      .map((item) => normalizeFoodSafetyTask(item))
      .filter((item): item is FoodSafetyTask => Boolean(item)),
    overviewMetrics: normalizeOverviewMetrics(parsed.data.overviewMetrics),
    source,
    updatedAt,
  }
}

export const readSupplyLiveDataset = async (): Promise<SupplyLiveDataset> => {
  const existing = await readPersistentJsonState<unknown>(SUPPLY_NAMESPACE)
  const normalized = normalizeDataset(existing)
  if (normalized) return normalized
  return emptyDataset(isStrictLiveMode() ? 'strict-live-empty' : 'unconfigured')
}

export const writeSupplyLiveDataset = async (
  payload: unknown,
  source = 'manual-ingest'
): Promise<SupplyLiveDataset> => {
  const current = await readSupplyLiveDataset()
  const normalized = normalizeDataset(payload)
  const next: SupplyLiveDataset = normalized
    ? {
        ...normalized,
        source: clip(source, normalized.source, 120) || normalized.source,
        updatedAt: new Date().toISOString(),
      }
    : {
        ...current,
        source: clip(source, current.source, 120) || current.source,
        updatedAt: new Date().toISOString(),
      }
  await writePersistentJsonState(SUPPLY_NAMESPACE, next)
  return next
}

export const patchSupplyLiveDataset = async (
  payload: {
    orders?: unknown[]
    dispatchTasks?: unknown[]
    inventoryAlerts?: unknown[]
    foodSafetyTasks?: unknown[]
    overviewMetrics?: unknown
  },
  source = 'manual-patch'
): Promise<SupplyLiveDataset> => {
  const current = await readSupplyLiveDataset()
  const next: SupplyLiveDataset = {
    orders: payload.orders ? payload.orders.map((item) => normalizeOrder(item)).filter((item): item is SupplyPurchaseOrder => Boolean(item)) : current.orders,
    dispatchTasks: payload.dispatchTasks
      ? payload.dispatchTasks.map((item) => normalizeDispatchTask(item)).filter((item): item is SupplyDispatchTask => Boolean(item))
      : current.dispatchTasks,
    inventoryAlerts: payload.inventoryAlerts
      ? payload.inventoryAlerts.map((item) => normalizeInventoryAlert(item)).filter((item): item is InventoryAlertItem => Boolean(item))
      : current.inventoryAlerts,
    foodSafetyTasks: payload.foodSafetyTasks
      ? payload.foodSafetyTasks.map((item) => normalizeFoodSafetyTask(item)).filter((item): item is FoodSafetyTask => Boolean(item))
      : current.foodSafetyTasks,
    overviewMetrics:
      payload.overviewMetrics === undefined
        ? current.overviewMetrics
        : normalizeOverviewMetrics(payload.overviewMetrics, current.overviewMetrics),
    source: clip(source, current.source, 120) || current.source,
    updatedAt: new Date().toISOString(),
  }
  await writePersistentJsonState(SUPPLY_NAMESPACE, next)
  return next
}

export const buildSupplyOverview = (dataset: SupplyLiveDataset) => {
  const delayedOrders = dataset.orders.filter((order) => order.status === '延迟').length
  const onTimeRate =
    dataset.orders.length > 0
      ? Number((((dataset.orders.length - delayedOrders) / dataset.orders.length) * 100).toFixed(1))
      : 0
  const computedTurnoverDays =
    dataset.inventoryAlerts.length > 0
      ? Number(
          (
            dataset.inventoryAlerts.reduce((sum, row) => sum + row.balanceDays, 0) /
            dataset.inventoryAlerts.length
          ).toFixed(1)
        )
      : null
  const computedColdChainComplianceRate =
    dataset.dispatchTasks.length > 0
      ? Number(
          (
            dataset.dispatchTasks.reduce((sum, row) => sum + row.completion, 0) /
            dataset.dispatchTasks.length
          ).toFixed(1)
        )
      : null

  return {
    totalOrders: dataset.orders.length,
    delayedOrders,
    onTimeRate,
    pendingQc: dataset.orders.filter((order) => order.status === '待质检').length,
    dispatchTasks: dataset.dispatchTasks.length,
    pendingFoodSafetyTasks: dataset.foodSafetyTasks.filter((task) => task.status !== '已完成').length,
    inventoryTurnoverDays:
      dataset.overviewMetrics.inventoryTurnoverDays ?? computedTurnoverDays,
    wasteRatePercent: dataset.overviewMetrics.wasteRatePercent,
    coldChainComplianceRate:
      dataset.overviewMetrics.coldChainComplianceRate ?? computedColdChainComplianceRate,
  }
}

export const findSupplyPurchaseOrder = (dataset: SupplyLiveDataset, orderId: string) =>
  dataset.orders.find((item) => item.id === clip(orderId, '', 120).toLowerCase())

export const findSupplyDispatchTask = (dataset: SupplyLiveDataset, routeId: string) =>
  dataset.dispatchTasks.find((item) => item.id === clip(routeId, '', 120).toLowerCase())

export const findInventoryAlert = (dataset: SupplyLiveDataset, alertId: string) =>
  dataset.inventoryAlerts.find((item) => item.id === clip(alertId, '', 120).toLowerCase())

export const findFoodSafetyTask = (dataset: SupplyLiveDataset, taskId: string) =>
  dataset.foodSafetyTasks.find((item) => item.id === clip(taskId, '', 120).toLowerCase())
