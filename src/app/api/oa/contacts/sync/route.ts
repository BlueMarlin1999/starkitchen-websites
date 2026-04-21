import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { syncOaDirectoryFromGaia } from '@/lib/server/oa/gaia-directory-sync'
import {
  buildPermissionDeniedResponse,
  canManageOaDirectory,
  resolveOaRequestRole,
} from '@/lib/server/oa/permissions'

export const runtime = 'nodejs'

const syncSchema = z.object({
  source: z.enum(['auto', 'seed', 'gaia-api']).optional().default('auto'),
  strictRemote: z.boolean().optional().default(false),
  onlyActive: z.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
})

interface SyncErrorResolution {
  status: number
  code: string
  userMessage: string
  auditMessage: string
}

const resolveSyncError = (error: unknown): SyncErrorResolution => {
  const rawMessage = error instanceof Error ? error.message : 'SYNC_CONTACTS_FAILED'
  if (rawMessage === 'STRICT_LIVE_MODE_SEED_DISABLED') {
    return {
      status: 400,
      code: 'STRICT_LIVE_MODE_SEED_DISABLED',
      userMessage: '当前为严格真实模式，已禁用 seed 同步源。请切换到盖雅 API。',
      auditMessage: '严格真实模式拒绝 seed 同步。',
    }
  }
  if (rawMessage.includes('GAIA_API_ROSTER_URL')) {
    return {
      status: 412,
      code: 'GAIA_CONFIG_MISSING',
      userMessage: '尚未配置盖雅花名册接口，请先在后端环境变量配置 GAIA_API_ROSTER_URL。',
      auditMessage: '盖雅同步失败：未配置 GAIA_API_ROSTER_URL。',
    }
  }
  if (rawMessage.startsWith('GAIA_REMOTE_HTTP_')) {
    return {
      status: 502,
      code: 'GAIA_REMOTE_HTTP_ERROR',
      userMessage: '盖雅接口当前不可用，请稍后重试并检查接口状态。',
      auditMessage: `盖雅同步失败：${rawMessage}`,
    }
  }
  if (rawMessage.toLowerCase().includes('abort')) {
    return {
      status: 504,
      code: 'GAIA_REMOTE_TIMEOUT',
      userMessage: '盖雅接口请求超时，请稍后重试。',
      auditMessage: `盖雅同步失败：${rawMessage}`,
    }
  }
  return {
    status: 500,
    code: 'SYNC_CONTACTS_FAILED',
    userMessage: '盖雅同步失败，请稍后重试。',
    auditMessage: `盖雅同步失败：${rawMessage}`,
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const role = resolveOaRequestRole(request)
  if (!canManageOaDirectory(role)) {
    await appendOaAuditByRequest(request, {
      action: 'contacts.sync',
      success: false,
      entityId: actorId,
      message: `盖雅同步失败：角色 ${role} 无权限`,
    })
    return buildPermissionDeniedResponse('当前账号无权执行盖雅花名册同步。')
  }

  const parsedPayload = await parseJsonWithSchema(request, syncSchema, '盖雅同步参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  if (isStrictLiveMode() && parsedPayload.data.source === 'seed') {
    return NextResponse.json(
      { message: '当前为严格真实模式，已禁用 seed 同步源。请配置并使用盖雅 API。' },
      { status: 400 }
    )
  }

  try {
    const strictRemote = isStrictLiveMode() ? true : parsedPayload.data.strictRemote
    const result = await syncOaDirectoryFromGaia({
      source: parsedPayload.data.source,
      strictRemote,
      onlyActive: parsedPayload.data.onlyActive,
      limit: parsedPayload.data.limit,
    })
    await appendOaAuditByRequest(request, {
      action: 'contacts.sync',
      success: true,
      entityId: actorId,
      message: `盖雅同步完成(${result.source})：导入 ${result.imported}，新增 ${result.created}，更新 ${result.updated}`,
    })
    return NextResponse.json(result)
  } catch (error) {
    const resolvedError = resolveSyncError(error)
    await appendOaAuditByRequest(request, {
      action: 'contacts.sync',
      success: false,
      entityId: actorId,
      message: resolvedError.auditMessage,
    })
    return NextResponse.json(
      { code: resolvedError.code, message: resolvedError.userMessage },
      { status: resolvedError.status }
    )
  }
}
