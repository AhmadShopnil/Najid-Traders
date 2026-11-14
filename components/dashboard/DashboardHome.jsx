'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Boxes, FileText, Image, Users, Plus, BarChart3, PieChart } from 'lucide-react'
import { useGetStatsQuery } from '@/store/services/statsApi'
import { useI18n } from '@/hooks/useI18n'
import { usePermission } from '@/hooks/usePermission'
import { StatsCard } from '@/components/ui/StatsCard'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'
import { RecentActivity } from './RecentActivity'
import { GlobalRecentActivities } from './GlobalRecentActivities'
import { QuickActions } from './QuickActions'

function buildActivitySeries(activities = []) {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: 0,
    })
  }
  const byDay = new Map(days.map((d) => [d.key, d]))
  for (const act of activities) {
    if (!act?.createdAt) continue
    const key = new Date(act.createdAt).toISOString().slice(0, 10)
    const slot = byDay.get(key)
    if (slot) slot.count += 1
  }
  return days
}

function buildDistribution(stats) {
  const items = [
    { label: 'Content', value: stats?.totalContent || 0, color: '#10b981' },
    { label: 'Modules', value: stats?.totalModules || 0, color: '#5b5ce6' },
    { label: 'Media', value: stats?.totalMedia || 0, color: '#0ea5e9' },
    { label: 'Users', value: stats?.totalUsers || 0, color: '#f59e0b' },
  ]
  const total = items.reduce((sum, i) => sum + i.value, 0)
  return { items, total }
}

export function DashboardHome() {
  const { data: statsRes, isLoading } = useGetStatsQuery()
  const stats = statsRes?.data
  const { translate: t } = useI18n()
  const { can } = usePermission()

  const CARDS = [
    { key: 'totalModules', label: t('dashboard.totalModules'), icon: Boxes, color: 'purple', trend: 'Dynamic schemas' },
    { key: 'totalContent', label: t('dashboard.totalContent'), icon: FileText, color: 'green', trend: 'Published & drafts' },
    { key: 'totalMedia', label: t('dashboard.totalMedia'), icon: Image, color: 'blue', trend: 'Uploaded assets' },
    { key: 'totalUsers', label: t('dashboard.totalUsers'), icon: Users, color: 'amber', trend: 'Workspace team' },
  ]

  const activitySeries = useMemo(
    () => buildActivitySeries(stats?.recentActivities || []),
    [stats?.recentActivities]
  )
  const maxDayCount = Math.max(1, ...activitySeries.map((d) => d.count))

  const distribution = useMemo(() => buildDistribution(stats), [stats])

  // Compute SVG polyline points for 7-day chart
  const chartPoints = activitySeries.map((d, idx) => {
    const x = 24 + idx * (452 / 6)
    const y = 130 - (d.count / maxDayCount) * 95
    return { x, y, ...d }
  })
  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} 145 L ${chartPoints[0].x} 145 Z`

  // Donut arc segments
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let cumulativePct = 0

  return (
    <div className="space-y-6">
      {/* Clean SaaS Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Get detailed insights into your CMS modules, content, media, and team activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <ApiEndpointsBadge
            endpoints={[
              {
                label: 'CMS Stats & Metrics (Admin)',
                path: '/api/admin/stats',
                isPublic: false,
                description: 'Aggregated metrics for modules, content, media, users and recent items',
              },
              {
                label: 'Audit Activity Log (Admin)',
                path: '/api/admin/activities',
                isPublic: false,
                description: 'Full CMS activity trail across content, modules, media, and users',
              },
            ]}
          />
          {can('modules:create') && (
            <Link
              href="/dashboard/modules/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Module</span>
            </Link>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon, color, trend }) => (
          <StatsCard
            key={key}
            label={label}
            value={stats?.[key]}
            icon={icon}
            color={color}
            trend={trend}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Analytics Row: Activity Overview + Workspace Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5b5ce6] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Activity Overview</h2>
                <p className="text-xs text-slate-400">Events recorded over the last 7 days</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f6fb] text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#5b5ce6]" />
              Last 7 Days
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 500 175" className="w-full h-48 overflow-visible" role="img" aria-label="7 day activity chart">
              <defs>
                <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5ce6" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#5b5ce6" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[35, 70, 105, 145].map((y) => (
                <line key={y} x1="20" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              <path d={areaPath} fill="url(#overviewGrad)" />
              <path d={linePath} fill="none" stroke="#5b5ce6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {chartPoints.map((p) => (
                <g key={p.key}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#5b5ce6" strokeWidth="2.5" />
                  <text x={p.x} y={166} textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
                    {p.label}
                  </text>
                  {p.count > 0 && (
                    <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-slate-700 text-[10px] font-bold">
                      {p.count}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Workspace Distribution Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm tracking-tight">Workspace Breakdown</h2>
              <p className="text-xs text-slate-400">Distribution across CMS entities</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 my-auto py-2">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
                <circle cx="65" cy="65" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {distribution.total > 0 &&
                  distribution.items.map((item) => {
                    const pct = item.value / distribution.total
                    const dashArray = `${pct * circumference} ${circumference}`
                    const dashOffset = -cumulativePct * circumference
                    cumulativePct += pct
                    return (
                      <circle
                        key={item.label}
                        cx="65"
                        cy="65"
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth="14"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                      />
                    )
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">{distribution.total}</span>
                <span className="text-[11px] font-medium text-slate-400">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {distribution.items.map((item) => {
                const pct = distribution.total > 0 ? Math.round((item.value / distribution.total) * 100) : 0
                return (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlobalRecentActivities items={stats?.recentActivities} loading={isLoading} />
          <RecentActivity items={stats?.recentContent} loading={isLoading} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
