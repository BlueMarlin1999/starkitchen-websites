import type { Metadata } from 'next'
import IndustriesPage from '@/components/pages/IndustriesPage'

export const metadata: Metadata = {
  title: 'Industries',
  description:
    '查看 Star Kitchen 面向企业园区、教育、医疗、酒店与工业服务空间的行业场景与服务方法。'
}

export const revalidate = 60

export default function IndustriesRoute() {
  return <IndustriesPage />
}
