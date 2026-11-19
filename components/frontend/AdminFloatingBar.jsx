'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Sparkles, Edit3 } from 'lucide-react'

export function AdminFloatingBar({
  badgeText = '',
  permalink = '',
  primaryAction = null, // { label: string, href: string, icon?: any }
  secondaryAction = null, // { label: string, href: string, icon?: any }
}) {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="print:hidden fixed bottom-5 right-5 z-50 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/15 text-xs">
      <div className="flex items-center gap-2 pr-2 border-r border-white/15">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-200">{badgeText}</span>
        {permalink && (
          <span className="font-mono text-[11px] text-purple-300 bg-white/10 px-2 py-0.5 rounded-md">
            {permalink}
          </span>
        )}
      </div>

      {primaryAction && (
        <Link
          href={primaryAction.href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{primaryAction.label}</span>
        </Link>
      )}

      {secondaryAction && (
        <Link
          href={secondaryAction.href}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded-xl transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{secondaryAction.label}</span>
        </Link>
      )}
    </div>
  )
}
