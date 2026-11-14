import { LoginForm } from '@/components/auth/LoginForm'
import { getDashboardBranding } from '@/lib/settings/defaults'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const branding = await getDashboardBranding()
  return { title: `Login - ${branding.name || 'CMS'}` }
}

export default async function LoginPage() {
  const branding = await getDashboardBranding()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <LoginForm branding={branding} />
    </div>
  )
}
