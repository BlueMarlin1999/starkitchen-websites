import type { Metadata } from 'next'
import AiTechHomePageClient from '@/components/pages/AiTechHomePageClient'
import { buildSiteMetadata } from '@/app/metadata'

export const metadata: Metadata = buildSiteMetadata('ai-tech')

export default function AiCompanyPreviewPage() {
  return <AiTechHomePageClient />
}
