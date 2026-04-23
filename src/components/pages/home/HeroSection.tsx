import Link from 'next/link'
import { ArrowRight, ChevronRight, Play } from 'lucide-react'
import { CompanyLogo } from '@/components/company-logo'
import { heroSignals, brandSlogans } from '@/lib/corporate-content'
import { corporateDisplay, corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { corporateMedia } from '@/lib/corporate-media'
import { COMPANY_NAME_EN, COMPANY_SHORT_NAME_EN } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { MediaTile } from './shared'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-14 lg:pb-24 lg:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_10%_10%,rgba(234,0,22,0.14),transparent_20%),radial-gradient(circle_at_84%_10%,rgba(246,138,0,0.14),transparent_18%),radial-gradient(circle_at_70%_38%,rgba(255,212,0,0.12),transparent_18%),radial-gradient(circle_at_16%_46%,rgba(56,181,51,0.1),transparent_18%),radial-gradient(circle_at_86%_18%,rgba(26,151,218,0.14),transparent_22%)]" />

      <div className="mx-auto max-w-[88rem] px-6">
        <div className="grid gap-12 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
          <div className={cn(corporateSans.className, 'relative z-10')}>
            <div className="flex items-center gap-4">
              <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(23,28,25,0.5)]')}>
                {COMPANY_SHORT_NAME_EN} | {COMPANY_NAME_EN}
              </p>
              <span className="h-px w-20 sk-corp-rule" />
            </div>

            <h1
              className={cn(
                corporateDisplay.className,
                'mt-7 max-w-[11ch] text-[clamp(2.8rem,4.5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--sk-ink)]'
              )}
            >
              把环球美味，
              <span className="block">做成邻里共享的日常</span>
              <span className="block text-[var(--sk-red)]">Star Kitchen</span>
            </h1>

            <p className="mt-7 max-w-[34rem] text-[15px] leading-7 tracking-[0.01em] text-[rgba(23,28,25,0.76)] sm:text-[16px] sm:leading-[1.75]">
              星厨集团为企业园区、教育、医疗、酒店与工业空间提供餐饮服务、中央厨房与 AI 经营中枢一体化解决方案，把国际标准、本土温度与运营效率接进同一张服务网络。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[rgba(23,28,25,0.58)] sm:text-[13px]">
              {brandSlogans.map((item, index) => (
                <span key={item.en} className="inline-flex items-center gap-3">
                  <span className="font-medium">{item.zh}</span>
                  {index < brandSlogans.length - 1 ? <span className="text-[rgba(23,28,25,0.24)]">/</span> : null}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-action)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                了解集团定位
                <ArrowRight className="h-4 w-4 text-[var(--sk-yellow)]" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(62,59,64,0.12)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:bg-white"
              >
                发起商务沟通
                <ChevronRight className="h-4 w-4 text-[var(--sk-action)]" />
              </Link>
              <Link
                href="/industries"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.08)] px-6 py-3 text-sm font-semibold text-[rgba(23,28,25,0.72)] transition-colors hover:bg-white/60 hover:text-[var(--sk-ink)]"
              >
                查看行业场景
              </Link>
            </div>

            <div className="mt-10 grid gap-4 border-t border-[rgba(62,59,64,0.08)] pt-6 sm:grid-cols-3">
              {heroSignals.map((signal) => (
                <div key={signal.label} className="min-w-[10rem]">
                  <p className={cn(corporateMono.className, 'sk-corp-kicker text-[9px] text-[rgba(23,28,25,0.4)]')}>
                    {signal.label}
                  </p>
                  <p className="mt-2 text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--sk-ink)]">{signal.value}</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-[rgba(23,28,25,0.62)]">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="absolute -left-6 top-16 h-40 w-40 rounded-full bg-[rgba(246,138,0,0.18)] blur-3xl" />
            <div className="absolute -right-4 bottom-8 h-52 w-52 rounded-full bg-[rgba(26,151,218,0.16)] blur-3xl" />

            <div className="sk-corp-panel-dark sk-corp-hero-grid relative overflow-hidden rounded-[2.9rem] p-7 text-[#fff9ef] sm:p-9">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)] opacity-70" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
                      north star operating stack
                    </p>
                    <h2 className="mt-4 max-w-[13ch] text-[clamp(1.75rem,2.2vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.022em] text-[#fffaf1]">
                      Hospitality discipline. <br />
                      System-level execution.
                    </h2>
                  </div>

                  <div className="rounded-[1.6rem] border border-[rgba(255,255,255,0.12)] bg-white/5 p-3">
                    <CompanyLogo variant="mark" iconClassName="h-12 w-12 rounded-full bg-white p-0.5 shadow-none" />
                  </div>
                </div>

                <div className="mt-8 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.1)] bg-[#16151b]">
                    <div className="relative aspect-[4/5] sm:aspect-[16/11] xl:aspect-[5/6]">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={corporateMedia.heroVideo.poster}
                        className="absolute inset-0 h-full w-full object-cover"
                      >
                        <source src={corporateMedia.heroVideo.src} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,13,12,0.04),rgba(10,13,12,0.16)_36%,rgba(10,13,12,0.76)_100%)]" />
                    </div>

                    <div className="absolute left-5 top-5 inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(24,23,30,0.58)] px-4 py-2 backdrop-blur">
                      <Play className="h-4 w-4 text-[var(--sk-yellow)]" />
                      <span className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(255,255,255,0.84)]')}>
                        brand film
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <div className="max-w-md rounded-[1.6rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(24,23,30,0.46)] p-5 backdrop-blur-md">
                        <p className={cn(corporateMono.className, 'sk-corp-kicker text-[9px] text-[rgba(255,246,234,0.7)]')}>
                          kitchen to guest
                        </p>
                        <h3 className="mt-3 max-w-[13ch] text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.015em] text-[#fffaf1]">
                          从厨房火候，到服务动线，使用同一套执行标准。
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[2rem] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(26,151,218,0.18),rgba(26,151,218,0.04))] p-6">
                      <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
                        what we build
                      </p>
                      <p className="mt-4 text-[14px] leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.9)]">
                        One operating stack for guest experience, kitchen production, supply discipline, and AI command.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                      <MediaTile
                        asset={corporateMedia.tableService}
                        label="Guest moment"
                        title="服务不只出餐，也包含节奏、温度与体面。"
                        aspectClassName="aspect-[4/3]"
                      />
                      <MediaTile
                        asset={corporateMedia.teamPreparation}
                        label="Back of house"
                        title="中央厨房、备餐与标准化，是体验背后的骨架。"
                        aspectClassName="aspect-[4/3]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 border-t border-[rgba(255,255,255,0.1)] pt-6">
                  {[
                    'Dining experience',
                    'Central kitchen',
                    'Supply discipline',
                    'AI operating layer'
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[rgba(255,255,255,0.12)] bg-white/[0.04] px-4 py-2 text-[13px] text-[rgba(255,246,234,0.82)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
