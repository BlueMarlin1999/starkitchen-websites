import { AiTechSiteShell } from '@/components/ai-tech/site-shell'
import { ArchitectureSection } from '@/components/pages/ai-tech/ArchitectureSection'
import { CapabilitiesSection } from '@/components/pages/ai-tech/CapabilitiesSection'
import { ContactSection } from '@/components/pages/ai-tech/ContactSection'
import { HeroSection } from '@/components/pages/ai-tech/HeroSection'
import { PlatformSection } from '@/components/pages/ai-tech/PlatformSection'
import { ScenariosSection } from '@/components/pages/ai-tech/ScenariosSection'

export default function AiTechHomePageClient() {
  return (
    <AiTechSiteShell>
      <HeroSection />
      <PlatformSection />
      <ScenariosSection />
      <CapabilitiesSection />
      <ArchitectureSection />
      <ContactSection />
    </AiTechSiteShell>
  )
}
