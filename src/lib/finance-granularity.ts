import { MetricSlug, getScopedFinancialMetric } from '@/lib/business-metrics'

export type OperatingSegmentKey =
  | 'breakfast'
  | 'lunch'
  | 'tea-break'
  | 'dinner'
  | 'night-snack'
  | 'banquet'

interface OperatingSegmentTemplate {
  key: OperatingSegmentKey
  label: string
  revenueShare: number
  foodRate: number
  laborRate: number
}

export interface OperatingSegmentRow {
  key: OperatingSegmentKey
  label: string
  revenue: number
  foodCost: number
  laborCost: number
  operatingProfit: number
  revenueShare: number
  foodCostRate: number
  laborCostRate: number
  operatingMargin: number
}

export interface SegmentComponentAmount {
  id: string
  label: string
  share: number
  amount: number
}

export interface OperatingSegmentDetail {
  segment: OperatingSegmentRow
  revenueComponents: SegmentComponentAmount[]
  foodCostComponents: SegmentComponentAmount[]
  laborCostComponents: SegmentComponentAmount[]
}

const SEGMENT_TEMPLATES: OperatingSegmentTemplate[] = [
  { key: 'breakfast', label: '早餐', revenueShare: 0.17, foodRate: 0.27, laborRate: 0.18 },
  { key: 'lunch', label: '午餐', revenueShare: 0.33, foodRate: 0.31, laborRate: 0.22 },
  { key: 'tea-break', label: '茶歇', revenueShare: 0.08, foodRate: 0.24, laborRate: 0.2 },
  { key: 'dinner', label: '晚餐', revenueShare: 0.24, foodRate: 0.34, laborRate: 0.24 },
  { key: 'night-snack', label: '夜宵', revenueShare: 0.06, foodRate: 0.29, laborRate: 0.21 },
  { key: 'banquet', label: '宴会', revenueShare: 0.12, foodRate: 0.37, laborRate: 0.26 },
]

const COMPONENT_LIBRARY: Record<
  OperatingSegmentKey,
  {
    revenue: Array<{ id: string; label: string; share: number }>
    food: Array<{ id: string; label: string; share: number }>
    labor: Array<{ id: string; label: string; share: number }>
  }
