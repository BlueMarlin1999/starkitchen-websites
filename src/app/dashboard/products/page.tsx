import Link from 'next/link'
import { ArrowRight, PackageSearch, Shapes, Tags } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PRODUCT_CATEGORY_LIBRARY, PRODUCT_ITEMS, getProductsByCategory } from '@/lib/product-center'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

export default function ProductCenterPage() {
  const allUnitCost = PRODUCT_ITEMS.reduce((sum, item) => sum + item.unitCost, 0)
  const averageUnitCost = PRODUCT_ITEMS.length > 0 ? allUnitCost / PRODUCT_ITEMS.length : 0
  const averageGrossMargin =
    PRODUCT_ITEMS.length > 0
      ? PRODUCT_ITEMS.reduce((sum, item) => {
          if (item.suggestedPrice <= 0) return sum
          return sum + ((item.suggestedPrice - item.unitCost) / item.suggestedPrice) * 100
        }, 0) / PRODUCT_ITEMS.length
      : 0

  const highMarginItems = [...PRODUCT_ITEMS]
    .sort(
      (left, right) =>
        (right.suggestedPrice - right.unitCost) / right.suggestedPrice -
        (left.suggestedPrice - left.unitCost) / left.suggestedPrice
    )
    .slice(0, 4)

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看产品中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-primary" />
                产品中心 Product Center
              </CardTitle>
              <CardDescription className="text-slate-300">
                支持按类目、菜系、主食材、烹饪方法管理产品库，并可下钻查看 Recipe 与 SOP
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">产品总数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{PRODUCT_ITEMS.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">类目数量</p>
                <p className="mt-2 text-2xl font-semibold text-white">{PRODUCT_CATEGORY_LIBRARY.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均单品成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">¥{averageUnitCost.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均毛利率</p>
                <p className="mt-2 text-2xl font-semibold text-white">{averageGrossMargin.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shapes className="h-5 w-5 text-primary" />
                产品分类入口
              </CardTitle>
              <CardDescription className="text-slate-300">
                5 大类目可直接进入右侧产品库
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PRODUCT_CATEGORY_LIBRARY.map((category) => {
                const count = getProductsByCategory(category.id).length
                return (
                  <Link
                    key={category.id}
                    href={`/dashboard/products/category/${category.id}/`}
                    className="group rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{category.title}</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{count} 个</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{category.description}</p>
                    <div className="mt-3 inline-flex items-center text-xs text-primary">
                      进入产品库
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                高毛利单品关注
              </CardTitle>
              <CardDescription className="text-slate-300">
                建议结合排班与供应链策略推动套餐转化
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {highMarginItems.map((item) => {
                const grossMargin = item.suggestedPrice > 0 ? ((item.suggestedPrice - item.unitCost) / item.suggestedPrice) * 100 : 0
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                        毛利率 {grossMargin.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      成本 ¥{item.unitCost.toFixed(2)} · 建议售价 ¥{item.suggestedPrice.toFixed(2)}
                    </p>
                    <Link
                      href={`/dashboard/products/${item.id}/`}
                      className="mt-2 inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                    >
                      查看 Recipe 与 SOP
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
