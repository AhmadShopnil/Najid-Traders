import { getPublicProductsPageData, getPublicEmployees } from '@/lib/public-data'
import { FrontendMain } from '@/components/frontend/FrontendMain'

export const revalidate = 60

export async function generateMetadata() {
  const { settings } = await getPublicProductsPageData()
  const siteName = settings?.siteName || 'Najid Traders'
  return {
    title: `${siteName} — Importer & Wholesale Supplier`,
    description:
      settings?.seo?.metaDescription ||
      'Najid Traders imports Three-Piece, Sarees, authentic Spices, and China household products including water pots. Browse product details and contact us for wholesale inquiries.',
  }
}

export default async function HomePage() {
  const [{ items, taxonomies, settings }, employees] = await Promise.all([
    getPublicProductsPageData(),
    getPublicEmployees(),
  ])

  return (
    <FrontendMain
      products={items}
      taxonomies={taxonomies}
      employees={employees}
      settings={settings}
    />
  )
}
