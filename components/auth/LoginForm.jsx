'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock, Mail, LayoutDashboard } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

export function LoginForm({ branding = {} }) {
  const router = useRouter()
  const { translate: t } = useI18n()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const dashboardName = branding?.name && branding.name !== 'CMS' ? branding.name : t('auth.loginTitle')
  const dashboardSubtitle = branding?.loginSubtitle || t('auth.loginSubtitle')

  async function onSubmit(data) {
    setServerError('')
    const result = await signIn('credentials', { ...data, redirect: false })
    if (result?.error) {
      setServerError(t('auth.invalidCredentials'))
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        {branding?.logo ? (
          <img
            src={branding.logo}
            alt={dashboardName}
            className="w-16 h-16 rounded-2xl object-contain p-1.5 mx-auto mb-4 border border-white/15 bg-white shadow-md"
          />
        ) : (
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white shadow-md ring-1 ring-white/15"
            style={{ backgroundColor: branding?.sidebarBg || '#0D253F' }}
          >
            <LayoutDashboard
              className="w-8 h-8"
              style={{ color: branding?.accentColor || '#C89B3C' }}
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-white">{dashboardName}</h1>
        <p className="text-slate-400 mt-1 text-sm">{dashboardSubtitle}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('email')} type="email" placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('password')} type="password" placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 disabled:opacity-60 text-white font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-2 hover:brightness-110 shadow-sm"
            style={{
              backgroundColor: branding?.primaryColor || '#0D253F',
              borderBottom: `2px solid ${branding?.accentColor || '#C89B3C'}`,
            }}
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  )
}
