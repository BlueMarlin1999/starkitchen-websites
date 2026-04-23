import { BadgeCheck, Bot } from 'lucide-react'
import { SectionHeading } from '@/components/corporate/section-heading'
import { aiLoopSteps } from '@/lib/corporate-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function AiLayerSection() {
  return (
    <section className="sk-corp-panel-dark rounded-[2.7rem] px-6 py-16 text-[#fff9ef] sm:px-8 lg:px-12">
      <SectionHeading
        eyebrow="AI Operating Layer"
        title="AI 进入经营动作层"
        description="我们不想把数据做成炫目的大屏，而是让系统持续感知经营波动、做出判断，并推动总部、区域和现场团队形成闭环。"
        invert
      />

      <div className="mt-12 grid gap-5 xl:grid-cols-3">
        {aiLoopSteps.map((step) => (
          <div key={step.step} className="rounded-[1.85rem] border border-[rgba(216,195,164,0.14)] bg-white/[0.04] p-6">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>step {step.step}</p>
            <h3 className={cn(corporateSans.className, 'mt-4 text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[#fffaf1]')}>
              {step.title}
            </h3>
            <p className="mt-3 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[2rem] border border-[rgba(216,195,164,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[rgba(255,255,255,0.12)] bg-white/10 text-[var(--sk-yellow)]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
                management cockpit
              </p>
              <p className="mt-2 text-[1.1rem] font-semibold leading-7 text-[#fff8ef]">把总部、区域与现场带回同一套决策语境</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              '把风险、机会和优先级做成同一张经营地图',
              '让营运、财务、人效和供应链共享判断上下文',
              '把建议推进为任务、会议、复盘与责任分配',
              '把品牌、运营与智能系统放进同一套组织底座'
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-[1.45rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-4 text-[13px] text-[rgba(255,246,234,0.74)]">
                <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[var(--sk-yellow)]" />
                <span className="leading-6">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-6 sm:p-8">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-blue)]')}>
            why now
          </p>
          <h3 className="mt-4 max-w-[14ch] text-[clamp(1.75rem,2.2vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.018em] text-[#fffaf1]">
            当服务行业进入薄利时代，系统能力就是利润能力。
          </h3>
          <p className="mt-4 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">
            竞争不再只取决于选址、采购或厨师团队，而取决于能否把复杂运营持续做对。AI 不替代服务本身，但会放大优秀组织的反应速度、执行深度与复盘能力。
          </p>

          <div className="mt-8 grid gap-4">
            {[
              { label: '总部视角', detail: '更快识别利润结构与跨区域波动。' },
              { label: '区域视角', detail: '把巡店、整改和供给协同拉回同一节奏。' },
              { label: '现场视角', detail: '让 SOP、巡检和班次安排真正服务经营结果。' }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.45rem] border border-[rgba(216,195,164,0.12)] bg-white/[0.04] p-4">
                <p className="text-[13px] font-semibold text-[#fff8ef]">{item.label}</p>
                <p className="mt-2 text-[13px] leading-6 text-[rgba(255,246,234,0.7)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
