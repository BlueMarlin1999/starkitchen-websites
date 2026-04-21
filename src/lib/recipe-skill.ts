import { buildApiUrl } from '@/lib/runtime-config'
import { LlmProviderId, LlmRouteProfileId } from '@/lib/llm-catalog'

export type RecipeSkillPromptType = 'recipe' | 'menu_copy' | 'costing'
export type RecipeSkillExportFormat = 'word' | 'excel' | 'pdf' | 'all'

export interface RecipeSkillGenerateRequest {
  input: string
  promptType: RecipeSkillPromptType
  routeProfileId: LlmRouteProfileId
  provider: LlmProviderId
  model: string
}

export interface RecipeSkillGenerateResponse {
  recipe_id: string
  recipe_name: string
  prompt_type: RecipeSkillPromptType
  provider_id: string
  model: string
  tokens_used: number
  validation: string
  attempts: number
  created_at: string
  data: {
    recipe_meta: {
      recipe_name: string
      cuisine: string
      version: string
      servings: string
      prep_time_minutes: number
      cook_time_minutes: number
      difficulty: string
      allergens: string[]
    }
    ingredients: Array<{ cost: number }>
    process_steps: Array<unknown>
    costing: {
      total_material_cost: number
      total_cost: number
      suggested_price: number
      gross_margin_rate: number
    }
  }
}

export interface RecipeSkillListItem {
  id: string
  name: string
  cuisine: string
  version: string
  validation_status: string
  prompt_type: RecipeSkillPromptType
  tokens_used: number
  created_at: string
  updated_at: string
}

export interface RecipeSkillListResponse {
  total: number
  page: number
  size: number
  recipes: RecipeSkillListItem[]
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json()
    if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim()
    if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim()
  } catch {
    return fallback
  }
  return fallback
}

export const generateRecipeSkill = async (
  payload: RecipeSkillGenerateRequest,
  token: string
) => {
  const response = await fetch(buildApiUrl('/recipe-skill/generate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      input: payload.input,
      prompt_type: payload.promptType,
      routeProfileId: payload.routeProfileId,
      provider: payload.provider,
      model: payload.model,
      maxRetries: 2,
      temperature: 0.3,
      maxTokens: 4096,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `菜谱生成失败 (${response.status})`))
  }
  return (await response.json()) as RecipeSkillGenerateResponse
}

export const fetchRecipeSkillRecipes = async (token: string, page = 1, size = 20) => {
  const response = await fetch(
    buildApiUrl(`/recipe-skill/recipes?page=${Math.max(1, page)}&size=${Math.max(1, size)}`),
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `菜谱列表读取失败 (${response.status})`))
  }
  return (await response.json()) as RecipeSkillListResponse
}

const resolveFileName = (contentDisposition: string, fallback: string) => {
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1])
  const simpleMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
  if (simpleMatch?.[1]) return simpleMatch[1]
  return fallback
}

export const downloadRecipeSkillExport = async (
  token: string,
  recipeId: string,
  format: RecipeSkillExportFormat
) => {
  const response = await fetch(buildApiUrl(`/recipe-skill/export/${format}/${recipeId}`), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `导出失败 (${response.status})`))
  }

  const contentDisposition = response.headers.get('content-disposition') || ''
  const fallbackName = `${recipeId}.${format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : format === 'all' ? 'zip' : 'html'}`
  const fileName = resolveFileName(contentDisposition, fallbackName)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

