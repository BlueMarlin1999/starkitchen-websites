import { aiTechScenarios } from '@/lib/ai-tech-site-content'
import { AiSectionHeading } from './shared'

export function ScenariosSection() {
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
