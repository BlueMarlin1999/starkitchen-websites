import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { AiLayerSection } from '@/components/pages/home/AiLayerSection'
import { BrandCinemaSection } from '@/components/pages/home/BrandCinemaSection'
import { BrandManifestoSection } from '@/components/pages/home/BrandManifestoSection'
import { BrandRibbonSection } from '@/components/pages/home/BrandRibbonSection'
import { CapabilitiesSection } from '@/components/pages/home/CapabilitiesSection'
import { CompanySection } from '@/components/pages/home/CompanySection'
import { ContactSection } from '@/components/pages/home/ContactSection'
import { FutureSection } from '@/components/pages/home/FutureSection'
import { HeroSection } from '@/components/pages/home/HeroSection'
import { IndustriesSection } from '@/components/pages/home/IndustriesSection'
import { ServiceSignatureSection } from '@/components/pages/home/ServiceSignatureSection'
import { StarsManifestoSection } from '@/components/pages/home/StarsManifestoSection'

export default function HomePageClient() {
  return (
    <CorporateSiteShell activePath="/">
      <HeroSection />
      <BrandRibbonSection />

      <div className="mx-auto max-w-[88rem] px-6 py-20">
        <div className="space-y-24 sm:space-y-28">
          <BrandCinemaSection />
          <BrandManifestoSection />
          <ServiceSignatureSection />
          <StarsManifestoSection />
          <CompanySection />
          <IndustriesSection />
          <CapabilitiesSection />
          <AiLayerSection />
          <FutureSection />
          <ContactSection />
        </div>
      </div>
    </CorporateSiteShell>
  )
}
