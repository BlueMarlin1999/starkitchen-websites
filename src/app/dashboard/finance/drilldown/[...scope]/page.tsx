import { SCOPE_HIERARCHY_STATIC_PATHS } from '@/lib/business-metrics'
import { DrilldownScopeClient } from './drilldown-scope-client'

interface DrilldownScopePageProps {
  params: {
    scope: string[]
  }
}

export function generateStaticParams() {
  return SCOPE_HIERARCHY_STATIC_PATHS.map((scope) => ({ scope }))
}

export default function DrilldownScopePage({ params }: DrilldownScopePageProps) {
  return <DrilldownScopeClient requestedScopePath={params.scope} />
}
