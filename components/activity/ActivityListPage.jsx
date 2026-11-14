'use client'

import { useState } from 'react'
import {
  History,
  Search,
  Clock,
  Layers,
  FileText,
  Boxes,
  Image as ImageIcon,
  Users,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useGetActivitiesQuery } from '@/store/services/activitiesApi'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime, cn } from '@/lib/utils'

const ACTION_COLORS = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  publish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  upload: 'bg-blue-50 text-blue-700 border-blue-200',
  update: 'bg-amber-50 text-amber-700 border-amber-200',
  assign: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  remove: 'bg-red-50 text-red-700 border-red-200',
  unpublish: 'bg-slate-50 text-slate-700 border-slate-200',
  archive: 'bg-slate-50 text-slate-700 border-slate-200',
}

export function ActivityListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [entityType, setEntityType] = useState('all')
  const [action, setAction] = useState('all')

  const { data: res, isLoading } = useGetActivitiesQuery({
    page,
    limit: 20,
    entityType: entityType !== 'all' ? entityType : undefined,
    action: action !== 'all' ? action : undefined,
    q: debouncedSearch || undefined,
  })

  const activities = res?.data || []
  const pagination = res?.pagination

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Comprehensive audit trail of all actions across your CMS"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Activity Log' },
        ]}
        apiEndpoints={[
          {
            label: 'Activities API (Admin)',
            path: '/api/admin/activities',
            isPublic: false,
            description: 'Returns paginated audit log with filter query options',
          },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by title, description, or user..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value)
                setPage(1)
              }}
              className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Entity Types</option>
              <option value="content">Content</option>
              <option value="module">Modules</option>
              <option value="page">Pages</option>
              <option value="media">Media</option>
              <option value="user">Users</option>
              <option value="setting">Settings</option>
              <option value="role">Roles (RBAC)</option>
              <option value="group">Groups (RBAC)</option>
            </select>

            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="publish">Published</option>
              <option value="upload">Uploaded</option>
              <option value="assign">Assigned</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 px-4">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No activities found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Actions will automatically appear here whenever content, modules, pages, media, or settings are created or updated.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((item) => {
              const actionColor = ACTION_COLORS[item.action] || 'bg-slate-50 text-slate-700 border-slate-200'

              return (
                <div
                  key={item._id}
                  className="p-4 hover:bg-slate-50/80 transition flex items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {item.user?.avatar ? (
                        <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover rounded-xl" />
                      ) : item.user?.name ? (
                        item.user.name.charAt(0).toUpperCase()
                      ) : (
                        'U'
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.user?.name || 'System User'}
                        </span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', actionColor)}>
                          {item.action}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{item.entityType}</span>
                      </div>

                      <p className="text-xs text-slate-700 mt-0.5 font-medium truncate">
                        {item.description || item.entityTitle || 'CMS Action'}
                      </p>

                      {item.entityTitle && item.description !== item.entityTitle && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          Target: {item.entityTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(item.createdAt)}
                    </span>
                    {item.user?.role && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.user.role}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
