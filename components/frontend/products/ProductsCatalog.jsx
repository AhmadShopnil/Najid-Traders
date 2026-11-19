'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Package, ArrowRight, Info, SlidersHorizontal, Image as ImageIcon } from 'lucide-react'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { extractProductSummary } from '@/lib/product-helpers'

export function ProductsCatalog({
  items = [],
  taxonomies = [],
  settings = {},
  initialCategory = 'all',
}) {
  const searchParams = useSearchParams()
  const urlCategory = searchParams?.get('category') || null
  const theme = settings.theme || {}
  const secondaryColor = theme.secondaryColor || '#16385D'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || initialCategory || 'all')

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory)
    }
  }, [urlCategory])

  const categoryOptions = useMemo(() => {
    const seen = new Map()
    for (const tax of taxonomies) {
      for (const term of tax.terms || []) {
        if (term?.slug && term?.name && !seen.has(term.slug)) {
          seen.set(term.slug, term.name)
        }
      }
    }
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }))
  }, [taxonomies])

  const normalizedProducts = useMemo(
    () =>
      items.map((item) => ({
        ...extractProductSummary(item),
        categorySlugs: Array.isArray(item.resolvedCategories)
          ? item.resolvedCategories.map((c) => c.slug).filter(Boolean)
          : [],
      })),
    [items]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return normalizedProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categorySlugs.includes(selectedCategory)
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.origin.toLowerCase().includes(q) ||
        product.categories.some((c) => c.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [normalizedProducts, search, selectedCategory])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <FrontendHeader settings={settings} />

      <main className="flex-1">
        {/* Clean Light Header */}
        <section className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Link href="/" className="hover:text-slate-900">
                Home
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-900">Products</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Imported Products Catalog
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Browse our wholesale product directory. Select any item to view specifications
                  and contact our office for pricing and availability.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700">
                <Info
                  className="h-4 w-4 shrink-0"
                  style={{ color: secondaryColor }}
                />
                Catalog showcase only &mdash; contact us directly to order
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Grid */}
        <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, origin, or category..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({normalizedProducts.length})
              </button>
              {categoryOptions.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === cat.slug
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  style={selectedCategory === cat.slug ? { backgroundColor: secondaryColor } : undefined}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${encodeURIComponent(product.slug)}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-[#16385D] transition-colors"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    {product.categories[0] && (
                      <span className="absolute top-3 left-3 rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {product.categories[0]}
                      </span>
                    )}
                    {product.images?.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                        <ImageIcon className="w-3 h-3 text-amber-300" />
                        {product.images.length} Photos
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-[#16385D] transition-colors line-clamp-1">
                      {product.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 flex-1">
                      {product.description || 'Imported product available for wholesale inquiry.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="font-medium text-slate-500">
                        {product.origin ? `Origin: ${product.origin}` : 'Contact for Price & MOQ'}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-semibold"
                        style={{ color: secondaryColor }}
                      >
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900">
                No Matching Products Found
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                {items.length === 0
                  ? 'No published products yet. Add products under the Products module in your admin dashboard.'
                  : 'Try clearing your search or switching to a different category filter.'}
              </p>
            </div>
          )}
        </section>
      </main>

      <FrontendFooter settings={settings} />
    </div>
  )
}
