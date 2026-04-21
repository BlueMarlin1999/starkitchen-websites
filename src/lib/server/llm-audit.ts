import { NextRequest, NextResponse } from 'next/server'
import { resolveAuditActor } from '@/lib/server/llm-auth'

const MAX_AUDIT_ENTRIES = 300

export type LlmAuditAction =
  | 'provider.update'
  | 'provider.test'
  | 'routes.update'
  | 'agent-routes.update'
  | 'chat.completion'
  | 'control-plane.read'

export interface LlmAuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: LlmAuditAction
  success: boolean
  statusCode: number
  latencyMs: number | null
  providerId?: string
  routeId?: string
  model?: string
  message: string
  path: string
}

export interface LlmAuditSummaryBucket {
  id: string
  count: number
  errorCount: number
  avgLatencyMs: number | null
}

export interface LlmAuditSummary {
  windowHours: number
  totalEvents: number
  successCount: number
  errorCount: number
  successRate: number
  avgLatencyMs: number | null
  p95LatencyMs: number | null
  byAction: LlmAuditSummaryBucket[]
  byProvider: LlmAuditSummaryBucket[]
  recentErrors: LlmAuditLogEntry[]
}

declare global {
  // eslint-disable-next-line no-var
  var __SK_LLM_AUDIT_LOGS__: LlmAuditLogEntry[] | undefined
}

const getAuditStore = () => {
  if (!globalThis.__SK_LLM_AUDIT_LOGS__) {
    globalThis.__SK_LLM_AUDIT_LOGS__ = []
  }
  return globalThis.__SK_LLM_AUDIT_LOGS__
}

export const readLlmAuditLogs = (_request?: NextRequest) => getAuditStore()

interface AppendAuditLogInput {
  action: LlmAuditAction
  success: boolean
  statusCode: number
  message: string
  latencyMs?: number | null
  providerId?: string
  routeId?: string
  model?: string
}

export const appendLlmAuditLog = (
  _response: NextResponse,
  request: NextRequest,
  payload: AppendAuditLogInput
) => {
  const store = getAuditStore()
  const now = new Date()
  store.unshift({
    id: `${now.getTime()}-${Math.random().toString(16).slice(2, 10)}`,
    timestamp: now.toISOString(),
    actor: resolveAuditActor(request),
    action: payload.action,
    success: payload.success,
    statusCode: payload.statusCode,
    latencyMs: typeof payload.latencyMs === 'number' ? Math.max(0, payload.latencyMs) : null,
    providerId: payload.providerId,
    routeId: payload.routeId,
    model: payload.model,
    message: payload.message,
    path: request.nextUrl.pathname,
  })
  if (store.length > MAX_AUDIT_ENTRIES) {
    store.length = MAX_AUDIT_ENTRIES
  }
}

const average = (values: number[]) => {
  if (!values.length) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

const percentile = (values: number[], rank: number) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * rank) - 1))
  return sorted[index]
}

const buildBuckets = (
  entries: LlmAuditLogEntry[],
  resolveId: (entry: LlmAuditLogEntry) => string
): LlmAuditSummaryBucket[] => {
  const map = new Map<string, { count: number; errorCount: number; latencies: number[] }>()
  entries.forEach((entry) => {
    const id = resolveId(entry)
    if (!id) return
    const bucket = map.get(id) || { count: 0, errorCount: 0, latencies: [] }
    bucket.count += 1
    if (!entry.success) bucket.errorCount += 1
    if (typeof entry.latencyMs === 'number') bucket.latencies.push(entry.latencyMs)
    map.set(id, bucket)
  })
  return Array.from(map.entries())
    .map(([id, value]) => ({
      id,
      count: value.count,
      errorCount: value.errorCount,
      avgLatencyMs: average(value.latencies),
    }))
    .sort((a, b) => b.count - a.count)
}

export const summarizeLlmAuditLogs = (
  entries: LlmAuditLogEntry[],
  windowHours = 24
): LlmAuditSummary => {
  const minTimestamp = Date.now() - windowHours * 60 * 60 * 1000
  const scopedEntries = entries.filter((entry) => Date.parse(entry.timestamp) >= minTimestamp)
  const latencies = scopedEntries
    .map((entry) => entry.latencyMs)
    .filter((value): value is number => typeof value === 'number')
  const successCount = scopedEntries.filter((entry) => entry.success).length
  const errorCount = scopedEntries.length - successCount

  return {
    windowHours,
    totalEvents: scopedEntries.length,
    successCount,
    errorCount,
    successRate: scopedEntries.length ? Number((successCount / scopedEntries.length).toFixed(4)) : 0,
    avgLatencyMs: average(latencies),
    p95LatencyMs: percentile(latencies, 0.95),
    byAction: buildBuckets(scopedEntries, (entry) => entry.action),
    byProvider: buildBuckets(scopedEntries, (entry) => entry.providerId || 'n/a'),
    recentErrors: scopedEntries.filter((entry) => !entry.success).slice(0, 8),
  }
}
