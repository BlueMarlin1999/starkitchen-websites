import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CompanyLogo } from '@/components/company-logo'
import { AI_BRAND_NAME_EN, AI_BRAND_NAME_ZH, AI_BRAND_TAGLINE_EN } from '@/lib/brand'
import { aiTechNavItems } from '@/lib/ai-tech-site-content'
import { cn } from '@/lib/utils'

interface AiTechSiteShellProps {
  children: React.ReactNode
}

export function AiTechSiteShell({ children }: AiTechSiteShellProps) {
  return (
    <main className="min-h-screen bg-[#07101d] text-white [background-image:radial-gradient(circle_at_12%_10%,rgba(234,0,22,0.18),transparent_18%),radial-gradient(circle_at_88%_12%,rgba(246,138,0,0.18),transparent_18%),radial-gradient(circle_at_82%_76%,rgba(26,151,218,0.18),transparent_20%),radial-gradient(circle_at_18%_82%,rgba(56,181,51,0.16),transparent_20%),linear-gradient(180deg,#07101d_0%,#09182a_54%,#0c1f31_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,16,29,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <CompanyLogo variant="mark" iconClassName="h-11 w-11 rounded-full bg-white p-0.5 shadow-none" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{AI_BRAND_NAME_ZH}</p>
              <p className="truncate text-xs text-white/62">{AI_BRAND_NAME_EN} · {AI_BRAND_TAGLINE_EN}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {aiTechNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ai"
              className="hidden rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/76 transition-colors hover:bg-white/10 sm:inline-flex"
            >
              查看现有 AI 中心
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-blue)] px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              预约演示
              <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="border-t border-white/10 bg-[rgba(5,12,22,0.92)] px-6 py-12">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CompanyLogo variant="mark" iconClassName="h-11 w-11 rounded-full bg-white p-0.5 shadow-none" />
              <div>
                <p className="text-sm font-semibold text-white">{AI_BRAND_NAME_ZH}</p>
                <p className="text-xs text-white/62">{AI_BRAND_NAME_EN}</p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/68">
              为连锁服务业构建 AI Operating System，把经营洞察、任务协同、审批工单、多模态能力与可审计治理整合到同一平台。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-white/64">
            <span className="text-[var(--sk-red)]">Service Chains</span>
            <span className="text-[var(--sk-orange)]">AI Agents</span>
            <span className="text-[var(--sk-yellow)]">Workflow Automation</span>
            <span className="text-[var(--sk-green)]">Governed Execution</span>
            <span className="text-[var(--sk-blue)]">StarKitchen AI</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
