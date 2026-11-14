'use client'

import Link from 'next/link'
import { Plus, Search, FileText, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useGetPagesQuery, useDeletePageMutation } from '@/store/services/pagesApi'
import { usePermission } from '@/hooks/usePermission'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'

export function PagesList() {
  const { can } = usePermission()
  const canCreate = can('pages:create')
  const canUpdate = can('pages:update')
  const canDelete = can('pages:delete')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: res, isLoading } = useGetPagesQuery({ page, q: debouncedSearch || undefined })
  const [deletePage, { isLoading: deleting }] = useDeletePageMutation()

  const pages = res?.data || []
  const pagination = res?.pagination

  async function handleDelete() {
    if (!deleteTarget) return
    await deletePage(deleteTarget._id)
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (val, row) => {
        if (canUpdate) {
          return (
            <Link href={`/dashboard/pages/${row._id}`} className="font-medium text-purple-600 hover:text-purple-700">
              {val}
            </Link>
          )
        }
        return <span className="font-medium text-slate-800">{val}</span>
      },
    },
    { key: 'slug', label: 'Slug' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', label: 'Created At', render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: '',
      className: 'text-right w-24',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <ApiEndpointsBadge
            variant="pill"
            title="Page APIs"
            endpoints={[
              {
                label: 'Page Layout (Admin)',
                path: `/api/admin/pages/${row._id}`,
                isPublic: false,
                description: 'Fetch complete page sections configuration',
              },
              {
                label: 'Public Page Feed',
                path: `/api/public/pages/${row.slug}`,
                isPublic: true,
                description: 'Public page endpoint for client sites',
              },
            ]}
          />
          {row.status === 'published' && (
            <a
              href={`/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit live page on frontend"
              className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-emerald-50 transition text-xs font-semibold flex items-center gap-1"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {canUpdate && (
            <Link href={`/dashboard/pages/${row._id}`} className="text-slate-400 hover:text-purple-600 p-1.5 rounded-md hover:bg-purple-50 transition text-xs font-semibold">
              Edit
            </Link>
          )}
          {canDelete && (
            <button type="button" onClick={() => setDeleteTarget(row)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition text-xs font-semibold">
              Delete
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Build and organize flexible page layouts"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages' }]}
        apiEndpoints={[
          {
            label: 'All Pages (Admin)',
            path: '/api/admin/pages',
            isPublic: false,
            description: 'Returns list of all pages and layouts',
          },
        ]}
        actions={
          canCreate ? (
            <Link href="/dashboard/pages/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition">
              <Plus className="w-4 h-4" /> Create Page
            </Link>
          ) : null
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search pages..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {!isLoading && pages.length === 0 && !search ? (
        <EmptyState
          icon={FileText}
          title="No Pages"
          description="Create your first dynamic page using the page builder."
          action={
            canCreate ? (
              <Link href="/dashboard/pages/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl">
                <Plus className="w-4 h-4" /> Create Page
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={pages}
            loading={isLoading}
            emptyMessage="No pages found matching your query."
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
