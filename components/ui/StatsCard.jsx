import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

const COLOR_MAP = {
  purple: {
    icon: 'bg-indigo-50 text-[#5b5ce6] ring-1 ring-indigo-100',
    stroke: '#5b5ce6',
    fill: '#5b5ce6',
    trend: 'text-emerald-600',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
    stroke: '#0ea5e9',
    fill: '#0ea5e9',
    trend: 'text-sky-600',
  },
  green: {
    icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    stroke: '#10b981',
    fill: '#10b981',
    trend: 'text-emerald-600',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    stroke: '#f59e0b',
    fill: '#f59e0b',
    trend: 'text-amber-600',
  },
}

export function StatsCard({ label, value, icon: Icon, color = 'purple', trend, loading }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.purple
  const gradId = `spark-${color}`

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] hover:shadow-[0_10px_24px_-6px_rgba(91,92,230,0.12)] hover:border-indigo-200/80 transition-all duration-200">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', theme.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
          ) : (
            <p className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 mt-0.5 tabular-nums leading-tight">
              {value ?? 0}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        {trend ? (
          <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', theme.trend)}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{trend}</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">Live workspace count</span>
        )}

        {/* Mini Sparkline Wave */}
        <svg viewBox="0 0 96 28" className="w-24 h-7 flex-shrink-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.fill} stopOpacity="0.22" />
              <stop offset="100%" stopColor={theme.fill} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 22 C12 20, 18 14, 28 16 C38 18, 44 10, 56 12 C66 14, 76 6, 96 4 L96 28 L0 28 Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M0 22 C12 20, 18 14, 28 16 C38 18, 44 10, 56 12 C66 14, 76 6, 96 4"
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
