'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, FolderTree } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import {
  extractItemFields,
  buildDetailHref,
  buildPreviewItemsForModule,
  isPreviewEntry,
} from './helpers'

export function DynamicModuleCategoriesWidget({ props = {} }) {
  const {
    moduleSlug: rawModuleSlug = '',
    title = '',
    subtitle = '',
    displayStyle = 'blocks', // 'blocks' | 'pills'
    columns = 2,
    itemsPerCategory = 4,
    selectedCategories = [],
    detailPageSlug = '',
    archivePageSlug = '',
  } = props

  const [resolvedSlug, setResolvedSlug] = useState(rawModuleSlug)
  const [items, setItems] = useState([])
  const [taxonomies, setTaxonomies] = useState([])
  const [moduleMeta, setModuleMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (rawModuleSlug) {
      setResolvedSlug(rawModuleSlug)
      return
    }
    let mounted = true
    fetch('/api/public/modules')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setResolvedSlug(json.data[0].slug)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [rawModuleSlug])

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!resolvedSlug) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/public/${encodeURIComponent(resolvedSlug)}?limit=100`)
        const json = await res.json()
        if (!isMounted) return

        if (json?.success && Array.isArray(json.data)) {
          const modInfo = json.meta?.module || null
          const fetchedTax = json.meta?.taxonomies || []
          setModuleMeta(modInfo)
          const hasTerms = fetchedTax.some((t) => (t.terms || []).length > 0)
          if (json.data.length === 0) {
            const defaultTax = hasTerms
              ? fetchedTax
              : [
                  {
                    id: 'sample-tax',
                    name: 'Categories',
                    slug: 'categories',
                    terms: [
                      { id: 'cat-1', name: 'Category 1', slug: 'category-1', color: '#7c3aed' },
                      { id: 'cat-2', name: 'Category 2', slug: 'category-2', color: '#059669' },
                    ],
                  },
                ]
            setTaxonomies(defaultTax)
            setItems(buildPreviewItemsForModule(modInfo, defaultTax, 4))
          } else {
            setItems(json.data)
            setTaxonomies(fetchedTax)
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [resolvedSlug])

  const allTerms = useMemo(() => {
    const list = []
    taxonomies.forEach((tax) => {
      ;(tax.terms || []).forEach((t) => {
        list.push({ ...t, taxSlug: tax.slug, taxName: tax.name })
      })
    })
    if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
      const lowerSet = new Set(selectedCategories.map((c) => String(c).toLowerCase()))
      return list.filter(
        (t) =>
          lowerSet.has(String(t.id || '').toLowerCase()) ||
          lowerSet.has(String(t.slug || '').toLowerCase())
      )
    }
    return list
  }, [taxonomies, selectedCategories])

  const moduleFields = moduleMeta?.fields || []
  const displayTitle =
    title?.trim() || (moduleMeta?.name ? `${moduleMeta.name} by Category` : '')

  const categoryGroups = useMemo(() => {
    return allTerms.map((term) => {
      const matching = items.filter((item) => {
        const resolved = item.resolvedCategories || []
        return resolved.some(
          (c) =>
            String(c.id).toLowerCase() === String(term.id).toLowerCase() ||
            String(c.slug).toLowerCase() === String(term.slug).toLowerCase()
        )
      })
      return {
        term,
        totalCount: matching.length,
        entries: matching.slice(0, itemsPerCategory || 4).map((raw) => ({
          raw,
          parsed: extractItemFields(raw, props, moduleFields),
        })),
      }
    })
  }, [allTerms, items, itemsPerCategory, props, moduleFields])

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns] || 'grid-cols-1 lg:grid-cols-2'

  const archiveBase = (archivePageSlug || resolvedSlug || '').replace(/^\/+/, '').trim()

  return (
    <div className="space-y-6 text-slate-900">
      {(displayTitle || subtitle) && (
        <div className="border-b border-slate-200 pb-3">
          {displayTitle && (
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-6 rounded-full bg-purple-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{displayTitle}</h2>
            </div>
          )}
          {subtitle && <p className="text-sm text-slate-500 mt-1 ml-4">{subtitle}</p>}
        </div>
      )}

      {loading ? (
        <div className={cn('grid gap-6', colClass)}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white animate-pulse space-y-4">
              <div className="h-5 w-32 bg-slate-100 rounded" />
              <div className="h-44 w-full bg-slate-100 rounded-xl" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : categoryGroups.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            No categories (taxonomy terms) have been added to module &quot;{moduleMeta?.name || resolvedSlug}&quot; yet
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Add categories in Module Settings or Content Editor to display category-grouped sections here.
          </p>
        </div>
      ) : displayStyle === 'pills' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryGroups.map(({ term, totalCount }) => {
            const catHref = archiveBase
              ? `/${archiveBase}?category=${encodeURIComponent(term.slug)}`
              : `?category=${encodeURIComponent(term.slug)}`
            return (
              <Link
                key={term.id}
                href={catHref}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: term.color || '#7c3aed' }}
                  />
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition">
                      {term.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {totalCount} {moduleMeta?.name || 'items'}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className={cn('grid gap-8', colClass)}>
          {categoryGroups.map(({ term, entries }) => {
            const catHref = archiveBase
              ? `/${archiveBase}?category=${encodeURIComponent(term.slug)}`
              : `?category=${encodeURIComponent(term.slug)}`

            return (
              <div
                key={term.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b-2 pb-3 mb-5" style={{ borderColor: term.color || '#7c3aed' }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: term.color || '#7c3aed' }}
                      />
                      <h3 className="text-lg font-extrabold text-slate-900">{term.name}</h3>
                    </div>
                    <Link
                      href={catHref}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {entries.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center italic">
                      No items published in this category yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const { raw, parsed } = entries[0]
                        const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
                        const previewOnly = isPreviewEntry(raw)
                        return (
                          <Link
                            href={href}
                            onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                            className="block group"
                          >
                            {parsed.image && (
                              <div className="aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 mb-3">
                                <img
                                  src={parsed.image}
                                  alt={parsed.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                              </div>
                            )}
                            <h4 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-purple-600 transition leading-snug">
                              {parsed.title}
                            </h4>
                            {parsed.excerpt && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                                {parsed.excerpt}
                              </p>
                            )}
                          </Link>
                        )
                      })()}

                      {entries.length > 1 && (
                        <div className="divide-y divide-slate-100 pt-2 border-t border-slate-100">
                          {entries.slice(1).map(({ raw, parsed }, idx) => {
                            const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
                            const previewOnly = isPreviewEntry(raw)
                            return (
                              <Link
                                key={parsed.id || idx}
                                href={href}
                                onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                                className="py-2.5 flex items-center gap-3 group"
                              >
                                {parsed.image && (
                                  <img
                                    src={parsed.image}
                                    alt={parsed.title}
                                    className="w-16 h-12 rounded-lg object-cover shrink-0 bg-slate-100"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-purple-600 transition line-clamp-2 leading-snug">
                                    {parsed.title}
                                  </h5>
                                  {parsed.publishedAt && (
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                      {formatDate(parsed.publishedAt)}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
