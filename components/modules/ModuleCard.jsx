'use client'

import Link from 'next/link'
import { Settings, Trash2, FileText, ToggleLeft, ToggleRight, Layers } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'

export function ModuleCard({ module, onDelete, onToggle }) {
  const { can } = usePermission()

  const canUpdate = can('modules:update')
  const canDelete = can('modules:delete')
  const canReadContent = can(['content:read', 'content:create', 'taxonomies:manage'])

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.1)] hover:border-violet-200 transition-all duration-200 flex flex-col justify-between',
        module.isActive ? 'border-slate-200/80' : 'border-slate-200/80 opacity-65'
      )}
    >
      <div>
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 ring-1 ring-violet-100 flex items-center justify-center text-2xl flex-shrink-0">
            {module.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 truncate tracking-tight">{module.name}</h3>
              {!module.isActive && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">/{module.slug}</p>
          </div>
        </div>
        {canUpdate && (
          <button
            onClick={onToggle}
            title={module.isActive ? 'Deactivate' : 'Activate'}
            className="text-slate-400 hover:text-purple-600 transition"
          >
            {module.isActive ? (
              <ToggleRight className="w-7 h-7 text-purple-600" />
            ) : (
              <ToggleLeft className="w-7 h-7" />
            )}
          </button>
        )}
      </div>
      {module.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{module.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1 font-medium text-slate-500">
          <Layers className="w-3.5 h-3.5 text-violet-500" />
          {module.fields?.length || 0} fields
        </span>
        <span>·</span>
        <span>{formatDate(module.createdAt)}</span>
      </div>
      </div>
      <div className="flex items-center gap-2">
        {canReadContent && module.isActive && (
          <Link
            href={`/dashboard/content/${module.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <FileText className="w-3.5 h-3.5" /> Content
          </Link>
        )}
        {canReadContent && !module.isActive && (
          <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed">
            <FileText className="w-3.5 h-3.5" /> Disabled
          </span>
        )}
        <ApiEndpointsBadge
          variant="pill"
          title={`${module.name} APIs`}
          endpoints={[
            {
              label: 'Module Schema (Admin)',
              path: `/api/admin/modules/${module._id}`,
              isPublic: false,
              description: 'Fetch fields, validations, and settings schema'
            },
            {
              label: 'Content Entries (Admin)',
              path: `/api/admin/contents?moduleId=${module._id}`,
              isPublic: false,
              description: 'Fetch all content records for this module'
            },
            {
              label: 'Public Content Feed',
              path: `/api/public/${module.slug}`,
              isPublic: true,
              description: 'Public REST endpoint (requires Allow Public Read)'
            }
          ]}
        />
        {canUpdate && (
          <Link
            href={`/dashboard/modules/${module._id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
          >
            <Settings className="w-3.5 h-3.5" /> Edit
          </Link>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
