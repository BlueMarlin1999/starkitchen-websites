import { GaiaSyncSource, loadGaiaRosterForSync } from '@/lib/server/gaia-sync'
import { OaGaiaSyncResult, syncOaContactsFromGaia } from '@/lib/server/oa/storage'

export interface OaGaiaDirectorySyncOptions {
  source: GaiaSyncSource
  strictRemote: boolean
  onlyActive?: boolean
  limit?: number
}

export interface OaGaiaDirectorySyncResult extends OaGaiaSyncResult {
  source: 'gaia-seed' | 'gaia-api'
  mode: 'seed' | 'json' | 'csv'
  endpointHint: string
  warnings: string[]
  syncedAt: string
}

export const syncOaDirectoryFromGaia = async (
  options: OaGaiaDirectorySyncOptions
): Promise<OaGaiaDirectorySyncResult> => {
  const roster = await loadGaiaRosterForSync({
    source: options.source,
    strictRemote: options.strictRemote,
  })
  const stats = await syncOaContactsFromGaia(roster.items, {
    onlyActive: options.onlyActive,
    limit: options.limit,
  })
  return {
    ...stats,
    source: roster.source,
    mode: roster.mode,
    endpointHint: roster.endpointHint,
    warnings: roster.warnings,
    syncedAt: roster.fetchedAt,
  }
}
