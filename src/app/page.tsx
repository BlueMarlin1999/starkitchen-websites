import { headers } from 'next/headers'
import AiTechHomePageClient from '@/components/pages/AiTechHomePageClient'
import HomePageClient from '@/components/pages/HomePageClient'
import { resolveSiteVariantFromHost } from '@/app/metadata'

export default function HomePage() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const variant = resolveSiteVariantFromHost(host)

  if (variant === 'ai-tech') {
    return <AiTechHomePageClient />
  }

  return <HomePageClient />
}
