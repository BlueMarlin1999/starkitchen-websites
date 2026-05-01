import { corporateMono } from '@/lib/corporate-fonts'
import { aiTechModules } from '@/lib/ai-tech-site-content'
import { cn } from '@/lib/utils'
import { AiSectionHeading } from './shared'

export function PlatformSection() {
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
