import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  brandDifferentiators,
  brandIntroduction,
  brandPositioning,
  brandValues,
} from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { COMPANY_NAME_ZH_LEGAL, COMPANY_SHORT_NAME_EN } from '@/lib/brand'
import { cn } from '@/lib/utils'

export function BrandManifestoSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="sk-corp-panel-dark rounded-[2.6rem] p-8 text-[#fff9ef] sm:p-10">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[var(--sk-blue)]')}>
            Brand manifesto
          </p>
          <h2 className="mt-5 max-w-[15ch] text-[clamp(1.85rem,2.7vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#fffaf1]">
            {brandPositioning}
          </h2>
          <p className="mt-6 max-w-[34rem] text-[15px] leading-7 tracking-[0.01em] text-[rgba(255,246,234,0.76)]">
            {brandIntroduction}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {brandValues.map((value) => (
              <span
                key={value}
                className="rounded-full border border-[rgba(216,195,164,0.16)] bg-white/[0.06] px-4 py-2 text-sm text-[rgba(255,246,234,0.86)]"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="sk-corp-panel-soft rounded-[2.6rem] p-8 sm:p-10">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(23,28,25,0.48)]')}>
              Group identity
            </p>
            <h3 className="mt-5 max-w-[13ch] text-[clamp(1.6rem,2.2vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.018em] text-[var(--sk-ink)]">
              {COMPANY_NAME_ZH_LEGAL}
            </h3>
            <p className="mt-4 max-w-[33rem] text-[15px] leading-7 tracking-[0.01em] text-[rgba(23,28,25,0.68)]">
              对外简称星厨集团 {COMPANY_SHORT_NAME_EN}。我们希望合作方首先感受到的，是一家兼具国际标准、本土温度与时尚服务气质的现代餐饮服务集团。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {brandDifferentiators.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="sk-corp-panel rounded-[1.8rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--sk-action)] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={cn(corporateSans.className, 'mt-5 text-[1.25rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                    {item.title}
                  </p>
                  <p className="mt-3 text-[13px] leading-6 tracking-[0.01em] text-[rgba(23,28,25,0.72)]">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
