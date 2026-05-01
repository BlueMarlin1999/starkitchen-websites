import { BadgeCheck } from 'lucide-react'
import { SectionHeading } from '@/components/corporate/section-heading'
import { corporateMono, corporateSans } from '@/lib/corporate-fonts'
import { cn } from '@/lib/utils'
import { MediaTile, signatureGallery } from './shared'

export function ServiceSignatureSection() {
  return (
    <section>
      <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
        <div className="sk-corp-panel-soft rounded-[2.4rem] p-8 sm:p-10">
          <SectionHeading
            eyebrow="Service Signature"
            title="现代感与餐饮感，需要同时成立"
            description="我们先用食物、服务与组织秩序建立信任，再把系统能力自然交给合作方理解。"
          />

          <p className="mt-8 text-[14px] leading-7 tracking-[0.01em] text-[rgba(23,28,25,0.72)]">
            品牌图像应来自真实的餐饮运营世界: 厨房协同、现场服务、出品呈现与空间温度，而不是抽象的科技光效。
          </p>

          <div className="mt-8 grid gap-4">
            {[
              '让人先看到食物与服务，再理解系统与效率。',
              '用厨房、餐台与接待场景建立行业辨识度。',
              '让集团气质与真实餐饮感在同一套品牌表达里同时成立。',
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
