export type RecipePromptType = 'recipe' | 'menu_copy' | 'costing'

export interface RecipeMeta {
  recipe_name: string
  cuisine: string
  version: string
  servings: string
  prep_time_minutes: number
  cook_time_minutes: number
  difficulty: string
  allergens: string[]
}

export interface RecipeMenuCopy {
  description: string
  selling_points: string[]
}

export interface RecipeIngredient {
  name: string
  category: string
  gross_weight: number
  net_weight: number
  loss_rate: number
  unit_price: number
  cost: number
  spec: string
}

export interface RecipeProcessStep {
  step_no: number
  action: string
  detail: string
  temperature: string
  duration: string
  equipment: string
  key_control_point: string
}

export interface RecipeSop {
  food_safety: string[]
  plating_standard: string
  shelf_life: string
  storage: string
  execution_notes: string
}

export interface RecipeCosting {
  total_material_cost: number
  packaging_cost: number
  labor_cost: number
  other_cost: number
  total_cost: number
  suggested_price: number
  cost_rate: number
  gross_margin_rate: number
}

export interface RecipeSkillData {
  recipe_meta: RecipeMeta
  menu_copy: RecipeMenuCopy
  ingredients: RecipeIngredient[]
  process_steps: RecipeProcessStep[]
  sop: RecipeSop
  costing: RecipeCosting
}

export interface RecipeValidationResult {
  valid: boolean
  message: string
  errors: string[]
}

export interface RecipeSkillRecord {
  id: string
  name: string
  cuisine: string
  version: string
  promptType: RecipePromptType
  userInput: string
  validationStatus: '通过' | '草稿' | '失败'
  tokensUsed: number
  createdBy: string
  createdAt: string
  updatedAt: string
  recipeJson: RecipeSkillData
}

export interface RecipeGenerationResult {
  data: RecipeSkillData
  tokensUsed: number
  validation: RecipeValidationResult
  attempts: number
}
