import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/corporate/section-heading'
import { serviceLayers } from '@/lib/corporate-content'
import { corporateMono } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'
import { capabilityMoments } from './shared'

export function CapabilitiesSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="sk-corp-panel-soft rounded-[2.4rem] p-8 sm:p-10">
          <SectionHeading
            eyebrow="Service Architecture"
            title="让品牌、供应、现场与数据协同运转"
            description="餐饮组织的问题通常不是缺一个工具，而是不同层级在说不同语言。我们要做的是把这些层重新接起来。"
          />

          <div className="mt-10 space-y-4">
            {serviceLayers.map((layer, index) => {
              const Icon = layer.icon

              return (
                <div key={layer.title} className="sk-corp-panel rounded-[1.6rem] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--sk-action)] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-semibold text-[var(--sk-ink)]">{layer.title}</p>
                        <span className={cn(corporateMono.className, 'text-[11px] text-[rgba(23,28,25,0.38)]')}>
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)] sm:text-[14px] sm:leading-7">{layer.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sk-corp-panel-dark rounded-[2.4rem] p-8 text-[#fff9ef] sm:p-10">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
            Operating outputs
          </p>
          <h3 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,2.5vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#fffaf1]">
            客户真正购买的，是稳定、清晰和可以复制的组织能力。
          </h3>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {capabilityMoments.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-[1.6rem] border border-[rgba(216,195,164,0.14)]"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.asset.src}
                    alt={item.asset.alt}
                    fill
                    sizes="(min-width: 1280px) 18rem, (min-width: 768px) 24vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,13,12,0.06),rgba(10,13,12,0.24)_48%,rgba(10,13,12,0.74)_100%)]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(255,246,234,0.7)]')}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-[#fff8ef]">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                title: '菜单与体验更新',
                description: '把品牌策略、顾客结构和空间动线真正落到菜单与服务动作。'
              },
              {
                title: '食安与运营纪律',
                description: '把巡检、留样、培训和现场责任链前置到日常，而不是事后纠错。'
              },
              {
                title: '采购与损耗治理',
                description: '围绕供给稳定性与成本弹性，建立更清晰的补货、采购与损耗逻辑。'
              },
              {
                title: 'AI 管理驾驶舱',
                description: '让经营者看到的不是分散报表，而是面向动作的管理地图。'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-[rgba(216,195,164,0.16)] bg-white/[0.04] p-5"
              >
                <p className="text-[15px] font-semibold text-[#fff8ef]">{item.title}</p>
                <p className="mt-3 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/capabilities"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,195,164,0.18)] bg-white/5 px-5 py-3 text-sm font-semibold text-[#fff8ef] transition-colors hover:bg-white/10"
            >
              查看能力架构详情
              <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
