import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import {
  listRecipeRecords,
  parseRecipeListPagination,
} from '@/lib/server/recipe-skill/storage'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const { page, size } = parseRecipeListPagination(request.nextUrl.searchParams)
  const data = await listRecipeRecords(page, size)

  return NextResponse.json({
    total: data.total,
    page: data.page,
    size: data.size,
    recipes: data.recipes.map((item) => ({
      id: item.id,
      name: item.name,
      cuisine: item.cuisine,
      version: item.version,
      validation_status: item.validationStatus,
      prompt_type: item.promptType,
      tokens_used: item.tokensUsed,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })),
  })
}

