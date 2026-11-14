import { connectDB } from '@/lib/db/mongoose'
import { Group } from '@/lib/db/models/Group'
import { User } from '@/lib/db/models/User'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'
import {
  getHiddenSuperAdminIds,
  getSuperAdminRoleId,
  getUserVisibilityFilter,
  isSuperAdminCaller,
} from '@/lib/rbac/userVisibility'

export async function GET(request, { params }) {
  const { authorized, response, session } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid group ID', 400)

  try {
    await connectDB()
    const visibilityFilter = await getUserVisibilityFilter(session)
    const group = await Group.findById(id)
      .populate('roles', 'name slug color permissions')
      .populate({
        path: 'members',
        match: visibilityFilter,
        select: 'name email avatar roleRef',
      })
      .lean()
    if (!group) return errorResponse('Group not found', 404)
    return successResponse(group)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { authorized, response, session } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid group ID', 400)

  const { data, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const existing = await Group.findById(id).lean()
    if (!existing) return errorResponse('Group not found', 404)

    const callerIsSuperAdmin = isSuperAdminCaller(session)

    const update = {}
    if (data.name !== undefined) update.name = String(data.name).trim()
    if (data.slug !== undefined) {
      update.slug = String(data.slug).toLowerCase().replace(/[^a-z0-9]+/g, '_')
    }
    if (data.description !== undefined) update.description = String(data.description)
    if (data.color !== undefined) update.color = String(data.color)
    if (Array.isArray(data.roles)) {
      if (!callerIsSuperAdmin && data.roles.length > 0) {
        const superAdminRoleId = await getSuperAdminRoleId()
        if (superAdminRoleId && data.roles.some((r) => String(r) === String(superAdminRoleId))) {
          return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role to a group', 403)
        }
      }
      update.roles = data.roles
    }
    if (Array.isArray(data.permissions)) update.permissions = data.permissions

    const syncOps = []
    if (Array.isArray(data.members)) {
      let nextMembers = data.members.map((m) => String(m))
      let hiddenSet = new Set()

      if (!callerIsSuperAdmin) {
        const hiddenIds = await getHiddenSuperAdminIds(session)
        hiddenSet = new Set(hiddenIds.map((hid) => String(hid)))
        const preservedHidden = (existing.members || [])
          .map((m) => String(m))
          .filter((m) => hiddenSet.has(m))
        const filteredIncoming = nextMembers.filter((m) => !hiddenSet.has(m))
        nextMembers = Array.from(new Set([...filteredIncoming, ...preservedHidden]))
      }

      update.members = nextMembers
      const oldMembers = (existing.members || []).map((m) => String(m))

      const toRemove = oldMembers.filter((m) => !nextMembers.includes(m) && !hiddenSet.has(m))
      const toAdd = nextMembers.filter((m) => !oldMembers.includes(m) && !hiddenSet.has(m))

      if (toRemove.length > 0) {
        syncOps.push(User.updateMany({ _id: { $in: toRemove } }, { $pull: { groups: id } }))
      }
      if (toAdd.length > 0) {
        syncOps.push(User.updateMany({ _id: { $in: toAdd } }, { $addToSet: { groups: id } }))
      }
    }

    const [updated] = await Promise.all([
      Group.findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate('roles', 'name slug color')
        .lean(),
      ...syncOps,
    ])

    invalidatePermissionCache()
    return successResponse(updated, 'Group updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid group ID', 400)

  try {
    await connectDB()
    const [deleted] = await Promise.all([
      Group.findByIdAndDelete(id).lean(),
      User.updateMany({ groups: id }, { $pull: { groups: id } }),
    ])
    if (!deleted) return errorResponse('Group not found', 404)

    invalidatePermissionCache()
    return successResponse(null, 'Group deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
