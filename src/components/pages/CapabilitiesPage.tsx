import Link from 'next/link'
import { ArrowRight, BadgeCheck, Bot, LineChart } from 'lucide-react'
import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { SectionHeading } from '@/components/corporate/section-heading'
import { aiLoopSteps, capabilityPillars, serviceLayers } from '@/lib/corporate-content'
import { corporateDisplay, corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export default function CapabilitiesPage() {
  return (
    <CorporateSiteShell activePath="/capabilities">
      <section className="relative overflow-hidden border-b border-slate-900/10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(255,186,90,0.22),transparent_52%),radial-gradient(circle_at_top_right,rgba(11,70,150,0.14),transparent_48%)]" />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <div>
              <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.34em] text-slate-500')}>
                Capabilities
              </p>
              <h1
                className={cn(
                  corporateDisplay.className,
                  'mt-6 max-w-5xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl'
                )}
              >
                真正的集团能力，不是某一项做得好，而是每一层都能接住复杂运营
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
                Star Kitchen 的核心能力，不是单纯的菜品研发，也不是单纯的数字化平台，而是一套贯穿品牌、供应、
                现场、人效和 AI 管理中枢的系统模型。
              </p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-900/10 bg-white/80 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
              <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.30em] text-slate-500')}>
                What clients buy
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  '更稳定的服务质量',
                  '更清楚的经营判断',
                  '更可复制的组织能力',
                  '更适合长期扩张的系统底座'
                ].map((item) => (
                  <div key={item} className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-4 text-sm font-medium text-slate-800">
                    {item}
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
            eyebrow="Capability Pillars"
            title="四大能力支柱，共同定义服务集团的执行半径"
            description="这四层不是平行模块，而是从战略到底层运营互相承接的关系。"
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-2">
            {capabilityPillars.map((pillar) => {
              const Icon = pillar.icon

              return (
                <div
                  key={pillar.title}
                  className="rounded-[2rem] border border-slate-900/10 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                      capability pillar
                    </span>
                  </div>

                  <h3 className={cn(corporateDisplay.className, 'mt-6 text-2xl font-semibold text-slate-950')}>
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.description}</p>

                  <div className="mt-6 space-y-3">
                    {pillar.points.map((point) => (
                      <div key={point} className="flex items-center gap-3 text-sm text-slate-700">
                        <BadgeCheck className="h-4 w-4 flex-none text-[#0d4f8f]" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-10 xl:grid-cols-[0.94fr_1.06fr] xl:items-start">
          <div className="rounded-[2.25rem] bg-[#f0e6d5] p-8 sm:p-10">
            <SectionHeading
              eyebrow="Service Architecture"
              title="把品牌、供应、现场和数据重新对齐"
              description="许多组织并不是没有工具，而是不同层级使用不同语言。我们要做的是把这些层重新接起来。"
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
              Operating outputs
            </p>
            <h3 className={cn(corporateDisplay.className, 'mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl')}>
              能力最后要落到真实产出，而不是停留在概念层
            </h3>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: '菜单与体验更新',
                  description: '让品牌策略、顾客结构和就餐动线落到真实菜单、空间和服务动作。'
                },
                {
                  title: '食安与运营纪律',
                  description: '把巡检、留样、培训和现场责任链前置到日常，而不是事后补救。'
                },
                {
                  title: '采购与损耗治理',
                  description: '围绕供给稳定性与成本弹性，建立更清晰的采购、补货和损耗控制逻辑。'
                },
                {
                  title: '管理层 AI 驾驶舱',
                  description: '把报表、预警、任务和复盘接成同一张管理地图，让决策可以持续演进。'
                }
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-5">
                  <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-[#0d2347] px-6 py-16 text-white sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="AI Operating Layer"
            title="AI 不只是看板，而是经营动作层"
            description="我们更关心 AI 是否帮助总部、区域和现场形成闭环，而不是把数据做成另一个更炫的展示页。"
            invert
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-3">
            {aiLoopSteps.map((step) => (
              <div key={step.step} className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-6">
                <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.30em] text-cyan-100/70')}>
                  step {step.step}
                </p>
                <h3 className={cn(corporateDisplay.className, 'mt-4 text-2xl font-semibold text-white')}>
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.28em] text-cyan-100/70')}>
                    management cockpit
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">把总部、区域、现场拉到同一套决策语言</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  '把风险、机会和优先级做成同一张经营地图',
                  '让营运、财务、人效和供应链共享判断上下文',
                  '把建议推进为任务、复盘和责任分配',
                  '为未来的 AI 产品站保留清晰技术叙事入口'
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                    <BadgeCheck className="mt-1 h-4 w-4 flex-none text-cyan-200" />
                    <span className="leading-7">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#081935] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
                  <LineChart className="h-6 w-6" />
                </div>
                <p className="text-xl font-semibold text-white">系统能力，就是利润能力</p>
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-300">
                当服务行业进入薄利时代，真正拉开差距的不是单个能人，而是组织是否拥有持续发现问题、排序问题和纠正问题的能力。
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  { label: '总部视角', detail: '更快识别利润结构与跨区域波动' },
                  { label: '区域视角', detail: '把巡店、整改和供给协同拉回同一节奏' },
                  { label: '现场视角', detail: '让 SOP、巡检和班次安排真正服务经营结果' }
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            联系合作团队
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-900/20 hover:bg-white"
          >
            回看行业场景
          </Link>
        </section>
      </div>
    </CorporateSiteShell>
  )
}
