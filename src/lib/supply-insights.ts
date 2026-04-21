import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildScopeDrilldownHref } from '@/lib/scope-drilldown'

export type SupplyStatus = '在途' | '延迟' | '待质检'
export type DispatchIssue = '正常' | '待补货' | '冷链预警'
export type InventoryPriority = '高' | '中' | '低'
export type FoodSafetyStatus = '待确认' | '整改中' | '已完成'

export interface SupplyPurchaseOrder {
  id: string
  po: string
  item: string
  supplier: string
  eta: string
  status: SupplyStatus
  delayHours: number
  orderAmountWan: number
  receivingProjectSlug: string
  receivingProjectName: string
  receivingScopePath: string[]
  receivingDrilldownHref: string
}

export interface SupplyDispatchTask {
  id: string
  route: string
  completion: number
  issue: DispatchIssue
  etaVarianceMinutes: number
  coldChainTemp: string
  targetStoreSlug: string
  targetStoreName: string
  targetScopePath: string[]
  targetDrilldownHref: string
}

export interface InventoryAlertItem {
  id: string
  item: string
  balanceDays: number
  thresholdDays: number
  action: string
  priority: InventoryPriority
  linkedOrderId: string
}

export interface FoodSafetyTask {
  id: string
  storeSlug: string
  store: string
  status: FoodSafetyStatus
  deadline: string
  owner: string
  issueSummary: string
  scopePath: string[]
  scopeDrilldownHref: string
}

const getProjectBySlug = (projectSlug: string) => {
  const project = REAL_CATERING_PROJECTS.find((item) => item.siteSlug === projectSlug)
  if (!project) {
    throw new Error(`Missing project config for slug: ${projectSlug}`)
  }
  return project
}
const strictLiveMode = isStrictLiveMode()
export const SUPPLY_LIVE_REQUIRED = strictLiveMode

const purchaseOrderSeeds = [
  {
    id: 'po-2048',
    po: 'PO-2048',
    item: '叶菜类',
    supplier: 'FreshFields',
    eta: '今日 15:00',
    status: '在途' as const,
    delayHours: 0,
    orderAmountWan: 5.4,
    receivingProjectSlug: 'bluefish-shanghai-huazhu',
  },
  {
    id: 'po-2051',
    po: 'PO-2051',
    item: '禽类',
    supplier: 'Golden Grain',
    eta: '今日 18:30',
    status: '延迟' as const,
    delayHours: 4,
    orderAmountWan: 8.2,
    receivingProjectSlug: 'a-sz011-bidi-2',
  },
  {
    id: 'po-2052',
    po: 'PO-2052',
    item: '调味料',
    supplier: 'Chef Essentials',
    eta: '明日 13:00',
    status: '待质检' as const,
    delayHours: 0,
    orderAmountWan: 2.1,
    receivingProjectSlug: 'a-sz046-yiteng',
  },
  {
    id: 'po-2054',
    po: 'PO-2054',
    item: '冻品',
    supplier: 'OceanPro',
    eta: '明日 09:00',
    status: '延迟' as const,
    delayHours: 7,
    orderAmountWan: 6.7,
    receivingProjectSlug: 'a-sz040-envision-shiyan',
  },
] as const

const seedPurchaseOrders: SupplyPurchaseOrder[] = purchaseOrderSeeds.map((seed) => {
  const project = getProjectBySlug(seed.receivingProjectSlug)
  return {
    ...seed,
    receivingProjectName: project.name,
    receivingScopePath: project.scopePath,
    receivingDrilldownHref: buildScopeDrilldownHref(project.scopePath, 'revenue'),
  }
})
export const SUPPLY_PURCHASE_ORDERS: SupplyPurchaseOrder[] = strictLiveMode ? [] : seedPurchaseOrders

const dispatchSeeds = [
  {
    id: 'route-central-a-huazhu',
    from: '中央厨房 A',
    targetStoreSlug: 'bluefish-shanghai-huazhu',
    completion: 98,
    issue: '正常' as const,
    etaVarianceMinutes: 6,
    coldChainTemp: '2.8°C',
  },
  {
    id: 'route-central-a-bidi',
    from: '中央厨房 A',
    targetStoreSlug: 'a-sz011-bidi-2',
    completion: 91,
    issue: '待补货' as const,
    etaVarianceMinutes: 32,
    coldChainTemp: '4.6°C',
  },
  {
    id: 'route-central-b-shiyan',
    from: '中央厨房 B',
    targetStoreSlug: 'a-sz040-envision-shiyan',
    completion: 87,
    issue: '冷链预警' as const,
    etaVarianceMinutes: 41,
    coldChainTemp: '7.9°C',
  },
] as const

