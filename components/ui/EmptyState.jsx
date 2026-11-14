import { PackageOpen } from 'lucide-react'

export function EmptyState({ icon: Icon = PackageOpen, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/80 rounded-2xl border-2 border-dashed border-slate-200/90">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-slate-100 border border-slate-200/70 flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-8 h-8 text-violet-500" />
      </div>
      <h3 className="text-slate-900 font-semibold text-lg tracking-tight">{title}</h3>
      {description && <p className="text-slate-500 text-sm mt-1.5 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
