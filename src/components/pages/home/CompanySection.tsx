import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/corporate/section-heading'
import { capabilityPillars } from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function CompanySection() {
  return (
    <section>
      <div className="grid gap-10 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-7">
          <SectionHeading
            eyebrow="Company Positioning"
            title="这是 Star Kitchen 的经营世界观"
            description="我们希望客户很快理解，这是一家懂场景、懂组织、也懂长期运营的服务集团。"
          />

          <div className="sk-corp-panel-soft rounded-[2.1rem] p-7">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[rgba(23,28,25,0.48)]')}>
              why this matters
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[rgba(23,28,25,0.74)]">
              真正有价值的餐饮服务集团，不只靠形象建立印象，更靠清晰表达复杂服务与组织运营能力来赢得信任。
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.12)] bg-white/65 px-5 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:bg-white"
            >
              查看关于我们
              <ArrowRight className="h-4 w-4 text-[var(--sk-action)]" />
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {capabilityPillars.map((pillar, index) => {
            const Icon = pillar.icon

            return (
              <article
                key={pillar.title}
                className={cn(
                  'sk-corp-panel rounded-[2rem] p-6 transition-transform hover:-translate-y-1'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[var(--sk-action)] text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className={cn(corporateMono.className, 'text-[11px] text-[rgba(23,28,25,0.42)]')}>0{index + 1}</p>
                </div>

                <h3 className={cn(corporateSans.className, 'mt-6 text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                  {pillar.title}
                </h3>
                <p className="mt-4 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{pillar.description}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {pillar.points.map((point) => (
                    <span key={point} className="sk-corp-chip rounded-full px-3 py-1 text-xs">
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
