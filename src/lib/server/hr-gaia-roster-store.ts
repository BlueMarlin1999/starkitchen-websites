import {
  GAIA_SEED_ROSTER,
  GaiaEmployeeRecord,
  cloneGaiaEmployeeRecord,
  parseGaiaRosterCsv,
} from '@/lib/hr-workforce'
import { isStrictLiveMode } from '@/lib/live-mode'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'
import { GaiaSyncSource, loadGaiaRosterForSync } from '@/lib/server/gaia-sync'

const HR_GAIA_ROSTER_NAMESPACE = 'hr/gaia-roster/v1'

type HrGaiaImportSource = 'seed' | 'csv' | 'gaia-api' | 'empty'

export interface HrGaiaImportSummary {
  source: HrGaiaImportSource
  importedAt: string
  importedRows: number
  errorCount: number
  errors: string[]
}

interface HrGaiaRosterStorePayload {
  roster: GaiaEmployeeRecord[]
  importSummary: HrGaiaImportSummary
}

declare global {
  // eslint-disable-next-line no-var
  var __SK_HR_GAIA_ROSTER_STATE__: HrGaiaRosterStorePayload | undefined
}

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, max = 200) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(min, Math.min(max, value))
  const parsed = Number.parseFloat(clip(value, 30))
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const cloneRoster = (items: GaiaEmployeeRecord[]) => items.map((item) => cloneGaiaEmployeeRecord(item))

const sortRoster = (items: GaiaEmployeeRecord[]) =>
  [...items].sort((left, right) => {
    if (left.projectName !== right.projectName) return left.projectName.localeCompare(right.projectName, 'zh-CN')
    if (left.roleTitle !== right.roleTitle) return left.roleTitle.localeCompare(right.roleTitle, 'zh-CN')
    return left.name.localeCompare(right.name, 'zh-CN')
  })

const deduplicateRoster = (items: GaiaEmployeeRecord[]) => {
  const map = new Map<string, GaiaEmployeeRecord>()
  for (const item of items) {
    const employeeId = clip(item.employeeId, 80).toUpperCase()
    if (!employeeId) continue
    map.set(employeeId, {
      ...cloneGaiaEmployeeRecord(item),
      employeeId,
    })
  }
  return sortRoster(Array.from(map.values()))
}

const normalizeRosterRecord = (value: unknown): GaiaEmployeeRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Partial<GaiaEmployeeRecord>
  const employeeId = clip(input.employeeId, 80).toUpperCase()
  const name = clip(input.name, 120)
  const roleTitle = clip(input.roleTitle, 120)
  const projectSlug = clip(input.projectSlug, 120)
  const projectName = clip(input.projectName, 160)
  if (!employeeId || !name || !roleTitle || !projectSlug || !projectName) return null

  const employmentType =
    input.employmentType === '兼职' || input.employmentType === '外包' ? input.employmentType : '全职'
  const status = input.status === '休假' || input.status === '离岗' ? input.status : '在岗'

  return {
    employeeId,
    name,
    roleTitle,
    city: clip(input.city, 80),
    projectSlug,
    projectName,
    scopePath: Array.isArray(input.scopePath) ? input.scopePath.map((segment) => clip(segment, 80)).filter(Boolean) : [],
    hourlyCost: normalizeNumber(input.hourlyCost, 0, 0, 5000),
    overtimeMultiplier: normalizeNumber(input.overtimeMultiplier, 1.5, 1, 8),
    employmentType,
    status,
    gaiaOrgUnit: clip(input.gaiaOrgUnit, 120),
    hiredAt: clip(input.hiredAt, 40) || nowIso().slice(0, 10),
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => clip(tag, 80)).filter(Boolean).slice(0, 12) : [],
  }
}

