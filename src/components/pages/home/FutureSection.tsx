import { SectionHeading } from '@/components/corporate/section-heading'
import { commitmentCards, operatingPrinciples } from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function FutureSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="sk-corp-panel rounded-[2.3rem] p-8 sm:p-10">
          <SectionHeading
            eyebrow="Brand Direction"
            title="像国际服务集团，也像值得长期信任的合作伙伴"
            description="可信赖、国际化、温暖、克制、有系统能力，这些品质应该同时出现在 Star Kitchen 的品牌表达里。"
          />

          <div className="mt-8 space-y-4">
            {commitmentCards.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="rounded-[1.6rem] border border-[rgba(62,59,64,0.08)] bg-[var(--sk-paper)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--sk-action)] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--sk-ink)]">{item.title}</p>
                      <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sk-corp-panel-soft rounded-[2.3rem] p-8 sm:p-10">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[rgba(23,28,25,0.5)]')}>
            brand expression
          </p>
          <h3 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,2.5vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--sk-ink)]">
            让合作方记住我们的，不只是味道，更是秩序、温度与执行力。
          </h3>
          <p className="mt-5 text-[15px] leading-7 text-[rgba(23,28,25,0.72)]">
            Star Kitchen 希望传达的是国际标准下的服务美学、本土温度里的运营纪律，以及由 AI 放大的组织执行力。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {operatingPrinciples.map((item) => (
              <div key={item.title} className="sk-corp-panel rounded-[1.7rem] p-5">
                <p className="text-[15px] font-semibold text-[var(--sk-ink)]">{item.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.8rem] bg-[var(--sk-deep)] p-6 text-white">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
              brand note
            </p>
            <p className={cn(corporateSans.className, 'mt-3 text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.015em]')}>
              Global flavors. Local hearts. Smart execution.
            </p>
            <p className="mt-3 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">
              这也是 Star Kitchen 希望留给合作方、顾客与团队的统一品牌印象。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
