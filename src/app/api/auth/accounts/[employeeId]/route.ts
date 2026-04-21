import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canManageLlmControlPlane, requireAuthenticated } from '@/lib/server/llm-auth'
import { deleteAuthAccount, updateAuthAccount } from '@/lib/server/auth-accounts'
import { parseJsonWithSchema } from '@/lib/server/input-validation'

export const runtime = 'nodejs'

const routeParamsSchema = z.object({
  employeeId: z.string().trim().min(2).max(80),
})

const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    password: z.string().min(8).max(200).optional(),
    role: z.string().trim().min(1).max(40).optional(),
    scopePath: z
      .union([z.string().trim().min(1).max(240), z.array(z.string().trim().min(1).max(80)).max(8)])
      .optional(),
    mobile: z.string().trim().min(6).max(40).optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.name !== undefined ||
      payload.password !== undefined ||
      payload.role !== undefined ||
      payload.scopePath !== undefined ||
      payload.mobile !== undefined ||
      payload.disabled !== undefined,
    {
      message: '至少提供一个可更新字段。',
      path: ['name'],
    }
  )

const parseParams = async (context: { params: Promise<{ employeeId: string }> }) => {
  const params = await context.params
  const parsed = routeParamsSchema.safeParse(params)
  if (!parsed.success) return null
  return parsed.data.employeeId
}

const ensureManagerPermission = (request: NextRequest) => {
  if (canManageLlmControlPlane(request)) return null
  return NextResponse.json({ message: '仅管理层可维护账号。' }, { status: 403 })
}

const mapAccountError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'AUTH_ACCOUNT_OPERATION_FAILED'
  if (message === 'AUTH_ACCOUNT_INPUT_INVALID') return { status: 400, message: '账号参数不合法。' }
  if (message === 'AUTH_ACCOUNT_NOT_FOUND') return { status: 404, message: '账号不存在。' }
  return { status: 500, message: '账号操作失败，请稍后重试。' }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const permissionDenied = ensureManagerPermission(request)
  if (permissionDenied) return permissionDenied

  const employeeId = await parseParams(context)
  if (!employeeId) {
    return NextResponse.json({ message: '员工工号参数不合法。' }, { status: 400 })
  }

  const parsed = await parseJsonWithSchema(request, updateAccountSchema, '账号更新参数不合法。')
  if (!parsed.ok) return parsed.response

  try {
    const account = await updateAuthAccount({
      employeeId,
      ...parsed.data,
    })
    return NextResponse.json({ ok: true, account })
  } catch (error) {
    const mapped = mapAccountError(error)
    return NextResponse.json({ message: mapped.message }, { status: mapped.status })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const permissionDenied = ensureManagerPermission(request)
  if (permissionDenied) return permissionDenied

  const employeeId = await parseParams(context)
  if (!employeeId) {
    return NextResponse.json({ message: '员工工号参数不合法。' }, { status: 400 })
  }

  try {
    const removedEmployeeId = await deleteAuthAccount(employeeId)
    return NextResponse.json({ ok: true, employeeId: removedEmployeeId })
  } catch (error) {
    const mapped = mapAccountError(error)
    return NextResponse.json({ message: mapped.message }, { status: mapped.status })
  }
}