const normalizeStorePayload = (value: unknown): HrGaiaRosterStorePayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return buildInitialStore()
  }
  const payload = value as Partial<HrGaiaRosterStorePayload>
  const roster = Array.isArray(payload.roster)
    ? deduplicateRoster(
        payload.roster
          .map((item) => normalizeRosterRecord(item))
          .filter(Boolean) as GaiaEmployeeRecord[]
      )
    : []

  const summaryInput = payload.importSummary as Partial<HrGaiaImportSummary> | undefined
  const importSummary: HrGaiaImportSummary = {
    source:
      summaryInput?.source === 'csv' ||
      summaryInput?.source === 'gaia-api' ||
      summaryInput?.source === 'seed' ||
      summaryInput?.source === 'empty'
        ? summaryInput.source
        : roster.length > 0
          ? 'gaia-api'
          : isStrictLiveMode()
            ? 'empty'
            : 'seed',
    importedAt: clip(summaryInput?.importedAt, 80) || nowIso(),
    importedRows: normalizeNumber(summaryInput?.importedRows, roster.length, 0, 100000),
    errorCount: normalizeNumber(summaryInput?.errorCount, 0, 0, 100000),
    errors: Array.isArray(summaryInput?.errors)
      ? summaryInput.errors.map((item) => clip(item, 240)).filter(Boolean).slice(0, 120)
      : [],
  }

  if (roster.length > 0) {
    return { roster, importSummary }
  }
  return buildInitialStore()
}

const buildImportSummary = (
  source: HrGaiaImportSource,
  importedRows: number,
  errors: string[] = []
): HrGaiaImportSummary => ({
  source,
  importedAt: nowIso(),
  importedRows,
  errorCount: errors.length,
  errors: errors.slice(0, 120),
})

const buildInitialStore = (): HrGaiaRosterStorePayload => {
  if (isStrictLiveMode()) {
    return {
      roster: [],
      importSummary: buildImportSummary('empty', 0),
    }
  }
  return {
    roster: deduplicateRoster(cloneRoster(GAIA_SEED_ROSTER)),
    importSummary: buildImportSummary('seed', GAIA_SEED_ROSTER.length),
  }
}

const getMemoryStore = () => {
  if (!globalThis.__SK_HR_GAIA_ROSTER_STATE__) {
    globalThis.__SK_HR_GAIA_ROSTER_STATE__ = buildInitialStore()
  }
  return globalThis.__SK_HR_GAIA_ROSTER_STATE__
}

const readStoreFromPersistent = async () => {
  const payload = await readPersistentJsonState<HrGaiaRosterStorePayload>(HR_GAIA_ROSTER_NAMESPACE)
  const normalized = normalizeStorePayload(payload)
  await writePersistentJsonState(HR_GAIA_ROSTER_NAMESPACE, normalized)
  return normalized
}

const readStore = async (): Promise<HrGaiaRosterStorePayload> => {
  if (!isPersistentJsonStoreEnabled()) return getMemoryStore()
  try {
    return await readStoreFromPersistent()
  } catch {
    return getMemoryStore()
  }
}

const writeStore = async (payload: HrGaiaRosterStorePayload) => {
  const normalized = normalizeStorePayload(payload)
  if (!isPersistentJsonStoreEnabled()) {
    globalThis.__SK_HR_GAIA_ROSTER_STATE__ = normalized
    return normalized
  }
  await writePersistentJsonState(HR_GAIA_ROSTER_NAMESPACE, normalized)
  return normalized
}

export const listHrGaiaRoster = async () => {
  const state = await readStore()
  return state
}

export const syncHrGaiaRoster = async (options: {
  source: GaiaSyncSource
  strictRemote: boolean
}) => {
  const roster = await loadGaiaRosterForSync(options)
  const nextState = await writeStore({
    roster: deduplicateRoster(cloneRoster(roster.items)),
    importSummary: buildImportSummary(
      roster.source === 'gaia-api' ? 'gaia-api' : 'seed',
      roster.items.length,
      roster.warnings
    ),
  })
  return {
    ...nextState,
    remote: roster,
  }
}

export const importHrGaiaRosterCsv = async (csvText: string) => {
  const parsed = parseGaiaRosterCsv(csvText)
  const current = await readStore()
  const nextRoster = deduplicateRoster([...current.roster, ...cloneRoster(parsed.items)])
  const nextState = await writeStore({
    roster: nextRoster,
    importSummary: buildImportSummary('csv', parsed.items.length, parsed.errors),
  })
  return {
    ...nextState,
    importedRows: parsed.items.length,
    errorCount: parsed.errors.length,
  }
}

export const resetHrGaiaRosterToSeed = async () => {
  if (isStrictLiveMode()) {
    throw new Error('STRICT_LIVE_MODE_SEED_DISABLED')
  }
  const nextState = await writeStore({
    roster: deduplicateRoster(cloneRoster(GAIA_SEED_ROSTER)),
    importSummary: buildImportSummary('seed', GAIA_SEED_ROSTER.length),
  })
  return nextState
}
