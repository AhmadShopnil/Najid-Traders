import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { edgeAuthConfig } from '@/lib/auth/edge.config'

const { auth: proxyAuth } = NextAuth(edgeAuthConfig)

function getPublicOrigin(request) {
  // If deployed on Vercel or behind a reverse proxy, extract the real forwarded host & proto
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const host = request.headers.get('host')
  if (host && !host.includes('localhost')) {
    return `https://${host}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return request.nextUrl.origin
}

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
    const origin = getPublicOrigin(request)
    const url = new URL('/login', origin)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && isAuthenticated) {
    const origin = getPublicOrigin(request)
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*', '/api/upload/:path*', '/login'],
}
