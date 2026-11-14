import { Role } from '@/lib/db/models/Role'
import { User } from '@/lib/db/models/User'

/**
 * Returns true if the authenticated session belongs to a Super Admin.
 */
export function isSuperAdminCaller(session) {
  return (
    session?.user?.role === 'super_admin' ||
    session?.user?.roleSlug === 'super_admin'
  )
}

/**
 * Resolves the MongoDB ObjectId of the `super_admin` Role document, or null if missing.
 */
export async function getSuperAdminRoleId() {
  const roleDoc = await Role.findOne({ slug: 'super_admin' }).select('_id').lean()
  return roleDoc?._id || null
}

/**
 * Builds a MongoDB query filter for the User collection so non-Super-Admin
 * callers can never view or count Super Admin accounts, even with `users:read`.
 * Super Admin callers receive `{}` (unrestricted visibility).
 */
export async function getUserVisibilityFilter(session) {
  if (isSuperAdminCaller(session)) return {}
  const superAdminRoleId = await getSuperAdminRoleId()
  if (superAdminRoleId) {
    return {
      role: { $ne: 'super_admin' },
      roleRef: { $ne: superAdminRoleId },
    }
  }
  return { role: { $ne: 'super_admin' } }
}

/**
 * Returns ObjectIds of all Super Admin users when caller is NOT a Super Admin.
 * Returns `[]` for Super Admin callers.
 */
export async function getHiddenSuperAdminIds(session) {
  if (isSuperAdminCaller(session)) return []
  const superAdminRoleId = await getSuperAdminRoleId()
  const orConditions = [{ role: 'super_admin' }]
  if (superAdminRoleId) {
    orConditions.push({ roleRef: superAdminRoleId })
  }
  return User.find({ $or: orConditions }).distinct('_id')
}

/**
 * Checks whether a target User document (with optional populated `roleRef`) is a Super Admin.
 */
export function isTargetUserSuperAdmin(user, superAdminRoleId = null) {
  if (!user) return false
  if (user.role === 'super_admin') return true
  if (user.roleRef?.slug === 'super_admin') return true
  if (superAdminRoleId && user.roleRef) {
    const refId = typeof user.roleRef === 'object' ? user.roleRef._id : user.roleRef
    if (refId && String(refId) === String(superAdminRoleId)) {
      return true
    }
  }
  return false
}
