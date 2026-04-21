import type { Metadata } from 'next'
import ContactPage from '@/components/pages/ContactPage'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    '联系 Star Kitchen，发起集团餐饮服务、中央厨房供应协同或 AI 经营系统相关沟通。'
}

export const revalidate = 60

export default function ContactRoute() {
  return <ContactPage />
}
