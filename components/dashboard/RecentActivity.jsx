import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function RecentActivity({ items, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <h2 className="font-bold text-slate-900 text-sm tracking-tight">Recent Activity on Content</h2>
        <p className="text-xs text-slate-400">Recently created or updated entries</p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !items?.length ? (
        <p className="text-slate-400 text-sm text-center py-10">No recent activity</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const modSlug = item.moduleId?.slug || item.moduleSlug
            const href = modSlug ? `/dashboard/content/${modSlug}/${item._id}` : '/dashboard'
            return (
              <Link
                key={item._id}
                href={href}
                className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                  {item.moduleId?.icon || '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.data?.title || item.data?.headline || item.data?.name || 'Untitled'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.moduleId?.name || modSlug || 'Content'} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
