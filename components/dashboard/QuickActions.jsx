'use client'

import Link from 'next/link'
import { Boxes, Image, Users, Sparkles, ArrowRight, Zap } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

const ACTIONS = [
  {
    label: 'Create Module',
    description: 'Define a new dynamic content schema',
    href: '/dashboard/modules/new',
    icon: Boxes,
    color: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70',
    perm: 'modules:create',
  },
  {
    label: 'Design Page Builder',
    description: 'Build responsive layouts visually',
    href: '/dashboard/builder/new',
    icon: Sparkles,
    color: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70',
    perm: 'pages:create',
  },
  {
    label: 'Upload Media',
    description: 'Organize images & files in folders',
    href: '/dashboard/media',
    icon: Image,
    color: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70',
    perm: 'media:upload',
  },
  {
    label: 'Add User',
    description: 'Invite team members & assign roles',
    href: '/dashboard/users',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70',
    perm: 'users:create',
  },
]

export function QuickActions() {
  const { can } = usePermission()
  const visibleActions = ACTIONS.filter((a) => !a.perm || can(a.perm))

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">Quick Actions</h2>
          <p className="text-xs text-slate-400">Jump straight into common tasks</p>
        </div>
      </div>

      {visibleActions.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No quick actions available for your role.</p>
      ) : (
        <div className="space-y-2.5">
          {visibleActions.map(({ label, description, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-violet-200 hover:shadow-xs transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors block">
                  {label}
                </span>
                <span className="text-xs text-slate-400 block truncate">{description}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
