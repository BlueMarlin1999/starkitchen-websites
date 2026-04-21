import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { syncOaDirectoryFromGaia } from '@/lib/server/oa/gaia-directory-sync'
import {
  buildPermissionDeniedResponse,
  canManageOaDirectory,
  canReadOaDirectory,
  resolveOaRequestRole,
} from '@/lib/server/oa/permissions'
import { createOaContact, deleteOaContact, listOaContacts } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const contactSchema = z.object({
  employeeId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().max(120).optional(),
  orgUnitId: z.string().trim().max(80).optional(),
  mobile: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  wecomUserId: z.string().trim().max(120).optional(),
  feishuUserId: z.string().trim().max(120).optional(),
  feishuOpenId: z.string().trim().max(120).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  orgUnitId: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  source: z.enum(['stored', 'auto', 'seed', 'gaia-api']).optional().default('stored'),
  strictRemote: z.coerce.boolean().optional().default(false),
  onlyActive: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
})

const mapCreateError = (message: string) => {
  if (message === 'CONTACT_ALREADY_EXISTS') return { status: 409, message: '联系人已存在。' }
  if (message === 'ORG_NOT_FOUND') return { status: 400, message: '组织单元不存在。' }
  if (message === 'CONTACT_EMPLOYEE_ID_REQUIRED') return { status: 400, message: 'employeeId 不能为空。' }
  return { status: 500, message: '创建联系人失败。' }
}

const mapDeleteError = (message: string) => {
  if (message === 'CONTACT_NOT_FOUND') return { status: 404, message: '联系人不存在。' }
  return { status: 500, message: '删除联系人失败。' }
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canReadOaDirectory(role)) {
    await appendOaAuditByRequest(request, {
      action: 'contacts.read',
      success: false,
      entityId: actorId,
      message: `读取联系人失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权查看通讯录。')
  }

  const parsedQuery = parseQueryWithSchema(request, querySchema, '通讯录查询参数不合法。')
  if (!parsedQuery.ok) return parsedQuery.response

  const query = parsedQuery.data
  let syncResult: Awaited<ReturnType<typeof syncOaDirectoryFromGaia>> | null = null
  if (query.source !== 'stored') {
    if (isStrictLiveMode() && query.source === 'seed') {
      return NextResponse.json(
        { message: '当前为严格真实模式，已禁用 seed 同步源。请配置并使用盖雅 API。' },
        { status: 400 }
      )
    }
    try {
      const strictRemote = isStrictLiveMode() ? true : query.strictRemote
      syncResult = await syncOaDirectoryFromGaia({
        source: query.source,
        strictRemote,
        onlyActive: query.onlyActive,
        limit: query.limit,
      })
      await appendOaAuditByRequest(request, {
        action: 'contacts.sync',
        success: true,
        entityId: actorId,
        message: `通讯录读取触发盖雅同步(${syncResult.source})：导入 ${syncResult.imported}，新增 ${syncResult.created}，更新 ${syncResult.updated}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GAIA_SYNC_FAILED'
      await appendOaAuditByRequest(request, {
        action: 'contacts.sync',
        success: false,
        entityId: actorId,
        message: `通讯录读取触发盖雅同步失败：${message}`,
      })
      return NextResponse.json({ message: '盖雅同步失败，请稍后重试。' }, { status: 500 })
    }
  }

  const items = await listOaContacts({
    search: query.search,
    orgUnitId: query.orgUnitId,
    status: query.status,
  })
  await appendOaAuditByRequest(request, {
    action: 'contacts.read',
    success: true,
    message: `读取联系人 ${items.length} 条`,
  })

  return NextResponse.json({
    items,
    total: items.length,
    sync: syncResult,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canManageOaDirectory(role)) {
    await appendOaAuditByRequest(request, {
      action: 'contacts.create',
      success: false,
      entityId: actorId,
      message: `新增联系人失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权新增联系人。')
  }

  const parsedPayload = await parseJsonWithSchema(request, contactSchema, '联系人参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  try {
    const contact = await createOaContact(parsedPayload.data)
    await appendOaAuditByRequest(request, {
      action: 'contacts.create',
      success: true,
      entityId: contact.employeeId,
      message: `新增联系人 ${contact.name}(${contact.employeeId})`,
    })
    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CREATE_CONTACT_FAILED'
    const mapped = mapCreateError(message)
    await appendOaAuditByRequest(request, {
      action: 'contacts.create',
      success: false,
      message: `新增联系人失败：${message}`,
    })
    return NextResponse.json({ message: mapped.message }, { status: mapped.status })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canManageOaDirectory(role)) {
    await appendOaAuditByRequest(request, {
      action: 'contacts.delete',
      success: false,
      entityId: actorId,
      message: `删除联系人失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权删除联系人。')
  }

  const employeeId = (request.nextUrl.searchParams.get('employeeId') || '').trim()
  if (!employeeId) {
    return NextResponse.json({ message: 'employeeId 不能为空。' }, { status: 400 })
  }

  try {
    const removedEmployeeId = await deleteOaContact(employeeId)
    await appendOaAuditByRequest(request, {
      action: 'contacts.delete',
      success: true,
      entityId: removedEmployeeId,
      message: `删除联系人 ${removedEmployeeId}`,
    })
    return NextResponse.json({ employeeId: removedEmployeeId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DELETE_CONTACT_FAILED'
    const mapped = mapDeleteError(message)
    await appendOaAuditByRequest(request, {
      action: 'contacts.delete',
      success: false,
      message: `删除联系人失败：${message}`,
    })
    return NextResponse.json({ message: mapped.message }, { status: mapped.status })
  }
}
