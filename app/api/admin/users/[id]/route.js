import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Role } from '@/lib/db/models/Role'
import { Group } from '@/lib/db/models/Group'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'
import {
  getSuperAdminRoleId,
  isSuperAdminCaller,
  isTargetUserSuperAdmin,
} from '@/lib/rbac/userVisibility'

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('users:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid user ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, email, password, roleRef, groups, isActive } = body

    const [existingUser, superAdminRoleId] = await Promise.all([
      User.findById(id).populate('roleRef', 'slug').lean(),
      getSuperAdminRoleId(),
    ])
    if (!existingUser) return errorResponse('User not found', 404)

    const callerIsSuperAdmin = isSuperAdminCaller(session)

    if (!callerIsSuperAdmin && isTargetUserSuperAdmin(existingUser, superAdminRoleId)) {
      return errorResponse('User not found', 404)
    }

    const update = {}
    if (name !== undefined) update.name = String(name).trim()
    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim()
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: id } }).select('_id').lean()
      if (duplicate) return errorResponse('Email already in use by another user', 409)
      update.email = normalizedEmail
    }
    if (isActive !== undefined) update.isActive = Boolean(isActive)

    if (roleRef !== undefined) {
      if (roleRef) {
        if (!isValidObjectId(String(roleRef))) return errorResponse('Invalid roleRef ID', 400)
        const roleDoc = await Role.findById(roleRef).lean()
        if (!roleDoc) return errorResponse('Role not found', 404)
        if (roleDoc.slug === 'super_admin' && !callerIsSuperAdmin) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
        }
        update.roleRef = roleRef
        update.role = roleDoc.slug
      } else {
        update.roleRef = null
        if (body.role === 'super_admin' && !callerIsSuperAdmin) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
        }
        update.role = body.role !== undefined ? body.role : null
      }
    } else if (body.role !== undefined) {
      if (body.role === 'super_admin' && !callerIsSuperAdmin) {
        return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
      }
      update.role = body.role
    }

    if (password) {
      update.passwordHash = await User.hashPassword(password)
    }

    const syncGroupOps = []
    if (Array.isArray(groups)) {
      update.groups = groups
      const oldGroups = (existingUser.groups || []).map((g) => g.toString())
      const newGroups = groups.map((g) => g.toString())

      const toRemove = oldGroups.filter((g) => !newGroups.includes(g))
      const toAdd = newGroups.filter((g) => !oldGroups.includes(g))

      if (toRemove.length > 0) {
        syncGroupOps.push(Group.updateMany({ _id: { $in: toRemove } }, { $pull: { members: id } }))
      }
      if (toAdd.length > 0) {
        syncGroupOps.push(Group.updateMany({ _id: { $in: toAdd } }, { $addToSet: { members: id } }))
      }
    }

    const [updated] = await Promise.all([
      User.findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate('roleRef', 'name slug color')
        .populate('groups', 'name slug color')
        .select('-passwordHash')
        .lean(),
      ...syncGroupOps,
    ])

    invalidatePermissionCache()
    return successResponse(updated, 'User updated successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('users:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid user ID', 400)

  try {
    await connectDB()
    if (id === session.user.id) {
      return errorResponse('You cannot delete your own account', 400)
    }
    const [user, superAdminRoleId] = await Promise.all([
      User.findById(id).populate('roleRef', 'slug'),
      getSuperAdminRoleId(),
    ])
    if (!user) return errorResponse('User not found', 404)

    const callerIsSuperAdmin = isSuperAdminCaller(session)
    if (!callerIsSuperAdmin && isTargetUserSuperAdmin(user, superAdminRoleId)) {
      return errorResponse('User not found', 404)
    }

    await Promise.all([
      Group.updateMany({ members: id }, { $pull: { members: id } }),
      user.deleteOne(),
    ])

    invalidatePermissionCache()
    return successResponse(null, 'User deleted successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}