const seedDispatchTasks: SupplyDispatchTask[] = dispatchSeeds.map((seed) => {
  const project = getProjectBySlug(seed.targetStoreSlug)
  return {
    ...seed,
    route: `${seed.from} -> ${project.name}`,
    targetStoreName: project.name,
    targetScopePath: project.scopePath,
    targetDrilldownHref: buildScopeDrilldownHref(project.scopePath, 'revenue'),
  }
})
export const SUPPLY_DISPATCH_TASKS: SupplyDispatchTask[] = strictLiveMode ? [] : seedDispatchTasks

const seedInventoryAlertItems: InventoryAlertItem[] = [
  {
    id: 'item-poultry',
    item: '禽类',
    balanceDays: 5,
    thresholdDays: 7,
    action: '建议补货',
    priority: '高',
    linkedOrderId: 'po-2051',
  },
  {
    id: 'item-leafy-veg',
    item: '叶菜',
    balanceDays: 3,
    thresholdDays: 5,
    action: '建议当日调拨',
    priority: '中',
    linkedOrderId: 'po-2048',
  },
  {
    id: 'item-cooking-oil',
    item: '食用油',
    balanceDays: 9,
    thresholdDays: 8,
    action: '库存充足',
    priority: '低',
    linkedOrderId: 'po-2052',
  },
  {
    id: 'item-rice-flour',
    item: '米面',
    balanceDays: 16,
    thresholdDays: 10,
    action: '库存充足',
    priority: '低',
    linkedOrderId: 'po-2054',
  },
]
export const INVENTORY_ALERT_ITEMS: InventoryAlertItem[] = strictLiveMode ? [] : seedInventoryAlertItems

const foodSafetySeeds = [
  {
    id: 'task-a-wx005-cuntian',
    storeSlug: 'a-wx005-cuntian',
    status: '待确认' as const,
    deadline: '今日 17:30',
    owner: '食安督导组',
    issueSummary: '冷藏记录缺失 2 个时段，待门店主管补录并复核',
  },
  {
    id: 'task-a-sz040-envision-shiyan',
    storeSlug: 'a-sz040-envision-shiyan',
    status: '整改中' as const,
    deadline: '明日 12:00',
    owner: '北区质量经理',
    issueSummary: '留样签字不完整，需完成全链路追溯材料补齐',
  },
  {
    id: 'task-bluefish-shanghai-biyun',
    storeSlug: 'bluefish-shanghai-biyun',
    status: '已完成' as const,
    deadline: '已闭环',
    owner: '上海食安专员',
    issueSummary: '餐具高温消杀记录闭环完成，复核通过',
  },
] as const

const seedFoodSafetyTasks: FoodSafetyTask[] = foodSafetySeeds.map((seed) => {
  const project = getProjectBySlug(seed.storeSlug)
  return {
    ...seed,
    store: project.name,
    scopePath: project.scopePath,
    scopeDrilldownHref: buildScopeDrilldownHref(project.scopePath),
  }
})
export const FOOD_SAFETY_TASKS: FoodSafetyTask[] = strictLiveMode ? [] : seedFoodSafetyTasks

export const getSupplyPurchaseOrderById = (orderId: string) =>
  SUPPLY_PURCHASE_ORDERS.find((order) => order.id === orderId)

export const getSupplyDispatchTaskById = (routeId: string) =>
  SUPPLY_DISPATCH_TASKS.find((task) => task.id === routeId)

export const getInventoryAlertById = (alertId: string) =>
  INVENTORY_ALERT_ITEMS.find((item) => item.id === alertId)

export const getFoodSafetyTaskById = (taskId: string) =>
  FOOD_SAFETY_TASKS.find((task) => task.id === taskId)

export const getLinkedOrderForInventoryAlert = (alertId: string) => {
  const alert = getInventoryAlertById(alertId)
  if (!alert) return undefined
  return getSupplyPurchaseOrderById(alert.linkedOrderId)
}

export const SUPPLY_OVERVIEW = {
  totalOrders: SUPPLY_PURCHASE_ORDERS.length,
  delayedOrders: SUPPLY_PURCHASE_ORDERS.filter((order) => order.status === '延迟').length,
  onTimeRate: SUPPLY_PURCHASE_ORDERS.length > 0 ? 92.8 : 0,
  pendingQc: SUPPLY_PURCHASE_ORDERS.filter((order) => order.status === '待质检').length,
  dispatchTasks: SUPPLY_DISPATCH_TASKS.length,
}
