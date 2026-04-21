'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Filter, PackageSearch } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProductCategoryId, getProductCategoryMeta, getProductsByCategory } from '@/lib/product-center'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

interface ProductCategoryClientProps {
  category: ProductCategoryId
}

export default function ProductCategoryClient({ category }: ProductCategoryClientProps) {
  const categoryMeta = getProductCategoryMeta(category)
  const products = getProductsByCategory(category)
  const [keyword, setKeyword] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedIngredient, setSelectedIngredient] = useState('all')
  const [selectedMethod, setSelectedMethod] = useState('all')

  const cuisineOptions = useMemo(
    () => Array.from(new Set(products.map((item) => item.cuisine))).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [products]
  )
  const ingredientOptions = useMemo(
    () => Array.from(new Set(products.map((item) => item.primaryIngredient))).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [products]
  )
  const methodOptions = useMemo(
    () => Array.from(new Set(products.map((item) => item.cookingMethod))).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [products]
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((item) => {
        const normalizedKeyword = keyword.trim().toLowerCase()
        const matchKeyword =
          !normalizedKeyword ||
          `${item.name} ${item.sku} ${item.description} ${item.tags.join(' ')}`
            .toLowerCase()
            .includes(normalizedKeyword)
        const matchCuisine = selectedCuisine === 'all' || item.cuisine === selectedCuisine
        const matchIngredient = selectedIngredient === 'all' || item.primaryIngredient === selectedIngredient
        const matchMethod = selectedMethod === 'all' || item.cookingMethod === selectedMethod
        return matchKeyword && matchCuisine && matchIngredient && matchMethod
      }),
    [keyword, products, selectedCuisine, selectedIngredient, selectedMethod]
  )

  const averageCost =
    filteredProducts.length > 0
      ? filteredProducts.reduce((sum, item) => sum + item.unitCost, 0) / filteredProducts.length
      : 0

  const averageMargin =
    filteredProducts.length > 0
      ? filteredProducts.reduce((sum, item) => sum + ((item.suggestedPrice - item.unitCost) / item.suggestedPrice) * 100, 0) /
        filteredProducts.length
      : 0

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看产品分类库">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-primary" />
                {categoryMeta?.title || '产品分类'}产品库
              </CardTitle>
              <CardDescription className="text-slate-300">
                {categoryMeta?.description || '按分类管理产品库'} · 支持菜系 / 主食材 / 烹饪方法筛选
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">当前筛选产品数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{filteredProducts.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">¥{averageCost.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均毛利率</p>
                <p className="mt-2 text-2xl font-semibold text-white">{averageMargin.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                筛选器
              </CardTitle>
              <CardDescription className="text-slate-300">
                可组合过滤并查看成本结构
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-4">
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索名称 / SKU / 标签"
                className="min-h-11 border-white/20 bg-[#071633]/70 text-white placeholder:text-slate-400"
              />
              <select
                value={selectedCuisine}
                onChange={(event) => setSelectedCuisine(event.target.value)}
                className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">全部菜系</option>
                {cuisineOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={selectedIngredient}
                onChange={(event) => setSelectedIngredient(event.target.value)}
                className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">全部主食材</option>
                {ingredientOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={selectedMethod}
                onChange={(event) => setSelectedMethod(event.target.value)}
                className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">全部烹饪方法</option>
                {methodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>产品列表</CardTitle>
              <CardDescription className="text-slate-300">
                点击任一产品查看 Recipe 与 SOP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredProducts.map((item) => {
                const margin = item.suggestedPrice > 0 ? ((item.suggestedPrice - item.unitCost) / item.suggestedPrice) * 100 : 0
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/products/${item.id}/`}
                    className="group block rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{item.sku}</Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                          毛利率 {margin.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{item.cuisine}</Badge>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{item.primaryIngredient}</Badge>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{item.cookingMethod}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      成本 ¥{item.unitCost.toFixed(2)} · 建议售价 ¥{item.suggestedPrice.toFixed(2)}
                    </p>
                    <div className="mt-2 inline-flex items-center text-xs text-primary">
                      查看产品详情
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  当前筛选条件下无产品，请调整过滤条件。
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Link
            href="/dashboard/products/"
            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            返回产品中心
          </Link>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
