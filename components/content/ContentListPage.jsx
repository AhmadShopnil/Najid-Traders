'use client'

import Link from 'next/link'
import {
  Plus,
  Search,
  FileText,
  FolderTree,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  SlidersHorizontal,
  Package,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useGetContentsQuery, useDeleteContentMutation } from '@/store/services/contentsApi'
import { useGetModulesQuery } from '@/store/services/modulesApi'
import { useGetModuleTaxonomiesQuery } from '@/store/services/taxonomiesApi'
import { usePermission } from '@/hooks/usePermission'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, resolveContentSlug, cn } from '@/lib/utils'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'
import { TaxonomyManager } from '@/components/taxonomies/TaxonomyManager'

function extractPrimaryImage(row, fields = []) {
  const imageField = fields.find((f) => f.type === 'image' || f.type === 'gallery')
  if (!imageField) return ''
  const val = row.data?.[imageField.name]
  if (!val) return ''
  if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : val[0]?.url || ''
  if (typeof val === 'string') return val
  return val?.url || ''
}

function renderFieldValue(val, field) {
  if (val === undefined || val === null || val === '') {
    return <span className="text-slate-300">—</span>
  }

  let parsed = val
  if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
    try {
      parsed = JSON.parse(val)
    } catch {}
  }

  if (field?.type === 'keyvalue' && Array.isArray(parsed)) {
    if (parsed.length === 0) return <span className="text-slate-300">—</span>
    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {parsed.slice(0, 2).map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 text-slate-700 rounded-md border border-slate-200/80"
          >
            <span className="font-semibold">{item.key}:</span> {item.value}
          </span>
        ))}
        {parsed.length > 2 && (
          <span className="text-[11px] text-slate-400 font-medium self-center">
            +{parsed.length - 2}
          </span>
        )}
      </div>
    )
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return <span className="text-slate-300">—</span>
    return (
      <div className="flex flex-wrap gap-1">
        {parsed.slice(0, 3).map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md border border-slate-200/80"
          >
            {typeof item === 'object' ? item.key || JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    )
  }

  if (field?.type === 'boolean' || typeof parsed === 'boolean') {
    return parsed ? (
      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
        Yes
      </span>
    ) : (
      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-md border border-slate-200">
        No
      </span>
    )
  }

  if (typeof parsed === 'object') {
    return <span className="font-mono text-xs text-slate-600">{JSON.stringify(parsed)}</span>
  }

  return <span className="text-slate-700 text-xs font-medium">{String(parsed)}</span>
}

