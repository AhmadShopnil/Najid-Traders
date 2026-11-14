'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ArrowRight,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import {
  extractItemFields,
  buildDetailHref,
  buildPreviewItemsForModule,
  isPreviewEntry,
} from './helpers'

export function DynamicModuleFeedWidget({ props = {} }) {
  const {
    moduleSlug: rawModuleSlug = '',
    title = '',
    subtitle = '',
    layout = 'grid', // 'grid' | 'magazine' | 'list' | 'compact'
    columns = 3,
    limit = 6,
    categoryMode = 'all', // 'all' | 'specific' | 'selected' | 'url'
    categoryFilter = '',
    selectedCategories = [],
    showCategoryTabs = true,
    showSearch = false,
    showPagination = true,
    showImage = true,
    showCategoryBadge = true,
    showDate = true,
    showExcerpt = true,
    showCustomFields = true,
    readMoreText = 'Read More',
    detailPageSlug = '',
  } = props

  const selectedCategoriesList = useMemo(() => {
    if (Array.isArray(selectedCategories)) {
      return selectedCategories.map((c) => String(c).trim()).filter(Boolean)
    }
    if (typeof selectedCategories === 'string' && selectedCategories.trim()) {
      return selectedCategories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    }
    return []
  }, [selectedCategories])

  const selectedCategoriesKey = selectedCategoriesList.join('|')

  const [resolvedSlug, setResolvedSlug] = useState(rawModuleSlug)
  const [items, setItems] = useState([])
  const [moduleMeta, setModuleMeta] = useState(null)
  const [taxonomies, setTaxonomies] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  const [activeCategory, setActiveCategory] = useState(() => {
    if (categoryMode === 'specific' && categoryFilter) return categoryFilter
    return 'all'
  })
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Resolve moduleSlug automatically from /api/public/modules if empty
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

  // Sync category mode cleanly without skipping setPage(1)
  useEffect(() => {
    let nextCat = 'all'
    if (categoryMode === 'specific') {
      nextCat = categoryFilter || 'all'
    } else if (categoryMode === 'selected') {
      nextCat = 'all'
    } else if (categoryMode === 'url' || categoryMode === 'all') {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        const urlCat = sp.get('category') || sp.get('term')
        if (urlCat) nextCat = urlCat
      }
    }
    setActiveCategory(nextCat)
    setPage(1)
  }, [categoryMode, categoryFilter, selectedCategoriesKey, resolvedSlug])

  useEffect(() => {
    let isMounted = true
    async function fetchFeed() {
      if (!resolvedSlug) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(limit || 6))
        params.set('page', String(page))
        if (activeCategory && activeCategory !== 'all') {
          params.set('category', activeCategory)
        } else if (categoryMode === 'selected' && selectedCategoriesList.length > 0) {
          params.set('category', selectedCategoriesList.join(','))
        }
        if (appliedSearch) {
          params.set('q', appliedSearch)
        }

        const res = await fetch(`/api/public/${encodeURIComponent(resolvedSlug)}?${params.toString()}`)
        const json = await res.json()

        if (!isMounted) return

        if (json?.success && Array.isArray(json.data)) {
          const modInfo = json.meta?.module || null
          const taxList = json.meta?.taxonomies || []
          setModuleMeta(modInfo)
          setTaxonomies(taxList)
          setPagination(json.pagination || null)

          if (
            json.data.length === 0 &&
            page === 1 &&
            !appliedSearch &&
            activeCategory === 'all' &&
            (categoryMode !== 'selected' || selectedCategoriesList.length === 0)
          ) {
            setItems(buildPreviewItemsForModule(modInfo, taxList, Math.min(limit || 4, 4)))
            setUsingFallback(true)
          } else {
            setItems(json.data)
            setUsingFallback(false)
          }
        } else {
          const fallbackItems = buildPreviewItemsForModule({ name: resolvedSlug, slug: resolvedSlug }, [], Math.min(limit || 4, 4))
          setItems(fallbackItems)
          setUsingFallback(true)
        }
      } catch {
        if (isMounted) {
          const fallbackItems = buildPreviewItemsForModule({ name: resolvedSlug, slug: resolvedSlug }, [], Math.min(limit || 4, 4))
          setItems(fallbackItems)
          setUsingFallback(true)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFeed()
    return () => {
      isMounted = false
    }
  }, [resolvedSlug, limit, page, activeCategory, categoryMode, selectedCategoriesKey, appliedSearch])

  const allTerms = useMemo(() => {
    const list = []
    taxonomies.forEach((tax) => {
      ;(tax.terms || []).forEach((t) => {
        list.push({ ...t, taxSlug: tax.slug, taxName: tax.name })
      })
    })
    return list
  }, [taxonomies])

  const visibleTerms = useMemo(() => {
    if (categoryMode === 'selected' && selectedCategoriesList.length > 0) {
      const lowerSet = new Set(selectedCategoriesList.map((s) => s.toLowerCase()))
      return allTerms.filter(
        (t) =>
          lowerSet.has(String(t.slug || '').toLowerCase()) ||
          lowerSet.has(String(t.id || '').toLowerCase())
      )
    }
    return allTerms
  }, [allTerms, categoryMode, selectedCategoriesList])

  const activeTermObj = useMemo(() => {
    if (!activeCategory || activeCategory === 'all') return null
    return allTerms.find(
      (t) =>
        String(t.id).toLowerCase() === String(activeCategory).toLowerCase() ||
        String(t.slug).toLowerCase() === String(activeCategory).toLowerCase()
    )
  }, [allTerms, activeCategory])

  const moduleFields = moduleMeta?.fields || []
  const displayTitle =
    title?.trim() ||
    (activeTermObj && categoryMode === 'url'
      ? `${activeTermObj.name} — ${moduleMeta?.name || resolvedSlug}`
      : moduleMeta?.name || '')

  const normalizedItems = useMemo(() => {
    return items.map((raw) => ({
      raw,
      parsed: extractItemFields(raw, props, moduleFields),
    }))
  }, [items, props, moduleFields])

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="space-y-6 text-slate-900">
      {(displayTitle || subtitle || (showCategoryTabs && categoryMode !== 'specific' && visibleTerms.length > 0) || showSearch || activeTermObj) && (
        <div className="space-y-4 border-b border-slate-200 pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {displayTitle && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-1.5 h-6 rounded-full bg-purple-600 shrink-0" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {displayTitle}
                  </h2>
                  {activeTermObj && (
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: activeTermObj.color || '#7c3aed' }}
                    >
                      {activeTermObj.name}
                    </span>
                  )}
                </div>
              )}
              {subtitle && <p className="text-sm text-slate-500 mt-1 ml-4">{subtitle}</p>}
            </div>

            {showSearch && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setPage(1)
                  setAppliedSearch(searchInput.trim())
                }}
                className="flex items-center gap-1.5 w-full md:w-72"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Search ${moduleMeta?.name || 'items'}...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                </div>
                {appliedSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setAppliedSearch('')
                      setPage(1)
                    }}
                    className="text-[11px] text-red-500 hover:underline px-1"
                  >
                    Clear
                  </button>
                )}
              </form>
            )}
          </div>

          {showCategoryTabs && categoryMode !== 'specific' && visibleTerms.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all')
                  setPage(1)
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
                  activeCategory === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <span>All</span>
              </button>
              {visibleTerms.map((term) => {
                const isActive =
                  String(activeCategory).toLowerCase() === String(term.id).toLowerCase() ||
                  String(activeCategory).toLowerCase() === String(term.slug).toLowerCase()
                return (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(term.slug || term.id)
                      setPage(1)
                    }}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: term.color || '#8b5cf6' }}
                    />
                    <span>{term.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {usingFallback && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
          <span>
            💡 <strong>Preview Mode:</strong> Showing sample preview data for{' '}
            <code>&quot;{moduleMeta?.name || resolvedSlug}&quot;</code> because no published entries exist yet.
          </span>
        </div>
      )}

      {loading ? (
        <div className={cn('grid gap-6', layout === 'compact' ? 'grid-cols-1' : gridColsClass)}>
          {Array.from({ length: Math.min(limit || 3, 6) }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse">
              {layout !== 'compact' && <div className="w-full aspect-16/10 bg-slate-100 rounded-xl" />}
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-5 w-4/5 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : normalizedItems.length === 0 ? (
        <div className="py-12 px-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            No {moduleMeta?.name || 'items'} found in this category
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Module: <code className="font-mono text-purple-600">{moduleMeta?.name || resolvedSlug}</code>
            {activeTermObj ? ` • Category: ${activeTermObj.name}` : ''}
          </p>
          {activeCategory !== 'all' && categoryMode !== 'specific' && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all')
                setPage(1)
              }}
              className="mt-3 px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
            >
              View All {moduleMeta?.name || 'Items'}
            </button>
          )}
        </div>
      ) : layout === 'compact' ? (
        <div className="divide-y divide-slate-200/80">
          {normalizedItems.map(({ raw, parsed }, idx) => {
            const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
            const previewOnly = isPreviewEntry(raw)
            return (
              <Link
                key={parsed.id || idx}
                href={href}
                onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 group hover:bg-slate-50/80 rounded-xl p-1.5 transition"
              >
                {showImage && parsed.image ? (
                  <img
                    src={parsed.image}
                    alt={parsed.title}
                    className="w-20 h-16 rounded-xl object-cover shrink-0 bg-slate-100 group-hover:scale-105 transition"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {showCategoryBadge && parsed.categories[0] && (
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: parsed.categories[0].color || '#7c3aed' }}
                    >
                      {parsed.categories[0].name}
                    </span>
                  )}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-600 transition line-clamp-2 leading-snug">
                    {parsed.title}
                  </h4>
                  {showDate && parsed.publishedAt && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {formatDate(parsed.publishedAt)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : layout === 'list' ? (
        <div className="space-y-4">
          {normalizedItems.map(({ raw, parsed }, idx) => {
            const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
            const previewOnly = isPreviewEntry(raw)
            return (
              <div
                key={parsed.id || idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-purple-300 hover:shadow-lg transition flex flex-col sm:flex-row gap-5 items-start sm:items-center group"
              >
                {showImage && parsed.image && (
                  <Link
                    href={href}
                    onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                    className="w-full sm:w-60 aspect-16/10 rounded-xl overflow-hidden bg-slate-100 shrink-0"
                  >
                    <img
                      src={parsed.image}
                      alt={parsed.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {showCategoryBadge &&
                      parsed.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cat.color || '#7c3aed' }}
                        >
                          {cat.name}
                        </span>
                      ))}
                    {showDate && parsed.publishedAt && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(parsed.publishedAt)}
                      </span>
                    )}
                  </div>
                  <Link href={href} onClick={previewOnly ? (e) => e.preventDefault() : undefined}>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-purple-600 transition leading-snug">
                      {parsed.title}
                    </h3>
                  </Link>
                  {showExcerpt && parsed.excerpt && (
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {parsed.excerpt}
                    </p>
                  )}
                  {showCustomFields && parsed.extraFields.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {parsed.extraFields.slice(0, 4).map((ef, eIdx) => (
                        <span
                          key={eIdx}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                        >
                          <strong className="text-slate-500">{ef.label}:</strong> {ef.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-1">
                    <Link
                      href={href}
                      onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
                    >
                      <span>{readMoreText || 'Read More'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : layout === 'magazine' && normalizedItems.length >= 2 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {(() => {
              const { raw, parsed } = normalizedItems[0]
              const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
              const previewOnly = isPreviewEntry(raw)
              return (
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition group flex flex-col justify-between">
                  <div>
                    {showImage && parsed.image && (
                      <Link
                        href={href}
                        onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                        className="block aspect-16/9 overflow-hidden bg-slate-100"
                      >
                        <img
                          src={parsed.image}
                          alt={parsed.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </Link>
                    )}
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {showCategoryBadge &&
                          parsed.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="text-[11px] font-bold px-3 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: cat.color || '#7c3aed' }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        {showDate && parsed.publishedAt && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(parsed.publishedAt)}
                          </span>
                        )}
                      </div>
                      <Link href={href} onClick={previewOnly ? (e) => e.preventDefault() : undefined}>
                        <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-purple-600 transition leading-tight mb-3">
                          {parsed.title}
                        </h3>
                      </Link>
                      {showExcerpt && parsed.excerpt && (
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                          {parsed.excerpt}
                        </p>
                      )}
                      {showCustomFields && parsed.extraFields.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {parsed.extraFields.slice(0, 4).map((ef, eIdx) => (
                            <span
                              key={eIdx}
                              className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                            >
                              <strong className="text-slate-500">{ef.label}:</strong> {ef.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Link
                      href={href}
                      onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700"
                    >
                      <span>{readMoreText || 'Read More'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })()}

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {normalizedItems.slice(1, 4).map(({ raw, parsed }, sIdx) => {
                const href = buildDetailHref(raw, resolvedSlug, detailPageSlug)
                const previewOnly = isPreviewEntry(raw)
                return (
                  <Link
                    key={parsed.id || sIdx}
                    href={href}
                    onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition flex gap-4 items-center group flex-1"
                  >
                    {showImage && parsed.image && (
                      <div className="w-28 sm:w-32 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={parsed.image}
                          alt={parsed.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      {showCategoryBadge && parsed.categories[0] && (
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: parsed.categories[0].color || '#7c3aed' }}
                        >
                          {parsed.categories[0].name}
                        </span>
                      )}
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-purple-600 transition line-clamp-2 leading-snug">
                        {parsed.title}
                      </h4>
                      {showDate && parsed.publishedAt && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(parsed.publishedAt)}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {normalizedItems.length > 4 && (
            <div className={cn('grid gap-6 pt-2', gridColsClass)}>
              {normalizedItems.slice(4).map(({ raw, parsed }, idx) => (
                <ModuleCardItem
                  key={parsed.id || idx}
                  raw={raw}
                  parsed={parsed}
                  moduleSlug={resolvedSlug}
                  detailPageSlug={detailPageSlug}
                  showImage={showImage}
                  showCategoryBadge={showCategoryBadge}
                  showDate={showDate}
                  showExcerpt={showExcerpt}
                  showCustomFields={showCustomFields}
                  readMoreText={readMoreText}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={cn('grid gap-6', gridColsClass)}>
          {normalizedItems.map(({ raw, parsed }, idx) => (
            <ModuleCardItem
              key={parsed.id || idx}
              raw={raw}
              parsed={parsed}
              moduleSlug={resolvedSlug}
              detailPageSlug={detailPageSlug}
              showImage={showImage}
              showCategoryBadge={showCategoryBadge}
              showDate={showDate}
              showExcerpt={showExcerpt}
              showCustomFields={showCustomFields}
              readMoreText={readMoreText}
            />
          ))}
        </div>
      )}

      {showPagination && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={!pagination.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs font-bold text-slate-600 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function ModuleCardItem({
  raw,
  parsed,
  moduleSlug,
  detailPageSlug,
  showImage,
  showCategoryBadge,
  showDate,
  showExcerpt,
  showCustomFields,
  readMoreText,
}) {
  const href = buildDetailHref(raw, moduleSlug, detailPageSlug)
  const previewOnly = isPreviewEntry(raw)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-300 transition duration-300 flex flex-col justify-between group">
      <div>
        {showImage && parsed.image && (
          <Link
            href={href}
            onClick={previewOnly ? (e) => e.preventDefault() : undefined}
            className="block aspect-16/10 overflow-hidden bg-slate-100 relative"
          >
            <img
              src={parsed.image}
              alt={parsed.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            {showCategoryBadge && parsed.categories[0] && (
              <span
                className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-md"
                style={{ backgroundColor: parsed.categories[0].color || '#7c3aed' }}
              >
                {parsed.categories[0].name}
              </span>
            )}
          </Link>
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {(!showImage || !parsed.image) &&
              showCategoryBadge &&
              parsed.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: cat.color || '#7c3aed' }}
                >
                  {cat.name}
                </span>
              ))}
            {showDate && parsed.publishedAt && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(parsed.publishedAt)}
              </span>
            )}
          </div>
          <Link href={href} onClick={previewOnly ? (e) => e.preventDefault() : undefined}>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-purple-600 transition line-clamp-2 leading-snug mb-2">
              {parsed.title}
            </h3>
          </Link>
          {showExcerpt && parsed.excerpt && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {parsed.excerpt}
            </p>
          )}
          {showCustomFields && parsed.extraFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
              {parsed.extraFields.slice(0, 3).map((ef, eIdx) => (
                <span
                  key={eIdx}
                  className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                >
                  <span className="text-slate-400">{ef.label}:</span> {ef.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
          {parsed.author || ''}
        </span>
        <Link
          href={href}
          onClick={previewOnly ? (e) => e.preventDefault() : undefined}
          className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
        >
          <span>{readMoreText || 'Read More'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
