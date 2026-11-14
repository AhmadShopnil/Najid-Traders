import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Role } from '@/lib/db/models/Role'
import { Group } from '@/lib/db/models/Group'
import { ALL_PERMISSIONS } from './permissions'

/**
 * Resolves full RBAC context (user profile, role metadata, and effective permissions)
 * with minimal parallelized DB queries.
 */
export async function resolveUserAuthContext(userId) {
  await connectDB()

  const user = await User.findById(userId)
    .select('name email avatar role roleRef groups directPermissions isActive')
    .populate('roleRef', 'name slug color permissions')
    .lean()

  if (!user || !user.isActive) {
    return {
      isActive: false,
      user: null,
      roleSlug: null,
      roleName: null,
      roleColor: '#6b7280',
      permissions: [],
    }
  }

  const roleSlug = user.roleRef?.slug || user.role || null
  const roleName = user.roleRef?.name || (user.role ? user.role.replace(/_/g, ' ') : null)
  const roleColor = user.roleRef?.color || (roleSlug === 'super_admin' ? '#7c3aed' : '#6b7280')

  // Super admin always gets all permissions immediately
  if (user.role === 'super_admin' || user.roleRef?.slug === 'super_admin') {
    return {
      isActive: true,
      user,
      roleSlug: 'super_admin',
      roleName: roleName || 'Super Admin',
      roleColor: roleColor || '#7c3aed',
      permissions: [...ALL_PERMISSIONS],
    }
  }

  const set = new Set()

  // 1. Role permissions (either from populated roleRef or fallback legacy slug)
  let fallbackRolePromise = Promise.resolve(null)
  if (user.roleRef?.permissions) {
    user.roleRef.permissions.forEach((p) => set.add(p))
  } else if (!user.roleRef && user.role) {
    fallbackRolePromise = Role.findOne({ slug: user.role }).select('permissions').lean()
  }

  // 2. Group permissions in parallel with fallback role query
  const userGroupIds = Array.isArray(user.groups) ? user.groups : []
  const groupsPromise = Group.find({
    $or: [
      ...(userGroupIds.length > 0 ? [{ _id: { $in: userGroupIds } }] : []),
      { members: user._id },
    ],
  })
    .select('permissions roles')
    .lean()

  const [fallbackRole, groups] = await Promise.all([fallbackRolePromise, groupsPromise])

  if (fallbackRole?.permissions) {
    fallbackRole.permissions.forEach((p) => set.add(p))
  }

  const groupRoleIds = []
  groups.forEach((g) => {
    if (Array.isArray(g.permissions)) {
      g.permissions.forEach((p) => set.add(p))
    }
    if (Array.isArray(g.roles)) {
      g.roles.forEach((rId) => groupRoleIds.push(rId))
    }
  })

  // 3. Inherited permissions from roles assigned to groups
  if (groupRoleIds.length > 0) {
    const rolesFromGroups = await Role.find({ _id: { $in: groupRoleIds } })
      .select('permissions')
      .lean()
    rolesFromGroups.forEach((r) => {
      if (Array.isArray(r.permissions)) {
        r.permissions.forEach((p) => set.add(p))
      }
    })
  }

  // 4. Direct user permission overrides
  if (Array.isArray(user.directPermissions)) {
    user.directPermissions.forEach((p) => set.add(p))
  }

  return {
    isActive: true,
    user,
    roleSlug,
    roleName,
    roleColor,
    permissions: [...set].sort(),
  }
}

export async function resolvePermissions(userId) {
  const ctx = await resolveUserAuthContext(userId)
  return ctx.permissions
}
