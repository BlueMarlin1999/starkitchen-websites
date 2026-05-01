import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function ContactSection() {
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
