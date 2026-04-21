import Link from 'next/link'
import { ArrowRight, BadgeCheck, Bot, ChevronRight, Play } from 'lucide-react'
import { CorporateSiteShell } from '@/components/corporate/site-shell'
import { SectionHeading } from '@/components/corporate/section-heading'
import { CompanyLogo } from '@/components/company-logo'
import {
  aiLoopSteps,
  brandDifferentiators,
  brandIntroduction,
  brandPositioning,
  brandSlogans,
  brandStarsPrinciples,
  brandValues,
  capabilityPillars,
  commitmentCards,
  heroSignals,
  industryFocus,
  serviceLayers,
} from '@/lib/corporate-content'
import { corporateDisplay, corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { corporateMedia, type CorporateMediaAsset } from '@/lib/corporate-media'
import { COMPANY_NAME_EN, COMPANY_NAME_ZH_LEGAL, COMPANY_SHORT_NAME_EN } from '@/lib/brand'
import { cn } from '@/lib/utils'

const signatureGallery = [
  {
    asset: corporateMedia.serviceKitchen,
    label: 'Kitchen choreography',
    title: '开放厨房、现制出品与高峰节奏，需要的是训练有素的协同。',
    aspectClassName: 'aspect-[4/5] lg:aspect-[4/6]',
  },
  {
    asset: corporateMedia.waiterService,
    label: 'Dining room service',
    title: '让服务动作、上菜节奏与空间氛围，成为品牌体验的一部分。',
    aspectClassName: 'aspect-[4/3]',
  },
  {
    asset: corporateMedia.buffetService,
    label: 'Service line',
    title: '从团餐到活动服务，稳定的供给与陈列本身就是专业度。',
    aspectClassName: 'aspect-[4/3]',
  },
  {
    asset: corporateMedia.platedService,
    label: 'Plated hospitality',
    title: '不止是“吃得上”，而是让呈现、温度与记忆点一起发生。',
    aspectClassName: 'aspect-[4/3]',
  },
] as const

const capabilityMoments = [
  {
    asset: corporateMedia.teamPreparation,
    label: 'Back of house',
    title: '厨房生产',
  },
  {
    asset: corporateMedia.baristaService,
    label: 'Frontline hospitality',
    title: '服务体验',
  },
  {
    asset: corporateMedia.tableService,
    label: 'Guest-facing finish',
    title: '现场呈现',
  },
] as const

const brandRibbonItems = [
  'Global Flavors, Local Hearts!',
  '环球美味 邻里共享!',
  'Global Standards, Smart Solutions!',
  '国际标准 数智未来!',
  '星厨集团 SK Group',
  'Safe · Tasty · Attentive · Reliable · Smart',
] as const

const brandMoodCards = [
  {
    label: '服务美学',
    title: '把标准化做成体验感',
    detail: '让流程、陈列、服务动线与空间氛围一起传递星级感受。',
  },
  {
    label: '品牌精神',
    title: '把功能性做成时尚感',
    detail: '让餐饮服务既专业可靠，也拥有让人愿意记住的气质与审美。',
  },
  {
    label: '产品生态',
    title: '把传统餐饮做成智慧化美味',
    detail: '把中央厨房、供应链与 AI 系统接进产品体验，而不只是接进后台。',
  },
] as const

const starsVisualBackdrops = [
  corporateMedia.teamPreparation.src,
  corporateMedia.platedService.src,
  corporateMedia.waiterService.src,
  corporateMedia.serviceKitchen.src,
  corporateMedia.heroVideo.poster,
] as const

const ribbonAccentColors = [
  'var(--sk-red)',
  'var(--sk-orange)',
  'var(--sk-yellow)',
  'var(--sk-green)',
  'var(--sk-blue)',
] as const

function MediaTile({
  asset,
  label,
  title,
  aspectClassName = 'aspect-[4/3]',
  className,
}: {
  asset: CorporateMediaAsset
  label: string
  title: string
  aspectClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[2rem] border border-[rgba(23,28,25,0.08)] bg-[#ddd2c2] shadow-[0_24px_64px_rgba(41,36,29,0.1)]',
        className
      )}
    >
      <div className={cn('relative', aspectClassName)}>
        <img
          src={asset.src}
          alt={asset.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,14,13,0.06),rgba(11,14,13,0.18)_48%,rgba(11,14,13,0.72)_100%)]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-[#fffaf1]">
        <p className={cn(corporateMono.className, 'sk-corp-kicker text-[9px] text-[rgba(255,246,234,0.76)]')}>{label}</p>
        <p className="mt-2 max-w-[16rem] text-[14px] font-medium leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.94)]">{title}</p>
      </div>
    </div>
  )
}

