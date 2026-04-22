import Link from 'next/link'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { SectionHeading } from '@/components/corporate/section-heading'
import { industryFocus, industryPlaybooks } from '@/lib/corporate-content'
import { corporateDisplay, corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export default function IndustriesPage() {
  return (
    <CorporateSiteShell activePath="/industries">
      <section className="relative overflow-hidden border-b border-slate-900/10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(255,186,90,0.22),transparent_52%),radial-gradient(circle_at_top_right,rgba(11,70,150,0.14),transparent_48%)]" />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <div>
              <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.34em] text-slate-500')}>
                Industry Focus
              </p>
              <h1
                className={cn(
                  corporateDisplay.className,
                  'mt-6 max-w-5xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl'
                )}
              >
                我们关心的不是抽象行业名词，而是每一种场景背后的运营结构
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
                园区、教育、医疗、酒店和工业服务空间看起来都在“做餐饮”，但它们面对的是完全不同的供给波动、服务纪律、
                用餐节奏与品牌要求。Star Kitchen 的价值，来自理解这种差异并把它变成可执行系统。
              </p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-900/10 bg-white/80 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
              <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.30em] text-slate-500')}>
                What changes by scenario
              </p>
              <div className="mt-8 space-y-4">
                {[
                  '高峰与平峰的落差幅度',
                  '品牌体验与功能性服务的占比',
                  '食安、留样与记录要求',
                  '产能组织和补货响应速度'
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-4 text-sm text-slate-700">
                    <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[#0d4f8f]" />
                    <span className="leading-7">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-6 py-16 sm:space-y-24 sm:py-20">
        <section>
          <SectionHeading
            eyebrow="Scenario Overview"
            title="五类核心场景，五套不同的运营重心"
            description="我们不是按行业名录去区分场景，而是按真实运营结构去理解供给压力、履约节奏与服务标准。"
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
            {industryFocus.map((industry) => {
              const Icon = industry.icon

              return (
                <div
                  key={industry.title}
                  className="rounded-[1.75rem] border border-slate-900/10 bg-[#fcfaf6] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0e6d5] text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{industry.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{industry.description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {industry.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Playbooks"
            title="场景不同，真正要设计的是供给逻辑、组织节奏与体验标准"
            description="下面这些 playbooks 更接近真实业务语言，帮助合作方更快判断供给逻辑、执行重点与组织节奏。"
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-2">
            {industryPlaybooks.map((playbook) => {
              const Icon = playbook.icon

              return (
                <div
                  key={playbook.title}
                  className="rounded-[2rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-7"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className={cn(corporateDisplay.className, 'text-2xl font-semibold text-slate-950')}>
                      {playbook.title}
                    </h3>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">{playbook.description}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {playbook.priorities.map((priority) => (
                      <span key={priority} className="rounded-full border border-slate-900/10 bg-[#fcfaf6] px-3 py-1 text-xs text-slate-500">
                        {priority}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-slate-900/10 bg-[#f0e6d5] p-5">
                    <p className="text-sm font-semibold text-slate-950">Star Kitchen 的应对方式</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{playbook.response}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-[#0d2347] px-6 py-14 text-white shadow-[0_30px_120px_rgba(8,20,43,0.28)] sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Next Step"
            title="如果你已经有明确场景，我们可以直接从场景出发讨论合作方式"
            description="从单一场景试点到区域化服务网络，我们都建议先把供给节奏、履约标准与组织边界对齐。"
            invert
          />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              联系合作团队
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/capabilities"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              查看能力架构
            </Link>
          </div>
        </section>
      </div>
    </CorporateSiteShell>
  )
}
