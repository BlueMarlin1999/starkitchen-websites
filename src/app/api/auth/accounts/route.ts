import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canManageLlmControlPlane, requireAuthenticated } from '@/lib/server/llm-auth'
import { listAuthAccounts, upsertAuthAccount } from '@/lib/server/auth-accounts'
import { parseJsonWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const createAccountSchema = z.object({
  employeeId: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(40).default('manager'),
  scopePath: z.union([z.string().trim().min(1).max(240), z.array(z.string().trim().min(1).max(80)).max(8)]).optional(),
  mobile: z.string().trim().min(6).max(40),
  disabled: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  if (!canManageLlmControlPlane(request)) {
    return NextResponse.json({ message: '仅管理层可查看账号目录。' }, { status: 403 })
  }

  const items = await listAuthAccounts()
  return NextResponse.json({
    items,
    total: items.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  if (!canManageLlmControlPlane(request)) {
    return NextResponse.json({ message: '仅管理层可创建账号。' }, { status: 403 })
  }

  const parsed = await parseJsonWithSchema(request, createAccountSchema, '账号参数不合法。')
  if (!parsed.ok) return parsed.response

  try {
    const account = await upsertAuthAccount(parsed.data)
    return NextResponse.json({ ok: true, account }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '账号创建失败。'
    if (message === 'AUTH_ACCOUNT_INPUT_INVALID') {
      return NextResponse.json(
        {
          message: '手机号格式不合法或必填字段缺失，请使用真实手机号（如 13800138000）。',
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ message: '账号创建失败，请稍后重试。' }, { status: 500 })
  }
}
