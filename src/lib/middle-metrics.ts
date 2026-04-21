import { z } from 'zod'
import { getRoleBaseScopePath } from '@/lib/access'
import { MetricSlug, getScopedFinancialMetric } from '@/lib/business-metrics'
import { HR_WORKFORCE_SNAPSHOT, getHrShiftSummary } from '@/lib/hr-insights'
import {
  FOOD_SAFETY_TASKS,
  INVENTORY_ALERT_ITEMS,
  SUPPLY_DISPATCH_TASKS,
  SUPPLY_PURCHASE_ORDERS,
} from '@/lib/supply-insights'

const MIDDLE_METRIC_KEYS = [
  'revenue-monthly',
  'food-cost-rate',
  'labor-cost-rate',
  'net-profit-rate',
  'operating-profit',
  'on-duty-rate',
  'key-role-gap',
  'delayed-purchase-orders',
  'dispatch-warnings',
  'food-safety-open',
] as const

export type MiddleMetricKey = (typeof MIDDLE_METRIC_KEYS)[number]
export const middleMetricKeySchema = z.enum(MIDDLE_METRIC_KEYS)

type MiddleMetricUnit = 'wan' | 'percent' | 'count'

interface MiddleMetricDefinition {
  key: MiddleMetricKey
  label: string
  hint: string
  unit: MiddleMetricUnit
  countSuffix?: string
  inputHint: string
}

export interface MiddleManualMetricRecord {
  id: string
  metricKey: MiddleMetricKey
  value: number
  note: string
  actorId: string
  actorName: string
  actorRole: string
  createdAt: string
}

export type MiddleMetricSource = 'auto' | 'manual'

export interface MiddleMetricCard {
  key: MiddleMetricKey
  label: string
  hint: string
  value: number
  displayValue: string
  source: MiddleMetricSource
  sourceLabel: string
  inputHint: string
  updatedAt: string
  updatedBy: string
  note: string
}

export interface MiddleManualHistoryItem extends MiddleManualMetricRecord {
  label: string
  displayValue: string
}

export interface MiddleMetricsPayload {
  scopePath: string[]
  metrics: MiddleMetricCard[]
  history: MiddleManualHistoryItem[]
  manualCount: number
  updatedAt: string
}

const METRIC_DEFINITIONS: MiddleMetricDefinition[] = [
  {
    key: 'revenue-monthly',
    label: '营业收入（月）',
    hint: '项目收入规模',
    unit: 'wan',
    inputHint: '单位：万元，例如 171.5',
  },
  {
    key: 'food-cost-rate',
    label: '食材成本率',
    hint: '后厨成本控制',
    unit: 'percent',
    inputHint: '单位：百分比，例如 31.2（无需输入 %）',
  },
  {
    key: 'labor-cost-rate',
    label: '人力成本率',
    hint: '排班与工时效率',
    unit: 'percent',
    inputHint: '单位：百分比，例如 29.8（无需输入 %）',
  },
  {
    key: 'net-profit-rate',
    label: '净利率',
    hint: '项目最终利润',
    unit: 'percent',
    inputHint: '单位：百分比，例如 12.5（无需输入 %）',
  },
  {
    key: 'operating-profit',
    label: '营业利润',
    hint: '经营利润表现',
    unit: 'wan',
    inputHint: '单位：万元，例如 27.0',
  },
  {
    key: 'on-duty-rate',
    label: '在岗编制达成',
    hint: '在岗 / 编制',
    unit: 'percent',
    inputHint: '单位：百分比，例如 96.1（无需输入 %）',
  },
  {
    key: 'key-role-gap',
    label: '关键岗位缺编',
    hint: '厨师长 / 督导等岗位',
    unit: 'count',
    countSuffix: '人',
    inputHint: '单位：人，例如 4',
  },
  {
    key: 'delayed-purchase-orders',
    label: '延迟采购单',
    hint: '采购到货异常',
    unit: 'count',
    countSuffix: '单',
    inputHint: '单位：单，例如 3',
  },
  {
    key: 'dispatch-warnings',
    label: '配送异常任务',
    hint: '冷链 / 履约预警',
    unit: 'count',
    countSuffix: '项',
    inputHint: '单位：项，例如 2',
  },
  {
    key: 'food-safety-open',
    label: '食安待闭环',
    hint: '食安整改追踪',
    unit: 'count',
    countSuffix: '项',
    inputHint: '单位：项，例如 1',
  },
]

const toSafeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const readScopedMetric = (scopePath: string[], slug: MetricSlug) =>
  toSafeNumber(getScopedFinancialMetric(slug, scopePath)?.value, 0)

const formatCount = (value: number, suffix = '') => `${Math.max(0, Math.round(value))}${suffix}`
const formatWan = (value: number) => `${value.toFixed(1)}万`
const formatPercent = (value: number) => `${value.toFixed(1)}%`

const formatWithDefinition = (definition: MiddleMetricDefinition, value: number) => {
  if (definition.unit === 'wan') return formatWan(value)
  if (definition.unit === 'percent') return formatPercent(value)
  return formatCount(value, definition.countSuffix)
}

