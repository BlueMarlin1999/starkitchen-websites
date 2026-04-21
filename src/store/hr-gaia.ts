import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GAIA_SEED_ROSTER,
  GaiaEmployeeRecord,
  cloneGaiaEmployeeRecord,
  parseGaiaRosterCsv,
} from '@/lib/hr-workforce'

export type HrGaiaImportSource = 'seed' | 'csv'

export interface HrGaiaImportSummary {
  source: HrGaiaImportSource
  importedAt: string
  importedRows: number
  errorCount: number
  errors: string[]
}

interface HrGaiaStoreState {
  roster: GaiaEmployeeRecord[]
  importSummary: HrGaiaImportSummary
  importSeedRoster: () => void
  importRosterCsv: (csvText: string) => { importedRows: number; errorCount: number; errors: string[] }
  resetToSeed: () => void
}

const nowIso = () => new Date().toISOString()

const cloneRoster = (items: GaiaEmployeeRecord[]) => items.map((item) => cloneGaiaEmployeeRecord(item))

const normalizeEmployeeId = (value: string) => value.trim().toUpperCase()

const sortRoster = (items: GaiaEmployeeRecord[]) =>
  [...items].sort((left, right) => {
    if (left.projectName !== right.projectName) return left.projectName.localeCompare(right.projectName, 'zh-CN')
    if (left.roleTitle !== right.roleTitle) return left.roleTitle.localeCompare(right.roleTitle, 'zh-CN')
    return left.name.localeCompare(right.name, 'zh-CN')
  })

const deduplicateRoster = (items: GaiaEmployeeRecord[]) => {
  const keyed = new Map<string, GaiaEmployeeRecord>()
  items.forEach((item) => {
    const normalizedId = normalizeEmployeeId(item.employeeId)
    if (!normalizedId) return
    keyed.set(normalizedId, {
      ...cloneGaiaEmployeeRecord(item),
      employeeId: normalizedId,
    })
  })
  return sortRoster(Array.from(keyed.values()))
}

const buildInitialRoster = () => deduplicateRoster(cloneRoster(GAIA_SEED_ROSTER))

const buildImportSummary = (
  source: HrGaiaImportSource,
  importedRows: number,
  errors: string[] = []
): HrGaiaImportSummary => ({
  source,
  importedAt: nowIso(),
  importedRows,
  errorCount: errors.length,
  errors,
})

const normalizeRosterFromPersisted = (value: unknown): GaiaEmployeeRecord[] => {
  if (!Array.isArray(value)) return buildInitialRoster()
  const safeRoster = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Partial<GaiaEmployeeRecord>
      if (!record.employeeId || !record.name || !record.roleTitle || !record.projectSlug || !record.projectName) {
        return null
      }
      return {
        employeeId: String(record.employeeId),
        name: String(record.name),
        roleTitle: String(record.roleTitle),
        city: String(record.city || ''),
        projectSlug: String(record.projectSlug),
        projectName: String(record.projectName),
        scopePath: Array.isArray(record.scopePath) ? record.scopePath.map((segment) => String(segment)) : [],
        hourlyCost: Number(record.hourlyCost) > 0 ? Number(record.hourlyCost) : 0,
        overtimeMultiplier: Number(record.overtimeMultiplier) > 0 ? Number(record.overtimeMultiplier) : 1.5,
        employmentType:
          record.employmentType === '兼职' || record.employmentType === '外包' ? record.employmentType : '全职',
        status: record.status === '休假' || record.status === '离岗' ? record.status : '在岗',
        gaiaOrgUnit: String(record.gaiaOrgUnit || ''),
        hiredAt: String(record.hiredAt || nowIso().slice(0, 10)),
        tags: Array.isArray(record.tags) ? record.tags.map((tag) => String(tag)) : [],
      } satisfies GaiaEmployeeRecord
    })
    .filter(Boolean) as GaiaEmployeeRecord[]

  return safeRoster.length > 0 ? deduplicateRoster(safeRoster) : buildInitialRoster()
}

const normalizeSummaryFromPersisted = (value: unknown): HrGaiaImportSummary => {
  if (!value || typeof value !== 'object') {
    return buildImportSummary('seed', GAIA_SEED_ROSTER.length)
  }
  const input = value as Partial<HrGaiaImportSummary>
  return {
    source: input.source === 'csv' ? 'csv' : 'seed',
    importedAt: typeof input.importedAt === 'string' && input.importedAt.trim() ? input.importedAt : nowIso(),
    importedRows: Number.isFinite(input.importedRows) ? Number(input.importedRows) : GAIA_SEED_ROSTER.length,
    errorCount: Number.isFinite(input.errorCount) ? Number(input.errorCount) : 0,
    errors: Array.isArray(input.errors) ? input.errors.map((item) => String(item)) : [],
  }
}

export const useHrGaiaStore = create<HrGaiaStoreState>()(
  persist(
    (set) => ({
      roster: buildInitialRoster(),
      importSummary: buildImportSummary('seed', GAIA_SEED_ROSTER.length),
      importSeedRoster: () =>
        set({
          roster: buildInitialRoster(),
          importSummary: buildImportSummary('seed', GAIA_SEED_ROSTER.length),
        }),
      importRosterCsv: (csvText: string) => {
        const parseResult = parseGaiaRosterCsv(csvText)
        const importedRows = parseResult.items.length
        const errorCount = parseResult.errors.length

        if (importedRows > 0) {
          set((state) => ({
            roster: deduplicateRoster([...state.roster, ...cloneRoster(parseResult.items)]),
            importSummary: buildImportSummary('csv', importedRows, parseResult.errors),
          }))
        } else {
          set({
            importSummary: buildImportSummary('csv', 0, parseResult.errors),
          })
        }

        return {
          importedRows,
          errorCount,
          errors: parseResult.errors,
        }
      },
      resetToSeed: () =>
        set({
          roster: buildInitialRoster(),
          importSummary: buildImportSummary('seed', GAIA_SEED_ROSTER.length),
        }),
    }),
    {
      name: 'hr-gaia-store',
      partialize: (state) => ({
        roster: state.roster,
        importSummary: state.importSummary,
      }),
      version: 1,
      migrate: (persistedState) => {
        const snapshot = (persistedState || {}) as {
          roster?: unknown
          importSummary?: unknown
        }
        return {
          roster: normalizeRosterFromPersisted(snapshot.roster),
          importSummary: normalizeSummaryFromPersisted(snapshot.importSummary),
        }
      },
      merge: (persistedState, currentState) => {
        const snapshot = (persistedState || {}) as {
          roster?: unknown
          importSummary?: unknown
        }
        return {
          ...currentState,
          roster: normalizeRosterFromPersisted(snapshot.roster),
          importSummary: normalizeSummaryFromPersisted(snapshot.importSummary),
        }
      },
    }
  )
)
