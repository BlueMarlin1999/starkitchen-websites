import { METRIC_SLUGS } from '@/lib/business-metrics'
import { MetricDetailClient } from './metric-detail-client'

interface MetricDetailPageProps {
  params: {
    metric: string
  }
}

export function generateStaticParams() {
  return METRIC_SLUGS.map((metric) => ({ metric }))
}

export default function MetricDetailPage({ params }: MetricDetailPageProps) {
  return <MetricDetailClient metric={params.metric} />
}
