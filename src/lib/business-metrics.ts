import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  ChefHat,
  Users,
  Building2,
  Zap,
  Package,
  Megaphone,
  Truck,
  Receipt,
  LineChart,
  Briefcase,
  PiggyBank,
} from 'lucide-react'
import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'

export type MetricSlug =
  | 'revenue'
  | 'food-cost'
  | 'labor-cost'
  | 'rent'
  | 'energy'
  | 'other-material-cost'
  | 'marketing-cost'
  | 'maintenance-logistics-cost'
  | 'tax'
  | 'interest'
  | 'depreciation-amortization'
  | 'operating-profit'
  | 'management-cost'
  | 'net-profit'

export type MetricCategory = 'revenue' | 'cost' | 'profit'

export interface FinancialMetric {
  slug: MetricSlug
  name: string
  icon: LucideIcon
  category: MetricCategory
  value: number
  unit: string
  monthlyValues: number[]
  description: string
  subMenus: string[]
}

export interface CityProject {
  city: string
  projects: number
  stores: number
}

export interface CityMetricRow extends CityProject {
  value: number
  weight: number
}

export const MONTH_LABELS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04']

const CITY_DISPLAY_ORDER = ['上海', '苏州', '北京', '鄂尔多斯', '太仓', '无锡', '十堰', '赤峰', '大连']

const cityProjectSummary = REAL_CATERING_PROJECTS.reduce<Record<string, { projects: number; stores: number }>>(
  (acc, project) => {
    const current = acc[project.city] || { projects: 0, stores: 0 }
    current.projects += 1
    current.stores += 1
    acc[project.city] = current
    return acc
  },
  {}
)

const orderedCities = [
  ...CITY_DISPLAY_ORDER.filter((city) => cityProjectSummary[city]),
  ...Object.keys(cityProjectSummary).filter((city) => !CITY_DISPLAY_ORDER.includes(city)).sort((a, b) => a.localeCompare(b, 'zh-CN')),
]

export const CITY_PROJECTS: CityProject[] = orderedCities.map((city) => ({
  city,
  projects: cityProjectSummary[city].projects,
  stores: cityProjectSummary[city].stores,
}))

const cityRevenueBaseMap: Record<string, number> = {
  上海: 1.38,
  苏州: 1.62,
  北京: 1.18,
  鄂尔多斯: 0.94,
  太仓: 0.76,
  无锡: 0.82,
  十堰: 0.74,
  赤峰: 0.69,
  大连: 0.71,
}

const cityRevenueMap = Object.fromEntries(
  CITY_PROJECTS.map(({ city, projects }) => [city, Math.max(90, Math.round(projects * 125 * (cityRevenueBaseMap[city] || 1)))])
) as Record<string, number>

const revenueTotal = Object.values(cityRevenueMap).reduce((sum, value) => sum + value, 0)

const cityWeights = CITY_PROJECTS.map((city) => ({
  ...city,
  weight: cityRevenueMap[city.city] / revenueTotal,
}))

export const FINANCIAL_METRICS: FinancialMetric[] = [
  {
    slug: 'revenue',
    name: '营业收入',
    icon: BadgeDollarSign,
    category: 'revenue',
    value: 7850,
    unit: '万元',
    monthlyValues: [7020, 7180, 7420, 7590, 7760, 7850],
    description: '全口径门店营业收入，含团餐、零售配套与定制餐服务。',
    subMenus: ['收入趋势', '区域收入结构', '重点门店收入'],
  },
  {
    slug: 'food-cost',
    name: '食材成本',
    icon: ChefHat,
    category: 'cost',
    value: 2480,
    unit: '万元',
    monthlyValues: [2320, 2380, 2440, 2490, 2520, 2480],
    description: '含生鲜、预制品、调味料采购及损耗成本。',
    subMenus: ['成本趋势', '菜品品类成本', '区域成本对比'],
  },
  {
    slug: 'labor-cost',
    name: '人力成本',
    icon: Users,
    category: 'cost',
    value: 1620,
    unit: '万元',
    monthlyValues: [1540, 1570, 1600, 1630, 1645, 1620],
    description: '含门店排班工时、社保公积金与临时用工费用。',
    subMenus: ['人效趋势', '排班成本', '区域人力结构'],
  },
  {
    slug: 'rent',
    name: '房租',
    icon: Building2,
    category: 'cost',
    value: 620,
    unit: '万元',
    monthlyValues: [612, 614, 616, 618, 621, 620],
    description: '门店及中央厨房场地租赁成本。',
    subMenus: ['租赁趋势', '高租金城市', '合同到期预警'],
  },
  {
    slug: 'energy',
    name: '能耗费',
    icon: Zap,
    category: 'cost',
    value: 318,
    unit: '万元',
    monthlyValues: [304, 308, 312, 316, 322, 318],
    description: '含水电燃气与冷链设备能耗费用。',
    subMenus: ['能耗趋势', '门店能耗排行', '节能改造回报'],
  },
  {
    slug: 'other-material-cost',
    name: '其它材料成本',
    icon: Package,
    category: 'cost',
    value: 286,
    unit: '万元',
    monthlyValues: [270, 276, 282, 288, 292, 286],
    description: '一次性用品、包装物料及厨房耗材等。',
    subMenus: ['材料趋势', '物料结构', '供应商成本波动'],
  },
  {
    slug: 'marketing-cost',
    name: '营销费用',
    icon: Megaphone,
    category: 'cost',
    value: 240,
    unit: '万元',
    monthlyValues: [208, 216, 224, 236, 248, 240],
    description: '线上投放、活动补贴、会员促销等营销投入。',
    subMenus: ['投放趋势', '渠道ROI', '活动复盘'],
  },
  {
    slug: 'maintenance-logistics-cost',
    name: '维保物流成本',
    icon: Truck,
    category: 'cost',
    value: 358,
    unit: '万元',
    monthlyValues: [338, 344, 350, 356, 364, 358],
    description: '设备维保、冷链运输、城市配送及干线物流。',
    subMenus: ['物流趋势', '维保工单', '冷链履约率'],
  },
  {
    slug: 'tax',
    name: '税费',
    icon: Receipt,
    category: 'cost',
    value: 700,
    unit: '万元',
    monthlyValues: [666, 674, 682, 690, 710, 700],
    description: '增值税、附加税费与地方税务支出。',
    subMenus: ['税费趋势', '税负结构', '税务筹划建议'],
  },
  {
    slug: 'interest',
    name: '利息',
    icon: BadgeDollarSign,
    category: 'cost',
    value: 94,
    unit: '万元',
    monthlyValues: [82, 84, 88, 90, 96, 94],
    description: '贷款与授信相关利息支出，用于评估融资成本压力。',
    subMenus: ['利息趋势', '融资结构', '付息覆盖'],
  },
  {
    slug: 'depreciation-amortization',
    name: '折旧摊销',
    icon: Briefcase,
    category: 'cost',
    value: 188,
    unit: '万元',
    monthlyValues: [176, 180, 184, 186, 192, 188],
    description: '设备、装修及系统资产的折旧摊销费用。',
    subMenus: ['折旧趋势', '资产结构', '折旧效率'],
  },
  {
    slug: 'operating-profit',
    name: '营运利润',
    icon: LineChart,
    category: 'profit',
    value: 1228,
    unit: '万元',
    monthlyValues: [1062, 1098, 1126, 1136, 1128, 1228],
    description: '营业收入减直接经营成本后的经营利润。',
    subMenus: ['利润趋势', '城市利润贡献', '利润异常分析'],
  },
  {
    slug: 'management-cost',
    name: '管理费用',
    icon: Briefcase,
    category: 'cost',
    value: 360,
    unit: '万元',
    monthlyValues: [352, 354, 356, 359, 362, 360],
    description: '总部管理、人事行政、数字化系统与办公费用。',
    subMenus: ['管理费趋势', '费用科目结构', '预算执行率'],
  },
  {
    slug: 'net-profit',
    name: '净利润',
    icon: PiggyBank,
    category: 'profit',
    value: 868,
    unit: '万元',
    monthlyValues: [710, 744, 770, 777, 766, 868],
    description: '营运利润扣除管理费用等后的净利润表现。',
    subMenus: ['净利趋势', '净利率分析', '利润改善动作'],
  },
]