> = {
  breakfast: {
    revenue: [
      { id: 'contract-meal', label: '合同基础餐包', share: 0.56 },
      { id: 'self-service', label: '自选档口加购', share: 0.2 },
      { id: 'meeting-snack', label: '晨会茶点增购', share: 0.11 },
      { id: 'delivery', label: '外带配送', share: 0.09 },
      { id: 'other', label: '其他收入', share: 0.04 },
    ],
    food: [
      { id: 'protein', label: '蛋白食材', share: 0.31 },
      { id: 'grains', label: '主食谷物', share: 0.27 },
      { id: 'vegetable-fruit', label: '蔬果配料', share: 0.15 },
      { id: 'dairy-beverage', label: '乳品饮料', share: 0.18 },
      { id: 'packaging', label: '包装耗材', share: 0.09 },
    ],
    labor: [
      { id: 'kitchen', label: '后厨岗位', share: 0.39 },
      { id: 'service', label: '档口服务', share: 0.24 },
      { id: 'cleaning', label: '保洁后勤', share: 0.12 },
      { id: 'management', label: '班组管理', share: 0.17 },
      { id: 'temporary', label: '临时支援', share: 0.08 },
    ],
  },
  lunch: {
    revenue: [
      { id: 'contract-meal', label: '合同套餐', share: 0.52 },
      { id: 'premium-upgrade', label: '升级菜品加价', share: 0.16 },
      { id: 'meeting-catering', label: '会议团餐', share: 0.14 },
      { id: 'delivery', label: '外卖到楼', share: 0.12 },
      { id: 'other', label: '其他收入', share: 0.06 },
    ],
    food: [
      { id: 'protein', label: '肉禽水产', share: 0.42 },
      { id: 'vegetable-fruit', label: '蔬果豆制品', share: 0.2 },
      { id: 'grains', label: '主食谷物', share: 0.19 },
      { id: 'seasoning', label: '调料油品', share: 0.12 },
      { id: 'packaging', label: '包装耗材', share: 0.07 },
    ],
    labor: [
      { id: 'kitchen', label: '后厨岗位', share: 0.44 },
      { id: 'service', label: '服务出餐', share: 0.28 },
      { id: 'cleaning', label: '保洁后勤', share: 0.1 },
      { id: 'management', label: '排班管理', share: 0.12 },
      { id: 'temporary', label: '临时补岗', share: 0.06 },
    ],
  },
  'tea-break': {
    revenue: [
      { id: 'meeting-package', label: '会议茶歇包', share: 0.58 },
      { id: 'retail-snack', label: '零售糕点', share: 0.18 },
      { id: 'coffee-upgrade', label: '咖啡升级', share: 0.15 },
      { id: 'delivery', label: '送会服务', share: 0.06 },
      { id: 'other', label: '其他收入', share: 0.03 },
    ],
    food: [
      { id: 'bakery', label: '烘焙甜点', share: 0.38 },
      { id: 'beverage', label: '饮品原料', share: 0.27 },
      { id: 'fruit', label: '水果轻食', share: 0.19 },
      { id: 'seasoning', label: '调配辅料', share: 0.09 },
      { id: 'packaging', label: '包材耗材', share: 0.07 },
    ],
    labor: [
      { id: 'barista', label: '饮品岗位', share: 0.35 },
      { id: 'kitchen', label: '后厨配餐', share: 0.24 },
      { id: 'service', label: '会务服务', share: 0.22 },
      { id: 'management', label: '班组管理', share: 0.11 },
      { id: 'temporary', label: '临时支援', share: 0.08 },
    ],
  },
  dinner: {
    revenue: [
      { id: 'contract-meal', label: '合同晚餐', share: 0.49 },
      { id: 'premium-upgrade', label: '精品菜加购', share: 0.2 },
      { id: 'family-package', label: '家庭组合餐', share: 0.15 },
      { id: 'delivery', label: '外卖配送', share: 0.11 },
      { id: 'other', label: '其他收入', share: 0.05 },
    ],
    food: [
      { id: 'protein', label: '肉禽水产', share: 0.45 },
      { id: 'vegetable-fruit', label: '蔬果豆制品', share: 0.19 },
      { id: 'grains', label: '主食谷物', share: 0.15 },
      { id: 'seasoning', label: '调料油品', share: 0.13 },
      { id: 'packaging', label: '包材耗材', share: 0.08 },
    ],
    labor: [
      { id: 'kitchen', label: '后厨岗位', share: 0.41 },
      { id: 'service', label: '服务出餐', share: 0.29 },
      { id: 'cleaning', label: '收尾保洁', share: 0.11 },
      { id: 'management', label: '班组管理', share: 0.12 },
      { id: 'temporary', label: '临时加班', share: 0.07 },
    ],
  },
  'night-snack': {
    revenue: [
      { id: 'basic-package', label: '标准夜宵包', share: 0.57 },
      { id: 'extra-snack', label: '加餐增购', share: 0.17 },
      { id: 'night-meeting', label: '夜间会务', share: 0.11 },
      { id: 'delivery', label: '夜间配送', share: 0.1 },
      { id: 'other', label: '其他收入', share: 0.05 },
    ],
    food: [
      { id: 'protein', label: '肉禽蛋类', share: 0.37 },
      { id: 'grains', label: '主食谷物', share: 0.25 },
      { id: 'vegetable-fruit', label: '蔬果辅料', share: 0.14 },
      { id: 'beverage', label: '饮品原料', share: 0.14 },
      { id: 'packaging', label: '包材耗材', share: 0.1 },
    ],
    labor: [
      { id: 'kitchen', label: '后厨岗位', share: 0.36 },
      { id: 'service', label: '服务岗位', share: 0.24 },
      { id: 'night-shift', label: '夜班津贴', share: 0.2 },
      { id: 'management', label: '值班管理', share: 0.12 },
      { id: 'temporary', label: '临时支援', share: 0.08 },
    ],
  },
  banquet: {
    revenue: [
      { id: 'banquet-package', label: '宴会套餐', share: 0.62 },
      { id: 'custom-upgrade', label: '定制加价', share: 0.18 },
      { id: 'beverage-package', label: '酒水套餐', share: 0.12 },
      { id: 'service-fee', label: '会务服务费', share: 0.05 },
      { id: 'other', label: '其他收入', share: 0.03 },
    ],
    food: [
      { id: 'protein', label: '肉禽水产', share: 0.49 },
      { id: 'vegetable-fruit', label: '蔬果原料', share: 0.14 },
      { id: 'grains', label: '主食谷物', share: 0.1 },
      { id: 'beverage', label: '酒水饮品', share: 0.18 },
      { id: 'packaging', label: '摆台耗材', share: 0.09 },
    ],
    labor: [
      { id: 'kitchen', label: '宴会后厨', share: 0.38 },
      { id: 'service', label: '宴会服务', share: 0.33 },
      { id: 'cleaning', label: '场地恢复', share: 0.1 },
      { id: 'management', label: '宴会统筹', share: 0.12 },
      { id: 'temporary', label: '临时人员', share: 0.07 },
    ],
  },
}

