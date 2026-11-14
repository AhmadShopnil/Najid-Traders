import { connectDB } from '@/lib/db/mongoose'
import { Group } from '@/lib/db/models/Group'
import { User } from '@/lib/db/models/User'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'
import {
  getSuperAdminRoleId,
  isSuperAdminCaller,
  isTargetUserSuperAdmin,
} from '@/lib/rbac/userVisibility'

// Add a user to a group
export async function POST(request, { params }) {
  const { authorized, response, session } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid group ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { userId } = body
    if (!userId || !isValidObjectId(String(userId))) return errorResponse('Valid userId is required', 400)

    const [group, user, superAdminRoleId] = await Promise.all([
      Group.findById(id).select('_id').lean(),
      User.findById(userId).select('_id role roleRef').populate('roleRef', 'slug').lean(),
      getSuperAdminRoleId(),
    ])
    if (!group) return errorResponse('Group not found', 404)
    if (!user || (!isSuperAdminCaller(session) && isTargetUserSuperAdmin(user, superAdminRoleId))) {
      return errorResponse('User not found', 404)
    }

    await Promise.all([
      Group.findByIdAndUpdate(id, { $addToSet: { members: userId } }),
      User.findByIdAndUpdate(userId, { $addToSet: { groups: id } }),
    ])

    invalidatePermissionCache()
    return successResponse(null, 'Member added')
  } catch (err) {
    return errorResponse(err.message)
  }
}

// Remove a user from a group (supports query ?userId=... or JSON body { userId })
export async function DELETE(request, { params }) {
  const { authorized, response, session } = await requirePermission('groups:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid group ID', 400)

  try {
    await connectDB()
    let userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      const { data: body } = await parseJsonBody(request)
      userId = body?.userId
    }

    if (!userId || !isValidObjectId(String(userId))) {
      return errorResponse('Valid userId is required', 400)
    }

    const [user, superAdminRoleId] = await Promise.all([
      User.findById(userId).select('_id role roleRef').populate('roleRef', 'slug').lean(),
      getSuperAdminRoleId(),
    ])
    if (!user || (!isSuperAdminCaller(session) && isTargetUserSuperAdmin(user, superAdminRoleId))) {
      return errorResponse('User not found', 404)
    }

    await Promise.all([
      Group.findByIdAndUpdate(id, { $pull: { members: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { groups: id } }),
    ])

    invalidatePermissionCache()
    return successResponse(null, 'Member removed')
  } catch (err) {
    return errorResponse(err.message)
  }
}
