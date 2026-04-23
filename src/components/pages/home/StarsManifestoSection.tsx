import { SectionHeading } from '@/components/corporate/section-heading'
import { brandStarsPrinciples } from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'
import { starsVisualBackdrops } from './shared'

export function StarsManifestoSection() {
  return (
    <section className="sk-corp-panel rounded-[2.8rem] px-6 py-16 sm:px-8 lg:px-10">
      <SectionHeading
        eyebrow="STARS Brand Declaration"
        title="STARS 是星厨集团的品牌标准"
        description="从安全到美味，从关怀到可靠，再到智慧创新，让客户、员工与合作伙伴在每个接触点都感受到这五种品质。"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {brandStarsPrinciples.map((item, index) => {
          const Icon = item.icon

          return (
            <article
              key={`${item.letter}-${item.english}`}
              className={cn(
                'group relative min-h-[21rem] overflow-hidden rounded-[2.2rem] border border-[rgba(23,28,25,0.08)] shadow-[0_20px_55px_rgba(41,36,29,0.12)]'
              )}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
                style={{ backgroundImage: `url(${starsVisualBackdrops[index]})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,13,12,0.14),rgba(9,13,12,0.34)_30%,rgba(9,13,12,0.84)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,165,117,0.16),transparent_28%)]" />

              <div className="relative z-10 flex h-full flex-col justify-between p-6 text-[#fffaf1]">
                <div className="flex items-start justify-between gap-4">
                  <span className={cn(corporateSans.className, 'text-[3.4rem] font-semibold leading-none tracking-[-0.05em] text-[rgba(255,250,241,0.94)]')}>
                    {item.letter}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[rgba(216,195,164,0.16)] bg-[rgba(20,29,26,0.44)] text-[#fff8ef] backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <p className="text-[1rem] font-semibold tracking-[0.01em] text-[#fffaf1]">{item.english}</p>
                  <p className="mt-2 text-[12px] font-medium tracking-[0.01em] text-[var(--sk-yellow)]">{item.chinese}</p>
                  <p className="mt-3 max-w-[17rem] text-[13px] leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.8)]">{item.description}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