const round2 = (value: number) => Number(value.toFixed(2))

const hashText = (value: string) =>
  value.split('').reduce((acc, char, index) => {
    const code = char.charCodeAt(0)
    return (acc * 31 + code + index * 17) % 1_000_003
  }, 7)

const ratioNoise = (seed: string, amplitude = 0.08) => {
  const hash = hashText(seed)
  const normalized = ((hash % 1000) / 1000) * 2 - 1
  return 1 + normalized * amplitude
}

const normalizeShares = (shares: number[]) => {
  const sum = shares.reduce((acc, value) => acc + value, 0)
  if (sum <= 0) return shares.map(() => 1 / shares.length)
  return shares.map((share) => share / sum)
}

const allocateByShares = (total: number, shares: number[]) => normalizeShares(shares).map((share) => total * share)

const deriveSegmentMetricValue = (segment: OperatingSegmentRow, metricSlug: MetricSlug, totalMetricValue: number) => {
  switch (metricSlug) {
    case 'revenue':
      return segment.revenue
    case 'food-cost':
      return segment.foodCost
    case 'labor-cost':
      return segment.laborCost
    case 'operating-profit':
      return segment.operatingProfit
    case 'net-profit':
      return segment.operatingProfit * 0.72
    case 'interest':
      return totalMetricValue * segment.revenueShare * 0.95
    case 'depreciation-amortization':
      return totalMetricValue * segment.revenueShare * 1.04
    default:
      return totalMetricValue * segment.revenueShare
  }
}

const buildComponentRows = (
  scopePath: string[],
  segmentKey: OperatingSegmentKey,
  bucket: 'revenue' | 'food' | 'labor',
  totalAmount: number
): SegmentComponentAmount[] => {
  const componentTemplates = COMPONENT_LIBRARY[segmentKey][bucket]
  const scopeSeed = scopePath.join('/')
  const noisyShares = componentTemplates.map((item) =>
    item.share * ratioNoise(`${scopeSeed}:${segmentKey}:${bucket}:${item.id}`, 0.12)
  )
  const normalizedShares = normalizeShares(noisyShares)
  const amounts = allocateByShares(totalAmount, normalizedShares)

  return componentTemplates.map((item, index) => ({
    id: item.id,
    label: item.label,
    share: round2(normalizedShares[index]),
    amount: round2(amounts[index]),
  }))
}

