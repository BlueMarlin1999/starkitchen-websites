import {
  RecipeCosting,
  RecipeIngredient,
  RecipeMenuCopy,
  RecipeMeta,
  RecipeProcessStep,
  RecipeSkillData,
  RecipeSop,
  RecipeValidationResult,
} from '@/lib/server/recipe-skill/types'

const requiredTopLevelKeys = [
  'recipe_meta',
  'menu_copy',
  'ingredients',
  'process_steps',
  'sop',
  'costing',
] as const

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const pickString = (
  source: Record<string, unknown>,
  keys: string[],
  fallback = ''
) => {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return fallback
}

const pickNumber = (
  source: Record<string, unknown>,
  keys: string[],
  fallback = 0
) => {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Number(value.toFixed(2))
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.trim())
      if (Number.isFinite(parsed)) {
        return Number(parsed.toFixed(2))
      }
    }
  }
  return fallback
}

const pickStringArray = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]
    if (!Array.isArray(value)) continue
    const list = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
    if (list.length) return list
  }
  return [] as string[]
}

const normalizeRecipeMeta = (source: Record<string, unknown>): RecipeMeta => ({
  recipe_name: pickString(source, ['recipe_name', 'name', 'dish_name'], '未命名菜品'),
  cuisine: pickString(source, ['cuisine', 'cuisine_style'], '未分类'),
  version: pickString(source, ['version'], 'v1.0'),
  servings: pickString(source, ['servings', 'yield'], '1份'),
  prep_time_minutes: pickNumber(source, ['prep_time_minutes', 'prep_minutes'], 15),
  cook_time_minutes: pickNumber(source, ['cook_time_minutes', 'cook_minutes'], 12),
  difficulty: pickString(source, ['difficulty'], '中级'),
  allergens: pickStringArray(source, ['allergens', 'allergy']),
})

const normalizeMenuCopy = (source: Record<string, unknown>): RecipeMenuCopy => {
  const sellingPoints = pickStringArray(source, ['selling_points', 'highlights'])
  return {
    description: pickString(source, ['description', 'menu_description'], '请补充菜品描述'),
    selling_points: sellingPoints.length
      ? sellingPoints
      : ['口味层次分明', '标准化易复制', '适配门店高峰出品'],
  }
}

const normalizeIngredient = (
  source: Record<string, unknown>,
  index: number
): RecipeIngredient => ({
  name: pickString(source, ['name', 'ingredient_name'], `原料${index + 1}`),
  category: pickString(source, ['category', 'type'], '辅料'),
  gross_weight: pickNumber(source, ['gross_weight', 'gross'], 100),
  net_weight: pickNumber(source, ['net_weight', 'net'], 90),
  loss_rate: pickNumber(source, ['loss_rate', 'loss'], 0.1),
  unit_price: pickNumber(source, ['unit_price', 'price'], 1),
  cost: pickNumber(source, ['cost', 'material_cost'], 1),
  spec: pickString(source, ['spec', 'specification'], '标准规格'),
})

const normalizeProcessStep = (
  source: Record<string, unknown>,
  index: number
): RecipeProcessStep => ({
  step_no: Math.max(1, Math.round(pickNumber(source, ['step_no', 'step'], index + 1))),
  action: pickString(source, ['action'], `步骤${index + 1}`),
  detail: pickString(source, ['detail', 'description'], '请补充操作说明'),
  temperature: pickString(source, ['temperature'], '常温'),
  duration: pickString(source, ['duration', 'time'], '2分钟'),
  equipment: pickString(source, ['equipment'], '标准灶台'),
  key_control_point: pickString(
    source,
    ['key_control_point', 'kcp'],
    '关注火候与卫生规范'
  ),
})

const normalizeSop = (source: Record<string, unknown>): RecipeSop => {
  const foodSafety = pickStringArray(source, ['food_safety', 'safety_points'])
  return {
    food_safety: foodSafety.length
      ? foodSafety
      : ['生熟分离操作', '中心温度达标后出品', '每批次留样并记录'],
    plating_standard: pickString(
      source,
      ['plating_standard', 'plating'],
      '统一餐具，主料居中，辅料环绕'
    ),
    shelf_life: pickString(source, ['shelf_life'], '建议2小时内食用'),
    storage: pickString(source, ['storage'], '0-4℃冷藏，密封保存'),
    execution_notes: pickString(
      source,
      ['execution_notes', 'notes'],
      '高峰时段优先保障核心步骤与复核'
    ),
  }
}

