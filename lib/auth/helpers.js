import { cache } from 'react'
import { auth } from '@/lib/auth/auth.config'
import { redirect } from 'next/navigation'

/**
 * Per-request memoized auth lookup for Server Components & Route Handlers.
 */
export const getServerSession = cache(async () => {
  return auth()
})

/**
 * Require the user to be authenticated and have the required permission(s) for API handlers.
 * @param {string|string[]|null} permission Single permission string or array of acceptable permissions (OR logic)
 */
export async function requirePermission(permission = null) {
  const session = await getServerSession()

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: Response.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    }
  }

  // Super admin always bypasses all checks
  if (session.user.role === 'super_admin' || session.user.roleSlug === 'super_admin') {
    return { authorized: true, session }
  }

  if (permission) {
    const userPerms = session.user.permissions || []
    const required = Array.isArray(permission) ? permission : [permission]
    const hasAccess = required.some((p) => userPerms.includes(p))

    if (!hasAccess) {
      return {
        authorized: false,
        response: Response.json(
          { success: false, message: `Forbidden — missing required permission: ${required.join(' or ')}` },
          { status: 403 }
        ),
      }
    }
  }

  return { authorized: true, session }
}

/**
 * Server-side route guard helper for Page components.
 * Redirects to login if unauthenticated or to redirectTo if unauthorized.
 */
export async function checkServerPermission(permission, redirectTo = '/dashboard') {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role === 'super_admin' || session.user.roleSlug === 'super_admin') {
    return true
  }

  if (permission) {
    const userPerms = session.user.permissions || []
    const required = Array.isArray(permission) ? permission : [permission]
    const hasAccess = required.some((p) => userPerms.includes(p))

    if (!hasAccess) {
      redirect(redirectTo)
    }
  }

  return true
}

/**
 * Role-based auth helper for routes restricted to explicit roles.
 */
export async function requireAuth(allowedRoles = []) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return {
      authorized: false,
      response: Response.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    }
  }

  const role = session.user.roleSlug || session.user.role
  if (role === 'super_admin') {
    return { authorized: true, session }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      authorized: false,
      response: Response.json({ success: false, message: 'Forbidden' }, { status: 403 }),
    }
  }

  return { authorized: true, session }
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  MANAGER: 'manager',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}

export const ADMIN_ROLES = ['super_admin', 'admin']
export const EDITOR_ROLES = ['super_admin', 'admin', 'developer', 'manager', 'editor']
