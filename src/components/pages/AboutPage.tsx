import Link from 'next/link'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { SectionHeading } from '@/components/corporate/section-heading'
import { CompanyLogo } from '@/components/company-logo'
import {
  brandDifferentiators,
  brandFoundations,
  brandIntroduction,
  brandPositioning,
  brandStarsPrinciples,
  brandValues,
  capabilityPillars,
  commitmentCards,
  operatingPrinciples,
  serviceLayers,
} from '@/lib/corporate-content'
import { corporateDisplay, corporateMono } from '@/lib/corporate-fonts'
import { COMPANY_NAME_EN, COMPANY_NAME_ZH_LEGAL, COMPANY_SHORT_NAME_EN } from '@/lib/brand'
import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <CorporateSiteShell activePath="/about">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(196,128,74,0.2),transparent_48%),radial-gradient(circle_at_top_right,rgba(31,49,45,0.12),transparent_44%)]" />
        <div className="mx-auto max-w-[88rem] px-6 pb-20 pt-14 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 xl:grid-cols-[1.04fr_0.96fr] xl:items-center">
            <div>
              <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[rgba(23,28,25,0.52)]')}>
                About {COMPANY_SHORT_NAME_EN}
              </p>
              <h1
                className={cn(
                  corporateDisplay.className,
                  'mt-6 max-w-5xl text-5xl font-semibold tracking-[-0.04em] text-[var(--sk-ink)] sm:text-6xl'
                )}
              >
                星厨集团想成为一家既有国际标准，也有人情温度的现代餐饮服务集团
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--sk-ink-soft)] sm:text-xl">
                {brandIntroduction}
              </p>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(23,28,25,0.68)]">
                {brandPositioning}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/capabilities"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f312d] px-6 py-3 text-sm font-semibold text-[#fff8ef] transition-transform hover:-translate-y-0.5"
                >
                  查看核心能力
                  <ArrowRight className="h-4 w-4 text-[#d8c3a4]" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.1)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:border-[rgba(23,28,25,0.18)] hover:bg-white"
                >
                  联系合作团队
                </Link>
              </div>
            </div>

            <div className="sk-corp-panel-dark relative overflow-hidden rounded-[2.5rem] p-7 text-white sm:p-8">
              <div className="absolute right-6 top-6">
                <CompanyLogo variant="mark" iconClassName="h-12 w-12 rounded-full bg-white p-0.5 shadow-none" />
              </div>
              <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[#d8c3a4]')}>
                Group identity
              </p>
              <h2 className={cn(corporateDisplay.className, 'mt-5 text-3xl font-semibold sm:text-4xl')}>
                {COMPANY_NAME_ZH_LEGAL}
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  `对外简称星厨集团 ${COMPANY_SHORT_NAME_EN}，英文名 ${COMPANY_NAME_EN}`,
                  'Global Flavors, Local Hearts! 环球美味，邻里共享。',
                  'Global Standards, Smart Solutions! 国际标准，数智未来。'
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-sm text-[rgba(255,246,234,0.82)]">
                    <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#d8c3a4]" />
                    <span className="leading-7">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[88rem] space-y-20 px-6 py-16 sm:space-y-24 sm:py-20">
        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="sk-corp-panel-soft rounded-[2.4rem] p-8 sm:p-10">
            <SectionHeading
              eyebrow="Mission, Vision, Values"
              title="使命、愿景与价值观，不只是介绍页上的词，而是星厨集团的经营取向"
              description="我们希望每个页面都让人感受到安全、创新、卓越、敏捷、真诚、共赢这些价值观，而不只是把它们列在墙上。"
            />

            <div className="mt-10 grid gap-4">
              {brandFoundations.map((item) => (
                <div key={item.label} className="sk-corp-panel rounded-[1.7rem] p-5">
                  <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(23,28,25,0.46)]')}>
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--sk-ink)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[rgba(23,28,25,0.72)]">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {brandValues.map((value) => (
                <span key={value} className="sk-corp-chip rounded-full px-4 py-2 text-sm">
                  {value}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {brandDifferentiators.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="sk-corp-panel rounded-[2rem] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#1f312d] text-[#fff8ef]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={cn(corporateDisplay.className, 'mt-6 text-[2rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[var(--sk-ink)]')}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[rgba(23,28,25,0.72)]">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Operating Principles"
            title="我们希望把成熟服务集团的纪律，和新一代系统能力结合起来"
            description="这不是一套品牌包装语言，而是关于公司如何做判断、如何组织现场、如何持续复盘的根本方法。"
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {operatingPrinciples.map((principle) => {
              const Icon = principle.icon

              return (
                <div
                  key={principle.title}
                  className="rounded-[1.9rem] border border-slate-900/10 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className={cn(corporateDisplay.className, 'mt-6 text-2xl font-semibold text-slate-950')}>
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{principle.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="sk-corp-panel rounded-[2.5rem] px-6 py-14 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="STARS Declaration"
            title="STARS 品牌宣言，是星厨集团对消费者、客户与合作伙伴的五重承诺"
            description="Safe、Tasty、Attentive、Reliable、Smart，这不是营销修辞，而是我们希望在每一份餐食与每一次交付里留下的感受。"
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-5">
            {brandStarsPrinciples.map((item, index) => {
              const Icon = item.icon

              return (
                <div
                  key={`${item.letter}-${item.english}`}
                  className={cn(
                    'rounded-[1.9rem] border border-[rgba(23,28,25,0.08)] bg-white/80 p-6 shadow-[0_18px_50px_rgba(41,36,29,0.06)]',
                    index % 2 === 1 ? 'xl:translate-y-6' : ''
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={cn(corporateDisplay.className, 'text-5xl font-semibold leading-none tracking-[-0.06em] text-[#9b5d33]')}>
                      {item.letter}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#1f312d] text-[#fff8ef]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-lg font-semibold text-[var(--sk-ink)]">{item.english}</p>
                  <p className="mt-2 text-sm font-medium text-[#9b5d33]">{item.chinese}</p>
                  <p className="mt-4 text-sm leading-7 text-[rgba(23,28,25,0.72)]">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-10 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.25rem] bg-[#f0e6d5] p-8 sm:p-10">
            <SectionHeading
              eyebrow="Group Model"
              title="集团模型不是单一业务线，而是四层能力一起成立"
              description="一家公司如果只擅长菜单或只擅长技术，很难真正服务复杂场景。Star Kitchen 试图同时把这几层能力搭起来。"
            />

            <div className="mt-10 space-y-4">
              {serviceLayers.map((layer) => {
                const Icon = layer.icon

                return (
                  <div key={layer.title} className="rounded-[1.5rem] border border-slate-900/10 bg-white/80 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{layer.title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{layer.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-slate-900/10 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-10">
            <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.32em] text-slate-500')}>
              Capability outline
            </p>
            <h3 className={cn(corporateDisplay.className, 'mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl')}>
              从餐饮现场到管理中枢，能力要能一层一层接得住
            </h3>

            <div className="mt-8 grid gap-4">
              {capabilityPillars.map((pillar) => (
                <div key={pillar.title} className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-5">
                  <p className="text-lg font-semibold text-slate-950">{pillar.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{pillar.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pillar.points.map((point) => (
                      <span key={point} className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs text-slate-500">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Brand Commitments"
            title="品牌长期资产，最终还是由这些更难但更真实的承诺构成"
            description="真正让一家服务集团建立品牌资产的，从来不是一句口号，而是质量、纪律、可持续性与组织学习能力。"
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {commitmentCards.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="rounded-[1.75rem] border border-slate-900/10 bg-[#fcfaf6] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </CorporateSiteShell>
  )
}