const buildAutoValues = (scopePath: string[]) => {
  const revenue = readScopedMetric(scopePath, 'revenue')
  const foodCost = readScopedMetric(scopePath, 'food-cost')
  const laborCost = readScopedMetric(scopePath, 'labor-cost')
  const netProfit = readScopedMetric(scopePath, 'net-profit')
  const operatingProfit = readScopedMetric(scopePath, 'operating-profit')
  const headcount = toSafeNumber(HR_WORKFORCE_SNAPSHOT.headcount, 0)
  const onDuty = toSafeNumber(HR_WORKFORCE_SNAPSHOT.onDuty, 0)
  const headcountRate = headcount > 0 ? (onDuty / headcount) * 100 : 0
  const keyRoleGap = toSafeNumber(HR_WORKFORCE_SNAPSHOT.keyRoleGap, 0)
  const delayedOrders = SUPPLY_PURCHASE_ORDERS.filter((item) => item.status === '延迟').length
  const dispatchWarnings = SUPPLY_DISPATCH_TASKS.filter((item) => item.issue !== '正常').length
  const foodSafetyOpen = FOOD_SAFETY_TASKS.filter((item) => item.status !== '已完成').length
  const shiftSummary = getHrShiftSummary()
  const inventoryHigh = INVENTORY_ALERT_ITEMS.filter((item) => item.priority === '高').length

  return {
    values: {
      'revenue-monthly': revenue,
      'food-cost-rate': revenue > 0 ? (foodCost / revenue) * 100 : 0,
      'labor-cost-rate': revenue > 0 ? (laborCost / revenue) * 100 : 0,
      'net-profit-rate': revenue > 0 ? (netProfit / revenue) * 100 : 0,
      'operating-profit': operatingProfit,
      'on-duty-rate': headcountRate,
      'key-role-gap': keyRoleGap,
      'delayed-purchase-orders': delayedOrders,
      'dispatch-warnings': dispatchWarnings,
      'food-safety-open': foodSafetyOpen,
    } as Record<MiddleMetricKey, number>,
    dynamicHints: {
      'food-safety-open': `最高人工偏差 ${shiftSummary.highestLaborRate.toFixed(1)}%，高优先库存预警 ${inventoryHigh} 项`,
    } as Partial<Record<MiddleMetricKey, string>>,
  }
}

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]) =>
  items
    .slice()
    .sort((left, right) => Date.parse(right.createdAt || '') - Date.parse(left.createdAt || ''))

export const buildMiddleScopePath = (role?: string, assignedScopePath?: string[] | string | null) =>
  getRoleBaseScopePath(role, assignedScopePath)

export const listMiddleMetricDefinitions = () => METRIC_DEFINITIONS.slice()

export const buildMiddleAutoMetricCards = (scopePath: string[], nowIso = new Date().toISOString()) => {
  const { values, dynamicHints } = buildAutoValues(scopePath)
  return METRIC_DEFINITIONS.map((definition) => {
    const value = values[definition.key] || 0
    return {
      key: definition.key,
      label: definition.label,
      hint: dynamicHints[definition.key] || definition.hint,
      value,
      displayValue: formatWithDefinition(definition, value),
      source: 'auto' as const,
      sourceLabel: '系统自动导入',
      inputHint: definition.inputHint,
      updatedAt: nowIso,
      updatedBy: 'system',
      note: '',
    }
  })
}

export const toMiddleManualHistoryItems = (entries: MiddleManualMetricRecord[]) => {
  const definitionMap = new Map(METRIC_DEFINITIONS.map((item) => [item.key, item]))
  return sortByCreatedAtDesc(entries).map((entry) => {
    const definition = definitionMap.get(entry.metricKey)
    const fallback: MiddleMetricDefinition = {
      key: entry.metricKey,
      label: entry.metricKey,
      hint: '',
      unit: 'count',
      inputHint: '',
    }
    const activeDefinition = definition || fallback
    return {
      ...entry,
      label: activeDefinition.label,
      displayValue: formatWithDefinition(activeDefinition, entry.value),
    }
  })
}

export const applyMiddleManualOverrides = (
  autoMetrics: MiddleMetricCard[],
  entries: MiddleManualMetricRecord[]
) => {
  const latestMap = new Map<MiddleMetricKey, MiddleManualMetricRecord>()
  for (const entry of sortByCreatedAtDesc(entries)) {
    if (!latestMap.has(entry.metricKey)) {
      latestMap.set(entry.metricKey, entry)
    }
  }

  return autoMetrics.map((metric) => {
    const latest = latestMap.get(metric.key)
    if (!latest) return metric
    return {
      ...metric,
      value: latest.value,
      displayValue: formatWithDefinition(
        METRIC_DEFINITIONS.find((definition) => definition.key === metric.key) || METRIC_DEFINITIONS[0],
        latest.value
      ),
      source: 'manual' as const,
      sourceLabel: '手工录入',
      updatedAt: latest.createdAt,
      updatedBy: latest.actorName || latest.actorId,
      note: latest.note,
    }
  })
}
