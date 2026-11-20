import { Suspense } from 'react'
import { getPublicProductsPageData } from '@/lib/public-data'
import { ProductsCatalog } from '@/components/frontend/products/ProductsCatalog'

export const revalidate = 60

export async function generateMetadata() {
  const { settings } = await getPublicProductsPageData()
  const favicon = settings?.favicon
  return {
    title: `Products — ${settings?.siteName || 'Najid Traders'}`,
    description:
      'Browse imported Three-Piece, Sarees, Spices, and China household products from Najid Traders.',
    ...(favicon
      ? {
          icons: {
            icon: [{ url: favicon }, { url: '/favicon.ico' }],
            shortcut: [favicon],
            apple: [{ url: favicon }],
          },
        }
      : {}),
  }
}

export default async function ProductsPage() {
  const { items, taxonomies, settings } = await getPublicProductsPageData()

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 animate-pulse" />}>
      <ProductsCatalog
        items={items}
        taxonomies={taxonomies}
        settings={settings}
      />
    </Suspense>
  )
}
