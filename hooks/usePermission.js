'use client'

import { useSession } from 'next-auth/react'
import { useInitialSession } from '@/components/providers/SessionProvider'

export const DEFAULT_ROLE_PERMS = {
  super_admin: ['*'],
  admin: [
    'modules:create','modules:read','modules:update','modules:delete',
    'content:create','content:read','content:update','content:delete','content:publish',
    'taxonomies:manage',
    'media:upload','media:read','media:delete',
    'pages:create','pages:read','pages:update','pages:delete','pages:publish',
    'users:create','users:read','users:update','users:delete',
    'settings:read','settings:update','settings:create_group','settings:manage_schema',
    'developer:api',
  ],
  developer: [
    'modules:create','modules:read','modules:update','modules:delete',
    'content:create','content:read','content:update','content:delete','content:publish',
    'taxonomies:manage',
    'media:upload','media:read','media:delete',
    'pages:create','pages:read','pages:update','pages:delete','pages:publish',
    'developer:api',
  ],
  manager: [
    'content:create','content:read','content:update','content:delete','content:publish',
    'taxonomies:manage',
    'media:upload','media:read','media:delete',
    'pages:create','pages:read','pages:update','pages:delete','pages:publish',
    'users:read',
  ],
  editor: [
    'content:create','content:read','content:update',
    'media:upload','media:read',
    'pages:read','pages:update',
  ],
  viewer: [
    'content:read','media:read','pages:read',
  ],
}

/**
 * Standard client hook to check granular permissions.
 * Uses server-injected initial session when available so dashboard renders have zero flicker.
 */
export function usePermission(explicitSession = null) {
  const { data: clientSession } = useSession()
  const initialSession = useInitialSession()
  const session = explicitSession || initialSession || clientSession
  const user = session?.user

  const role = user?.roleSlug || user?.role || ''
  const isSuperAdmin = role === 'super_admin'

  // Only fall back to legacy role map when `user.permissions` is not an array at all
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions
    : DEFAULT_ROLE_PERMS[role] || []

  function can(requiredPerm) {
    if (isSuperAdmin) return true
    if (!requiredPerm) return true
    const required = Array.isArray(requiredPerm) ? requiredPerm : [requiredPerm]
    return required.some((p) => permissions.includes(p))
  }

  function hasRole(requiredRole) {
    if (isSuperAdmin) return true
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(role)
  }

  const canViewApi = isSuperAdmin || can('developer:api')

  return {
    can,
    canViewApi,
    hasRole,
    isSuperAdmin,
    permissions,
    role,
    user,
  }
}

/**
 * Reusable declarative permission component.
 * Renders children only if user has the specified permission.
 */
export function Can({ permission, children, fallback = null }) {
  const { can } = usePermission()
  if (can(permission)) {
    return <>{children}</>
  }
  return fallback
}
