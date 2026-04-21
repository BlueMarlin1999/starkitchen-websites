import CounterDetailClient from './counter-detail-client'
import { COUNTER_SLUGS } from '@/lib/counter-metrics'

export function generateStaticParams() {
  return COUNTER_SLUGS.map((counter) => ({ counter }))
}

export default function CounterDetailPage() {
  return <CounterDetailClient />
}
