import { connectDB } from '@/lib/db/mongoose'
import { Group } from '@/lib/db/models/Group'
import { User } from '@/lib/db/models/User'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import {
  getHiddenSuperAdminIds,
  getSuperAdminRoleId,
  getUserVisibilityFilter,
  isSuperAdminCaller,
} from '@/lib/rbac/userVisibility'

export async function GET() {
  const { authorized, response, session } = await requirePermission(['groups:manage', 'users:read'])
  if (!authorized) return response
  try {
    await connectDB()
    const visibilityFilter = await getUserVisibilityFilter(session)
    const groups = await Group.find()
      .populate('roles', 'name slug color permissions')
      .populate({
        path: 'members',
        match: visibilityFilter,
        select: 'name email avatar',
      })
      .sort({ createdAt: -1 })
      .lean()
    return successResponse(groups)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { data, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    if (!data.name || !data.slug) return errorResponse('Name and slug are required', 400)
    const cleanSlug = String(data.slug).toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!cleanSlug) return errorResponse('Valid group slug is required', 400)

    const exists = await Group.findOne({ slug: cleanSlug }).select('_id').lean()
    if (exists) return errorResponse('Group with this slug already exists', 409)

    const callerIsSuperAdmin = isSuperAdminCaller(session)
    const incomingRoles = Array.isArray(data.roles) ? data.roles : []
    let incomingMembers = Array.isArray(data.members) ? data.members : []

    if (!callerIsSuperAdmin) {
      if (incomingRoles.length > 0) {
        const superAdminRoleId = await getSuperAdminRoleId()
        if (superAdminRoleId && incomingRoles.some((r) => String(r) === String(superAdminRoleId))) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role to a group', 403)
        }
      }
      if (incomingMembers.length > 0) {
        const hiddenIds = await getHiddenSuperAdminIds(session)
        const hiddenSet = new Set(hiddenIds.map((id) => String(id)))
        incomingMembers = incomingMembers.filter((m) => !hiddenSet.has(String(m)))
      }
    }

    const group = await Group.create({
      name: String(data.name).trim(),
      slug: cleanSlug,
      description: data.description || '',
      color: data.color || '#6b7280',
      roles: incomingRoles,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      members: incomingMembers,
    })

    if (incomingMembers.length > 0) {
      await User.updateMany(
        { _id: { $in: incomingMembers } },
        { $addToSet: { groups: group._id } }
      )
      invalidatePermissionCache()
    }

    return successResponse(group, 'Group created', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
