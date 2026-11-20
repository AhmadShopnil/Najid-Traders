import { LoginForm } from '@/components/auth/LoginForm'
import { getDashboardBranding } from '@/lib/settings/defaults'
import { getPublicSiteSettings } from '@/lib/public-data'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const [branding, settings] = await Promise.all([
    getDashboardBranding(),
    getPublicSiteSettings(),
  ])
  const favicon = settings?.favicon
  return {
    title: `Login - ${branding.name || 'CMS'}`,
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

export default async function LoginPage() {
  const branding = await getDashboardBranding()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <LoginForm branding={branding} />
    </div>
  )
}
