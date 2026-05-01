import Image from 'next/image'
import { corporateMono } from '@/lib/corporate-fonts'
import { corporateMedia, type CorporateMediaAsset } from '@/lib/corporate-media'
import { cn } from '@/lib/utils'

export const signatureGallery = [
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

export const capabilityMoments = [
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

export const brandRibbonItems = [
  'Global Flavors, Local Hearts!',
  '环球美味 邻里共享!',
  'Global Standards, Smart Solutions!',
  '国际标准 数智未来!',
  '星厨集团 SK Group',
  'Safe · Tasty · Attentive · Reliable · Smart',
] as const

export const brandMoodCards = [
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

export const starsVisualBackdrops = [
  corporateMedia.teamPreparation.src,
  corporateMedia.platedService.src,
  corporateMedia.waiterService.src,
  corporateMedia.serviceKitchen.src,
  corporateMedia.heroVideo.poster,
] as const

export const ribbonAccentColors = [
  'var(--sk-red)',
  'var(--sk-orange)',
  'var(--sk-yellow)',
  'var(--sk-green)',
  'var(--sk-blue)',
] as const

export function MediaTile({
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
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 30vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,14,13,0.06),rgba(11,14,13,0.18)_48%,rgba(11,14,13,0.72)_100%)]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-[#fffaf1]">
        <p className={cn(corporateMono.className, 'sk-corp-kicker text-[9px] text-[rgba(255,246,234,0.76)]')}>
          {label}
        </p>
        <p className="mt-2 max-w-[16rem] text-[14px] font-medium leading-6 tracking-[0.01em] text-[rgba(255,246,234,0.94)]">
          {title}
        </p>
      </div>
    </div>
  )
}
