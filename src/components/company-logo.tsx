import Image from 'next/image'
import { cn } from '@/lib/utils'
import { COMPANY_NAME_EN, COMPANY_NAME_ZH } from '@/lib/brand'

interface CompanyLogoProps {
  className?: string
  iconClassName?: string
  logoClassName?: string
  textClassName?: string
  subtextClassName?: string
  variant?: 'mark' | 'full'
  showText?: boolean
  compact?: boolean
}

export function CompanyLogo({
  className,
  iconClassName,
  logoClassName,
  textClassName,
  subtextClassName,
  variant = 'mark',
  showText = false,
  compact = false,
}: CompanyLogoProps) {
  if (variant === 'full') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Image
          src="/brand/star-kitchen-logo.jpg"
          alt={COMPANY_NAME_ZH}
          width={1280}
          height={1707}
          className={cn('h-24 w-auto max-w-full object-contain', logoClassName)}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 p-0.5 shadow-lg shadow-black/20',
          iconClassName
        )}
      >
        <Image
          src="/brand/star-kitchen-logo.jpg"
          alt={COMPANY_NAME_ZH}
          width={1280}
          height={1707}
          className="h-full w-full rounded-md object-contain object-center"
        />
      </div>

      {showText && (
        <div className={cn('min-w-0 leading-tight text-inherit', textClassName)}>
          <p className="truncate text-sm font-semibold">{COMPANY_NAME_ZH}</p>
          <p className={cn('truncate text-xs opacity-70', compact && 'hidden', subtextClassName)}>{COMPANY_NAME_EN}</p>
        </div>
      )}
    </div>
  )
}
