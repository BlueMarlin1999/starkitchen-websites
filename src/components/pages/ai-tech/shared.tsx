import {
  Bot,
  BrainCircuit,
  FileText,
  LineChart,
  Megaphone,
  Package,
  ShieldCheck,
  UtensilsCrossed,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { type AiAgentCapabilityId } from '@/lib/ai-agent-capabilities'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export const capabilityIconMap: Record<AiAgentCapabilityId, LucideIcon> = {
  contract_review: ShieldCheck,
  policy_generation: FileText,
  tender_generation: FileText,
  report_summary: LineChart,
  copywriting: Megaphone,
  product_generation: Package,
  menu_generation: UtensilsCrossed,
  audio_generation: Workflow,
  image_generation: BrainCircuit,
  video_generation: Bot,
  social_content: Megaphone,
  other: LineChart,
}

export function AiSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className={corporateSans.className}>
      <div className="flex items-center gap-4">
        <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-white/56')}>
          {eyebrow}
        </p>
        <span className="h-px w-16 bg-[linear-gradient(90deg,rgba(26,151,218,0.56),rgba(255,212,0,0))]" />
      </div>
      <h2 className="mt-5 max-w-[15ch] text-[clamp(2rem,3vw,3rem)] font-semibold leading-[1.04] tracking-[-0.028em] text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-[42rem] text-[15px] leading-7 text-white/70 sm:text-[16px] sm:leading-8">
        {description}
      </p>
    </div>
  )
}
