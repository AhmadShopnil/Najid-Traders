import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'

export function PageHeader({ title, description, subtitle, actions, breadcrumbs, apiEndpoints, className }) {
  const desc = description || subtitle
  return (
    <div className={cn('mb-6 pb-5 border-b border-slate-200/70', className)}>
      {breadcrumbs?.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-violet-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {desc && <p className="text-slate-500 mt-1 text-sm leading-relaxed">{desc}</p>}
        </div>
        {(actions || apiEndpoints) && (
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {apiEndpoints && <ApiEndpointsBadge endpoints={apiEndpoints} />}
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
