import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CompanyLogo } from '@/components/company-logo'
import { corporateContactEmail, corporateNavItems } from '@/lib/corporate-content'
import { COMPANY_NAME_ZH_LEGAL, COMPANY_SHORT_NAME_EN } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface CorporateSiteShellProps {
  activePath: string
  children: React.ReactNode
}

function isActivePath(activePath: string, href: string) {
  if (href === '/') {
    return activePath === '/'
  }

  return activePath.startsWith(href)
}

export function CorporateSiteShell({ activePath, children }: CorporateSiteShellProps) {
  return (
    <main className="sk-corporate-shell min-h-screen text-[var(--sk-ink)]">
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-[88rem] rounded-full border border-[rgba(62,59,64,0.08)] bg-[rgba(255,255,255,0.78)] px-5 py-3 shadow-[0_18px_55px_rgba(30,32,37,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-full border border-[rgba(62,59,64,0.08)] bg-white/90 p-1 shadow-[0_10px_30px_rgba(30,32,37,0.06)]">
                <CompanyLogo
                  showText
                  compact
                  className="text-[var(--sk-ink)]"
                  iconClassName="h-10 w-10 rounded-full bg-white p-0.5 shadow-none"
                  textClassName="text-[var(--sk-ink)]"
                  subtextClassName="text-[rgba(23,28,25,0.52)] opacity-100"
                />
              </div>
            </Link>

            <nav className="hidden items-center gap-1 xl:flex">
              {corporateNavItems.map((item) => {
                const active = isActivePath(activePath, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm transition-colors',
                      active
                        ? 'bg-[var(--sk-action)] text-white shadow-[0_10px_30px_rgba(26,151,218,0.22)] ring-1 ring-[rgba(255,212,0,0.24)]'
                        : 'text-[rgba(23,28,25,0.68)] hover:bg-white/70 hover:text-[var(--sk-ink)]'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login/"
                className="hidden rounded-full border border-[rgba(23,28,25,0.1)] bg-white/45 px-4 py-2 text-sm text-[rgba(23,28,25,0.74)] transition-colors hover:border-[rgba(23,28,25,0.18)] hover:bg-white/70 hover:text-[var(--sk-ink)] sm:inline-flex"
              >
                进入管理平台
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-action)] px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                联系 SK Group
                <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="mt-24 bg-[var(--sk-deep)] px-6 py-14 text-[#f7f7f5]">
        <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <CompanyLogo
              showText
              className="text-white"
              iconClassName="h-12 w-12 rounded-full bg-white p-0.5 shadow-none"
              textClassName="text-white"
              subtextClassName="text-[rgba(255,255,255,0.62)] opacity-100"
            />
            <p className="max-w-2xl text-sm leading-7 text-[rgba(255,255,255,0.72)]">
              {COMPANY_NAME_ZH_LEGAL} 对外简称星厨集团 {COMPANY_SHORT_NAME_EN}。我们以环球美味与邻里温度为品牌主张，把国际标准、服务美学与数智能力放进同一套餐饮服务集团语言里。
            </p>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em]">
              <span className="text-[var(--sk-red)]">Global Flavors, Local Hearts!</span>
              <span className="text-[var(--sk-orange)]">Star Kitchen Hospitality Group</span>
              <span className="text-[var(--sk-yellow)]">Global Standards, Smart Solutions!</span>
              <span className="text-[var(--sk-green)]">Dining. Service. Supply.</span>
              <span className="text-[var(--sk-blue)]">AI-enabled execution</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-white/5 px-5 py-3 text-sm text-white transition-colors hover:bg-white/10"
              >
                发起商务沟通
                <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
              </Link>
              <Link
                href="/login/"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] px-5 py-3 text-sm text-[rgba(255,255,255,0.74)] transition-colors hover:bg-white/5"
              >
                管理平台入口
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sk-orange)]">Navigate</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[rgba(255,255,255,0.76)]">
                {corporateNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sk-blue)]">Contact</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[rgba(255,255,255,0.76)]">
                <a href={`mailto:${corporateContactEmail}`} className="transition-colors hover:text-white">
                  {corporateContactEmail}
                </a>
                <span>Star Kitchen Hospitality Group / SK Group</span>
                <span>© 2026 Star Kitchen Hospitality Group.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
