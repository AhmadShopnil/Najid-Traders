import { getPublicProductsPageData } from '@/lib/public-data'
import { ProductsCatalog } from '@/components/frontend/products/ProductsCatalog'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { settings } = await getPublicProductsPageData()
  return {
    title: `Products — ${settings?.siteName || 'Najid Traders'}`,
    description:
      'Browse imported Three-Piece, Sarees, Spices, and China household products from Najid Traders.',
  }
}

export default async function ProductsPage({ searchParams }) {
  const resolvedParams = await searchParams
  const initialCategory = resolvedParams?.category || 'all'
  const { items, taxonomies, settings } = await getPublicProductsPageData()

  return (
    <ProductsCatalog
      items={items}
      taxonomies={taxonomies}
      settings={settings}
      initialCategory={initialCategory}
    />
  )
}
