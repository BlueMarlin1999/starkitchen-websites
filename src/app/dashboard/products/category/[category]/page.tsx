import { notFound } from 'next/navigation'
import ProductCategoryClient from './product-category-client'
import { PRODUCT_CATEGORY_LIBRARY, isProductCategoryId } from '@/lib/product-center'

interface ProductCategoryPageProps {
  params: {
    category: string
  }
}

export function generateStaticParams() {
  return PRODUCT_CATEGORY_LIBRARY.map((item) => ({ category: item.id }))
}

export default function ProductCategoryPage({ params }: ProductCategoryPageProps) {
  if (!isProductCategoryId(params.category)) {
    notFound()
  }

  return <ProductCategoryClient category={params.category} />
}
