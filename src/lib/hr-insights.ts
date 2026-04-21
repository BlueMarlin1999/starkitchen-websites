import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildScopeDrilldownHref, buildScopeMetricHref } from '@/lib/scope-drilldown'

export type HrPriority = 'high' | 'medium' | 'low'

export interface HrShiftOptimizationItem {
  id: string
  projectSlug: string
  store: string
  city: string
  laborRate: number
  targetRate: number
  affectedShift: string
  rootCause: string
  suggestion: string
  recoverableCostWan: number
  owner: string
  ownerTitle: string
  scopePath: string[]
  projectDrilldownHref: string
  laborMetricHref: string
}

export interface HrStaffingGapItem {
  id: string
  role: string
  gap: number
  area: string
  priority: HrPriority
  openDays: number
  candidatePipeline: number
  owner: string
  actionPlan: string
}

export interface HrResponseSlaItem {
  level: 'P1' | 'P2' | 'P3'
  scenario: string
  owner: string
  firstResponse: string
  closureTarget: string
}

const getProjectBySlug = (projectSlug: string) => {
  const project = REAL_CATERING_PROJECTS.find((item) => item.siteSlug === projectSlug)
  if (!project) {
    throw new Error(`Missing project config for slug: ${projectSlug}`)
  }
  return project
}
const strictLiveMode = isStrictLiveMode()
export const HR_LIVE_REQUIRED = strictLiveMode

const shiftSeeds = [
  {
    id: 'shift-a-sz044-envision-chifeng',
    projectSlug: 'a-sz044-envision-chifeng',
    laborRate: 34.8,
    targetRate: 32.0,
    affectedShift: '午高峰 + 晚高峰',
    rootCause: '兼职峰值配置偏高 + 岗位重叠',
    suggestion: '晚高峰减少 1 名兼职，前移备餐时段，收银与出餐跨岗',
    recoverableCostWan: 1.6,
  },
  {
    id: 'shift-a-bj055-huichuan',
    projectSlug: 'a-bj055-huichuan',
    laborRate: 33.2,
    targetRate: 32.0,
    affectedShift: '午高峰',
    rootCause: '午高峰排班密度偏高',
    suggestion: '午高峰岗位合并，改为跨岗轮值，新增 30 分钟机动班',
    recoverableCostWan: 0.9,
  },
  {
    id: 'shift-bluefish-shanghai-huazhu',
    projectSlug: 'bluefish-shanghai-huazhu',
    laborRate: 32.9,
    targetRate: 32.0,
    affectedShift: '后厨 prep 班段',
    rootCause: '后厨预制比例不足，人工投入前置',
    suggestion: '后厨预制比例提升至 58%，前厅岗位保留弹性工时',
    recoverableCostWan: 0.7,
  },
  {
    id: 'shift-a-sz046-yiteng',
    projectSlug: 'a-sz046-yiteng',
    laborRate: 32.6,
    targetRate: 31.8,
    affectedShift: '开餐前 2 小时',
    rootCause: '前置备餐偏早，空档工时偏高',
    suggestion: '将开餐前备餐窗口由 120 分钟压缩至 75 分钟',
    recoverableCostWan: 0.5,
  },
] as const

const seedShiftItems: HrShiftOptimizationItem[] = shiftSeeds.map((seed) => {
  const project = getProjectBySlug(seed.projectSlug)
  return {
    ...seed,
    store: project.name,
    city: project.city,
    owner: project.owner,
    ownerTitle: project.ownerTitle,
    scopePath: project.scopePath,
    projectDrilldownHref: buildScopeDrilldownHref(project.scopePath, 'labor-cost'),
    laborMetricHref: buildScopeMetricHref('labor-cost', project.scopePath),
  }
})
export const HR_SHIFT_OPTIMIZATION_ITEMS: HrShiftOptimizationItem[] = strictLiveMode ? [] : seedShiftItems

const seedStaffingGapItems: HrStaffingGapItem[] = [
  {
    id: 'role-chef-lead',
    role: '厨师长',
    gap: 2,
    area: '苏州 / 无锡',
    priority: 'high',
    openDays: 12,
    candidatePipeline: 3,
    owner: '人力运营组 + 区域运营总监',
    actionPlan: '先由区域后厨主管跨店支援，7 天内完成 1 人补位，14 天补齐',
  },
  {
    id: 'role-procurement-specialist',
    role: '采购专员',
    gap: 1,
    area: '上海',
    priority: 'medium',
    openDays: 8,
    candidatePipeline: 2,
    owner: '供应链中心',
    actionPlan: '从共享采购池临时借调，完成试岗后转正',
  },
  {
    id: 'role-supervisor',
    role: '督导',
    gap: 1,
    area: '天津',
    priority: 'medium',
    openDays: 9,
    candidatePipeline: 4,
    owner: '运营管理中心',
    actionPlan: '先由北京区域督导周驻场，2 周内完成正式补岗',
  },
  {
    id: 'role-counter-captain',
    role: '档口负责人',
    gap: 1,
    area: '赤峰',
    priority: 'low',
    openDays: 5,
    candidatePipeline: 2,
    owner: '北区项目组',
    actionPlan: '优先内部晋升，保留外部招聘作为后备方案',
  },
]
export const HR_STAFFING_GAP_ITEMS: HrStaffingGapItem[] = strictLiveMode ? [] : seedStaffingGapItems

export const HR_RESPONSE_SLA: HrResponseSlaItem[] = [
  {
    level: 'P1',
    scenario: '人工成本率连续 3 天超目标 2pct 以上',
    owner: 'HRBP + 区域运营总监',
    firstResponse: '2 小时',
    closureTarget: '24 小时',
  },
  {
    level: 'P2',
    scenario: '关键岗位缺编导致排班无法覆盖',
    owner: 'HRBP + 招聘组',
    firstResponse: '4 小时',
    closureTarget: '72 小时',
  },
  {
    level: 'P3',
    scenario: '单班次临时缺编可通过内部调班解决',
    owner: '门店主管',
    firstResponse: '8 小时',
    closureTarget: '7 天',
  },
]

export const HR_WORKFORCE_SNAPSHOT = {
  onDuty: strictLiveMode ? 0 : 1268,
  headcount: strictLiveMode ? 0 : 1320,
  laborRate: strictLiveMode ? 0 : 30.8,
  laborRateTarget: 32.0,
  abnormalStores: HR_SHIFT_OPTIMIZATION_ITEMS.length,
  keyRoleGap: HR_STAFFING_GAP_ITEMS.reduce((sum, item) => sum + item.gap, 0),
}

export const getHrShiftSummary = () => {
  if (HR_SHIFT_OPTIMIZATION_ITEMS.length === 0) {
    return {
      highestLaborRate: 0,
      weightedGap: 0,
      recoverableCostWan: 0,
    }
  }
  const highestLaborRate = Math.max(...HR_SHIFT_OPTIMIZATION_ITEMS.map((item) => item.laborRate))
  const weightedGap =
    HR_SHIFT_OPTIMIZATION_ITEMS.reduce((sum, item) => sum + (item.laborRate - item.targetRate), 0) /
    HR_SHIFT_OPTIMIZATION_ITEMS.length
  const recoverableCostWan = HR_SHIFT_OPTIMIZATION_ITEMS.reduce(
    (sum, item) => sum + item.recoverableCostWan,
    0
  )

  return {
    highestLaborRate,
    weightedGap,
    recoverableCostWan,
  }
}
