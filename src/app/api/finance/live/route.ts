import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isStrictLiveMode } from '@/lib/live-mode'
import { canManageLlmControlPlane, resolveAuditActor } from '@/lib/server/llm-auth'
import { parseJsonWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  getFinanceLiveScopeSnapshot,
  importFinanceLivePayload,
  listFinanceLiveChildSnapshots,
  pullFinanceLiveFromRemote,
  readFinanceLiveState,
  seedFinanceLiveFromBaseline,
} from '@/lib/server/finance-live/storage'

export const runtime = 'nodejs'

const clip = (value: unknown, fallback = '', max = 240) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const parseBoolean = (value: string | null) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const parseIntegerInRange = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(clip(value, '', 16), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const isStateStale = (updatedAt: string, thresholdMinutes: number) => {
  const updatedAtMs = Date.parse(clip(updatedAt, '', 80))
  if (!Number.isFinite(updatedAtMs)) return true
  return Date.now() - updatedAtMs > thresholdMinutes * 60_000
}

const AUTO_SYNC_ON_READ_ENABLED = parseBooleanEnv(process.env.FINANCE_LIVE_AUTO_SYNC_ON_READ, true)
const AUTO_SYNC_THRESHOLD_MINUTES = parseIntegerInRange(
  process.env.FINANCE_LIVE_AUTO_SYNC_MINUTES,
  10,
  1,
  24 * 60
)
const AUTO_SYNC_MIN_GAP_MS = parseIntegerInRange(
  process.env.FINANCE_LIVE_AUTO_SYNC_MIN_GAP_MS,
  60_000,
  5_000,
  60 * 60 * 1_000
)

const readPullProvider = () =>
  clip(process.env.FINANCE_LIVE_PULL_PROVIDER, 'remote-url', 60).toLowerCase() || 'remote-url'

const hasRemotePullConfig = () => {
  if (readPullProvider() === 'kingdee-k3cloud') return true
  return Boolean(clip(process.env.FINANCE_LIVE_PULL_URL, '', 600))
}

const autoSyncState = {
  inFlight: null as Promise<string> | null,
  lastAttemptAt: 0,
}

const financeLiveQuerySchema = z.object({
  scope: z.string().trim().max(400).optional().default('global'),
  includeChildren: z.string().trim().max(10).optional(),
  sync: z.string().trim().max(10).optional(),
  autoseed: z.string().trim().max(10).optional(),
  autosync: z.string().trim().max(10).optional(),
})

const financeLiveWriteSchema = z
  .object({
    syncRemote: z.boolean().optional().default(false),
    seedAllScopes: z.boolean().optional().default(false),
    scopePaths: z.array(z.union([z.string(), z.array(z.string())])).optional(),
    source: z.string().trim().max(80).optional().default(''),
  })
  .passthrough()

const normalizeScopePath = (value: string) =>
  value
    .split(/[>\/,]+/)
    .map((segment) => clip(segment, '', 80).toLowerCase())
    .filter(Boolean)

const readBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const canManageFinanceLive = (request: NextRequest) => {
  if (canManageLlmControlPlane(request)) return true
  const requestToken =
    clip(request.headers.get('x-finance-ingest-token'), '', 400) || readBearerToken(request)
  if (!requestToken) return false

  const singleToken = clip(process.env.FINANCE_LIVE_INGEST_TOKEN, '', 400)
  if (singleToken && requestToken === singleToken) return true

  const tokenList = (process.env.FINANCE_LIVE_INGEST_TOKENS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return tokenList.includes(requestToken)
}

const toScopePath = (scope: string) => normalizeScopePath(clip(scope, 'global', 400))

const toResponseScopeKey = (scopePath: string[]) => scopePath.join('/')

const parseGetQuery = (request: NextRequest) =>
  parseQueryWithSchema(request, financeLiveQuerySchema, '财务查询参数不合法。')

const readGetFlags = (query: z.infer<typeof financeLiveQuerySchema>) => {
  const strictLiveMode = isStrictLiveMode()
  const includeChildren = parseBoolean(query.includeChildren || null)
  const syncRemote = parseBoolean(query.sync || null)
  const autoSeedParam = query.autoseed || null
  const autoSyncParam = query.autosync || null
  const autoSeed = autoSeedParam === null ? !strictLiveMode : parseBoolean(autoSeedParam)
  const autoSync = autoSyncParam === null ? true : parseBoolean(autoSyncParam)
  return { includeChildren, syncRemote, autoSeed: strictLiveMode ? false : autoSeed, autoSync }
}

const buildSyncForbiddenResponse = () =>
  NextResponse.json(
    {
      message: '需要管理权限后才能触发远程同步。',
      code: 'FINANCE_SYNC_FORBIDDEN',
    },
    { status: 401 }
  )

const runRemoteSyncIfRequested = async (request: NextRequest, enabled: boolean) => {
  if (!enabled) return { response: null, message: '' }
  if (!canManageFinanceLive(request)) {
    return { response: buildSyncForbiddenResponse(), message: '' }
  }
  try {
    const syncResult = await pullFinanceLiveFromRemote()
    return { response: null, message: `远程同步完成：${syncResult.upserted} 个范围更新。` }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    return { response: null, message: `远程同步失败：${reason}` }
  }
}

const shouldSkipAutoSync = (enabled: boolean) => {
  if (!enabled) return true
  if (!AUTO_SYNC_ON_READ_ENABLED) return true
  if (!hasRemotePullConfig()) return true
  return false
}

const shouldTriggerAutoSync = async () => {
  const state = await readFinanceLiveState()
  if (Object.keys(state.scopes).length === 0) return true
  return isStateStale(state.updatedAt, AUTO_SYNC_THRESHOLD_MINUTES)
}

const runAutoSyncAttempt = async () => {
  try {
    const syncResult = await pullFinanceLiveFromRemote()
    return `自动刷新完成：${syncResult.upserted} 个范围更新。`
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    return `自动刷新失败：${reason}`
  }
}

const runRemoteAutoSyncIfNeeded = async (enabled: boolean) => {
  if (shouldSkipAutoSync(enabled)) return ''
  if (!(await shouldTriggerAutoSync())) return ''

  const now = Date.now()
  if (now - autoSyncState.lastAttemptAt < AUTO_SYNC_MIN_GAP_MS) return ''

  autoSyncState.lastAttemptAt = now
  if (!autoSyncState.inFlight) {
    autoSyncState.inFlight = runAutoSyncAttempt().finally(() => {
      autoSyncState.inFlight = null
    })
  }
  return autoSyncState.inFlight
}

const loadFinanceSnapshotContext = async (
  scopePath: string[],
  includeChildren: boolean,
  autoSeed: boolean
) => {
  let seedMessage = ''
  let snapshot = await getFinanceLiveScopeSnapshot(scopePath)
  let children = includeChildren ? await listFinanceLiveChildSnapshots(scopePath) : []
  let state = await readFinanceLiveState()

  if (!snapshot && autoSeed && Object.keys(state.scopes).length === 0) {
    try {
      const seeded = await seedFinanceLiveFromBaseline({
        source: 'auto-baseline-seed',
      })
      state = await readFinanceLiveState()
      snapshot = await getFinanceLiveScopeSnapshot(scopePath)
      children = includeChildren ? await listFinanceLiveChildSnapshots(scopePath) : []
      if (seeded.upserted > 0) {
        seedMessage = `已自动初始化 ${seeded.upserted} 个范围基础明细。`
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'UNKNOWN'
      seedMessage = `自动初始化失败：${reason}`
    }
  }

  return { snapshot, children, state, seedMessage }
}

const buildGetSuccessMessage = (
  syncMessage: string,
  autoSyncMessage: string,
  seedMessage: string,
  hasSnapshot: boolean
) =>
  syncMessage ||
  autoSyncMessage ||
  seedMessage ||
  (hasSnapshot ? '已返回真实口径数据。' : '当前范围暂无真实口径数据，请先接入并同步实时数据源。')

export async function GET(request: NextRequest) {
  const parsedQuery = parseGetQuery(request)
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }
  const scopePath = toScopePath(parsedQuery.data.scope)
  if (scopePath.length === 0) {
    return NextResponse.json({ message: 'scope 参数无效' }, { status: 400 })
  }
  const { includeChildren, syncRemote, autoSeed, autoSync } = readGetFlags(parsedQuery.data)
  const syncResult = await runRemoteSyncIfRequested(request, syncRemote)
  if (syncResult.response) return syncResult.response
  const autoSyncMessage = syncRemote ? '' : await runRemoteAutoSyncIfNeeded(autoSync)
  const { snapshot, children, state, seedMessage } = await loadFinanceSnapshotContext(
    scopePath,
    includeChildren,
    autoSeed
  )

  return NextResponse.json({
    mode: snapshot ? 'live' : 'fallback',
    scopePath,
    scopeKey: toResponseScopeKey(scopePath),
    snapshot,
    children,
    updatedAt: snapshot?.updatedAt || state.updatedAt,
    source: snapshot?.source || state.source,
    totalScopes: Object.keys(state.scopes).length,
    message: buildGetSuccessMessage(
      syncResult.message,
      autoSyncMessage,
      seedMessage,
      Boolean(snapshot)
    ),
  })
}

const buildIngestForbiddenResponse = () =>
  NextResponse.json(
    {
      message: '需要管理权限后才能写入真实财务数据。',
      code: 'FINANCE_INGEST_FORBIDDEN',
    },
    { status: 401 }
  )

const runRemoteSyncWrite = async (request: NextRequest) => {
  try {
    const result = await pullFinanceLiveFromRemote()
    return NextResponse.json({
      ok: true,
      actor: resolveAuditActor(request),
      mode: 'remote-pull',
      ...result,
      message: `远程同步成功，更新 ${result.upserted} 个范围。`,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        mode: 'remote-pull',
        message: `远程同步失败：${reason}`,
      },
      { status: 500 }
    )
  }
}

const runBaselineSeedWrite = async (
  request: NextRequest,
  payload: z.infer<typeof financeLiveWriteSchema>
) => {
  if (isStrictLiveMode()) {
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        mode: 'baseline-seed',
        message: '严格真实模式下已禁用基线种子写入。请接入真实财务数据源后同步。',
      },
      { status: 400 }
    )
  }

  const scopePaths = Array.isArray(payload?.scopePaths) ? payload.scopePaths : undefined
  const source = clip(payload?.source, 'manual-baseline-seed', 80) || 'manual-baseline-seed'
  const seeded = await seedFinanceLiveFromBaseline({
    source,
    scopePaths,
  })
  return NextResponse.json({
    ok: true,
    actor: resolveAuditActor(request),
    mode: 'baseline-seed',
    ...seeded,
    message: `已初始化 ${seeded.upserted} 个范围（候选 ${seeded.seededScopes}）。`,
  })
}

