import { DEFAULT_SCOPE_PATH } from '@/lib/business-metrics'

export interface CounterMetric {
  slug: string
  counter: string
  counterEn: string
  revenue: number
  grossMarginRate: number
  wasteRate: number
  monthlyValues: number[]
  budgetRevenue: number
  scopePath: string[]
}

interface CounterMetricTemplate {
  slug: string
  counter: string
  counterEn: string
  baseRevenue: number
  grossMarginRate: number
  wasteRate: number
  monthlyValues: number[]
  budgetMultiplier: number
}

const COUNTER_TEMPLATES: CounterMetricTemplate[] = [
  {
    slug: 'new-jiangnan-cuisine',
    counter: '时光新江南菜',
    counterEn: 'New Jiangnan Cuisine',
    baseRevenue: 1260,
    grossMarginRate: 28.4,
    wasteRate: 2.1,
    monthlyValues: [1180, 1215, 1242, 1228, 1255, 1260],
    budgetMultiplier: 0.984,
  },
  {
    slug: 'jincheng-lanzhou',
    counter: '金城兰舟西域美食',
    counterEn: 'Jincheng Lanzhou',
    baseRevenue: 980,
    grossMarginRate: 25.7,
    wasteRate: 2.9,
    monthlyValues: [1015, 997, 992, 986, 978, 980],
    budgetMultiplier: 1.021,
  },
  {
    slug: 'shining-gourmet',
    counter: 'Shining Gourmet',
    counterEn: 'Shining Gourmet',
    baseRevenue: 1420,
    grossMarginRate: 31.2,
    wasteRate: 1.7,
    monthlyValues: [1338, 1365, 1388, 1402, 1410, 1420],
    budgetMultiplier: 0.973,
  },
  {
    slug: 'global-cuisine',
    counter: '环球美食',
    counterEn: 'Global Cuisine',
    baseRevenue: 1175,
    grossMarginRate: 27.1,
    wasteRate: 2.4,
    monthlyValues: [1110, 1132, 1148, 1160, 1172, 1175],
    budgetMultiplier: 0.992,
  },
  {
    slug: 'spring-noodles',
    counter: '满面春风',
    counterEn: 'Spring Noodles',
    baseRevenue: 905,
    grossMarginRate: 24.6,
    wasteRate: 3.1,
    monthlyValues: [936, 924, 918, 910, 906, 905],
    budgetMultiplier: 1.015,
  },
  {
    slug: 'specialty-noodles',
    counter: '特色面食',
    counterEn: 'Specialty Noodles',
    baseRevenue: 860,
    grossMarginRate: 23.8,
    wasteRate: 3.4,
    monthlyValues: [902, 891, 882, 874, 866, 860],
    budgetMultiplier: 1.028,
  },
]

export const COUNTER_SLUGS = COUNTER_TEMPLATES.map((item) => item.slug)

const DEPTH_REVENUE_FACTORS: Record<number, number> = {
  1: 1,
  2: 0.62,
  3: 0.36,
  4: 0.22,
  5: 0.12,
  6: 0.06,
}

const AREA_REVENUE_FACTORS: Record<string, number> = {
  china: 1.02,
  'east-china': 1.08,
  jiangsu: 1.06,
  suzhou: 1.12,
  'a-sz011-bidi-2': 1.15,
  'bluefish-suzhou-xinghai': 1.13,
  'bluefish-shanghai-biyun': 1.12,
  'bluefish-shanghai-huazhu': 1.11,
  wuxi: 1.03,
  shanghai: 1.1,
}

const roundOne = (value: number) => Math.round(value * 10) / 10

const roundInt = (value: number) => Math.round(value)

const normalizeScopePath = (scopePath?: string[] | null) =>
  (scopePath || []).map((segment) => segment.trim().toLowerCase()).filter(Boolean)

const getScopeRevenueFactor = (scopePath: string[] = DEFAULT_SCOPE_PATH) => {
  const depth = scopePath.length
  const depthFactor = DEPTH_REVENUE_FACTORS[depth] || 0.05
  const areaFactor = scopePath.reduce((factor, segment) => {
    return factor * (AREA_REVENUE_FACTORS[segment] || 1)
  }, 1)
  return depthFactor * areaFactor
}

export const getCounterMetricsByScope = (scopePath: string[] = DEFAULT_SCOPE_PATH): CounterMetric[] => {
  const normalizedScopePath = normalizeScopePath(scopePath)
  const effectiveScopePath = normalizedScopePath.length > 0 ? normalizedScopePath : DEFAULT_SCOPE_PATH
  const revenueFactor = getScopeRevenueFactor(effectiveScopePath)

  return COUNTER_TEMPLATES.map((template) => {
    const revenue = roundInt(template.baseRevenue * revenueFactor)
    const monthlyValues = template.monthlyValues.map((value) => roundInt(value * revenueFactor))
    const budgetRevenue = roundInt(revenue * template.budgetMultiplier)

    return {
      slug: template.slug,
      counter: template.counter,
      counterEn: template.counterEn,
      revenue,
      grossMarginRate: roundOne(template.grossMarginRate),
      wasteRate: roundOne(template.wasteRate),
      monthlyValues,
      budgetRevenue,
      scopePath: effectiveScopePath,
    }
  })
}

export const getCounterMetricBySlug = (slug: string, scopePath: string[] = DEFAULT_SCOPE_PATH) =>
  getCounterMetricsByScope(scopePath).find((metric) => metric.slug === slug)
