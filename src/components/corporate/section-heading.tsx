import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description: string
  align?: 'left' | 'center'
  invert?: boolean
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  invert = false,
}: SectionHeadingProps) {
  return (
    <div className={cn(corporateSans.className, 'max-w-[46rem]', align === 'center' && 'mx-auto text-center')}>
      <div className={cn('flex items-center gap-4', align === 'center' && 'justify-center')}>
        <p
          className={cn(
            corporateMono.className,
            'sk-corp-kicker text-[10px] sm:text-[11px]',
            invert ? 'text-[#ddc6a6]/88' : 'text-[rgba(23,28,25,0.55)]'
          )}
        >
          {eyebrow}
        </p>
        <span className={cn('h-px w-16', invert ? 'sk-corp-rule-invert' : 'sk-corp-rule')} />
      </div>
      <h2
        className={cn(
          corporateSans.className,
          'mt-5 max-w-[17ch] text-[clamp(1.9rem,2.55vw,2.45rem)] font-semibold leading-[1.06] tracking-[-0.022em]',
          align === 'center' && 'mx-auto',
          invert ? 'text-[#fffaf1]' : 'text-[var(--sk-ink)]'
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'mt-5 max-w-[42rem] text-[15px] leading-7 sm:text-[16px] sm:leading-8',
          align === 'center' && 'mx-auto',
          invert ? 'text-[rgba(255,246,234,0.72)]' : 'text-[var(--sk-ink-soft)]'
        )}
      >
        {description}
      </p>
    </div>
  )
}
