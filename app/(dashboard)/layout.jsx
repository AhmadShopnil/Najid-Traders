import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import { getDashboardBranding } from '@/lib/settings/defaults'
import { getPublicSiteSettings } from '@/lib/public-data'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ServerSessionProvider } from '@/components/providers/SessionProvider'

export async function generateMetadata() {
  const [branding, settings] = await Promise.all([
    getDashboardBranding(),
    getPublicSiteSettings(),
  ])
  const favicon = settings?.favicon
  return {
    title: `${branding.name || 'CMS'} - Dashboard`,
    ...(favicon
      ? {
          icons: {
            icon: [{ url: favicon }, { url: '/favicon.ico' }],
            shortcut: [favicon],
            apple: [{ url: favicon }],
          },
        }
      : {}),
  }
}

export default async function Layout({ children }) {
  const [session, branding] = await Promise.all([
    getServerSession(),
    getDashboardBranding(),
  ])
  if (!session?.user?.id) redirect('/login')

  return (
    <ServerSessionProvider session={session}>
      <DashboardLayout session={session} branding={branding}>
        {children}
      </DashboardLayout>
    </ServerSessionProvider>
  )
}
