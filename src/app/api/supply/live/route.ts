import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canManageLlmControlPlane, requireAuthenticated, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  buildSupplyOverview,
  patchSupplyLiveDataset,
  readSupplyLiveDataset,
  writeSupplyLiveDataset,
} from '@/lib/server/supply-live-store'

export const runtime = 'nodejs'

const supplyWriteSchema = z
  .object({
    mode: z.enum(['replace', 'patch']).optional().default('patch'),
    source: z.string().trim().max(120).optional().default('manual-ingest'),
    orders: z.array(z.unknown()).optional(),
    dispatchTasks: z.array(z.unknown()).optional(),
    inventoryAlerts: z.array(z.unknown()).optional(),
    foodSafetyTasks: z.array(z.unknown()).optional(),
    overviewMetrics: z
      .object({
        inventoryTurnoverDays: z.number().nullable().optional(),
        wasteRatePercent: z.number().nullable().optional(),
        coldChainComplianceRate: z.number().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const dataset = await readSupplyLiveDataset()
  return NextResponse.json({
    ...dataset,
    overview: buildSupplyOverview(dataset),
    totalRows:
      dataset.orders.length +
      dataset.dispatchTasks.length +
      dataset.inventoryAlerts.length +
      dataset.foodSafetyTasks.length,
  })
}

export async function POST(request: NextRequest) {
  if (!canManageLlmControlPlane(request)) {
    return NextResponse.json(
      {
        message: '需要管理权限后才能写入供应链实时数据。',
        code: 'SUPPLY_LIVE_WRITE_FORBIDDEN',
      },
      { status: 401 }
    )
  }

  const parsed = await parseJsonWithSchema(request, supplyWriteSchema, '供应链写入参数不合法。')
  if (!parsed.ok) return parsed.response
  const payload = parsed.data

  const dataset =
    payload.mode === 'replace'
      ? await writeSupplyLiveDataset(payload, payload.source)
      : await patchSupplyLiveDataset(payload, payload.source)

  return NextResponse.json({
    ok: true,
    actor: resolveAuditActor(request),
    mode: payload.mode,
    source: dataset.source,
    updatedAt: dataset.updatedAt,
    overview: buildSupplyOverview(dataset),
    totalRows:
      dataset.orders.length +
      dataset.dispatchTasks.length +
      dataset.inventoryAlerts.length +
      dataset.foodSafetyTasks.length,
  })
}
