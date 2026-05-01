import { corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'
import { brandRibbonItems, ribbonAccentColors } from './shared'

export function BrandRibbonSection() {
  return (
    <section className="overflow-hidden border-y border-[rgba(62,59,64,0.08)] bg-[linear-gradient(90deg,#28262c_0%,#2f2c33_100%)] py-4 text-white">
      <div className="sk-brand-marquee-track flex w-max items-center gap-4 whitespace-nowrap pr-4">
        {[0, 1].map((group) => (
          <div key={group} className="flex items-center gap-4">
            {brandRibbonItems.map((item, index) => (
              <div
                key={`${group}-${item}`}
                className="flex items-center gap-4 rounded-full border bg-white/[0.04] px-4 py-2"
                style={{
                  borderColor: `${ribbonAccentColors[index % ribbonAccentColors.length]}33`,
                  boxShadow: `inset 0 0 0 1px ${ribbonAccentColors[index % ribbonAccentColors.length]}12`,
                }}
              >
                <span
                  className={cn(corporateMono.className, 'sk-corp-kicker text-[10px]')}
                  style={{ color: ribbonAccentColors[index % ribbonAccentColors.length] }}
                >
                  SK Group
                </span>
                <span className="text-[13px] text-[rgba(255,246,234,0.88)] sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
