import {
  DEFAULT_SCOPE_PATH,
  SCOPE_HIERARCHY_NODES,
  ScopeHierarchyLevel,
  getScopeHierarchyNodeByPath,
} from '@/lib/business-metrics'

const LEVEL_PRIORITY: Record<ScopeHierarchyLevel, number> = {
  global: 1,
  country: 2,
  region: 3,
  province: 4,
  city: 5,
  site: 6,
}

const normalizeScopeLabel = (value: string) => value.trim().toLowerCase()

export const getScopePathByName = (
  name: string,
  options?: {
    preferredLevels?: ScopeHierarchyLevel[]
    fallbackPath?: string[]
  }
) => {
  const normalizedName = normalizeScopeLabel(name)
  if (!normalizedName) return options?.fallbackPath || DEFAULT_SCOPE_PATH

  const matches = SCOPE_HIERARCHY_NODES.filter((node) => normalizeScopeLabel(node.name) === normalizedName)
  if (!matches.length) return options?.fallbackPath || DEFAULT_SCOPE_PATH

  const preferredLevels = options?.preferredLevels || []
  const preferredLevelSet = new Set<ScopeHierarchyLevel>(preferredLevels)
  const preferredMatches =
    preferredLevelSet.size > 0 ? matches.filter((node) => preferredLevelSet.has(node.level)) : matches
  const effectiveMatches = preferredMatches.length > 0 ? preferredMatches : matches
  const sortedMatches = effectiveMatches.slice().sort((a, b) => {
    const levelDiff = LEVEL_PRIORITY[b.level] - LEVEL_PRIORITY[a.level]
    if (levelDiff !== 0) return levelDiff
    return b.depth - a.depth
  })

  return sortedMatches[0]?.path || options?.fallbackPath || DEFAULT_SCOPE_PATH
}

const getSafeScopePath = (scopePath: string[]) => {
  const matchedNode = getScopeHierarchyNodeByPath(scopePath)
  if (matchedNode) return matchedNode.path
  return getScopeHierarchyNodeByPath(DEFAULT_SCOPE_PATH)?.path || DEFAULT_SCOPE_PATH
}

export const buildScopeDrilldownHref = (scopePath: string[], metricSlug?: string) => {
  const safeScopePath = getSafeScopePath(scopePath)
  const basePath = `/dashboard/finance/drilldown/${safeScopePath.join('/')}/`
  return metricSlug ? `${basePath}?metric=${encodeURIComponent(metricSlug)}` : basePath
}

export const buildScopeMetricHref = (metricSlug: string, scopePath: string[]) => {
  const safeScopePath = getSafeScopePath(scopePath)
  return `/dashboard/finance/${metricSlug}/?scope=${encodeURIComponent(safeScopePath.join('/'))}`
}
