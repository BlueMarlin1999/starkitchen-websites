import type { Metadata } from 'next'
import CapabilitiesPage from '@/components/pages/CapabilitiesPage'

export const metadata: Metadata = {
  title: 'Capabilities',
  description:
    '查看 Star Kitchen 的餐饮服务、中央厨房、供应链协同与 AI 经营系统能力架构。'
}

export const revalidate = 60

export default function CapabilitiesRoute() {
  return <CapabilitiesPage />
}