export function ContentListPage({ moduleSlug, initialTab = 'entries' }) {
  const { can } = usePermission()
  const canReadContent = can(['content:read', 'content:create'])
  const canCreate = can('content:create')
  const canUpdate = can('content:update')
  const canDelete = can('content:delete')
  const canReadModules = can(['modules:read', 'modules:create', 'modules:update'])
  const canUpdateModules = can('modules:update')
  const canManageCategories = can(['taxonomies:manage', 'modules:update', 'modules:create'])

  const resolvedDefaultTab =
    initialTab === 'categories' && canManageCategories
      ? 'categories'
      : !canReadContent && canManageCategories
        ? 'categories'
        : 'entries'

  const [activeTab, setActiveTab] = useState(resolvedDefaultTab)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function switchTab(nextTab) {
    setActiveTab(nextTab)
    if (typeof window !== 'undefined') {
      const targetUrl =
        nextTab === 'categories'
          ? `${window.location.pathname}?tab=categories`
          : window.location.pathname
      window.history.replaceState(null, '', targetUrl)
    }
  }

  const { data: modulesRes, isLoading: moduleLoading } = useGetModulesQuery()
  const module = modulesRes?.data?.find((m) => m.slug === moduleSlug)
  const moduleId = module?._id

  const { data: taxRes } = useGetModuleTaxonomiesQuery(moduleId, { skip: !moduleId })
  const taxonomies = taxRes?.data || []
  const allTerms = taxonomies.flatMap((tax) => tax.terms || [])

  const { data: contentsRes, isLoading: contentsLoading } = useGetContentsQuery(
    {
      moduleId,
      page,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      q: debouncedSearch || undefined,
    },
    { skip: !moduleId || !canReadContent }
  )

  const [deleteContent, { isLoading: deleting }] = useDeleteContentMutation()

  const contents = contentsRes?.data || []
  const pagination = contentsRes?.pagination
  const isLoading = moduleLoading || (canReadContent && contentsLoading)

  const kpis = useMemo(() => {
    const total = pagination?.total ?? contents.length
    const publishedCount = contents.filter((c) => c.status === 'published').length
    const draftCount = contents.filter((c) => c.status === 'draft').length
    return [
      {
        label: `Total ${module?.name || 'Entries'}`,
        value: total,
        icon: Layers,
        color: 'text-[#5b5ce6] bg-indigo-50',
      },
      {
        label: 'Published (Page)',
        value: publishedCount,
        icon: CheckCircle2,
        color: 'text-emerald-600 bg-emerald-50',
      },
      {
        label: 'Drafts (Page)',
        value: draftCount,
        icon: Clock,
        color: 'text-amber-600 bg-amber-50',
      },
      {
        label: 'Categories & Terms',
        value: `${taxonomies.length} / ${allTerms.length}`,
        icon: FolderTree,
        color: 'text-sky-600 bg-sky-50',
      },
    ]
  }, [pagination, contents, module?.name, taxonomies.length, allTerms.length])

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteContent(deleteTarget._id)
    setDeleteTarget(null)
  }

  if (!isLoading && !module) {
    return <div className="p-8 text-center text-slate-500">Module not found</div>
  }

  if (!isLoading && module && module.isActive === false) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
          {module.icon || '📦'}
        </div>
        <h2 className="text-lg font-bold text-slate-900">{module.name} is Currently Inactive</h2>
        <p className="text-sm text-slate-500">
          This module has been deactivated. Re-enable it in Module Management to access or manage
          its content.
        </p>
        {canReadModules && (
          <Link
            href="/dashboard/modules"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#5b5ce6] hover:bg-[#4c4dd4] text-white text-sm font-semibold rounded-xl transition"
          >
            Go to Modules
          </Link>
        )}
      </div>
    )
  }

  const fieldsToShow = module?.fields?.filter((f) => f.isListField) || []
  const listFields = fieldsToShow.length > 0 ? fieldsToShow : module?.fields?.slice(0, 5) || []
  const primaryTitleField =
    listFields.find((f) => f.name === 'title' || f.name === 'headline' || f.name === 'name') ||
    listFields[0]
  const hasImageField = (module?.fields || []).some(
    (f) => f.type === 'image' || f.type === 'gallery'
  )

  const columns = [
    {
      key: 'title',
      label: module?.name ? `${module.name} Item` : 'Item',
      render: (_, row) => {
        const rawTitle = primaryTitleField ? row.data?.[primaryTitleField.name] : null
        const title =
          typeof rawTitle === 'string'
            ? rawTitle
            : Array.isArray(rawTitle)
              ? rawTitle[0]
              : rawTitle
                ? String(rawTitle)
                : row.data?.title || row.data?.headline || row.data?.name || 'Untitled'
        const thumb = hasImageField ? extractPrimaryImage(row, module?.fields) : ''
        const slug = resolveContentSlug(row.data, module?.fields, row._id)

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            {hasImageField && (
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-center">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-slate-300" />
                )}
              </div>
            )}
            <div className="min-w-0">
              {canUpdate ? (
                <Link
                  href={`/dashboard/content/${moduleSlug}/${row._id}`}
                  className="font-semibold text-slate-900 hover:text-[#5b5ce6] transition-colors block truncate max-w-[260px]"
                >
                  {title || 'Untitled'}
                </Link>
              ) : (
                <span className="font-semibold text-slate-900 block truncate max-w-[260px]">
                  {title || 'Untitled'}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-mono truncate block max-w-[260px]">
                /{slug}
              </span>
            </div>
          </div>
        )
      },
    },
    ...listFields
      .filter(
        (f) =>
          f.name !== primaryTitleField?.name &&
          f.type !== 'image' &&
          f.type !== 'gallery'
      )
      .map((f) => ({
        key: f.name,
        label: f.label,
        render: (_, row) => renderFieldValue(row.data?.[f.name], f),
      })),
    ...(taxonomies.length > 0
      ? [
          {
            key: 'taxonomies',
            label: taxonomies.length === 1 ? taxonomies[0].name : 'Categories',
            render: (_, row) => {
              const rowTax = row.taxonomies || {}
              const termIds = Object.values(rowTax).flat().filter(Boolean).map(String)
              if (termIds.length === 0) return <span className="text-slate-300">—</span>
              const matched = allTerms.filter((t) => termIds.includes(String(t._id)))
              if (matched.length === 0) return <span className="text-slate-300">—</span>
              return (
                <div className="flex flex-wrap gap-1">
                  {matched.slice(0, 3).map((t) => (
                    <span
                      key={t._id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: t.color || '#5b5ce6' }}
                      />
                      {t.name}
                    </span>
                  ))}
                  {matched.length > 3 && (
                    <span className="text-[11px] text-slate-400 font-semibold self-center">
                      +{matched.length - 3}
                    </span>
                  )}
                </div>
              )
            },
          },
        ]
      : []),
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      label: 'Updated / Author',
      render: (val, row) => (
        <div className="text-xs">
          <p className="font-medium text-slate-700">{formatDate(val)}</p>
          <p className="text-[11px] text-slate-400">{row.author?.name || 'System'}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right w-40',
      cellClassName: 'text-right',
      render: (_, row) => {
        const itemSlug = resolveContentSlug(row.data, module?.fields, row._id)
        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {row.status === 'published' && (
              <a
                href={`/${moduleSlug}/${itemSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition"
                title={`View live at /${moduleSlug}/${itemSlug}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <ApiEndpointsBadge
              variant="pill"
              title="Entry APIs"
              endpoints={[
                {
                  label: 'Single Entry (Admin)',
                  path: `/api/admin/contents/${row._id}`,
                  isPublic: false,
                  description: 'Fetch this record data',
                },
                {
                  label: 'Single Entry by Slug (Public)',
                  path: `/api/public/${moduleSlug}/${itemSlug}`,
                  isPublic: true,
                  description: 'Public single entry endpoint (supports slug or ID)',
                },
              ]}
            />
            {canUpdate && (
              <Link
                href={`/dashboard/content/${moduleSlug}/${row._id}`}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#5b5ce6] hover:border-[#5b5ce6]/40 hover:bg-indigo-50/40 transition"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(row)
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/40 transition"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${module?.name || 'Loading...'}`}
        description={
          activeTab === 'categories'
            ? `Organize category systems, tags, and terms for ${module?.name || 'this module'}`
            : `Manage entries, specifications, and categories for ${module?.name || 'this module'}`
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          ...(canReadModules ? [{ label: 'Modules', href: '/dashboard/modules' }] : []),
          { label: module?.name || 'Module', href: `/dashboard/content/${moduleSlug}` },
          { label: activeTab === 'categories' ? 'Categories' : 'Entries' },
        ]}
        apiEndpoints={[
          {
            label: 'All Entries (Admin)',
            path: moduleId ? `/api/admin/contents?moduleId=${moduleId}` : '/api/admin/contents',
            isPublic: false,
            description: 'Returns paginated content entries',
          },
          {
            label: 'Public Content Feed',
            path: `/api/public/${moduleSlug}`,
            isPublic: true,
            description: 'Public JSON feed of published entries',
          },
          ...(moduleId
            ? [
                {
                  label: 'Module Taxonomies (Admin)',
                  path: `/api/admin/modules/${moduleId}/taxonomies`,
                  isPublic: false,
                  description: 'Manage module category systems & terms',
                },
                {
                  label: 'Public Taxonomies Feed',
                  path: `/api/public/${moduleSlug}/taxonomies`,
                  isPublic: true,
                  description: 'Public categories and nested terms',
                },
                ...(canReadModules
                  ? [
                      {
                        label: 'Module Schema (Admin)',
                        path: `/api/admin/modules/${moduleId}`,
                        isPublic: false,
                      },
                    ]
                  : []),
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {moduleId && canUpdateModules && (
              <Link
                href={`/dashboard/modules/${moduleId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Module Fields
              </Link>
            )}
            {canCreate && activeTab === 'entries' && (
              <Link
                href={`/dashboard/content/${moduleSlug}/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5b5ce6] hover:bg-[#4c4dd4] text-white text-sm font-semibold rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add {module?.name ? module.name.replace(/s$/i, '') : 'Entry'}
              </Link>
            )}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mode Tabs + Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {canManageCategories && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {canReadContent && (
                <button
                  type="button"
                  onClick={() => switchTab('entries')}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition',
                    activeTab === 'entries'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Entries</span>
                  {pagination?.total !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 font-bold">
                      {pagination.total}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => switchTab('categories')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition',
                  activeTab === 'categories'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <FolderTree className="w-3.5 h-3.5 text-[#5b5ce6]" />
                <span>Categories</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-50 text-[#5b5ce6] font-bold">
                  {taxonomies.length}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'entries' && (
            <div className="flex items-center gap-1.5">
              {['all', 'published', 'draft', 'archived'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st)
                    setPage(1)
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition',
                    statusFilter === st
                      ? 'bg-[#5b5ce6] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'entries' && (
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={`Search ${module?.name?.toLowerCase() || 'entries'}...`}
              className="w-full pl-10 pr-4 py-2 bg-[#f8f9fc] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] focus:bg-white transition"
            />
          </div>
        )}
      </div>

      {activeTab === 'categories' && canManageCategories ? (
        module ? (
          <TaxonomyManager module={module} />
        ) : null
      ) : (
        <>
          {!isLoading && contents.length === 0 && !debouncedSearch && statusFilter === 'all' ? (
            <EmptyState
              icon={FileText}
              title={`No ${module?.name || 'Content'} Yet`}
              description={`Create your first entry for ${module?.name}.`}
              action={
                canCreate ? (
                  <Link
                    href={`/dashboard/content/${moduleSlug}/new`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5b5ce6] hover:bg-[#4c4dd4] text-white text-sm font-semibold rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" /> Create Entry
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="space-y-4">
              <DataTable
                columns={columns}
                data={contents}
                loading={isLoading}
                emptyMessage="No entries found matching your current filter."
              />
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}

          <ConfirmDialog
            open={!!deleteTarget}
            title="Delete Entry"
            message="Are you sure you want to delete this entry? This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        </>
      )}
    </div>
  )
}
