import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Info,
  Package,
  Tag,
} from 'lucide-react'
import { getPublicSingleItemData } from '@/lib/public-data'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { InquiryForm } from '@/components/frontend/InquiryForm'
import { extractProductSummary } from '@/lib/product-helpers'
import { ProductGallery } from '@/components/frontend/products/ProductGallery'

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const { items } = await getPublicProductsPageData()
    return (items || [])
      .map((item) => ({ itemSlug: String(item.slug || '') }))
      .filter((p) => Boolean(p.itemSlug))
  } catch {
    return []
  }
}

const SKIP_SPEC_KEYS = new Set([
  'title',
  'name',
  'product_name',
  'heading',
  'slug',
  'image',
  'thumbnail',
  'featured_image',
  'photo',
  'cover',
  'gallery',
  'images',
  'additional_images',
  'description',
  'details',
  'short_description',
  'summary',
  'excerpt',
])

export async function generateMetadata({ params }) {
  const { itemSlug } = await params
  const result =
    (await getPublicSingleItemData('products', itemSlug)) ||
    (await getPublicSingleItemData('product', itemSlug))

  if (!result) {
    return { title: 'Product Not Found — Najid Traders' }
  }

  const summary = extractProductSummary(result.contentItem)
  return {
    title: `${summary.title} — ${result.settings?.siteName || 'Najid Traders'}`,
    description: summary.description || `${summary.title} imported product details.`,
  }
}

export default async function ProductDetailPage({ params }) {
  const { itemSlug } = await params
  const result =
    (await getPublicSingleItemData('products', itemSlug)) ||
    (await getPublicSingleItemData('product', itemSlug))

  if (!result) notFound()

  const { contentItem, module: mod, settings } = result
  const product = extractProductSummary(contentItem)
  const contact = settings?.contact || {}
  const related = (contentItem.relatedItems || []).map(extractProductSummary)

  const fieldLabelMap = {}
  for (const f of mod?.fields || []) {
    if (f?.slug) fieldLabelMap[f.slug] = f.name || f.slug
    if (f?.name && f?.label) fieldLabelMap[f.name] = f.label
  }

  const specRows = []
  for (const [key, val] of Object.entries(product.raw || {})) {
    if (SKIP_SPEC_KEYS.has(key)) continue
    if (val === null || val === undefined || val === '') continue

    if (key === 'specifications' && Array.isArray(val)) {
      for (const entry of val) {
        if (entry && entry.key && entry.value) {
          specRows.push({ label: String(entry.key), value: String(entry.value) })
        }
      }
      continue
    }

    if (key === 'specifications' && typeof val === 'object' && !Array.isArray(val)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (subVal !== null && subVal !== undefined && subVal !== '') {
          specRows.push({ label: String(subKey), value: String(subVal) })
        }
      }
      continue
    }

    if (typeof val === 'object' && !Array.isArray(val)) continue
    specRows.push({
      label: fieldLabelMap[key] || key.replace(/_/g, ' '),
      value: Array.isArray(val) ? val.join(', ') : String(val),
    })
  }

  const rawHtmlOrText =
    product.raw?.description ||
    product.raw?.details ||
    product.raw?.short_description ||
    product.raw?.summary ||
    ''

  const theme = settings?.theme || {}
  const secondaryColor = theme.secondaryColor || '#16385D'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <FrontendHeader settings={settings} />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-slate-900">
              Products
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate">{product.title}</span>
          </nav>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 mb-6 transition-colors"
            style={{ color: secondaryColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Products
          </Link>

          {/* Product Main Card */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            {/* Image Gallery */}
            <div className="lg:col-span-6">
              <ProductGallery
                images={product.images || (product.image ? [product.image] : [])}
                title={product.title}
              />
            </div>

            {/* Info & Inquiry */}
            <div className="lg:col-span-6 flex flex-col">
              {product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200"
                    >
                      <Tag className="h-3 w-3 shrink-0" style={{ color: secondaryColor }} />
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {product.title}
              </h1>

              {rawHtmlOrText ? (
                <div
                  className="mt-4 prose prose-slate rich-text-content prose-sm max-w-none text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: String(rawHtmlOrText) }}
                />
              ) : (
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Imported wholesale product by {settings?.siteName || 'Najid Traders'}. Contact
                  our sales desk for current stock, packaging, and wholesale pricing.
                </p>
              )}

              {/* Specifications Table */}
              {specRows.length > 0 && (
                <div className="mt-6 rounded-md border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Product Specifications
                    </h2>
                  </div>
                  <dl className="divide-y divide-slate-200 text-sm bg-white">
                    {specRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between px-4 py-2.5 gap-4"
                      >
                        <dt className="font-medium capitalize text-slate-600">{row.label}</dt>
                        <dd className="font-semibold text-slate-900 text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Inquiry-Only Notice & Contact Box */}
              <div
                className="mt-6 rounded-md border border-slate-200 border-l-4 bg-slate-50 p-5 space-y-4"
                style={{ borderLeftColor: secondaryColor }}
              >
                <div className="flex items-start gap-3">
                  <Info
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: secondaryColor }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Wholesale &amp; Trade Inquiry Only
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Direct online purchase is not available on this website. Please contact{' '}
                      {settings?.siteName || 'Najid Traders'} directly for pricing, minimum order
                      quantity, and availability.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#16385D] transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}?subject=${encodeURIComponent(
                        `Product Inquiry: ${product.title}`
                      )}`}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email Inquiry
                    </a>
                  )}
                </div>

                {(contact.address || contact.hours) && (
                  <div className="border-t border-slate-200 pt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
                    {contact.address && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          className="h-3.5 w-3.5"
                          style={{ color: secondaryColor }}
                        />
                        {contact.address}
                      </span>
                    )}
                    {contact.hours && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock
                          className="h-3.5 w-3.5"
                          style={{ color: secondaryColor }}
                        />
                        {contact.hours}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct Product Inquiry Form */}
          <section className="mt-8">
            <InquiryForm
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                sku: product.sku,
              }}
              title={`Inquire About ${product.title}`}
              subtitle="Submit your contact details and required quantity. Our sales desk will follow up with pricing and availability."
              settings={settings}
            />
          </section>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Related Imported Products</h2>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-colors"
                  style={{ color: secondaryColor }}
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/products/${encodeURIComponent(rel.slug)}`}
                    className="group overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-[#16385D] transition-colors"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                      {rel.image ? (
                        <img
                          src={rel.image}
                          alt={rel.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Package className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16385D] line-clamp-1">
                        {rel.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {rel.description || 'View product details'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <FrontendFooter settings={settings} />
    </div>
  )
}
