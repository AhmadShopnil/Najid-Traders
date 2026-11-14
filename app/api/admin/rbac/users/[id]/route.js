import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Role } from '@/lib/db/models/Role'
import { Group } from '@/lib/db/models/Group'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { resolvePermissions } from '@/lib/rbac/resolvePermissions'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'
import {
  getSuperAdminRoleId,
  isSuperAdminCaller,
  isTargetUserSuperAdmin,
} from '@/lib/rbac/userVisibility'

// Update user role, groups, directPermissions
export async function PUT(request, { params }) {
  const { authorized, response, session } = await requirePermission(['users:update', 'roles:manage'])
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid user ID', 400)

  const { data, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const [existing, superAdminRoleId] = await Promise.all([
      User.findById(id).populate('roleRef', 'slug').lean(),
      getSuperAdminRoleId(),
    ])
    if (!existing) return errorResponse('User not found', 404)

    const callerIsSuperAdmin = isSuperAdminCaller(session)
    const callerPerms = session.user.permissions || []
    const canManageRoles = callerIsSuperAdmin || callerPerms.includes('roles:manage')

    if (!callerIsSuperAdmin && isTargetUserSuperAdmin(existing, superAdminRoleId)) {
      return errorResponse('User not found', 404)
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = String(data.name).trim()
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive)

    if (data.directPermissions !== undefined) {
      if (!canManageRoles) {
        return errorResponse('Forbidden — managing direct permissions requires roles:manage', 403)
      }
      updateData.directPermissions = Array.isArray(data.directPermissions) ? data.directPermissions : []
    }

    if (data.roleRef !== undefined) {
      if (data.roleRef) {
        if (!isValidObjectId(String(data.roleRef))) return errorResponse('Invalid roleRef ID', 400)
        const roleDoc = await Role.findById(data.roleRef).lean()
        if (!roleDoc) return errorResponse('Role not found', 404)
        if (roleDoc.slug === 'super_admin' && !callerIsSuperAdmin) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
        }
        updateData.roleRef = data.roleRef
        updateData.role = roleDoc.slug
      } else {
        updateData.roleRef = null
        if (data.role === 'super_admin' && !callerIsSuperAdmin) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
        }
        updateData.role = data.role !== undefined ? data.role : null
      }
    } else if (data.role !== undefined) {
      if (data.role === 'super_admin' && !callerIsSuperAdmin) {
        return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
      }
      updateData.role = data.role
    }

    const syncGroupOps = []
    if (Array.isArray(data.groups)) {
      updateData.groups = data.groups
      const oldGroups = (existing.groups || []).map((g) => g.toString())
      const newGroups = data.groups.map((g) => g.toString())
      const toRemove = oldGroups.filter((g) => !newGroups.includes(g))
      const toAdd = newGroups.filter((g) => !oldGroups.includes(g))
      if (toRemove.length > 0) {
        syncGroupOps.push(Group.updateMany({ _id: { $in: toRemove } }, { $pull: { members: id } }))
      }
      if (toAdd.length > 0) {
        syncGroupOps.push(Group.updateMany({ _id: { $in: toAdd } }, { $addToSet: { members: id } }))
      }
    }

    const [user] = await Promise.all([
      User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .populate('roleRef', 'name slug color')
        .populate('groups', 'name slug color')
        .select('-passwordHash')
        .lean(),
      ...syncGroupOps,
    ])

    invalidatePermissionCache()
    const permissions = await resolvePermissions(id)
    return successResponse({ ...user, effectivePermissions: permissions }, 'User updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}
