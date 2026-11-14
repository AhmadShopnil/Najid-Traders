import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { edgeAuthConfig } from '@/lib/auth/edge.config'

const { auth: proxyAuth } = NextAuth(edgeAuthConfig)

export const proxy = proxyAuth((request) => {
  const { pathname } = request.nextUrl
  const session = request.auth
  const isAuthenticated = Boolean(session?.user?.id)

  const isApiProtected = pathname.startsWith('/api/admin') || pathname.startsWith('/api/upload')
  const isDashboardProtected = pathname.startsWith('/dashboard')
  const isAuthPage = pathname === '/login'

  if (isApiProtected && !isAuthenticated) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (isDashboardProtected && !isAuthenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*', '/api/upload/:path*', '/login'],
}