function HeroSection() {
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
                href="/login/"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.08)] px-6 py-3 text-sm font-semibold text-[rgba(23,28,25,0.72)] transition-colors hover:bg-white/60 hover:text-[var(--sk-ink)]"
              >
                进入管理平台
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

function BrandRibbonSection() {
  return (
    <section className="overflow-hidden border-y border-[rgba(62,59,64,0.08)] bg-[linear-gradient(90deg,#28262c_0%,#2f2c33_100%)] py-4 text-white">
      <div className="sk-brand-marquee-track flex w-max items-center gap-4 whitespace-nowrap pr-4">
        {[0, 1].map((group) => (
          <div key={group} className="flex items-center gap-4">
            {brandRibbonItems.map((item, index) => (
              <div
                key={`${group}-${item}`}
                className="flex items-center gap-4 rounded-full border bg-white/[0.04] px-4 py-2"
                style={{
                  borderColor: `${ribbonAccentColors[index % ribbonAccentColors.length]}33`,
                  boxShadow: `inset 0 0 0 1px ${ribbonAccentColors[index % ribbonAccentColors.length]}12`,
                }}
              >
                <span
                  className={cn(corporateMono.className, 'sk-corp-kicker text-[10px]')}
                  style={{ color: ribbonAccentColors[index % ribbonAccentColors.length] }}
                >
                  SK Group
                </span>
                <span className="text-[13px] text-[rgba(255,246,234,0.88)] sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function BrandCinemaSection() {
  return (
    <section className="relative overflow-hidden rounded-[3rem] bg-[var(--sk-deep)] text-[#fff8ef]">
      <div className="absolute inset-0 grid xl:grid-cols-[1.02fr_0.98fr]">
        <div
          className="h-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(11,16,14,0.78) 0%, rgba(11,16,14,0.52) 42%, rgba(11,16,14,0.24) 100%), url(${corporateMedia.waiterService.src})`,
          }}
        />
        <div
          className="hidden h-full bg-cover bg-center xl:block"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(11,16,14,0.18) 0%, rgba(11,16,14,0.62) 100%), url(${corporateMedia.platedService.src})`,
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,138,0,0.18),transparent_28%),radial-gradient(circle_at_75%_16%,rgba(255,255,255,0.12),transparent_22%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,0,22,0.14),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(26,151,218,0.16),transparent_22%),radial-gradient(circle_at_60%_86%,rgba(255,212,0,0.14),transparent_22%),radial-gradient(circle_at_18%_82%,rgba(56,181,51,0.12),transparent_20%)]" />

      <div className="relative z-10 px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-10 xl:grid-cols-[0.94fr_1.06fr] xl:items-end">
          <div>
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[var(--sk-yellow)]')}>
              brand atmosphere
            </p>
            <h2 className="mt-5 max-w-[12ch] text-[clamp(1.95rem,2.8vw,3rem)] font-semibold leading-[1.05] tracking-[-0.022em] text-[#fffaf1]">
              全球风味的眼界，<span className="block text-[var(--sk-yellow)]">本地服务的温度。</span>
            </h2>
            <p className="sk-copy mt-6 max-w-[31rem] text-[15px] leading-7 text-[rgba(255,246,234,0.8)]">
              网站首先要像一家真正懂 hospitality 的餐饮服务集团:
              有食物的吸引力、服务的体面感，以及国际集团应有的组织秩序。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['企业园区', '教育餐饮', '医疗康养', '酒店服务', '工业基地'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(255,255,255,0.12)] bg-white/[0.04] px-4 py-2 text-[13px] tracking-[0.01em] text-[rgba(255,246,234,0.84)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {brandMoodCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.9rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(33,32,39,0.56)] p-5 backdrop-blur-md"
              >
                <p className={cn(corporateMono.className, 'sk-corp-kicker text-[9px] text-[var(--sk-yellow)]')}>{item.label}</p>
                <p className="mt-4 text-[1.05rem] font-semibold leading-6 tracking-[-0.01em] text-[#fffaf1]">
                  {item.title}
                </p>
                <p className="mt-3 text-[13px] leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.72)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-[rgba(255,255,255,0.1)] pt-6">
          <p className="max-w-2xl text-[13px] leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.7)] sm:text-[14px] sm:leading-7">
            Global flavors. Local hearts. 用更克制的企业语言，承载更完整的餐饮服务体验。
          </p>
        </div>
      </div>
    </section>
  )
}

function BrandManifestoSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="sk-corp-panel-dark rounded-[2.6rem] p-8 text-[#fff9ef] sm:p-10">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[var(--sk-blue)]')}>
            Brand manifesto
          </p>
          <h2 className="mt-5 max-w-[15ch] text-[clamp(1.85rem,2.7vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#fffaf1]">
            {brandPositioning}
          </h2>
          <p className="mt-6 max-w-[34rem] text-[15px] leading-7 tracking-[0.01em] text-[rgba(255,246,234,0.76)]">
            {brandIntroduction}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {brandValues.map((value) => (
              <span
                key={value}
                className="rounded-full border border-[rgba(216,195,164,0.16)] bg-white/[0.06] px-4 py-2 text-sm text-[rgba(255,246,234,0.86)]"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="sk-corp-panel-soft rounded-[2.6rem] p-8 sm:p-10">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[rgba(23,28,25,0.48)]')}>
              Group identity
            </p>
            <h3 className="mt-5 max-w-[13ch] text-[clamp(1.6rem,2.2vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.018em] text-[var(--sk-ink)]">
              {COMPANY_NAME_ZH_LEGAL}
            </h3>
            <p className="mt-4 max-w-[33rem] text-[15px] leading-7 tracking-[0.01em] text-[rgba(23,28,25,0.68)]">
              对外简称星厨集团 {COMPANY_SHORT_NAME_EN}。我们希望网站给人的第一感受，是一家兼具国际标准、本土温度与时尚服务气质的现代餐饮服务集团。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {brandDifferentiators.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="sk-corp-panel rounded-[1.8rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--sk-action)] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={cn(corporateSans.className, 'mt-5 text-[1.25rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                    {item.title}
                  </p>
                  <p className="mt-3 text-[13px] leading-6 tracking-[0.01em] text-[rgba(23,28,25,0.72)]">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceSignatureSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
        <div className="sk-corp-panel-soft rounded-[2.4rem] p-8 sm:p-10">
          <SectionHeading
            eyebrow="Service Signature"
            title="现代感与餐饮感，需要同时成立"
            description="官网应该先让人看到食物、服务和组织秩序，再理解系统能力。"
          />

          <p className="mt-8 text-[14px] leading-7 tracking-[0.01em] text-[rgba(23,28,25,0.72)]">
            品牌图像应来自真实的餐饮运营世界: 厨房协同、现场服务、出品呈现与空间温度，而不是抽象的科技光效。
          </p>

          <div className="mt-8 grid gap-4">
            {[
              '让人先看到食物与服务，再理解系统与效率。',
              '用厨房、餐台与接待场景建立行业辨识度。',
              '让集团气质与真实餐饮感出现在同一套页面语言里。',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-[1.45rem] border border-[rgba(23,28,25,0.08)] bg-white/60 p-4 text-[13px] tracking-[0.01em] text-[rgba(23,28,25,0.72)]">
                <BadgeCheck className="mt-1 h-4 w-4 flex-none text-[var(--sk-action)]" />
                <span className="leading-6">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.8rem] bg-[var(--sk-deep)] p-6 text-white">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[10px] text-[var(--sk-yellow)]')}>
              brand impression
            </p>
            <p className={cn(corporateSans.className, 'mt-3 max-w-[18ch] text-[1.35rem] font-semibold leading-[1.2] tracking-[-0.015em]')}>
              先看见餐饮与服务，再理解 AI 与系统能力。
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <MediaTile
            asset={signatureGallery[0].asset}
            label={signatureGallery[0].label}
            title={signatureGallery[0].title}
            aspectClassName={signatureGallery[0].aspectClassName}
            className="lg:row-span-2"
          />

          <MediaTile
            asset={signatureGallery[1].asset}
            label={signatureGallery[1].label}
            title={signatureGallery[1].title}
            aspectClassName={signatureGallery[1].aspectClassName}
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <MediaTile
              asset={signatureGallery[2].asset}
              label={signatureGallery[2].label}
              title={signatureGallery[2].title}
              aspectClassName={signatureGallery[2].aspectClassName}
            />
            <MediaTile
              asset={signatureGallery[3].asset}
              label={signatureGallery[3].label}
              title={signatureGallery[3].title}
              aspectClassName={signatureGallery[3].aspectClassName}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function StarsManifestoSection() {
  return (
    <section className="sk-corp-panel rounded-[2.8rem] px-6 py-16 sm:px-8 lg:px-10">
      <SectionHeading
        eyebrow="STARS Brand Declaration"
        title="STARS 是星厨集团的品牌标准"
        description="从安全到美味，从关怀到可靠，再到智慧创新，让客户、员工与合作伙伴在每个接触点都感受到这五种品质。"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {brandStarsPrinciples.map((item, index) => {
          const Icon = item.icon

          return (
            <article
              key={`${item.letter}-${item.english}`}
              className={cn(
                'group relative min-h-[21rem] overflow-hidden rounded-[2.2rem] border border-[rgba(23,28,25,0.08)] shadow-[0_20px_55px_rgba(41,36,29,0.12)]'
              )}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
                style={{ backgroundImage: `url(${starsVisualBackdrops[index]})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,13,12,0.14),rgba(9,13,12,0.34)_30%,rgba(9,13,12,0.84)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,165,117,0.16),transparent_28%)]" />

              <div className="relative z-10 flex h-full flex-col justify-between p-6 text-[#fffaf1]">
                <div className="flex items-start justify-between gap-4">
                  <span className={cn(corporateSans.className, 'text-[3.4rem] font-semibold leading-none tracking-[-0.05em] text-[rgba(255,250,241,0.94)]')}>
                    {item.letter}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[rgba(216,195,164,0.16)] bg-[rgba(20,29,26,0.44)] text-[#fff8ef] backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <p className="text-[1rem] font-semibold tracking-[0.01em] text-[#fffaf1]">{item.english}</p>
                  <p className="mt-2 text-[12px] font-medium tracking-[0.01em] text-[var(--sk-yellow)]">{item.chinese}</p>
                  <p className="mt-3 max-w-[17rem] text-[13px] leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.8)]">{item.description}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CompanySection() {
  return (
    <section>
      <div className="grid gap-10 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-7">
          <SectionHeading
            eyebrow="Company Positioning"
            title="这是 Star Kitchen 的经营世界观"
            description="我们希望客户一进入首页，就理解这是一家懂场景、懂组织、也懂长期运营的服务集团。"
          />

          <div className="sk-corp-panel-soft rounded-[2.1rem] p-7">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[rgba(23,28,25,0.48)]')}>
              why this matters
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[rgba(23,28,25,0.74)]">
              真正有价值的餐饮集团官网，不是“看起来像官网”，而是让潜在客户很快明白你们懂复杂服务，也懂组织运营。
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.12)] bg-white/65 px-5 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:bg-white"
            >
              查看关于我们
              <ArrowRight className="h-4 w-4 text-[var(--sk-action)]" />
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {capabilityPillars.map((pillar, index) => {
            const Icon = pillar.icon

            return (
              <article
                key={pillar.title}
                className={cn(
                  'sk-corp-panel rounded-[2rem] p-6 transition-transform hover:-translate-y-1'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[var(--sk-action)] text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className={cn(corporateMono.className, 'text-[11px] text-[rgba(23,28,25,0.42)]')}>0{index + 1}</p>
                </div>

                <h3 className={cn(corporateSans.className, 'mt-6 text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                  {pillar.title}
                </h3>
                <p className="mt-4 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{pillar.description}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {pillar.points.map((point) => (
                    <span key={point} className="sk-corp-chip rounded-full px-3 py-1 text-xs">
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

function IndustriesSection() {
  return (
    <section>
      <SectionHeading
        eyebrow="Industry Focus"
        title="不同场景，需要不同的餐饮方法"
        description="企业园区、教育、医疗、酒店和工业空间，面对的是不同的客流节奏、服务目标和组织压力。"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {industryFocus.map((industry, index) => {
          const Icon = industry.icon

          return (
              <article
                key={industry.title}
                className={cn(
                  'sk-corp-panel rounded-[2rem] p-5'
                )}
              >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[rgba(26,151,218,0.1)] text-[var(--sk-action)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className={cn(corporateMono.className, 'text-[11px] text-[rgba(23,28,25,0.4)]')}>
                  0{index + 1}
                </p>
              </div>
              <h3 className={cn(corporateSans.className, 'mt-5 text-[1.25rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--sk-ink)]')}>
                {industry.title}
              </h3>
              <p className="mt-4 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{industry.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {industry.tags.map((tag) => (
                  <span key={tag} className="sk-corp-chip rounded-full px-3 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          href="/industries"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,28,25,0.12)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--sk-ink)] transition-colors hover:bg-white"
        >
          查看行业场景详情
          <ArrowRight className="h-4 w-4 text-[var(--sk-action)]" />
        </Link>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
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
                  <img
                    src={item.asset.src}
                    alt={item.asset.alt}
                    loading="lazy"
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

function AiLayerSection() {
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
              '为 starkitchenai.com 预留完整的技术叙事入口'
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

function FutureSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="sk-corp-panel rounded-[2.3rem] p-8 sm:p-10">
          <SectionHeading
            eyebrow="Brand Direction"
            title="官网应该像集团，不像概念页"
            description="可信赖、国际化、温暖、克制、有系统能力，这些词应该同时出现在 Star Kitchen 的视觉里。"
          />

          <div className="mt-8 space-y-4">
            {commitmentCards.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="rounded-[1.6rem] border border-[rgba(62,59,64,0.08)] bg-[var(--sk-paper)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--sk-action)] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--sk-ink)]">{item.title}</p>
                      <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sk-corp-panel-soft rounded-[2.3rem] p-8 sm:p-10">
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[rgba(23,28,25,0.5)]')}>
            domain architecture
          </p>
          <h3 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,2.5vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--sk-ink)]">
            <span className="text-[var(--sk-action)]">starkitchen.ai</span> 讲公司与能力，
            <span className="block"><span className="text-[var(--sk-red)]">starkitchenai.com</span> 讲产品与技术。</span>
          </h3>
          <p className="mt-5 text-[15px] leading-7 text-[rgba(23,28,25,0.72)]">
            这两个域名不应该混在一起使用。公司官网负责建立信任、行业理解与服务能力认知；AI 技术站负责讲产品、Agent、接口与连锁服务业的智能化升级。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="sk-corp-panel rounded-[1.7rem] p-5">
              <p className="text-[15px] font-semibold text-[var(--sk-ink)]">starkitchen.ai</p>
              <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">
                面向客户、合作伙伴和品牌沟通的公司官网，强调服务能力与集团叙事。
              </p>
            </div>
            <div className="sk-corp-panel rounded-[1.7rem] p-5">
              <p className="text-[15px] font-semibold text-[var(--sk-ink)]">starkitchenai.com</p>
              <p className="mt-2 text-[13px] leading-6 text-[rgba(23,28,25,0.72)]">
                面向连锁服务业数字化升级的 AI 技术官网，强调产品、系统和智能运营。
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.8rem] bg-[var(--sk-deep)] p-6 text-white">
            <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>
              brand note
            </p>
            <p className={cn(corporateSans.className, 'mt-3 text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.015em]')}>
              Global flavors. Local hearts. Smart execution.
            </p>
            <p className="mt-3 text-[13px] leading-6 text-[rgba(255,246,234,0.72)]">
              这会是 Star Kitchen 最终应该留下来的视觉印象，而不是一个“也许能用”的普通 landing page。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section className="sk-corp-panel-dark rounded-[2.7rem] px-6 py-14 text-[#fff8ef] sm:px-8 lg:px-12">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
        <div>
          <p className={cn(corporateMono.className, 'sk-corp-kicker text-[11px] text-[var(--sk-yellow)]')}>Contact & platform</p>
          <h2 className="mt-5 max-w-[16ch] text-[clamp(1.9rem,2.7vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#fffaf1]">
            让品牌介绍、商务沟通和平台入口，都拥有一个配得上 Star Kitchen 的门面。
          </h2>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[rgba(255,246,234,0.72)]">
            这一轮先把官网气质拉到对的位置。下一阶段可以继续补案例、团队、新闻、商务资料、招商与正式联系表单。
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
              href="/login/"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,195,164,0.16)] bg-white/5 px-6 py-3 text-sm font-semibold text-[#fff8ef] transition-colors hover:bg-white/10"
            >
              进入管理平台
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              title: '公司官网主叙事',
              description: '对外讲清楚 Star Kitchen 是什么样的服务集团，以及为什么它与传统餐饮公司不同。'
            },
            {
              title: '平台入口保留',
              description: '内部团队与演示用户仍然可以从同一域名快速进入管理平台，不影响现有工作流。'
            },
            {
              title: '技术品牌预留',
              description: '后续 starkitchenai.com 可以独立承接 AI 产品、系统能力与解决方案内容。'
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

export default function HomePageClient() {
  return (
    <CorporateSiteShell activePath="/">
      <HeroSection />
      <BrandRibbonSection />

      <div className="mx-auto max-w-[88rem] px-6 py-20">
        <div className="space-y-24 sm:space-y-28">
          <BrandCinemaSection />
          <BrandManifestoSection />
          <ServiceSignatureSection />
          <StarsManifestoSection />
          <CompanySection />
          <IndustriesSection />
          <CapabilitiesSection />
          <AiLayerSection />
          <FutureSection />
          <ContactSection />
        </div>
      </div>
    </CorporateSiteShell>
  )
}
