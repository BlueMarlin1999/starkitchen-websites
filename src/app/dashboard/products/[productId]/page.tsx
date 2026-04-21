import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpenCheck, ClipboardCheck, FileText } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PRODUCT_ITEMS, getProductById, getProductCategoryMeta } from '@/lib/product-center'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface ProductDetailPageProps {
  params: {
    productId: string
  }
}

export function generateStaticParams() {
  return PRODUCT_ITEMS.map((item) => ({ productId: item.id }))
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = getProductById(params.productId)
  if (!product) {
    notFound()
  }

  const categoryMeta = getProductCategoryMeta(product.category)
  const grossProfit = product.suggestedPrice - product.unitCost
  const grossMargin = product.suggestedPrice > 0 ? (grossProfit / product.suggestedPrice) * 100 : 0
  const recipeCost = product.recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0)

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看产品详情">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                {product.name}
              </CardTitle>
              <CardDescription className="text-slate-300">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{product.sku}</Badge>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{categoryMeta?.title || '分类'}</Badge>
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{product.cuisine}</Badge>
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{product.primaryIngredient}</Badge>
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{product.cookingMethod}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">单品成本</p>
                  <p className="mt-2 text-2xl font-semibold text-white">¥{product.unitCost.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">建议售价</p>
                  <p className="mt-2 text-2xl font-semibold text-white">¥{product.suggestedPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">毛利</p>
                  <p className="mt-2 text-2xl font-semibold text-white">¥{grossProfit.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">毛利率</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{grossMargin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recipe 配方
                </CardTitle>
                <CardDescription className="text-slate-300">
                  出品规格 {product.recipe.yield} · 配方成本 ¥{recipeCost.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#081538]/55">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03]">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">食材</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">用量</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">成本</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.recipe.ingredients.map((ingredient) => (
                        <tr key={ingredient.name} className="border-b border-white/10 last:border-b-0">
                          <td className="px-3 py-3 text-slate-100">{ingredient.name}</td>
                          <td className="px-3 py-3 text-slate-200">
                            {ingredient.amount} {ingredient.unit}
                          </td>
                          <td className="px-3 py-3 text-slate-200">¥{ingredient.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-sm font-medium text-white">制作步骤</p>
                  <div className="mt-2 space-y-2">
                    {product.recipe.steps.map((step, index) => (
                      <p key={step} className="text-xs leading-5 text-slate-300">
                        {index + 1}. {step}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  SOP 标准流程
                </CardTitle>
                <CardDescription className="text-slate-300">
                  从备料到出品，再到品控执行
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.sop.map((section) => (
                  <div key={section.sectionTitle} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-sm font-medium text-white">{section.sectionTitle}</p>
                    <div className="mt-2 space-y-2">
                      {section.checkpoints.map((checkpoint) => (
                        <p key={checkpoint} className="text-xs leading-5 text-slate-300">
                          {checkpoint}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/products/category/${product.category}/`}
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回{categoryMeta?.title || '类目'}产品库
            </Link>
            <Link
              href="/dashboard/products/"
              className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
            >
              返回产品中心
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
