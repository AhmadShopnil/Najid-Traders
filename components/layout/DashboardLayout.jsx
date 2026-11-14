'use client'

import { useSelector } from 'react-redux'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children, session, branding = {} }) {
  const open = useSelector((state) => state.ui.sidebarOpen)
  const sidebarBg = branding.sidebarBg || '#0D253F'
  const primaryColor = branding.primaryColor || '#0D253F'
  const accentColor = branding.accentColor || '#C89B3C'

  return (
    <div
      className="flex h-screen bg-[#f5f6fb] text-slate-900 overflow-hidden"
      style={{
        '--dash-sidebar-bg': sidebarBg,
        '--dash-primary': primaryColor,
        '--dash-accent': accentColor,
      }}
    >
      <Sidebar session={session} branding={branding} />
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300 ml-0',
          open ? 'md:ml-64' : 'md:ml-[72px]'
        )}
      >
        <Header session={session} branding={branding} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
