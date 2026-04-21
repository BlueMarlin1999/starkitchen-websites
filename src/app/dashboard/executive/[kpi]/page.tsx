import { EXECUTIVE_KPI_LIBRARY } from '@/lib/business-metrics'
import { ExecutiveKpiDetailClient } from './executive-kpi-detail-client'

interface ExecutiveKpiDetailPageProps {
  params: {
    kpi: string
  }
}

export function generateStaticParams() {
  return EXECUTIVE_KPI_LIBRARY.map((kpi) => ({ kpi: kpi.key }))
}

export default function ExecutiveKpiDetailPage({ params }: ExecutiveKpiDetailPageProps) {
  return <ExecutiveKpiDetailClient kpiKey={params.kpi} />
}
