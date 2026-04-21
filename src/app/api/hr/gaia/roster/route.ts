import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import { canManageLlmControlPlane, requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  importHrGaiaRosterCsv,
  listHrGaiaRoster,
  resetHrGaiaRosterToSeed,
  syncHrGaiaRoster,
} from '@/lib/server/hr-gaia-roster-store'

export const runtime = 'nodejs'

const querySchema = z.object({
  source: z.enum(['stored', 'auto', 'gaia-api', 'seed']).optional().default('stored'),
  strictRemote: z.coerce.boolean().optional().default(false),
})

const postSchema = z.object({
  action: z.enum(['sync', 'import_csv', 'reset_seed']).optional().default('sync'),
  source: z.enum(['auto', 'gaia-api', 'seed']).optional().default('auto'),
  strictRemote: z.boolean().optional().default(false),
  csvText: z.string().max(2_000_000).optional(),
})

const buildForbiddenResponse = () =>
  NextResponse.json(
    {
      message: '需要管理权限后才能写入盖雅花名册。',
      code: 'HR_GAIA_MANAGE_FORBIDDEN',
    },
    { status: 403 }
  )

const buildSeedDisabledResponse = () =>
  NextResponse.json(
    {
      message: '当前为严格真实模式，已禁用 seed 数据能力，请接入远程盖雅 API。',
      code: 'STRICT_LIVE_MODE_SEED_DISABLED',
    },
    { status: 400 }
  )

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, querySchema, '盖雅花名册查询参数不合法。')
  if (!parsedQuery.ok) return parsedQuery.response

  const strictLiveMode = isStrictLiveMode()
  const source = parsedQuery.data.source

  if (strictLiveMode && source === 'seed') {
    return buildSeedDisabledResponse()
  }

  if (source !== 'stored') {
    try {
      const synced = await syncHrGaiaRoster({
        source,
        strictRemote: strictLiveMode ? true : parsedQuery.data.strictRemote,
      })
      return NextResponse.json({
        ...synced,
        mode: 'synced',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SYNC_FAILED'
      return NextResponse.json({ message }, { status: 500 })
    }
  }

  const state = await listHrGaiaRoster()
  return NextResponse.json({
    ...state,
    mode: 'stored',
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied
  if (!canManageLlmControlPlane(request)) return buildForbiddenResponse()

  const parsed = await parseJsonWithSchema(request, postSchema, '盖雅花名册写入参数不合法。')
  if (!parsed.ok) return parsed.response

  const strictLiveMode = isStrictLiveMode()
  const payload = parsed.data

  if (strictLiveMode && (payload.action === 'reset_seed' || payload.source === 'seed')) {
    return buildSeedDisabledResponse()
  }

  try {
    if (payload.action === 'import_csv') {
      const csvText = payload.csvText?.trim() || ''
      if (!csvText) {
        return NextResponse.json({ message: 'csvText 不能为空。' }, { status: 400 })
      }
      const imported = await importHrGaiaRosterCsv(csvText)
      return NextResponse.json({
        ...imported,
        mode: 'csv-import',
      })
    }

    if (payload.action === 'reset_seed') {
      const reset = await resetHrGaiaRosterToSeed()
      return NextResponse.json({
        ...reset,
        mode: 'seed-reset',
      })
    }

    const synced = await syncHrGaiaRoster({
      source: payload.source,
      strictRemote: strictLiveMode ? true : payload.strictRemote,
    })
    return NextResponse.json({
      ...synced,
      mode: 'synced',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WRITE_FAILED'
    return NextResponse.json({ message }, { status: 500 })
  }
}
