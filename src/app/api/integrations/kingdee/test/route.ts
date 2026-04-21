import { NextRequest, NextResponse } from 'next/server'
import { canManageLlmControlPlane, requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { fetchKingdeeFinanceIngestPayload, getKingdeeConfigSummary } from '@/lib/server/finance-live/kingdee-k3cloud'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  if (!canManageLlmControlPlane(request)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'KINGDEE_MANAGER_REQUIRED',
        message: '需要管理权限后才能测试金蝶连接。',
      },
      { status: 401 }
    )
  }

  const config = getKingdeeConfigSummary()
  if (!config.configured) {
    const missingRequiredEnvKeys = config.missingRequiredEnvKeys || []
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        code: 'KINGDEE_NOT_CONFIGURED',
        message: config.message || '金蝶配置不完整。',
        missingRequiredEnvKeys,
        metricMappingConfigured: Boolean(config.metricMappingConfigured),
        config,
      },
      { status: 412 }
    )
  }

  try {
    const { probe } = await fetchKingdeeFinanceIngestPayload()
    return NextResponse.json({
      ok: true,
      actor: resolveAuditActor(request),
      message: `金蝶连接成功，拉取 ${probe.rowCount} 行，映射 ${probe.scopeCount} 个范围。`,
      probe,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        code: 'KINGDEE_TEST_FAILED',
        message: `金蝶连接或取数失败：${reason}`,
        config,
      },
      { status: 500 }
    )
  }
}
