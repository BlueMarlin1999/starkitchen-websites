import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { SectionHeading } from '@/components/corporate/section-heading'
import { contactChannels, corporateContactEmail, engagementSteps } from '@/lib/corporate-content'
import { corporateDisplay, corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export default function ContactPage() {
  return (
    <CorporateSiteShell activePath="/contact">
      <section className="relative overflow-hidden border-b border-slate-900/10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(255,186,90,0.22),transparent_52%),radial-gradient(circle_at_top_right,rgba(11,70,150,0.14),transparent_48%)]" />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <div>
              <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.34em] text-slate-500')}>
                Contact
              </p>
              <h1
                className={cn(
                  corporateDisplay.className,
                  'mt-6 max-w-5xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl'
                )}
              >
                从第一次沟通开始，就把业务场景、服务边界和系统方向说清楚
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
                这一版官网先使用现有联系入口承接商务与品牌沟通。后续如果你愿意，我们可以再加正式表单、团队介绍、商务资料下载和案例预约模块。
              </p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-900/10 bg-white/80 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.30em] text-slate-500')}>
                    primary contact
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{corporateContactEmail}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                适合先发起商务、合作与品牌沟通。我们先用一个统一入口收敛信息，再根据主题转给相应团队。
              </p>
              <a
                href={`mailto:${corporateContactEmail}?subject=Star%20Kitchen%20Inquiry`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                发送邮件
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-6 py-16 sm:space-y-24 sm:py-20">
        <section>
          <SectionHeading
            eyebrow="Contact Routes"
            title="根据你的目标，先从最接近的问题开始"
            description="这几个入口的作用不是制造更多表单，而是帮助合作方更快把需求对到正确的能力线上。"
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-2">
            {contactChannels.map((channel) => {
              const Icon = channel.icon

              return (
                <div
                  key={channel.title}
                  className="rounded-[2rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-7"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className={cn(corporateDisplay.className, 'text-2xl font-semibold text-slate-950')}>
                      {channel.title}
                    </h3>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">{channel.description}</p>

                  <a
                    href={channel.href}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-[#fcfaf6] px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-900/20 hover:bg-white"
                  >
                    {channel.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-10 xl:grid-cols-[0.94fr_1.06fr] xl:items-start">
          <div className="rounded-[2.25rem] bg-[#f0e6d5] p-8 sm:p-10">
            <SectionHeading
              eyebrow="Engagement Flow"
              title="一段更有效的合作沟通，通常从共同定义问题开始"
              description="无论是集团合作、单场景项目，还是 AI 经营系统交流，我们都希望先把目标与现实边界对齐。"
            />

            <div className="mt-10 space-y-4">
              {engagementSteps.map((step) => (
                <div key={step.step} className="rounded-[1.5rem] border border-slate-900/10 bg-white/80 p-5">
                  <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.28em] text-slate-500')}>
                    step {step.step}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-slate-900/10 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-10">
            <p className={cn(corporateMono.className, 'text-xs uppercase tracking-[0.32em] text-slate-500')}>
              Brand architecture
            </p>
            <h3 className={cn(corporateDisplay.className, 'mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl')}>
              `starkitchen.ai` 与 `starkitchenai.com` 应该各自承担不同任务
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              公司官网负责建立信任、行业理解与服务能力认知；AI 技术站负责讲产品、Agent、数据底座与技术演进。这样品牌层次会更清楚，也更容易对外沟通。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-5">
                <p className="text-lg font-semibold text-slate-950">starkitchen.ai</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  面向客户、合作伙伴和品牌沟通的公司官网，强调集团能力、行业理解和服务方法。
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf6] p-5">
                <p className="text-lg font-semibold text-slate-950">starkitchenai.com</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  面向连锁服务业数字化升级的 AI 技术官网，强调系统架构、产品矩阵与智能运营能力。
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                回看公司定位
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/capabilities"
                className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-900/20"
              >
                查看核心能力
              </Link>
            </div>
          </div>
        </section>
      </div>
    </CorporateSiteShell>
  )
}
