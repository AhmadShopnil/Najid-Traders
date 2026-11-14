'use client'

import { signOut } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setLanguage, toggleMobileSidebar } from '@/store/slices/uiSlice'
import { useGetStatsQuery } from '@/store/services/statsApi'
import { useGetModulesQuery } from '@/store/services/modulesApi'
import {
  Bell,
  LogOut,
  Globe,
  ChevronDown,
  Menu,
  ExternalLink,
  Search,
  LayoutDashboard,
  Boxes,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Users,
  Briefcase,
  Inbox,
  Settings,
  History,
  Database,
  X,
} from 'lucide-react'
import { getInitials, formatDateTime } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'

const STATIC_COMMANDS = [
  { label: 'Dashboard Overview', href: '/dashboard', group: 'Workspace', icon: LayoutDashboard },
  { label: 'Dynamic Modules', href: '/dashboard/modules', group: 'Workspace', icon: Boxes },
  { label: 'Pages', href: '/dashboard/pages', group: 'Workspace', icon: FileText },
  { label: 'Visual Page Builder', href: '/dashboard/builder', group: 'Workspace', icon: Sparkles },
  { label: 'Media Library', href: '/dashboard/media', group: 'Workspace', icon: ImageIcon },
  { label: 'Employees & Team', href: '/dashboard/employees', group: 'Workspace', icon: Briefcase },
  { label: 'Customer Inquiries', href: '/dashboard/inquiries', group: 'Workspace', icon: Inbox },
  { label: 'Users & Team', href: '/dashboard/users', group: 'System', icon: Users },
  { label: 'Activity Audit Log', href: '/dashboard/activity', group: 'System', icon: History },
  { label: 'Global Settings', href: '/dashboard/settings', group: 'System', icon: Settings },
]

export function Header({ session, branding = {} }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const lang = useSelector((s) => s.ui.language)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const user = session?.user
  const { data: statsRes } = useGetStatsQuery(undefined, { skip: !notifOpen })
  const { data: modRes } = useGetModulesQuery(undefined, { skip: !searchOpen })
  const recentActivities = statsRes?.data?.recentActivities || []
  const workspaceName = branding?.name && branding.name !== 'CMS' ? branding.name : 'Dynamic CMS'

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const commandItems = useMemo(() => {
    const activeModules = (modRes?.data || [])
      .filter((m) => m.isActive)
      .map((m) => ({
        label: `${m.name} Content`,
        href: `/dashboard/content/${m.slug}`,
        group: 'Content Modules',
        icon: Database,
      }))
    const all = [...STATIC_COMMANDS, ...activeModules]
    if (!searchQuery.trim()) return all
    const q = searchQuery.toLowerCase()
    return all.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    )
  }, [modRes, searchQuery])

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between gap-4 px-4 sm:px-7 flex-shrink-0 z-30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => dispatch(toggleMobileSidebar())}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Quick Search Bar (matching reference ⌘K bar) */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSearchOpen(true)
            }}
            className="flex items-center justify-between gap-3 w-full max-w-sm px-3.5 py-2 bg-[#f5f6fb] hover:bg-[#eef0f8] border border-slate-200/80 rounded-xl text-xs text-slate-400 transition cursor-pointer"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">Search anything in {workspaceName}...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">
              ⌘ K
            </kbd>
          </button>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5b5ce6] bg-indigo-50/80 border border-indigo-200/70 hover:bg-indigo-100/80 rounded-xl transition flex-shrink-0"
          >
            <span>View Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => dispatch(setLanguage(lang === 'en' ? 'bn' : 'en'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-[#f5f6fb] hover:bg-slate-200/70 border border-slate-200/70 rounded-xl transition"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>

          {/* Notifications Bell Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen)
                setUserMenuOpen(false)
              }}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-[#f5f6fb] rounded-xl transition"
              aria-label="Recent notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Events</p>
                    <Link
                      href="/dashboard/activity"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-[#5b5ce6] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {recentActivities.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No recent activity</p>
                    ) : (
                      recentActivities.slice(0, 6).map((act) => (
                        <div key={act._id} className="px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <p className="font-semibold text-slate-800 line-clamp-1">
                            {act.description || act.entityTitle || act.action}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            {act.user?.name || 'System'} · {formatDateTime(act.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen)
                setNotifOpen(false)
              }}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-[#f5f6fb] transition"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-indigo-50 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-[#5b5ce6] text-xs font-bold">{getInitials(user?.name)}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-400 capitalize">
                  {(user?.roleSlug || user?.role || '').replace('_', ' ')}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-20">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Quick Command Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to page, module, or settings..."
                className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {commandItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No matching destinations</p>
              ) : (
                commandItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      type="button"
                      key={item.href}
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(item.href)
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50/70 text-left transition group"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#f5f6fb] group-hover:bg-white text-slate-500 group-hover:text-[#5b5ce6] flex items-center justify-center flex-shrink-0 transition">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-[#5b5ce6] truncate">
                          {item.label}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">{item.group}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
