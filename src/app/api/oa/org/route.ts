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
import { createOaOrgUnit, deleteOaOrgUnit, listOaOrgUnits } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const orgSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().trim().max(80).optional(),
  managerEmployeeId: z.string().trim().max(80).optional(),
})

const querySchema = z.object({
  source: z.enum(['stored', 'auto', 'seed', 'gaia-api']).optional().default('stored'),
  strictRemote: z.coerce.boolean().optional().default(false),
  onlyActive: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
})

const mapCreateError = (message: string) => {
  if (message === 'ORG_PARENT_NOT_FOUND') return { status: 400, message: '上级组织不存在。' }
  return { status: 500, message: '创建组织失败。' }
}

const mapDeleteError = (message: string) => {
  if (message === 'ORG_NOT_FOUND') return { status: 404, message: '组织单元不存在。' }
  if (message === 'ORG_HAS_CHILDREN') return { status: 409, message: '该组织仍有下级组织，无法删除。' }
  if (message === 'ORG_HAS_CONTACTS') return { status: 409, message: '该组织仍有联系人，无法删除。' }
  return { status: 500, message: '删除组织失败。' }
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canReadOaDirectory(role)) {
    await appendOaAuditByRequest(request, {
      action: 'org.read',
      success: false,
      entityId: actorId,
      message: `读取组织失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权查看组织结构。')
  }

  const parsedQuery = parseQueryWithSchema(request, querySchema, '组织查询参数不合法。')
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
        message: `组织读取触发盖雅同步(${syncResult.source})：导入 ${syncResult.imported}，新增组织 ${syncResult.orgCreated}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GAIA_SYNC_FAILED'
      await appendOaAuditByRequest(request, {
        action: 'contacts.sync',
        success: false,
        entityId: actorId,
        message: `组织读取触发盖雅同步失败：${message}`,
      })
      return NextResponse.json({ message: '盖雅同步失败，请稍后重试。' }, { status: 500 })
    }
  }

  const items = await listOaOrgUnits()
  await appendOaAuditByRequest(request, {
    action: 'org.read',
    success: true,
    message: `读取组织 ${items.length} 条`,
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
      action: 'org.create',
      success: false,
      entityId: actorId,
      message: `新增组织失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权新增组织。')
  }

  const parsedPayload = await parseJsonWithSchema(request, orgSchema, '组织参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  try {
    const orgUnit = await createOaOrgUnit(parsedPayload.data)
    await appendOaAuditByRequest(request, {
      action: 'org.create',
      success: true,
      entityId: orgUnit.id,
      message: `新增组织 ${orgUnit.name}`,
    })
    return NextResponse.json({ orgUnit }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CREATE_ORG_FAILED'
    const mapped = mapCreateError(message)
    await appendOaAuditByRequest(request, {
      action: 'org.create',
      success: false,
      message: `新增组织失败：${message}`,
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
      action: 'org.delete',
      success: false,
      entityId: actorId,
      message: `删除组织失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权删除组织。')
  }

  const orgUnitId = (request.nextUrl.searchParams.get('orgUnitId') || '').trim()
  if (!orgUnitId) {
    return NextResponse.json({ message: 'orgUnitId 不能为空。' }, { status: 400 })
  }

  try {
    const removedId = await deleteOaOrgUnit(orgUnitId)
    await appendOaAuditByRequest(request, {
      action: 'org.delete',
      success: true,
      entityId: removedId,
      message: `删除组织 ${removedId}`,
    })
    return NextResponse.json({ orgUnitId: removedId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DELETE_ORG_FAILED'
    const mapped = mapDeleteError(message)
    await appendOaAuditByRequest(request, {
      action: 'org.delete',
      success: false,
      message: `删除组织失败：${message}`,
    })
    return NextResponse.json({ message: mapped.message }, { status: mapped.status })
  }
}
