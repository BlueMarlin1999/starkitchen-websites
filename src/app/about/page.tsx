import type { Metadata } from 'next'
import AboutPage from '@/components/pages/AboutPage'

export const metadata: Metadata = {
  title: 'About',
  description:
    '了解 Star Kitchen 的公司定位、集团方法论、服务原则与长期品牌方向。'
}

export const revalidate = 60

export default function AboutRoute() {
  return <AboutPage />
}
