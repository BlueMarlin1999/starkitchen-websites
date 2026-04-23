import { corporateMono } from '@/lib/corporate-fonts'
import { corporateMedia } from '@/lib/corporate-media'
import { cn } from '@/lib/utils'
import { brandMoodCards } from './shared'

export function BrandCinemaSection() {
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
              Star Kitchen 希望把全球风味、本地温度与集团级运营纪律放进同一套品牌体验里，
              让食物吸引力、服务体面感与组织秩序同时成立。
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
