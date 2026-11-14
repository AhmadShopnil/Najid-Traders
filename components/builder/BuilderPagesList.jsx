'use client'

import Link from 'next/link'
import { Plus, Search, Sparkles, ExternalLink, Trash2, Edit3, Eye, Layers } from 'lucide-react'
import { useState } from 'react'
import { useGetBuilderPagesQuery, useDeleteBuilderPageMutation } from '@/store/services/builderPagesApi'
import { useGetModulesQuery } from '@/store/services/modulesApi'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'

export function BuilderPagesList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const { data: res, isLoading, isError } = useGetBuilderPagesQuery({
    page,
    limit: 20,
    summary: true,
    q: debouncedSearch || undefined,
  })
  const needsAllSummary = Boolean(debouncedSearch) || page > 1
  const { data: allPagesRes } = useGetBuilderPagesQuery(
    { page: 1, limit: 100, summary: true },
    { skip: !needsAllSummary }
  )
  const { data: modulesRes } = useGetModulesQuery({ active: true })
  const [deletePage, { isLoading: deleting }] = useDeleteBuilderPageMutation()

  const pages = res?.data || []
  const allSummaryPages = needsAllSummary ? (allPagesRes?.data || pages) : pages
  const pagination = res?.pagination
  const activeModules = modulesRes?.data || []

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    try {
      await deletePage(deleteTarget._id).unwrap()
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err?.data?.message || err?.message || 'Failed to delete visual page')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Builder (Ready Web Pages)"
        description="Design fully-styled visual pages, module listing pages with filters, and single item detail templates."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Page Builder' },
        ]}
        actions={
          <Link
            href="/dashboard/builder/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Visual Page</span>
          </Link>
        }
      />

      {/* Dynamic Modules Quick Customize Section (Listing & Single Detail Templates) */}
      {activeModules.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Dynamic Module Pages & Auto Single Detail Templates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the listing page (with category filters & search) and the automatic single detail page (`/[module]/[slug]`) for any module.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {activeModules.map((mod) => {
              const feedPage = allSummaryPages.find(
                (p) =>
                  p.slug === mod.slug ||
                  (p.pageType === 'module_feed' && p.targetModule === mod.slug)
              )
              const singlePage = allSummaryPages.find(
                (p) =>
                  (p.pageType === 'single_template' && p.targetModule === mod.slug) ||
                  p.slug === `${mod.slug}-detail`
              )

              const feedBuilderHref = feedPage
                ? `/dashboard/builder/${feedPage._id}`
                : `/dashboard/builder/new?preset=module_feed&module=${encodeURIComponent(mod.slug)}`

              const singleBuilderHref = singlePage
                ? `/dashboard/builder/${singlePage._id}`
                : `/dashboard/builder/new?preset=single_template&module=${encodeURIComponent(mod.slug)}`

              return (
                <div
                  key={mod._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3 hover:border-purple-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl bg-white w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center shadow-2xs">
                        {mod.icon || '📦'}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{mod.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`/${mod.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-purple-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            /{mod.slug} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span className="text-slate-300">&bull;</span>
                          <a
                            href={`/${mod.slug}/latest`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-amber-700 hover:underline inline-flex items-center gap-0.5"
                          >
                            /{mod.slug}/[slug] <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={feedBuilderHref}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {feedPage ? 'Custom Feed Page' : 'Auto Feed Page'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 mt-0.5">
                        {feedPage ? 'Edit Listing Page' : 'Customize Listing'}
                      </span>
                    </Link>

                    <Link
                      href={singleBuilderHref}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        {singlePage ? 'Custom Single Page' : 'Auto Single Page'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-amber-800 mt-0.5">
                        Edit Detail Design
                      </span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Published pages are live at yoursite.com/[slug]</span>
        </div>
      </div>

      {/* Error Alert */}
      {(deleteError || isError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
          {deleteError || 'Failed to load visual pages. Please refresh and try again.'}
        </div>
      )}

      {/* Pages Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading visual pages...
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Custom Visual Pages Saved Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Create a new visual page or click any module above to customize its listing or single detail page.
          </p>
          <Link
            href="/dashboard/builder/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-4 h-4" /> Create First Page
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Page Title</th>
                  <th className="py-3 px-4">Page Role / Module</th>
                  <th className="py-3 px-4">Frontend URL</th>
                  <th className="py-3 px-4">Layout Blocks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pages.map((p) => {
                  const sectionCount = p.sections?.length || 0
                  const widgetCount = (p.sections || []).reduce(
                    (acc, sec) => acc + (sec.widgets?.length || 0),
                    0
                  )

                  const liveHref =
                    p.pageType === 'single_template' && p.targetModule
                      ? `/${p.targetModule}/latest`
                      : `/${p.slug}`

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/dashboard/builder/${p._id}`}
                          className="font-semibold text-slate-900 hover:text-purple-600 transition flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>{p.title}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {p.pageType === 'single_template' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            📰 Single Detail {p.targetModule ? `(${p.targetModule})` : ''}
                          </span>
                        ) : p.pageType === 'module_feed' || p.targetModule ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                            📦 Module Feed {p.targetModule ? `(${p.targetModule})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            📄 Standard Page
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {p.pageType === 'single_template' && p.targetModule
                          ? `/${p.targetModule}/[slug]`
                          : `/${p.slug}`}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <span className="font-medium text-slate-800">{sectionCount}</span> sections &bull;{' '}
                        <span className="font-medium text-slate-800">{widgetCount}</span> widgets
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'published' && (
                            <a
                              href={liveHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              title="Visit live page on frontend"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Live Visit</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Link
                            href={`/dashboard/builder/${p._id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Visual Page?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
