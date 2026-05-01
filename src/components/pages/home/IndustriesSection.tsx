import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/corporate/section-heading'
import { industryFocus } from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function IndustriesSection() {
  return (
    <section>
      <SectionHeading
        eyebrow="Industry Focus"
        title="不同场景，需要不同的餐饮方法"
        description="企业园区、教育、医疗、酒店和工业空间，面对的是不同的客流节奏、服务目标和组织压力。"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {industryFocus.map((industry, index) => {
          const Icon = industry.icon

          return (
            <article
              key={industry.title}
              className={cn(
                'sk-corp-panel rounded-[2rem] p-5'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[rgba(26,151,218,0.1)] text-[var(--sk-action)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className={cn(corporateMono.className, 'text-[11px] text-[rgba(23,28,25,0.4)]')}>
                  0{index + 1}
                </p>
              </div>
              <h3 className={cn(corporateSans.className, 'mt-5 text-[1.25rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                {industry.title}
              </h3>
              <p className="mt-4 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{industry.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {industry.tags.map((tag) => (
                  <span key={tag} className="sk-corp-chip rounded-full px-3 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          href="/industries"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.12)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:bg-white"
        >
          查看行业场景详情
          <ArrowRight className="h-4 w-4 text-[var(--sk-action)]" />
        </Link>
      </div>
    </section>
  )
}
