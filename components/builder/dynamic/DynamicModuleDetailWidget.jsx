'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Share2,
  Printer,
  Check,
  User,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import {
  extractItemFields,
  buildDetailHref,
  buildPreviewItemsForModule,
  isPreviewEntry,
} from './helpers'

export function DynamicModuleDetailWidget({ props = {}, dynamicContext = null }) {
  const {
    moduleSlug: rawModuleSlug = '',
    previewItemId = '',
    showBreadcrumbs = true,
    showCategoryBadges = true,
    showAuthorAndDate = true,
    showShareButtons = true,
    showFeaturedImage = true,
    showExtraFields = true,
    showGallery = true,
    showRelated = true,
    relatedTitle = '',
    relatedCount = 3,
    detailPageSlug = '',
  } = props

  const contextItem = dynamicContext?.contentItem || null
  const [resolvedSlug, setResolvedSlug] = useState(dynamicContext?.moduleSlug || rawModuleSlug)
  const [item, setItem] = useState(contextItem)
  const [loading, setLoading] = useState(!contextItem)
  const [copied, setCopied] = useState(false)
  const [usingSample, setUsingSample] = useState(false)

  useEffect(() => {
    if (dynamicContext?.moduleSlug || rawModuleSlug) {
      setResolvedSlug(dynamicContext?.moduleSlug || rawModuleSlug)
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
  }, [dynamicContext?.moduleSlug, rawModuleSlug])

  useEffect(() => {
    if (contextItem) {
      setItem(contextItem)
      setLoading(false)
      setUsingSample(false)
      return
    }

    let isMounted = true
    async function fetchSingleItem() {
      if (!resolvedSlug) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        let targetId = previewItemId
        let targetMod = resolvedSlug

        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search)
          if (sp.get('id') || sp.get('item')) {
            targetId = sp.get('id') || sp.get('item')
          }
          if (sp.get('module')) {
            targetMod = sp.get('module')
          }
        }

        const idToFetch = targetId?.trim() ? targetId.trim() : 'latest'
        const res = await fetch(
          `/api/public/${encodeURIComponent(targetMod)}/${encodeURIComponent(idToFetch)}`
        )
        const json = await res.json()
        if (!isMounted) return

        if (json?.success && json.data) {
          setItem(json.data)
          setUsingSample(false)
        } else {
          const modRes = await fetch(`/api/public/${encodeURIComponent(targetMod)}?limit=1`)
          const modJson = await modRes.json()
          const modInfo = modJson?.meta?.module || { name: targetMod, slug: targetMod, fields: [] }
          const taxList = modJson?.meta?.taxonomies || []
          const sampleList = buildPreviewItemsForModule(modInfo, taxList, 4)

          setItem({
            ...sampleList[0],
            module: modInfo,
            content: `This is a preview of the Single Detail Page for your "${modInfo.name}" module.\n\nWhen a visitor opens any item from this module, its title, featured image, categories, full description, and all custom fields will dynamically render here.`,
            relatedItems: sampleList.slice(1, 4),
          })
          setUsingSample(true)
        }
      } catch {
        if (isMounted) {
          const sampleList = buildPreviewItemsForModule({ name: resolvedSlug, slug: resolvedSlug }, [], 4)
          setItem({
            ...sampleList[0],
            relatedItems: sampleList.slice(1, 4),
          })
          setUsingSample(true)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSingleItem()
    return () => {
      isMounted = false
    }
  }, [contextItem, resolvedSlug, previewItemId])

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse py-4">
        <div className="h-4 w-48 bg-slate-100 rounded" />
        <div className="h-9 w-4/5 bg-slate-100 rounded" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
        <div className="aspect-video w-full bg-slate-100 rounded-3xl" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!item) return null

  const moduleName = item.module?.name || resolvedSlug || 'Content'
  const moduleFields = item.module?.fields || []
  const parsed = extractItemFields(item, props, moduleFields)
  const relatedList = (item.relatedItems || []).slice(0, relatedCount || 3)
  const effectiveRelatedTitle = relatedTitle?.trim() || `Related ${moduleName}`

  function handleCopyLink() {
    if (typeof window === 'undefined') return
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="space-y-6 text-slate-900">
      {usingSample && (
        <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
          📄 <strong>Single Module Detail Preview ({moduleName}):</strong> On the live page, clicking any item will dynamically display all fields and full content for that specific entry.
        </div>
      )}

      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-purple-600 font-medium">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${resolvedSlug}`} className="capitalize font-medium text-slate-700 hover:text-purple-600">
            {moduleName}
          </Link>
          {parsed.categories[0] && (
            <>
              <span>/</span>
              <span className="font-semibold text-purple-600">{parsed.categories[0].name}</span>
            </>
          )}
        </nav>
      )}

      {/* Category Badges */}
      {showCategoryBadges && parsed.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {parsed.categories.map((cat) => (
            <span
              key={cat.id}
              className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-xs"
              style={{ backgroundColor: cat.color || '#7c3aed' }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Title / Heading */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.2] tracking-tight">
        {parsed.title}
      </h1>

      {/* Author, Date & Share Bar */}
      {(showAuthorAndDate || showShareButtons) && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 border-y border-slate-200">
          {showAuthorAndDate && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  {parsed.author && <span className="font-bold text-slate-900 block">{parsed.author}</span>}
                  {parsed.publishedAt && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(parsed.publishedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {showShareButtons && (
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Share / Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Print"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Featured Image */}
      {showFeaturedImage && parsed.image && (
        <figure className="rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
          <img
            src={parsed.image}
            alt={parsed.title}
            className="w-full max-h-[540px] object-cover"
          />
        </figure>
      )}

      {/* Extra Custom Module Fields */}
      {showExtraFields && parsed.extraFields.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {parsed.extraFields.map((ef, idx) => (
            <div
              key={idx}
              className={cn(
                'bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col',
                ef.type === 'richtext' && 'sm:col-span-2 md:col-span-3'
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {ef.label}
              </span>
              {ef.type === 'richtext' || /<[a-z][\s\S]*>/i.test(String(ef.value)) ? (
                <div
                  className="mt-1.5 rich-text-content prose prose-slate text-sm text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(ef.value)) }}
                />
              ) : (
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {String(ef.value)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Content / Description Body */}
      {parsed.fullContent && (
        <div className="prose prose-slate rich-text-content max-w-none text-base sm:text-lg text-slate-800 leading-[1.85] space-y-4">
          {/<[a-z][\s\S]*>/i.test(parsed.fullContent) ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed.fullContent) }} />
          ) : (
            parsed.fullContent
              .split('\n')
              .filter(Boolean)
              .map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))
          )}
        </div>
      )}

      {/* Gallery Images */}
      {showGallery && parsed.gallery.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">
            Gallery
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {parsed.gallery.map((imgUrl, gIdx) => (
              <div key={gIdx} className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={imgUrl} alt={`${parsed.title} ${gIdx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Items Section */}
      {showRelated && relatedList.length > 0 && (
        <div className="pt-8 mt-8 border-t border-slate-200 space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-purple-600" />
            <h3 className="text-xl font-extrabold text-slate-900">{effectiveRelatedTitle}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedList.map((rel, rIdx) => {
              const relParsed = extractItemFields(rel, props, moduleFields)
              const relHref = buildDetailHref(rel, resolvedSlug, detailPageSlug)
              const previewOnly = isPreviewEntry(rel)
              return (
                <Link
                  key={relParsed.id || rIdx}
                  href={relHref}
                  onClick={previewOnly ? (e) => e.preventDefault() : undefined}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition group flex flex-col justify-between"
                >
                  <div>
                    {relParsed.image && (
                      <div className="aspect-16/10 overflow-hidden bg-slate-100">
                        <img
                          src={relParsed.image}
                          alt={relParsed.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {relParsed.categories[0] && (
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white mb-1.5"
                          style={{ backgroundColor: relParsed.categories[0].color || '#7c3aed' }}
                        >
                          {relParsed.categories[0].name}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition line-clamp-2">
                        {relParsed.title}
                      </h4>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}