const runManualIngestWrite = async (
  request: NextRequest,
  payload: z.infer<typeof financeLiveWriteSchema>
) => {
  const imported = await importFinanceLivePayload(payload, 'manual-ingest')
  if (imported.upserted <= 0) {
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        message: '未检测到可写入的范围数据。请提供 scope 或 scopes 数据。',
      },
      { status: 400 }
    )
  }
  return NextResponse.json({
    ok: true,
    actor: resolveAuditActor(request),
    mode: 'manual-ingest',
    ...imported,
    message: `写入成功：${imported.upserted} 个范围已更新。`,
  })
}

export async function POST(request: NextRequest) {
  if (!canManageFinanceLive(request)) {
    return buildIngestForbiddenResponse()
  }
  const parsedPayload = await parseJsonWithSchema(
    request,
    financeLiveWriteSchema,
    '财务写入参数不合法。'
  )
  if (!parsedPayload.ok) {
    return parsedPayload.response
  }
  const payload = parsedPayload.data
  if (payload?.syncRemote === true) return runRemoteSyncWrite(request)
  if (isStrictLiveMode() && payload?.seedAllScopes === true) {
    return NextResponse.json(
      {
        ok: false,
        actor: resolveAuditActor(request),
        message: '严格真实模式下已禁用 seedAllScopes。请直接写入或同步真实数据。',
      },
      { status: 400 }
    )
  }
  if (payload?.seedAllScopes === true) return runBaselineSeedWrite(request, payload)
  return runManualIngestWrite(request, payload)
}
