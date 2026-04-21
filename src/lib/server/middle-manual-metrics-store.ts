import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import {
  MiddleManualMetricRecord,
  MiddleMetricKey,
  middleMetricKeySchema,
} from '@/lib/middle-metrics'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'

const STORE_NAMESPACE = 'middle/manual-metrics/v1'
const MAX_ENTRY_COUNT = 5000
const DEFAULT_DATA_DIR = '/tmp/starkitchen-middle-metrics'
const STATE_FILE_NAME = 'state.json'

const clip = (value: unknown, max: number, fallback = '') => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const manualMetricRecordSchema: z.ZodType<MiddleManualMetricRecord> = z.object({
  id: z.string().trim().min(1).max(120),
  metricKey: middleMetricKeySchema,
  value: z.number().finite(),
  note: z.string().trim().max(240),
  actorId: z.string().trim().min(1).max(120),
  actorName: z.string().trim().min(1).max(120),
  actorRole: z.string().trim().min(1).max(60),
  createdAt: z.string().trim().min(1).max(80),
})

const manualStoreStateSchema = z.object({
  entries: z.array(manualMetricRecordSchema).max(MAX_ENTRY_COUNT).default([]),
  updatedAt: z.string().trim().min(1).max(80).default(''),
})

type ManualStoreState = z.infer<typeof manualStoreStateSchema>

const defaultState = (): ManualStoreState => ({
  entries: [],
  updatedAt: new Date().toISOString(),
})

const normalizeState = (raw: unknown): ManualStoreState => {
  const parsed = manualStoreStateSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  return defaultState()
}

const writeState = async (state: ManualStoreState) => {
  if (isPersistentJsonStoreEnabled()) {
    await writePersistentJsonState(STORE_NAMESPACE, state)
    return
  }
  const targetFilePath = await getStateFilePath()
  await writeFile(targetFilePath, JSON.stringify(state, null, 2), 'utf8')
}

export const readMiddleManualMetricState = async () => {
  const raw = await readManualStateRaw()
  return normalizeState(raw)
}

export const listMiddleManualMetricEntries = async (metricKey?: MiddleMetricKey) => {
  const state = await readMiddleManualMetricState()
  if (!metricKey) return state.entries
  return state.entries.filter((entry) => entry.metricKey === metricKey)
}

export const appendMiddleManualMetricEntry = async (input: {
  metricKey: MiddleMetricKey
  value: number
  note?: string
  actorId: string
  actorName: string
  actorRole: string
  createdAt?: string
}) => {
  const state = await readMiddleManualMetricState()
  const createdAt = clip(input.createdAt, 80) || new Date().toISOString()
  const nextEntry: MiddleManualMetricRecord = {
    id: randomUUID(),
    metricKey: input.metricKey,
    value: safeNumber(input.value, 0),
    note: clip(input.note, 240),
    actorId: clip(input.actorId, 120, 'unknown'),
    actorName: clip(input.actorName, 120, 'unknown'),
    actorRole: clip(input.actorRole, 60, 'supervisor'),
    createdAt,
  }
  const nextEntries = [...state.entries, nextEntry]
  const trimmedEntries =
    nextEntries.length > MAX_ENTRY_COUNT
      ? nextEntries.slice(nextEntries.length - MAX_ENTRY_COUNT)
      : nextEntries
  await writeState({
    entries: trimmedEntries,
    updatedAt: createdAt,
  })
  return nextEntry
}

export const clearMiddleManualMetricEntries = async (metricKey: MiddleMetricKey) => {
  const state = await readMiddleManualMetricState()
  const nextEntries = state.entries.filter((entry) => entry.metricKey !== metricKey)
  const changed = nextEntries.length !== state.entries.length
  await writeState({
    entries: nextEntries,
    updatedAt: new Date().toISOString(),
  })
  return { changed, removed: state.entries.length - nextEntries.length }
}

const getDataDir = () =>
  (process.env.MIDDLE_MANUAL_METRICS_DATA_DIR || DEFAULT_DATA_DIR).trim() || DEFAULT_DATA_DIR

const ensureDataDir = async () => {
  const target = getDataDir()
  await mkdir(target, { recursive: true })
  return target
}

const getStateFilePath = async () => {
  const dataDir = await ensureDataDir()
  return join(dataDir, STATE_FILE_NAME)
}

const readManualStateFromDisk = async () => {
  try {
    const stateFilePath = await getStateFilePath()
    const raw = await readFile(stateFilePath, 'utf8')
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

const readManualStateRaw = async () => {
  if (isPersistentJsonStoreEnabled()) {
    return readPersistentJsonState<unknown>(STORE_NAMESPACE)
  }
  return readManualStateFromDisk()
}