export const METRIC_MAP = Object.fromEntries(
  FINANCIAL_METRICS.map((metric) => [metric.slug, metric])
) as Record<MetricSlug, FinancialMetric>

const ALL_SLUGS = FINANCIAL_METRICS.map((metric) => metric.slug)

export const METRIC_SLUGS = ALL_SLUGS as MetricSlug[]

const buildCityRows = (total: number): CityMetricRow[] => {
  let assigned = 0

  return cityWeights.map((city, index) => {
    const value =
      index === cityWeights.length - 1 ? total - assigned : Math.round(total * city.weight)
    assigned += value

    return {
      city: city.city,
      projects: city.projects,
      stores: city.stores,
      value,
      weight: city.weight,
    }
  })
}

const metricCityMap = FINANCIAL_METRICS.reduce(
  (acc, metric) => {
    acc[metric.slug] = buildCityRows(metric.value).sort((a, b) => b.value - a.value)
    return acc
  },
  {} as Record<MetricSlug, CityMetricRow[]>
)

export const getMetricCityRows = (slug: MetricSlug) => metricCityMap[slug] || []

export const getMoMRate = (metric: FinancialMetric) => {
  const current = metric.monthlyValues[metric.monthlyValues.length - 1] || 0
  const previous = metric.monthlyValues[metric.monthlyValues.length - 2] || 0
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export const getTrendTone = (metric: FinancialMetric): 'positive' | 'negative' => {
  const rate = getMoMRate(metric)

  if (metric.category === 'cost') {
    return rate <= 0 ? 'positive' : 'negative'
  }

  return rate >= 0 ? 'positive' : 'negative'
}

export const formatAmount = (value: number, unit = '万元') =>
  `${value.toLocaleString('zh-CN')} ${unit}`

export const formatRate = (rate: number) => `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`

export const getMetricBySlug = (slug: string) => METRIC_MAP[slug as MetricSlug]

export const getRelatedMetrics = (slug: MetricSlug, count = 4) =>
  FINANCIAL_METRICS.filter((metric) => metric.slug !== slug).slice(0, count)

export const TOTAL_PROJECT_COUNT = CITY_PROJECTS.reduce((sum, city) => sum + city.projects, 0)
export const TOTAL_STORE_COUNT = CITY_PROJECTS.reduce((sum, city) => sum + city.stores, 0)

export type ExecutiveDomain =
  | 'cfo'
  | 'cmo'
  | 'chro'
  | 'cgo'
  | 'cto'
  | 'cio'
  | 'supply_president'

export type ExecutivePriority = 'P0' | 'P1' | 'P2'
export type ExecutiveKpiFormat = 'amount' | 'percent' | 'score' | 'days' | 'multiple' | 'count' | 'productivity'
export type ExecutiveTrendMode = 'percent' | 'point' | 'absolute'

export interface ExecutiveKpiDefinition {
  key: string
  label: string
  domain: ExecutiveDomain
  priority: ExecutivePriority
  format: ExecutiveKpiFormat
  unit: string
  trendMode: ExecutiveTrendMode
  level1Menu: string
  level2Menu: string
  level3Menu: string
  level4Menu: string
  benchmarkReference: string
  linkedMetricSlug?: MetricSlug
}

export interface ScopeExecutiveKpi extends ExecutiveKpiDefinition {
  value: number
  trend: number
}

export interface ExecutiveDomainGroup {
  domain: ExecutiveDomain
  label: string
  mission: string
  kpis: ScopeExecutiveKpi[]
}

export interface ExecutiveMenuLevel3Group {
  name: string
  items: ScopeExecutiveKpi[]
}

export interface ExecutiveMenuLevel2Group {
  name: string
  children: ExecutiveMenuLevel3Group[]
}

export interface ExecutiveMenuLevel1Group {
  name: string
  domains: ExecutiveDomain[]
  children: ExecutiveMenuLevel2Group[]
}

export interface ListedCateringBenchmarkBand {
  key: string
  label: string
  domain: ExecutiveDomain
  low: number
  median: number
  high: number
  unit: string
  fiscalYear: string
  samplePeers: string[]
  note: string
}

export const EXECUTIVE_DOMAIN_ORDER: ExecutiveDomain[] = [
  'cfo',
  'cmo',
  'chro',
  'cgo',
  'cto',
  'cio',
  'supply_president',
]

export const EXECUTIVE_DOMAIN_META: Record<ExecutiveDomain, { label: string; mission: string }> = {
  cfo: {
    label: 'CFO',
    mission: '利润、现金流与成本质量',
  },
  cmo: {
    label: 'CMO',
    mission: '用户增长、品牌与活动回报',
  },
  chro: {
    label: 'CHRO',
    mission: '组织效能、人才稳定与训练达成',
  },
  cgo: {
    label: 'CGO',
    mission: '开店增长、招商转化与合同赢率',
  },
  cto: {
    label: 'CAIO',
    mission: 'AI治理、技术平台稳定与智能化效率',
  },
  cio: {
    label: 'CIO',
    mission: '数据时效、治理与信息安全',
  },
  supply_president: {
    label: '供应链总裁',
    mission: 'OTIF、损耗、采购节省与冷链合规',
  },
}

export const EXECUTIVE_KPI_LIBRARY: ExecutiveKpiDefinition[] = [
  {
    key: 'revenue',
    label: '营业收入',
    domain: 'cfo',
    priority: 'P0',
    format: 'amount',
    unit: '万元',
    trendMode: 'percent',
    level1Menu: '财务与利润',
    level2Menu: '收入质量',
    level3Menu: '规模增长',
    level4Menu: '营业收入',
    benchmarkReference: '上市连锁餐饮常用口径：规模增长需联动同店增长。',
    linkedMetricSlug: 'revenue',
  },
  {
    key: 'food_cost_rate',
    label: '食材成本率',
    domain: 'cfo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '财务与利润',
    level2Menu: '成本质量',
    level3Menu: '可控成本',
    level4Menu: '食材成本率',
    benchmarkReference: '上市餐饮企业常监控 28%-36% 区间，按业态有差异。',
    linkedMetricSlug: 'food-cost',
  },
  {
    key: 'labor_cost_rate',
    label: '人工成本率',
    domain: 'cfo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '财务与利润',
    level2Menu: '成本质量',
    level3Menu: '可控成本',
    level4Menu: '人工成本率',
    benchmarkReference: '上市连锁餐饮常监控 22%-34% 区间，需结合时段排班。',
    linkedMetricSlug: 'labor-cost',
  },
  {
    key: 'operating_margin',
    label: '营运利润率',
    domain: 'cfo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '财务与利润',
    level2Menu: '利润池',
    level3Menu: '经营盈利能力',
    level4Menu: '营运利润率',
    benchmarkReference: '上市餐饮企业关注经营利润率与费用率的联动改善。',
    linkedMetricSlug: 'operating-profit',
  },
  {
    key: 'net_margin',
    label: '净利率',
    domain: 'cfo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '财务与利润',
    level2Menu: '利润池',
    level3Menu: '最终盈利能力',
    level4Menu: '净利率',
    benchmarkReference: '上市餐饮企业常以净利率评估扩张质量。',
    linkedMetricSlug: 'net-profit',
  },
  {
    key: 'cash_conversion_days',
    label: '现金周转天数',
    domain: 'cfo',
    priority: 'P1',
    format: 'days',
    unit: '天',
    trendMode: 'absolute',
    level1Menu: '财务与利润',
    level2Menu: '现金与营运资本',
    level3Menu: '周转效率',
    level4Menu: '现金周转天数',
    benchmarkReference: '上市公司常将现金周转天数纳入董事会经营看板。',
  },
  {
    key: 'inventory_turnover_days',
    label: '库存周转天数',
    domain: 'cfo',
    priority: 'P1',
    format: 'days',
    unit: '天',
    trendMode: 'absolute',
    level1Menu: '财务与利润',
    level2Menu: '现金与营运资本',
    level3Menu: '周转效率',
    level4Menu: '库存周转天数',
    benchmarkReference: '连锁团餐企业普遍用库存周转天数衡量资金效率。',
  },
  {
    key: 'same_store_growth',
    label: '同店增长',
    domain: 'cmo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'percent',
    level1Menu: '增长与客户',
    level2Menu: '增长质量',
    level3Menu: '门店增长',
    level4Menu: '同店增长',
    benchmarkReference: '上市餐饮企业季度沟通常披露同店增长（SSG）。',
  },
  {
    key: 'member_growth',
    label: '会员增长率',
    domain: 'cmo',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'percent',
    level1Menu: '增长与客户',
    level2Menu: '用户资产',
    level3Menu: '增长规模',
    level4Menu: '会员增长率',
    benchmarkReference: '上市餐饮企业通常将会员增长与复购联动披露。',
  },
  {
    key: 'campaign_roi',
    label: '营销 ROI',
    domain: 'cmo',
    priority: 'P1',
    format: 'multiple',
    unit: 'x',
    trendMode: 'absolute',
    level1Menu: '增长与客户',
    level2Menu: '营销效率',
    level3Menu: '投放效率',
    level4Menu: '营销 ROI',
    benchmarkReference: '上市企业普遍从“费用率”转向“ROI + 复购率”并行。',
    linkedMetricSlug: 'marketing-cost',
  },
  {
    key: 'nps',
    label: '客户 NPS',
    domain: 'cmo',
    priority: 'P1',
    format: 'score',
    unit: '分',
    trendMode: 'absolute',
    level1Menu: '增长与客户',
    level2Menu: '用户体验',
    level3Menu: '满意度治理',
    level4Menu: '客户 NPS',
    benchmarkReference: '头部上市餐饮品牌常将 NPS 与门店绩效打通。',
  },
  {
    key: 'staffing_fill_rate',
    label: '编制达成率',
    domain: 'chro',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '组织与人效',
    level2Menu: '组织稳定',
    level3Menu: '岗位健康度',
    level4Menu: '编制达成率',
    benchmarkReference: '上市餐饮企业常用关键岗位到岗率判断执行稳定性。',
  },
  {
    key: 'turnover_rate',
    label: '员工流失率',
    domain: 'chro',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '组织与人效',
    level2Menu: '组织稳定',
    level3Menu: '人员稳定性',
    level4Menu: '员工流失率',
    benchmarkReference: '上市餐饮企业强调一线人员流失率与服务质量的关系。',
  },
  {
    key: 'training_completion',
    label: '培训达成率',
    domain: 'chro',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '组织与人效',
    level2Menu: '人才发展',
    level3Menu: '能力建设',
    level4Menu: '培训达成率',
    benchmarkReference: '上市连锁企业常将培训达成率纳入门店绩效联考。',
  },
  {
    key: 'productivity_per_labor_hour',
    label: '人效产出',
    domain: 'chro',
    priority: 'P1',
    format: 'productivity',
    unit: '元/工时',
    trendMode: 'absolute',
    level1Menu: '组织与人效',
    level2Menu: '效率治理',
    level3Menu: '班次效能',
    level4Menu: '人效产出',
    benchmarkReference: '上市餐饮企业通常按岗位+时段跟踪人效改善。',
  },
  {
    key: 'pipeline_stores',
    label: '新增门店储备',
    domain: 'cgo',
    priority: 'P1',
    format: 'count',
    unit: '家',
    trendMode: 'absolute',
    level1Menu: '增长与客户',
    level2Menu: '扩张引擎',
    level3Menu: '招商漏斗',
    level4Menu: '新增门店储备',
    benchmarkReference: '上市扩张型餐饮企业常披露储备门店与签约转化率。',
  },
  {
    key: 'lead_conversion',
    label: '招商线索转化率',
    domain: 'cgo',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '增长与客户',
    level2Menu: '扩张引擎',
    level3Menu: '招商漏斗',
    level4Menu: '线索转化率',
    benchmarkReference: '上市企业扩张管理强调线索质量与签约效率并重。',
  },
  {
    key: 'contract_win_rate',
    label: '项目中标率',
    domain: 'cgo',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '增长与客户',
    level2Menu: '扩张引擎',
    level3Menu: '项目获取',
    level4Menu: '项目中标率',
    benchmarkReference: '团餐上市公司重点关注项目赢率与利润质量匹配。',
  },
  {
    key: 'ai_coverage',
    label: 'AI 流程覆盖率',
    domain: 'cto',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '数字化与 AI',
    level2Menu: '业务智能化',
    level3Menu: '流程自动化',
    level4Menu: 'AI 流程覆盖率',
    benchmarkReference: '上市企业数字化阶段常以流程覆盖率衡量 AI 落地。',
  },
  {
    key: 'uptime',
    label: '核心系统可用性',
    domain: 'cto',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '数字化与 AI',
    level2Menu: '平台稳定',
    level3Menu: '系统韧性',
    level4Menu: '核心系统可用性',
    benchmarkReference: '上市企业普遍要求核心系统高可用（99.9%+）。',
  },
  {
    key: 'data_freshness',
    label: '数据时效达成率',
    domain: 'cio',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '数字化与 AI',
    level2Menu: '数据治理',
    level3Menu: '实时决策',
    level4Menu: '数据时效达成率',
    benchmarkReference: '上市企业经营驾驶舱强调 T+0/T+1 数据可用。',
  },
  {
    key: 'security_events',
    label: '高风险安全事件',
    domain: 'cio',
    priority: 'P1',
    format: 'count',
    unit: '件',
    trendMode: 'absolute',
    level1Menu: '数字化与 AI',
    level2Menu: '数据治理',
    level3Menu: '风险防控',
    level4Menu: '高风险安全事件',
    benchmarkReference: '上市公司信息披露要求重大信息安全事件可追溯。',
  },
  {
    key: 'otif',
    label: 'OTIF 准时足量率',
    domain: 'supply_president',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '供应链与履约',
    level2Menu: '履约质量',
    level3Menu: '配送执行',
    level4Menu: 'OTIF 准时足量率',
    benchmarkReference: '头部连锁餐饮供应链常将 OTIF 作为核心履约 KPI。',
    linkedMetricSlug: 'maintenance-logistics-cost',
  },
  {
    key: 'waste_rate',
    label: '食材损耗率',
    domain: 'supply_president',
    priority: 'P0',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '供应链与履约',
    level2Menu: '成本协同',
    level3Menu: '损耗治理',
    level4Menu: '食材损耗率',
    benchmarkReference: '上市餐饮企业持续推动损耗率下降与毛利提升。',
    linkedMetricSlug: 'food-cost',
  },
  {
    key: 'procurement_saving_rate',
    label: '采购节省率',
    domain: 'supply_president',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '供应链与履约',
    level2Menu: '成本协同',
    level3Menu: '采购策略',
    level4Menu: '采购节省率',
    benchmarkReference: '上市企业常按品类波动跟踪采购节省率。',
    linkedMetricSlug: 'maintenance-logistics-cost',
  },
  {
    key: 'cold_chain_compliance',
    label: '冷链合规率',
    domain: 'supply_president',
    priority: 'P1',
    format: 'percent',
    unit: '%',
    trendMode: 'point',
    level1Menu: '供应链与履约',
    level2Menu: '履约质量',
    level3Menu: '品控与食安',
    level4Menu: '冷链合规率',
    benchmarkReference: '上市餐饮企业普遍将冷链合规纳入食安红线。',
  },
]

export const LISTED_CATERING_BENCHMARK_BANDS: ListedCateringBenchmarkBand[] = [
  {
    key: 'food_cost_rate',
    label: '食材成本率',
    domain: 'cfo',
    low: 28,
    median: 32,
    high: 36,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['百胜中国', '海底捞', '九毛九'],
    note: '公开年报口径汇总，按业态与供应链模式存在差异。',
  },
  {
    key: 'labor_cost_rate',
    label: '人工成本率',
    domain: 'cfo',
    low: 22,
    median: 28,
    high: 34,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['百胜中国', '海底捞', '呷哺集团'],
    note: '公开年报口径汇总，需结合门店类型和高峰排班结构。',
  },
  {
    key: 'operating_margin',
    label: '营运利润率',
    domain: 'cfo',
    low: 8,
    median: 12,
    high: 18,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['瑞幸', '海底捞', '百胜中国'],
    note: '公开年报口径汇总，用于评估经营盈利质量。',
  },
  {
    key: 'net_margin',
    label: '净利率',
    domain: 'cfo',
    low: 4,
    median: 8,
    high: 14,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['瑞幸', '海底捞', '百胜中国'],
    note: '公开年报口径汇总，受规模效应和一次性项目影响。',
  },
  {
    key: 'same_store_growth',
    label: '同店增长',
    domain: 'cmo',
    low: -2,
    median: 5,
    high: 12,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['海底捞', '九毛九', '呷哺集团'],
    note: '公开年报口径汇总，反映门店内生增长质量。',
  },
  {
    key: 'staffing_fill_rate',
    label: '编制达成率',
    domain: 'chro',
    low: 90,
    median: 95,
    high: 99,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['百胜中国', '海底捞', '九毛九'],
    note: '公开经营披露口径汇总，关键岗位到岗率为重点。',
  },
  {
    key: 'data_freshness',
    label: '数据时效达成率',
    domain: 'cio',
    low: 88,
    median: 94,
    high: 99,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['百胜中国', '瑞幸', '奈雪的茶'],
    note: '公开数字化实践口径汇总，目标是支持 T+0/T+1 决策。',
  },
  {
    key: 'otif',
    label: 'OTIF 准时足量率',
    domain: 'supply_president',
    low: 93,
    median: 96,
    high: 99,
    unit: '%',
    fiscalYear: 'FY2025',
    samplePeers: ['百胜中国', '海底捞', '瑞幸'],
    note: '公开供应链管理口径汇总，体现履约稳定性。',
  },
]

export type ScopeHierarchyLevel = 'global' | 'country' | 'region' | 'province' | 'city' | 'site'

interface ScopePerformanceProfile {
  efficiency: number
  growth: number
  people: number
  digital: number
  supply: number
  risk: number
}

interface ScopeHierarchySeed {
  slug: string
  name: string
  level: ScopeHierarchyLevel
  parentSlug?: string
  projects: number
  stores: number
  revenueShare: number
  owner?: string
  ownerTitle?: string
  focus: string[]
  profile: ScopePerformanceProfile
}

export interface ScopeHierarchyNode extends ScopeHierarchySeed {
  path: string[]
  depth: number
  children: string[]
}

export const DEFAULT_SCOPE_PATH = ['global']

const CITY_SCOPE_CONFIG: Record<
  string,
  {
    slug: string
    parentSlug: 'east-china' | 'jiangsu' | 'north-china'
    focus: string[]
    profile: ScopePerformanceProfile
  }
> = {
  上海: {
    slug: 'shanghai',
    parentSlug: 'east-china',
    focus: ['高客流项目效率', '会员增长与复购', 'AI 预测排班'],
    profile: { efficiency: 1.08, growth: 1.11, people: 1.05, digital: 1.15, supply: 1.07, risk: 0.94 },
  },
  苏州: {
    slug: 'suzhou',
    parentSlug: 'jiangsu',
    focus: ['产业园项目并行运营', '午高峰产能弹性', '损耗率持续下降'],
    profile: { efficiency: 1.12, growth: 1.15, people: 1.09, digital: 1.16, supply: 1.14, risk: 0.88 },
  },
  无锡: {
    slug: 'wuxi',
    parentSlug: 'jiangsu',
    focus: ['工业园区项目履约', '高峰档口效率', '区域排班平衡'],
    profile: { efficiency: 1.05, growth: 1.06, people: 1.04, digital: 1.06, supply: 1.08, risk: 0.95 },
  },
  太仓: {
    slug: 'taicang',
    parentSlug: 'jiangsu',
    focus: ['园区项目稳定履约', '采购周转效率', '食安抽检达标'],
    profile: { efficiency: 1.02, growth: 1.03, people: 1.01, digital: 1.03, supply: 1.04, risk: 0.98 },
  },
  北京: {
    slug: 'beijing',
    parentSlug: 'north-china',
    focus: ['商务园区项目履约', '重点客户续约', '利润与服务双优化'],
    profile: { efficiency: 1.04, growth: 1.06, people: 1.02, digital: 1.06, supply: 1.05, risk: 0.96 },
  },
  赤峰: {
    slug: 'chifeng',
    parentSlug: 'north-china',
    focus: ['中等体量项目效率', '关键岗位稳定', '成本精细治理'],
    profile: { efficiency: 0.98, growth: 1, people: 0.98, digital: 0.99, supply: 1, risk: 1.02 },
  },
  鄂尔多斯: {
    slug: 'ordos',
    parentSlug: 'north-china',
    focus: ['园区团餐稳定交付', '库存周转优化', '区域利润改善'],
    profile: { efficiency: 1, growth: 1.02, people: 0.99, digital: 1.01, supply: 1.01, risk: 1 },
  },
  十堰: {
    slug: 'shiyan',
    parentSlug: 'north-china',
    focus: ['工厂团餐履约稳定', '区域采购协同', '损耗率下降'],
    profile: { efficiency: 0.99, growth: 1.01, people: 0.99, digital: 1.01, supply: 1, risk: 1.01 },
  },
  大连: {
    slug: 'dalian',
    parentSlug: 'north-china',
    focus: ['机场项目履约稳定', '高峰供餐效率', '服务质量提升'],
    profile: { efficiency: 1.01, growth: 1.02, people: 1, digital: 1.04, supply: 1.03, risk: 0.99 },
  },
}

const cityProjectsMap = REAL_CATERING_PROJECTS.reduce<Record<string, number>>((acc, project) => {
  acc[project.city] = (acc[project.city] || 0) + 1
  return acc
}, {})

const getCityProjects = (city: string) => cityProjectsMap[city] || 0
const getCityStores = (city: string) => getCityProjects(city)

const eastChinaCitySet = new Set(['上海', '苏州', '无锡', '太仓'])
const jiangsuCitySet = new Set(['苏州', '无锡', '太仓'])

const eastChinaProjects = Object.keys(cityProjectsMap)
  .filter((city) => eastChinaCitySet.has(city))
  .reduce((sum, city) => sum + getCityProjects(city), 0)
const northChinaProjects = Object.keys(cityProjectsMap)
  .filter((city) => !eastChinaCitySet.has(city))
  .reduce((sum, city) => sum + getCityProjects(city), 0)
const jiangsuProjects = Object.keys(cityProjectsMap)
  .filter((city) => jiangsuCitySet.has(city))
  .reduce((sum, city) => sum + getCityProjects(city), 0)

const chinaProjects = eastChinaProjects + northChinaProjects
const globalProjects = chinaProjects

const eastChinaStores = eastChinaProjects
const northChinaStores = northChinaProjects
const jiangsuStores = jiangsuProjects
const chinaStores = eastChinaStores + northChinaStores
const globalStores = chinaStores

const getCityRevenueShare = (city: string) => {
  if (!revenueTotal) return 0
  return (cityRevenueMap[city] || 0) / revenueTotal
}

const cityNodesInOrder = [
  '上海',
  '北京',
  '十堰',
  '赤峰',
  '鄂尔多斯',
  '大连',
  '苏州',
  '无锡',
  '太仓',
]

const cityNodeSeeds: ScopeHierarchySeed[] = cityNodesInOrder
  .filter((city) => getCityProjects(city) > 0 && CITY_SCOPE_CONFIG[city])
  .map((city) => {
    const config = CITY_SCOPE_CONFIG[city]
    return {
      slug: config.slug,
      name: city,
      level: 'city' as const,
      parentSlug: config.parentSlug,
      projects: getCityProjects(city),
      stores: getCityStores(city),
      revenueShare: getCityRevenueShare(city),
      focus: config.focus,
      profile: config.profile,
    }
  })

const defaultSiteFocus = ['项目履约稳定', '成本与人效联动', '食安风险闭环']

const siteSeeds: ScopeHierarchySeed[] = REAL_CATERING_PROJECTS.map((project) => {
  const cityConfig = CITY_SCOPE_CONFIG[project.city]
  const cityProjectCount = Math.max(1, getCityProjects(project.city))
  const cityShare = getCityRevenueShare(project.city)
  const cityProfile = cityConfig?.profile || {
    efficiency: 1,
    growth: 1,
    people: 1,
    digital: 1,
    supply: 1,
    risk: 1,
  }

  return {
    slug: project.siteSlug,
    name: project.name,
    level: 'site',
    parentSlug: cityConfig?.slug || 'suzhou',
    projects: 1,
    stores: 1,
    revenueShare: cityShare / cityProjectCount,
    owner: project.owner,
    ownerTitle: project.ownerTitle,
    focus: [...defaultSiteFocus],
    profile: {
      efficiency: Number((cityProfile.efficiency + 0.03).toFixed(2)),
      growth: Number((cityProfile.growth + 0.02).toFixed(2)),
      people: Number((cityProfile.people + 0.02).toFixed(2)),
      digital: Number((cityProfile.digital + 0.03).toFixed(2)),
      supply: Number((cityProfile.supply + 0.02).toFixed(2)),
      risk: Number(Math.max(0.82, cityProfile.risk - 0.02).toFixed(2)),
    },
  }
})

const SCOPE_HIERARCHY_SEEDS: ScopeHierarchySeed[] = [
  {
    slug: 'global',
    name: '全球',
    level: 'global',
    projects: globalProjects,
    stores: globalStores,
    revenueShare: 1,
    focus: ['全球营收增长与利润质量', '跨区域运营标准化', '全球数据治理与安全合规'],
    profile: { efficiency: 1, growth: 1, people: 1, digital: 1, supply: 1, risk: 1 },
  },
  {
    slug: 'china',
    name: '中国',
    level: 'country',
    parentSlug: 'global',
    projects: chinaProjects,
    stores: chinaStores,
    revenueShare: 1,
    focus: ['全国区域协同', '重点城市盈利质量', '大客户项目稳定续约'],
    profile: { efficiency: 1.04, growth: 1.08, people: 1.03, digital: 1.08, supply: 1.06, risk: 0.95 },
  },
  {
    slug: 'east-china',
    name: '华东',
    level: 'region',
    parentSlug: 'china',
    projects: eastChinaProjects,
    stores: eastChinaStores,
    revenueShare: ['上海', '苏州', '无锡', '太仓'].reduce((sum, city) => sum + getCityRevenueShare(city), 0),
    focus: ['高密度项目协同排班', '供应链响应速度', '产业园团餐精细化运营'],
    profile: { efficiency: 1.07, growth: 1.12, people: 1.06, digital: 1.11, supply: 1.1, risk: 0.92 },
  },
  {
    slug: 'north-china',
    name: '华北',
    level: 'region',
    parentSlug: 'china',
    projects: northChinaProjects,
    stores: northChinaStores,
    revenueShare: ['北京', '十堰', '赤峰', '鄂尔多斯', '大连'].reduce((sum, city) => sum + getCityRevenueShare(city), 0),
    focus: ['重点项目保供', '食安巡检闭环', '重点城市成本管控'],
    profile: { efficiency: 1.01, growth: 1.03, people: 1, digital: 1.04, supply: 1.02, risk: 0.98 },
  },
  {
    slug: 'jiangsu',
    name: '江苏',
    level: 'province',
    parentSlug: 'east-china',
    projects: jiangsuProjects,
    stores: jiangsuStores,
    revenueShare: ['苏州', '无锡', '太仓'].reduce((sum, city) => sum + getCityRevenueShare(city), 0),
    focus: ['省内多城市履约协同', '企业园区项目并行', '成本与人效双优化'],
    profile: { efficiency: 1.09, growth: 1.13, people: 1.08, digital: 1.13, supply: 1.12, risk: 0.9 },
  },
  ...cityNodeSeeds,
  ...siteSeeds,
]

const scopeSeedMap = Object.fromEntries(
  SCOPE_HIERARCHY_SEEDS.map((seed) => [seed.slug, seed])
) as Record<string, ScopeHierarchySeed>

const scopeChildrenMap = SCOPE_HIERARCHY_SEEDS.reduce<Record<string, string[]>>((acc, seed) => {
  if (seed.parentSlug) {
    if (!acc[seed.parentSlug]) {
      acc[seed.parentSlug] = []
    }
    acc[seed.parentSlug].push(seed.slug)
  }
  return acc
}, {})

const resolveScopePath = (slug: string, visited: Set<string> = new Set()): string[] => {
  const seed = scopeSeedMap[slug]
  if (!seed) return []

  if (visited.has(slug)) return [slug]
  visited.add(slug)

  if (!seed.parentSlug) return [seed.slug]

  const parentPath = resolveScopePath(seed.parentSlug, new Set(visited))
  return [...parentPath, seed.slug]
}

export const SCOPE_HIERARCHY_NODES: ScopeHierarchyNode[] = SCOPE_HIERARCHY_SEEDS.map((seed) => {
  const path = resolveScopePath(seed.slug)
  return {
    ...seed,
    path,
    depth: path.length,
    children: scopeChildrenMap[seed.slug] || [],
  }
}).sort((a, b) => a.depth - b.depth)

const scopeHierarchyNodeMap = Object.fromEntries(
  SCOPE_HIERARCHY_NODES.map((node) => [node.slug, node])
) as Record<string, ScopeHierarchyNode>

export const SCOPE_HIERARCHY_STATIC_PATHS = SCOPE_HIERARCHY_NODES.map((node) => node.path)

export const getScopeHierarchyNodeBySlug = (slug: string) => scopeHierarchyNodeMap[slug]

export const getScopeHierarchyNodeByPath = (path: string[] = DEFAULT_SCOPE_PATH) => {
  const normalizedPath = path.filter(Boolean).map((segment) => segment.toLowerCase())
  if (!normalizedPath.length) return scopeHierarchyNodeMap.global

  const leaf = normalizedPath[normalizedPath.length - 1]
  const node = scopeHierarchyNodeMap[leaf]
  if (!node) return undefined

  if (node.path.length !== normalizedPath.length) return undefined
  for (let index = 0; index < normalizedPath.length; index += 1) {
    if (node.path[index] !== normalizedPath[index]) return undefined
  }

  return node
}

export const getScopeHierarchyBreadcrumb = (path: string[] = DEFAULT_SCOPE_PATH) => {
  const node = getScopeHierarchyNodeByPath(path)
  if (!node) return []
  return node.path
    .map((slug) => scopeHierarchyNodeMap[slug])
    .filter((item): item is ScopeHierarchyNode => Boolean(item))
}

export const getScopeHierarchyChildren = (path: string[] = DEFAULT_SCOPE_PATH) => {
  const node = getScopeHierarchyNodeByPath(path)
  if (!node) return []
  return node.children
    .map((slug) => scopeHierarchyNodeMap[slug])
    .filter((item): item is ScopeHierarchyNode => Boolean(item))
}

const EXECUTIVE_KPI_BASELINE: Record<string, number> = {
  revenue: 9860,
  food_cost_rate: 31.8,
  labor_cost_rate: 28.6,
  operating_margin: 12.4,
  net_margin: 8.9,
  cash_conversion_days: 41,
  inventory_turnover_days: 12.5,
  same_store_growth: 6.1,
  member_growth: 14.2,
  campaign_roi: 3.4,
  nps: 61,
  staffing_fill_rate: 95.4,
  turnover_rate: 12.6,
  training_completion: 88.3,
  productivity_per_labor_hour: 127,
  pipeline_stores: 68,
  lead_conversion: 17.8,
  contract_win_rate: 29.4,
  ai_coverage: 71.2,
  uptime: 99.91,
  data_freshness: 93.6,
  security_events: 5,
  otif: 96.2,
  waste_rate: 2.9,
  procurement_saving_rate: 4.6,
  cold_chain_compliance: 98.1,
}

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundValue = (value: number, precision = 1) => Number(value.toFixed(precision))

const getPriorityRank = (priority: ExecutivePriority) => {
  if (priority === 'P0') return 0
  if (priority === 'P1') return 1
  return 2
}

type ScopeKpiProfile = ScopeHierarchyNode['profile']

const scopeKpiDerivers: Record<
  string,
  (base: number, share: number, profile: ScopeKpiProfile) => number
> = {
  revenue: (base, share) => Math.max(1, Math.round(base * share)),
  food_cost_rate: (base, _share, p) => clampValue(base - (p.efficiency - 1) * 2.5 - (p.supply - 1) * 1.5 + (p.risk - 1) * 1.2, 24, 44),
  labor_cost_rate: (base, _share, p) => clampValue(base - (p.people - 1) * 2.2 + (p.growth - 1) * 0.8 + (p.risk - 1) * 0.5, 20, 38),
  operating_margin: (base, _share, p) => clampValue(base + (p.efficiency - 1) * 2.2 + (p.supply - 1) * 0.8 - (p.risk - 1) * 1.2, 3, 22),
  net_margin: (base, _share, p) => clampValue(base + (p.efficiency - 1) * 1.8 + (p.growth - 1) * 0.7 - (p.risk - 1) * 1.3, 1.5, 16),
  cash_conversion_days: (base, _share, p) => clampValue(base - (p.supply - 1) * 6 + (p.risk - 1) * 5, 16, 65),
  inventory_turnover_days: (base, _share, p) => clampValue(base - (p.supply - 1) * 2.4 + (p.risk - 1) * 1.8, 5, 22),
  same_store_growth: (base, _share, p) => clampValue(base + (p.growth - 1) * 4 - (p.risk - 1) * 2, -8, 22),
  member_growth: (base, _share, p) => clampValue(base + (p.growth - 1) * 6 + (p.digital - 1) * 3, -5, 35),
  campaign_roi: (base, _share, p) => clampValue(base + (p.growth - 1) * 0.9 + (p.digital - 1) * 0.5, 1.2, 6.8),
  nps: (base, _share, p) => clampValue(base + (p.people - 1) * 8 + (p.digital - 1) * 4 - (p.risk - 1) * 6, 20, 85),
  staffing_fill_rate: (base, _share, p) => clampValue(base + (p.people - 1) * 6 - (p.risk - 1) * 2, 80, 100),
  turnover_rate: (base, _share, p) => clampValue(base - (p.people - 1) * 4 + (p.risk - 1) * 3, 5, 36),
  training_completion: (base, _share, p) => clampValue(base + (p.people - 1) * 7 + (p.digital - 1) * 2, 60, 100),
  productivity_per_labor_hour: (base, _share, p) => clampValue(base + (p.people - 1) * 20 + (p.efficiency - 1) * 16, 80, 220),
  pipeline_stores: (base, share, p) => Math.max(1, Math.round(base * share * p.growth)),
  lead_conversion: (base, _share, p) => clampValue(base + (p.growth - 1) * 5 + (p.digital - 1) * 2, 5, 45),
  contract_win_rate: (base, _share, p) => clampValue(base + (p.growth - 1) * 4 + (p.risk < 1 ? 1.2 : 0), 8, 55),
  ai_coverage: (base, _share, p) => clampValue(base + (p.digital - 1) * 12, 20, 100),
  uptime: (base, _share, p) => clampValue(base + (p.digital - 1) * 0.08 - (p.risk - 1) * 0.15, 98.6, 99.99),
  data_freshness: (base, _share, p) => clampValue(base + (p.digital - 1) * 6 - (p.risk - 1) * 4, 70, 100),
  security_events: (base, share, p) => Math.max(0, Math.round(base * share * p.risk)),
  otif: (base, _share, p) => clampValue(base + (p.supply - 1) * 3 - (p.risk - 1) * 2, 86, 100),
  waste_rate: (base, _share, p) => clampValue(base - (p.supply - 1) * 1.1 + (p.risk - 1) * 0.8, 1.0, 8.5),
  procurement_saving_rate: (base, _share, p) => clampValue(base + (p.supply - 1) * 1.6 + (p.efficiency - 1) * 0.7, 1, 10),
  cold_chain_compliance: (base, _share, p) => clampValue(base + (p.supply - 1) * 1.2 - (p.risk - 1) * 0.9, 90, 100),
}

const deriveScopeKpiValue = (key: string, node: ScopeHierarchyNode) => {
  const base = EXECUTIVE_KPI_BASELINE[key] || 0
  const share = Math.max(0.005, node.revenueShare)
  const deriver = scopeKpiDerivers[key]
  if (!deriver) return base
  return deriver(base, share, node.profile)
}

const deriveScopeKpiTrend = (kpi: ExecutiveKpiDefinition, node: ScopeHierarchyNode) => {
  const signal = (
    `${node.slug}:${kpi.key}`
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    19
  ) - 9

  if (kpi.trendMode === 'percent') {
    return roundValue(signal * 0.22 + (node.profile.growth - 1) * 1.2, 1)
  }

  if (kpi.trendMode === 'point') {
    return roundValue(signal * 0.12 + (node.profile.efficiency - 1) * 0.8, 1)
  }

  if (kpi.format === 'days') {
    return roundValue(signal * 0.35 + (1 - node.profile.supply) * 1.4, 1)
  }

  if (kpi.format === 'count') {
    return Math.round(signal * 0.2 + (node.profile.risk - 1) * 2)
  }

  if (kpi.format === 'multiple') {
    return roundValue(signal * 0.03 + (node.profile.growth - 1) * 0.08, 2)
  }

  return roundValue(signal * 0.2, 1)
}

const normalizeScopeKpiValue = (kpi: ExecutiveKpiDefinition, value: number) => {
  if (kpi.format === 'amount' || kpi.format === 'count') return Math.round(value)
  if (kpi.format === 'multiple') return roundValue(value, 2)
  if (kpi.format === 'percent') return roundValue(value, 1)
  if (kpi.format === 'days') return roundValue(value, 1)
  if (kpi.format === 'score') return roundValue(value, 1)
  return Math.round(value)
}

export const getScopeExecutiveKpis = (path: string[] = DEFAULT_SCOPE_PATH): ScopeExecutiveKpi[] => {
  const node = getScopeHierarchyNodeByPath(path) || scopeHierarchyNodeMap.global

  return EXECUTIVE_KPI_LIBRARY.map((kpi) => {
    const value = normalizeScopeKpiValue(kpi, deriveScopeKpiValue(kpi.key, node))
    const trend = deriveScopeKpiTrend(kpi, node)
    return {
      ...kpi,
      value,
      trend,
    }
  }).sort((a, b) => {
    const byPriority = getPriorityRank(a.priority) - getPriorityRank(b.priority)
    if (byPriority !== 0) return byPriority
    return a.label.localeCompare(b.label, 'zh-CN')
  })
}

export const getScopeExecutiveKpiGroups = (path: string[] = DEFAULT_SCOPE_PATH): ExecutiveDomainGroup[] => {
  const kpis = getScopeExecutiveKpis(path)

  return EXECUTIVE_DOMAIN_ORDER.map((domain) => ({
    domain,
    label: EXECUTIVE_DOMAIN_META[domain].label,
    mission: EXECUTIVE_DOMAIN_META[domain].mission,
    kpis: kpis.filter((kpi) => kpi.domain === domain),
  })).filter((group) => group.kpis.length > 0)
}

export const getScopeExecutiveMenuTree = (path: string[] = DEFAULT_SCOPE_PATH): ExecutiveMenuLevel1Group[] => {
  const kpis = getScopeExecutiveKpis(path)
  const level1Map = new Map<
    string,
    {
      domains: Set<ExecutiveDomain>
      level2Map: Map<string, Map<string, ScopeExecutiveKpi[]>>
    }
  >()

  for (const kpi of kpis) {
    if (!level1Map.has(kpi.level1Menu)) {
      level1Map.set(kpi.level1Menu, {
        domains: new Set<ExecutiveDomain>(),
        level2Map: new Map<string, Map<string, ScopeExecutiveKpi[]>>(),
      })
    }
    const level1 = level1Map.get(kpi.level1Menu)!
    level1.domains.add(kpi.domain)

    if (!level1.level2Map.has(kpi.level2Menu)) {
      level1.level2Map.set(kpi.level2Menu, new Map<string, ScopeExecutiveKpi[]>())
    }
    const level2 = level1.level2Map.get(kpi.level2Menu)!

    if (!level2.has(kpi.level3Menu)) {
      level2.set(kpi.level3Menu, [])
    }
    level2.get(kpi.level3Menu)!.push(kpi)
  }

  return Array.from(level1Map.entries()).map(([name, level1]) => ({
    name,
    domains: Array.from(level1.domains),
    children: Array.from(level1.level2Map.entries()).map(([level2Name, level3Map]) => ({
      name: level2Name,
      children: Array.from(level3Map.entries()).map(([level3Name, items]) => ({
        name: level3Name,
        items: items.sort((a, b) => {
          const byPriority = getPriorityRank(a.priority) - getPriorityRank(b.priority)
          if (byPriority !== 0) return byPriority
          return a.level4Menu.localeCompare(b.level4Menu, 'zh-CN')
        }),
      })),
    })),
  }))
}

export const formatExecutiveKpiValue = (kpi: ScopeExecutiveKpi) => {
  if (kpi.format === 'amount') return `${Math.round(kpi.value).toLocaleString('zh-CN')} ${kpi.unit}`
  if (kpi.format === 'percent') return `${kpi.value.toFixed(1)}%`
  if (kpi.format === 'score') return `${kpi.value.toFixed(1)} 分`
  if (kpi.format === 'days') return `${kpi.value.toFixed(1)} 天`
  if (kpi.format === 'multiple') return `${kpi.value.toFixed(2)}x`
  if (kpi.format === 'count') return `${Math.round(kpi.value)} ${kpi.unit}`
  return `${Math.round(kpi.value).toLocaleString('zh-CN')} ${kpi.unit}`
}

export const formatExecutiveKpiTrend = (kpi: ScopeExecutiveKpi) => {
  const sign = kpi.trend >= 0 ? '+' : ''
  if (kpi.trendMode === 'percent') return `环比 ${sign}${kpi.trend.toFixed(1)}%`
  if (kpi.trendMode === 'point') return `较上期 ${sign}${kpi.trend.toFixed(1)}pt`
  if (kpi.format === 'days') return `较上期 ${sign}${kpi.trend.toFixed(1)} 天`
  if (kpi.format === 'count') return `较上期 ${sign}${Math.round(kpi.trend)} ${kpi.unit}`
  if (kpi.format === 'multiple') return `较上期 ${sign}${kpi.trend.toFixed(2)}x`
  return `较上期 ${sign}${kpi.trend.toFixed(1)}`
}

export interface ScopedFinancialMetric extends FinancialMetric {
  scopeName: string
  scopePath: string[]
}

export const getScopedFinancialMetric = (
  slug: MetricSlug,
  path: string[] = DEFAULT_SCOPE_PATH
): ScopedFinancialMetric | undefined => {
  const metric = getMetricBySlug(slug)
  if (!metric) return undefined

  const scopeNode = getScopeHierarchyNodeByPath(path)
  if (!scopeNode) {
    return {
      ...metric,
      scopeName: '默认口径',
      scopePath: DEFAULT_SCOPE_PATH,
    }
  }

  const scopedValue = Math.max(1, Math.round(metric.value * scopeNode.revenueShare))
  const scopedMonthlyValues = metric.monthlyValues.map((value) =>
    Math.max(1, Math.round(value * scopeNode.revenueShare))
  )

  return {
    ...metric,
    value: scopedValue,
    monthlyValues: scopedMonthlyValues,
    scopeName: scopeNode.name,
    scopePath: scopeNode.path,
  }
}
