'use client'

import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { History, ArrowRight, User } from 'lucide-react'

const ACTION_BADGES = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  publish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  upload: 'bg-blue-50 text-blue-700 border-blue-200',
  update: 'bg-amber-50 text-amber-700 border-amber-200',
  assign: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  remove: 'bg-red-50 text-red-700 border-red-200',
  unpublish: 'bg-slate-100 text-slate-700 border-slate-200',
  archive: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function GlobalRecentActivities({ items, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight">CMS Activity Audit Log</h2>
            <p className="text-xs text-slate-400">Latest workspace changes across modules & users</p>
          </div>
        </div>
        <Link
          href="/dashboard/activity"
          className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition group"
        >
          View All Activities
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">No audit activities recorded yet</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.slice(0, 10).map((act) => {
            const badgeClass =
              ACTION_BADGES[act.action] || 'bg-slate-100 text-slate-700 border-slate-200'

            return (
              <div key={act._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 text-xs font-semibold overflow-hidden">
                    {act.user?.avatar ? (
                      <img
                        src={act.user.avatar}
                        alt={act.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {act.user?.name || 'User'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}
                      >
                        {act.action}
                      </span>
                      <span className="text-xs text-slate-500 font-medium capitalize">
                        {act.entityType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 truncate mt-0.5">
                      {act.entityTitle ? (
                        <span className="font-medium text-slate-800">
                          {act.entityTitle}
                        </span>
                      ) : (
                        act.description || 'Performed action'
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                  {formatDateTime(act.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
