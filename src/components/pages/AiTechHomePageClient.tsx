import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  ChevronRight,
  FileText,
  LineChart,
  Megaphone,
  Package,
  ShieldCheck,
  UtensilsCrossed,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { AiTechSiteShell } from '@/components/ai-tech/site-shell'
import {
  AI_BRAND_NAME_EN,
  AI_BRAND_NAME_ZH,
  AI_BRAND_TAGLINE_EN,
} from '@/lib/brand'
import {
  aiTechArchitectureLayers,
  aiTechFocusAreas,
  aiTechHighlights,
  aiTechLoopSteps,
  aiTechModules,
  aiTechScenarios,
} from '@/lib/ai-tech-site-content'
import { AI_AGENT_CAPABILITY_LIBRARY, type AiAgentCapabilityId } from '@/lib/ai-agent-capabilities'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

const capabilityIconMap: Record<AiAgentCapabilityId, LucideIcon> = {
  contract_review: ShieldCheck,
  policy_generation: FileText,
  tender_generation: FileText,
  report_summary: LineChart,
  copywriting: Megaphone,
  product_generation: Package,
  menu_generation: UtensilsCrossed,
  audio_generation: Workflow,
  image_generation: BrainCircuit,
  video_generation: Bot,
  social_content: Megaphone,
  other: LineChart,
}

function AiSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className={corporateSans.className}>
      <div className="flex items-center gap-4">
        <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-white/56')}>{eyebrow}</p>
        <span className="h-px w-16 bg-[linear-gradient(90deg,rgba(26,151,218,0.56),rgba(255,212,0,0))]" />
      </div>
      <h2 className="mt-5 max-w-[15ch] text-[clamp(2rem,3vw,3rem)] font-semibold leading-[1.04] tracking-[-0.028em] text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-[42rem] text-[15px] leading-7 text-white/70 sm:text-[16px] sm:leading-8">
        {description}
      </p>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div className="mx-auto grid max-w-[88rem] gap-12 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <div className={corporateSans.className}>
          <div className="flex items-center gap-4">
            <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-white/58')}>
              {AI_BRAND_NAME_EN} · service ai company
            </p>
            <span className="h-px w-20 bg-[linear-gradient(90deg,rgba(234,0,22,0.62),rgba(255,212,0,0))]" />
          </div>

          <h1 className="mt-7 max-w-[11ch] text-[clamp(2.9rem,5vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white">
            为连锁服务业打造
            <span className="block text-[var(--sk-yellow)]">AI Operating System</span>
          </h1>

          <p className="mt-7 max-w-[36rem] text-[15px] leading-7 text-white/74 sm:text-[16px] sm:leading-8">
            {AI_BRAND_NAME_ZH} 不是一个聊天入口，而是一套面向餐饮、团餐、酒店、物业与服务零售的 AI 经营系统。
            它把经营洞察、智能体协作、审批工单、多模态生成与治理能力接进同一套执行链路。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#platform"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-blue)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              查看平台能力
              <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              预约演示
              <ChevronRight className="h-4 w-4 text-[var(--sk-green)]" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            {aiTechHighlights.map((item) => (
              <div key={item.label} className="min-w-[10rem]">
                <p className={cn(corporateMono.className, 'text-[9px] uppercase tracking-[0.2em] text-white/40')}>
                  {item.label}
                </p>
                <p className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em]" style={{ color: item.accent }}>
                  {item.value}
                </p>
                <p className="mt-1 text-[12px] leading-6 text-white/62">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-10 h-36 w-36 rounded-full bg-[rgba(234,0,22,0.18)] blur-3xl" />
          <div className="absolute right-8 top-4 h-32 w-32 rounded-full bg-[rgba(255,212,0,0.18)] blur-3xl" />
          <div className="absolute -right-6 bottom-12 h-44 w-44 rounded-full bg-[rgba(26,151,218,0.18)] blur-3xl" />

          <div className="overflow-hidden rounded-[2.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,22,40,0.94),rgba(9,16,31,0.96))] p-6 shadow-[0_30px_120px_rgba(1,8,20,0.45)] sm:p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-[var(--sk-yellow)]')}>
                  platform preview
                </p>
                <h2 className="mt-4 max-w-[14ch] text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.022em] text-white">
                  从异常识别，到动作派发，使用同一套 AI 经营语言。
                </h2>
              </div>
              <div className="rounded-[1.2rem] border border-white/12 bg-white/6 px-3 py-2 text-right">
                <p className="text-[11px] text-white/56">示意状态</p>
                <p className="mt-1 text-sm font-semibold text-[var(--sk-green)]">演示预览</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">经营信号</p>
                  <span className="rounded-full bg-[rgba(26,151,218,0.14)] px-3 py-1 text-[11px] text-[var(--sk-blue)]">
                    示意预览
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    ['人效偏离', '8 个门店节点等待区域跟进', 'var(--sk-red)'],
                    ['采购波动', '3 个区域出现成本波动预警', 'var(--sk-orange)'],
                    ['内容执行', '一批营销素材仍在待审批队列', 'var(--sk-green)'],
                  ].map(([label, detail, color]) => (
                    <div key={label} className="rounded-[1.2rem] border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">{label}</p>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <p className="mt-2 text-[12px] leading-6 text-white/60">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(26,151,218,0.16),rgba(26,151,218,0.05))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">智能体编排</p>
                    <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[11px] text-[var(--sk-yellow)]">
                      按任务调度
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['财务智能体', '利润敏感度与结构波动分析'],
                      ['营运智能体', '门店动作清单生成与派发'],
                      ['法务智能体', '合同条款比对与风险审阅'],
                      ['增长智能体', '营销文案与活动素材编排'],
                    ].map(([title, detail]) => (
                      <div key={title} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[13px] font-semibold text-white">{title}</p>
                        <p className="mt-2 text-[12px] leading-6 text-white/60">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">工作流状态</p>
                    <span className="rounded-full bg-[rgba(56,181,51,0.14)] px-3 py-1 text-[11px] text-[var(--sk-green)]">
                      人工在环
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      '识别经营波动与异常信号',
                      '生成建议动作与审批工单',
                      '派发到区域负责人完成确认',
                      '回写审计日志与执行结果',
                    ].map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-[1.1rem] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] text-white/72">
                          0{index + 1}
                        </span>
                        <p className="text-[13px] text-white/72">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section id="platform" className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[88rem]">
        <AiSectionHeading
          eyebrow="Platform"
          title="让 AI 从会回答，进入会经营、会协同、会执行。"
          description="StarKitchen AI 面向服务业组织，不只是提供模型调用，而是提供从信号到动作、从任务到治理的完整经营系统。"
        />

        <div className="mt-12 grid gap-5 xl:grid-cols-4">
          {aiTechModules.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_55px_rgba(0,0,0,0.18)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] text-white" style={{ backgroundColor: item.accent }}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className={cn(corporateMono.className, 'mt-5 text-[10px] uppercase tracking-[0.22em] text-white/48')}>
                  {item.eyebrow}
                </p>
                <h3 className="mt-3 text-[1.35rem] font-semibold leading-[1.14] tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-[14px] leading-7 text-white/68">{item.description}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {item.points.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] text-white/72"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ScenariosSection() {
  return (
    <section id="scenarios" className="border-y border-white/[0.08] bg-[rgba(4,10,18,0.46)] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[88rem]">
        <AiSectionHeading
          eyebrow="Service Scenarios"
          title="先对服务业有效，再谈 AI 的规模化。"
          description="这套系统不是泛用工具堆叠，而是围绕多门店、多角色、多工单、多模态内容与持续经营迭代构建。"
        />

        <div className="mt-12 grid gap-5 xl:grid-cols-2">
          {aiTechScenarios.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] text-white" style={{ backgroundColor: item.accent }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[1.35rem] font-semibold leading-[1.14] tracking-[-0.02em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-[34rem] text-[14px] leading-7 text-white/68">{item.description}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {item.outcomes.map((outcome) => (
                    <div key={outcome} className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.03] p-4">
                      <p className="text-[13px] leading-6 text-white/76">{outcome}</p>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
  const capabilitySpotlights = AI_AGENT_CAPABILITY_LIBRARY.slice(0, 8)

  return (
    <section id="capabilities" className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[88rem]">
        <AiSectionHeading
          eyebrow="Capability Matrix"
          title="从经营分析到多模态生成，服务业所需能力放在同一张产品版图里。"
          description="我们不是只做一个 AI 聊天框，而是为服务型组织提供成体系的能力包、模型路由与执行入口。"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {capabilitySpotlights.map((capability) => {
            const Icon = capabilityIconMap[capability.id]

            return (
              <article
                key={capability.id}
                className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[rgba(26,151,218,0.16)] text-[var(--sk-blue)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/60">
                    {capability.recommendedRoute}
                  </span>
                </div>
                <h3 className="mt-5 text-[1.1rem] font-semibold leading-[1.16] text-white">{capability.title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-white/66">{capability.description}</p>
                <p className="mt-4 text-[12px] text-[var(--sk-yellow)]">{capability.recommendedProvider} · {capability.recommendedModel}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 sm:p-7">
            <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-white/54')}>
              operating loop
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {aiTechLoopSteps.map((item) => (
                <div key={item.step} className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="text-[12px] font-semibold text-[var(--sk-yellow)]">{item.step}</p>
                  <p className="mt-3 text-[1rem] font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-[13px] leading-6 text-white/64">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,43,73,0.7),rgba(6,20,38,0.82))] p-6 sm:p-7">
            <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-[var(--sk-yellow)]')}>
              what teams gain
            </p>
            <div className="mt-6 space-y-4">
              {[
                '总部获得更快的经营摘要与可执行建议，而不是滞后的报表堆积。',
                '区域团队拥有更清晰的优先级、任务状态与跨部门协同上下文。',
                '门店与现场团队可以在审批与治理边界内得到更具体的动作支持。',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[var(--sk-green)]" />
                  <p className="text-[13px] leading-6 text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ArchitectureSection() {
  return (
    <section id="architecture" className="border-y border-white/[0.08] bg-[rgba(4,10,18,0.5)] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-[88rem]">
        <AiSectionHeading
          eyebrow="Architecture & Governance"
          title="真正能进企业现场的 AI，需要架构、权限与治理一起成立。"
          description="尤其在多门店、多角色、多系统的服务业环境里，AI 的价值不只来自模型能力，更来自路由、治理、审计与集成能力。"
        />

        <div className="mt-12 grid gap-5 xl:grid-cols-4">
          {aiTechArchitectureLayers.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] text-white" style={{ backgroundColor: item.accent }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-[1.15rem] font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-white/66">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          {aiTechFocusAreas.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] text-white" style={{ backgroundColor: item.accent }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[1rem] font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-4 text-[13px] leading-6 text-white/66">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" className="px-6 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[88rem] gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 sm:p-10">
          <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-[var(--sk-yellow)]')}>
            contact
          </p>
          <h2 className="mt-5 max-w-[15ch] text-[clamp(2rem,3vw,3rem)] font-semibold leading-[1.04] tracking-[-0.028em] text-white">
            让服务业 AI 从展示概念，进入可治理、可执行、可落地的运营系统。
          </h2>
          <p className="mt-5 max-w-[40rem] text-[15px] leading-7 text-white/72 sm:text-[16px] sm:leading-8">
            如果你正在为连锁餐饮、团餐、酒店、物业或服务零售寻找下一代运营底座，我们可以从真实场景、数据接入、治理要求和试点路径开始对齐。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-blue)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              联系合作团队
              <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
            </Link>
            <Link
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              查看能力矩阵
            </Link>
          </div>
        </div>

        <div className="rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,33,61,0.82),rgba(6,17,33,0.9))] p-8 sm:p-10">
          <p className={cn(corporateMono.className, 'text-[10px] uppercase tracking-[0.22em] text-[var(--sk-orange)]')}>
            engagement focus
          </p>
          <div className="mt-6 space-y-4">
            {[
              '从单一场景试点开始，把门店、区域或总部的关键问题放进同一套 AI 运营语境。',
              '与现有 OA、财务、供应链、内容与经营看板协同，而不是替换全部系统。',
              '先建立权限、审计、版本与工作流治理，再逐步扩大到更复杂的组织网络。',
            ].map((item) => (
              <div key={item} className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[13px] leading-6 text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AiTechHomePageClient() {
  return (
    <AiTechSiteShell>
      <HeroSection />
      <PlatformSection />
      <ScenariosSection />
      <CapabilitiesSection />
      <ArchitectureSection />
      <ContactSection />
    </AiTechSiteShell>
  )
}