export const getScopeOperatingSegmentRows = (scopePath: string[]): OperatingSegmentRow[] => {
  const revenue = getScopedFinancialMetric('revenue', scopePath)?.value || 0
  const foodCost = getScopedFinancialMetric('food-cost', scopePath)?.value || 0
  const laborCost = getScopedFinancialMetric('labor-cost', scopePath)?.value || 0

  if (revenue <= 0) return []

  const scopeSeed = scopePath.join('/')
  const noisyRevenueShares = SEGMENT_TEMPLATES.map((template) =>
    template.revenueShare * ratioNoise(`${scopeSeed}:${template.key}:revenue-share`, 0.16)
  )
  const normalizedRevenueShares = normalizeShares(noisyRevenueShares)
  const revenueAllocations = allocateByShares(revenue, normalizedRevenueShares)

  const rawFood = SEGMENT_TEMPLATES.map((template, index) => {
    const noisyRate = template.foodRate * ratioNoise(`${scopeSeed}:${template.key}:food-rate`, 0.14)
    return revenueAllocations[index] * noisyRate
  })
  const rawLabor = SEGMENT_TEMPLATES.map((template, index) => {
    const noisyRate = template.laborRate * ratioNoise(`${scopeSeed}:${template.key}:labor-rate`, 0.12)
    return revenueAllocations[index] * noisyRate
  })

  const rawFoodTotal = rawFood.reduce((sum, value) => sum + value, 0)
  const rawLaborTotal = rawLabor.reduce((sum, value) => sum + value, 0)
  const foodScale = rawFoodTotal > 0 ? foodCost / rawFoodTotal : 0
  const laborScale = rawLaborTotal > 0 ? laborCost / rawLaborTotal : 0

  return SEGMENT_TEMPLATES.map((template, index) => {
    const segmentRevenue = round2(revenueAllocations[index])
    const segmentFood = round2(Math.max(0, rawFood[index] * foodScale))
    const segmentLabor = round2(Math.max(0, rawLabor[index] * laborScale))
    const segmentOperatingProfit = round2(segmentRevenue - segmentFood - segmentLabor)
    return {
      key: template.key,
      label: template.label,
      revenue: segmentRevenue,
      foodCost: segmentFood,
      laborCost: segmentLabor,
      operatingProfit: segmentOperatingProfit,
      revenueShare: round2(normalizedRevenueShares[index]),
      foodCostRate: segmentRevenue > 0 ? round2((segmentFood / segmentRevenue) * 100) : 0,
      laborCostRate: segmentRevenue > 0 ? round2((segmentLabor / segmentRevenue) * 100) : 0,
      operatingMargin: segmentRevenue > 0 ? round2((segmentOperatingProfit / segmentRevenue) * 100) : 0,
    }
  })
}

export const getScopeOperatingSegmentDetail = (
  scopePath: string[],
  segmentKey: OperatingSegmentKey
): OperatingSegmentDetail | undefined => {
  const segments = getScopeOperatingSegmentRows(scopePath)
  const segment = segments.find((item) => item.key === segmentKey)
  if (!segment) return undefined

  return {
    segment,
    revenueComponents: buildComponentRows(scopePath, segmentKey, 'revenue', segment.revenue),
    foodCostComponents: buildComponentRows(scopePath, segmentKey, 'food', segment.foodCost),
    laborCostComponents: buildComponentRows(scopePath, segmentKey, 'labor', segment.laborCost),
  }
}

export const getMetricAmountForSegment = (
  metricSlug: MetricSlug,
  scopePath: string[],
  segment: OperatingSegmentRow
) => {
  const totalMetricValue = getScopedFinancialMetric(metricSlug, scopePath)?.value || 0
  return round2(Math.max(0, deriveSegmentMetricValue(segment, metricSlug, totalMetricValue)))
}

export const getMetricComponentBreakdown = (
  metricSlug: MetricSlug,
  scopePath: string[],
  detail: OperatingSegmentDetail
) => {
  if (metricSlug === 'revenue') return detail.revenueComponents
  if (metricSlug === 'food-cost') return detail.foodCostComponents
  if (metricSlug === 'labor-cost') return detail.laborCostComponents

  const totalMetricValue = getMetricByMetricSlug(metricSlug, scopePath)
  const baseShares = detail.revenueComponents.map((item) => item.share)
  const labels = detail.revenueComponents.map((item) => ({
    id: item.id,
    label: item.label,
  }))
  const amounts = allocateByShares(totalMetricValue, baseShares)

  return labels.map((item, index) => ({
    id: item.id,
    label: item.label,
    share: round2(baseShares[index]),
    amount: round2(amounts[index]),
  }))
}

const getMetricByMetricSlug = (metricSlug: MetricSlug, scopePath: string[]) => {
  const metricValue = getScopedFinancialMetric(metricSlug, scopePath)?.value || 0
  return Math.max(0, metricValue)
}
