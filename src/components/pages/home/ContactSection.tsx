import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'

export function ContactSection() {
  return (
    <section className="sk-corp-panel-dark rounded-[2.7rem] px-6 py-14 text-[#fff8ef] sm:px-8 lg:px-12">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
        <div>
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>Contact & collaboration</p>
          <h2 className="mt-5 max-w-[16ch] text-[clamp(1.9rem,2.7vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#fffaf1]">
            从第一轮沟通开始，就把场景、目标与合作方式说清楚。
          </h2>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[rgba(255,246,234,0.72)]">
            无论你关注的是集团餐饮服务、中央厨房与供应协同，还是 AI 经营系统与组织升级，我们都希望先围绕真实业务场景展开对话。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--sk-deep)] transition-transform hover:-translate-y-0.5"
            >
              联系合作团队
              <ArrowRight className="h-4 w-4 text-[var(--sk-action)]" />
            </Link>
            <Link
              href="/capabilities"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,195,164,0.16)] bg-white/5 px-6 py-3 text-sm font-semibold text-[#fff8ef] transition-colors hover:bg-white/10"
            >
              查看核心能力
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              title: '集团餐饮服务合作',
              description: '适合企业园区、教育、医疗、酒店与工业服务网络的餐饮服务合作讨论。'
            },
            {
              title: '中央厨房与供应协同',
              description: '适合围绕生产组织、履约稳定性、采购协同与成本纪律展开专项咨询。'
            },
            {
              title: 'AI 经营系统与试点',
              description: '适合希望把经营分析、任务闭环、智能体协作与治理能力接进服务网络的团队。'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-[1.7rem] border border-[rgba(216,195,164,0.14)] bg-white/[0.04] p-5">
              <p className="text-[15px] font-semibold text-[#fff8ef]">{item.title}</p>
              <p className="mt-3 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
