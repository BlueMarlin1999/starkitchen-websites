import { BadgeCheck } from 'lucide-react'
import { AI_AGENT_CAPABILITY_LIBRARY } from '@/lib/ai-agent-capabilities'
import { aiTechLoopSteps } from '@/lib/ai-tech-site-content'
import { corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'
import { AiSectionHeading, capabilityIconMap } from './shared'

export function CapabilitiesSection() {
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
