import { aiTechArchitectureLayers, aiTechFocusAreas } from '@/lib/ai-tech-site-content'
import { AiSectionHeading } from './shared'

export function ArchitectureSection() {
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
