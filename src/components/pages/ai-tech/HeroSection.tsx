import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { AI_BRAND_NAME_EN, AI_BRAND_NAME_ZH } from '@/lib/brand'
import { aiTechHighlights } from '@/lib/ai-tech-site-content'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function HeroSection() {
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
