'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, setMobileSidebarOpen } from '@/store/slices/uiSlice'
import { useI18n } from '@/hooks/useI18n'
import { usePermission } from '@/hooks/usePermission'
import { useGetModulesQuery } from '@/store/services/modulesApi'
import {
  LayoutDashboard,
  Boxes,
  Image,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  FileText,
  Database,
  ShieldCheck,
  History,
  Sparkles,
  X,
  Briefcase,
  Inbox,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar({ branding = {} }) {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)
  const dashboardName = branding?.name || 'CMS'
  const dashboardLogo = branding?.logo || ''
  const mobileOpen = useSelector((state) => state.ui.mobileSidebarOpen)
  const pathname = usePathname()
  const { translate: t } = useI18n()
  const { can, isSuperAdmin } = usePermission()

  const canSeeContent = can(['content:read', 'content:create', 'taxonomies:manage'])
  const { data: modulesRes } = useGetModulesQuery({ active: true }, { skip: !canSeeContent })
  const modules = (modulesRes?.data || []).filter((m) => m.isActive !== false)

  const canSeePages = can(['pages:read', 'pages:create', 'pages:update'])
  const canSeeMedia = can(['media:read', 'media:upload'])
  const canSeeEmployees = can('employees:read')
  const canSeeInquiries = can('inquiries:read')

  const CORE_ITEMS = [
    { key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
    canSeePages && { key: 'nav.pages', href: '/dashboard/pages', icon: FileText },
    canSeePages && { key: 'nav.builder', href: '/dashboard/builder', icon: Sparkles },
    canSeePages && { key: 'nav.menus', label: 'Menus / Navigation', href: '/dashboard/menus', icon: Compass },
    canSeeMedia && { key: 'nav.media', href: '/dashboard/media', icon: Image },
    canSeeEmployees && { key: 'nav.employees', label: 'Employees', href: '/dashboard/employees', icon: Briefcase },
    canSeeInquiries && { key: 'nav.inquiries', label: 'Inquiries', href: '/dashboard/inquiries', icon: Inbox },
  ].filter(Boolean)

  const canManageModules = can(['modules:read', 'modules:create', 'modules:update'])
  const canManageUsers = can(['users:read', 'users:create', 'users:update'])
  const canManageRbac = can(['roles:manage', 'groups:manage'])
  const canManageSettings = can(['settings:read', 'settings:update'])
  const canSeeActivity =
    isSuperAdmin || can(['roles:manage', 'settings:read', 'users:read', 'modules:create', 'developer:api'])

  const SYSTEM_ITEMS = [
    canManageModules && { key: 'nav.modules', href: '/dashboard/modules', icon: Boxes },
    canManageUsers && { key: 'nav.users', href: '/dashboard/users', icon: Users },
    canManageRbac && { key: 'nav.rbac', href: '/dashboard/users/rbac', icon: ShieldCheck },
    canManageSettings && { key: 'nav.settings', href: '/dashboard/settings', icon: Settings },
    canSeeActivity && { key: 'nav.activity', href: '/dashboard/activity', icon: History },
  ].filter(Boolean)

  const closeMobile = () => dispatch(setMobileSidebarOpen(false))

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full text-white border-r border-white/10 z-50 transition-all duration-300 flex flex-col shadow-xl',
          open ? 'w-64' : 'md:w-[72px] w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ backgroundColor: branding?.sidebarBg || '#0D253F' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/10">
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-3 min-w-0 group">
            {dashboardLogo ? (
              <img
                src={dashboardLogo}
                alt={dashboardName}
                className="w-9 h-9 rounded-xl object-contain p-0.5 flex-shrink-0 border border-white/15 bg-white shadow-sm"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ring-1 ring-white/20"
                style={{ backgroundColor: branding?.accentColor || '#C89B3C' }}
              >
                <Package className="w-5 h-5 text-white" />
              </div>
            )}
            {(open || mobileOpen) && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight truncate block leading-tight text-white">
                  {dashboardName}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest block"
                  style={{ color: branding?.accentColor || '#C89B3C' }}
                >
                  Admin Studio
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          <nav className="space-y-1">
            {CORE_ITEMS.map(({ key, label, href, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              const text = label || t(key)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  title={!open ? text : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group select-none',
                    active
                      ? 'text-white font-semibold shadow-xs'
                      : 'text-slate-300/80 hover:bg-white/[0.08] hover:text-white'
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          boxShadow: `inset 3px 0 0 0 ${branding?.accentColor || '#C89B3C'}`,
                        }
                      : undefined
                  }
                >
                  <Icon
                    className="w-5 h-5 flex-shrink-0 transition-colors"
                    style={active ? { color: branding?.accentColor || '#C89B3C' } : undefined}
                  />
                  {(open || mobileOpen) && (
                    <span className="text-sm font-medium whitespace-nowrap">{text}</span>
                  )}
                  {active && (open || mobileOpen) && (
                    <span
                      className="w-1.5 h-1.5 rounded-full ml-auto shrink-0 shadow-xs"
                      style={{ backgroundColor: branding?.accentColor || '#C89B3C' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {canSeeContent && modules.length > 0 && (
            <div className="space-y-1">
              {(open || mobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {t('nav.content')}
                </p>
              )}
              {modules.map((mod) => {
                const href = `/dashboard/content/${mod.slug}`
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={mod._id}
                    href={href}
                    onClick={closeMobile}
                    title={!open ? mod.name : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group select-none',
                      active
                        ? 'text-white font-semibold shadow-xs'
                        : 'text-slate-300/80 hover:bg-white/[0.08] hover:text-white'
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            boxShadow: `inset 3px 0 0 0 ${branding?.accentColor || '#C89B3C'}`,
                          }
                        : undefined
                    }
                  >
                    <Database
                      className="w-5 h-5 flex-shrink-0 transition-colors"
                      style={active ? { color: branding?.accentColor || '#C89B3C' } : undefined}
                    />
                    {(open || mobileOpen) && (
                      <span className="text-sm font-medium whitespace-nowrap truncate">{mod.name}</span>
                    )}
                    {active && (open || mobileOpen) && (
                      <span
                        className="w-1.5 h-1.5 rounded-full ml-auto shrink-0 shadow-xs"
                        style={{ backgroundColor: branding?.accentColor || '#C89B3C' }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {SYSTEM_ITEMS.length > 0 && (
            <div className="space-y-1">
              {(open || mobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  System
                </p>
              )}
              {SYSTEM_ITEMS.map(({ key, href, icon: Icon }) => {
                const active =
                  href === '/dashboard/users'
                    ? pathname === '/dashboard/users'
                    : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    title={!open ? t(key) : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group select-none',
                      active
                        ? 'text-white font-semibold shadow-xs'
                        : 'text-slate-300/80 hover:bg-white/[0.08] hover:text-white'
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            boxShadow: `inset 3px 0 0 0 ${branding?.accentColor || '#C89B3C'}`,
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0 transition-colors"
                      style={active ? { color: branding?.accentColor || '#C89B3C' } : undefined}
                    />
                    {(open || mobileOpen) && (
                      <span className="text-sm font-medium whitespace-nowrap">{t(key)}</span>
                    )}
                    {active && (open || mobileOpen) && (
                      <span
                        className="w-1.5 h-1.5 rounded-full ml-auto shrink-0 shadow-xs"
                        style={{ backgroundColor: branding?.accentColor || '#C89B3C' }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {(open || mobileOpen) && (
          <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
            <p className="text-xs font-bold text-white leading-snug">Explore Live Site</p>
            <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed">
              Preview your public wholesale site.
            </p>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition shadow-sm hover:brightness-110"
              style={{ backgroundColor: branding?.accentColor || '#C89B3C' }}
            >
              Open Frontend
            </Link>
          </div>
        )}

        <div className="p-3 border-t border-white/10 hidden md:block">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="w-full p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