const normalizeCosting = (source: Record<string, unknown>): RecipeCosting => ({
  total_material_cost: pickNumber(source, ['total_material_cost', 'material_cost_total'], 0),
  packaging_cost: pickNumber(source, ['packaging_cost'], 0),
  labor_cost: pickNumber(source, ['labor_cost'], 0),
  other_cost: pickNumber(source, ['other_cost'], 0),
  total_cost: pickNumber(source, ['total_cost'], 0),
  suggested_price: pickNumber(source, ['suggested_price', 'price'], 0),
  cost_rate: pickNumber(source, ['cost_rate'], 0),
  gross_margin_rate: pickNumber(source, ['gross_margin_rate', 'margin_rate'], 0),
})

const ensureMinimumItems = <T>(items: T[], fallbackFactory: (index: number) => T) => {
  const output = [...items]
  while (output.length < 3) {
    output.push(fallbackFactory(output.length))
  }
  return output
}

const normalizeRecipeData = (rawInput: unknown): RecipeSkillData => {
  const root = asRecord(rawInput)

  const recipeMeta = normalizeRecipeMeta(asRecord(root.recipe_meta))
  const menuCopy = normalizeMenuCopy(asRecord(root.menu_copy))

  const ingredients = ensureMinimumItems(
    asArray(root.ingredients).map((item, index) => normalizeIngredient(asRecord(item), index)),
    (index) => normalizeIngredient({}, index)
  )

  const processSteps = ensureMinimumItems(
    asArray(root.process_steps).map((item, index) => normalizeProcessStep(asRecord(item), index)),
    (index) => normalizeProcessStep({}, index)
  )

  const sop = normalizeSop(asRecord(root.sop))
  const costing = normalizeCosting(asRecord(root.costing))

  const materialCostSum = Number(
    ingredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2)
  )
  const totalCost = Number(
    (materialCostSum + costing.packaging_cost + costing.labor_cost + costing.other_cost).toFixed(2)
  )
  const suggestedPrice = costing.suggested_price > 0 ? costing.suggested_price : Number((totalCost * 2.2).toFixed(2))
  const costRate = suggestedPrice > 0 ? Number((totalCost / suggestedPrice).toFixed(4)) : 0
  const grossMarginRate = Number((1 - costRate).toFixed(4))

  return {
    recipe_meta: recipeMeta,
    menu_copy: menuCopy,
    ingredients,
    process_steps: processSteps
      .sort((left, right) => left.step_no - right.step_no)
      .map((item, index) => ({ ...item, step_no: index + 1 })),
    sop,
    costing: {
      total_material_cost: costing.total_material_cost || materialCostSum,
      packaging_cost: costing.packaging_cost,
      labor_cost: costing.labor_cost,
      other_cost: costing.other_cost,
      total_cost: costing.total_cost || totalCost,
      suggested_price: suggestedPrice,
      cost_rate: costing.cost_rate > 0 ? costing.cost_rate : costRate,
      gross_margin_rate:
        costing.gross_margin_rate > 0 ? costing.gross_margin_rate : grossMarginRate,
    },
  }
}

const validateNormalizedData = (
  data: RecipeSkillData,
  rawInput: unknown
): RecipeValidationResult => {
  const errors: string[] = []
  const root = asRecord(rawInput)

  const missingTopLevel = requiredTopLevelKeys.filter((key) => !(key in root))
  if (missingTopLevel.length) {
    errors.push(`缺少顶层字段: ${missingTopLevel.join(', ')}`)
  }
  if (data.ingredients.length < 3) {
    errors.push('ingredients 至少需要 3 项')
  }
  if (data.process_steps.length < 3) {
    errors.push('process_steps 至少需要 3 步')
  }

  const ingredientCostSum = Number(
    data.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0).toFixed(2)
  )
  const materialCost = Number(data.costing.total_material_cost.toFixed(2))
  const materialDiff = Math.abs(ingredientCostSum - materialCost)
  if (materialDiff > 1) {
    errors.push(
      `成本校验失败：ingredients.cost 合计(${ingredientCostSum}) 与 costing.total_material_cost(${materialCost}) 误差 ${materialDiff.toFixed(2)}`
    )
  }

  return {
    valid: errors.length === 0,
    message: errors.length ? errors.join('；') : '校验通过',
    errors,
  }
}

export const validateRecipeSkill = (rawInput: unknown) => {
  const data = normalizeRecipeData(rawInput)
  const validation = validateNormalizedData(data, rawInput)
  return { data, validation }
}

