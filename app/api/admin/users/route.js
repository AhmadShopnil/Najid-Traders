import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Role } from '@/lib/db/models/Role'
import { Group } from '@/lib/db/models/Group'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'
import { getUserVisibilityFilter, isSuperAdminCaller } from '@/lib/rbac/userVisibility'

export async function GET() {
  const { authorized, response, session } = await requirePermission('users:read')
  if (!authorized) return response
  try {
    await connectDB()
    const visibilityFilter = await getUserVisibilityFilter(session)
    const users = await User.find(visibilityFilter)
      .populate('roleRef', 'name slug color permissions')
      .populate('groups', 'name slug color')
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean()
    return successResponse(users)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('users:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, email, password, roleRef, groups, isActive = true } = body

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400)
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() }).select('_id').lean()
    if (existing) {
      return errorResponse('A user with this email already exists', 409)
    }

    const callerIsSuperAdmin = isSuperAdminCaller(session)

    let roleSlug = 'editor'
    if (roleRef) {
      if (!isValidObjectId(String(roleRef))) return errorResponse('Invalid roleRef ID', 400)
      const roleDoc = await Role.findById(roleRef).lean()
      if (!roleDoc) return errorResponse('Selected role not found', 404)
      roleSlug = roleDoc.slug
    } else if (body.role) {
      roleSlug = body.role
    }

    if (roleSlug === 'super_admin' && !callerIsSuperAdmin) {
      return errorResponse('Forbidden — only a Super Admin can assign the Super Admin role', 403)
    }

    const passwordHash = await User.hashPassword(password)
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: roleSlug,
      roleRef: roleRef || null,
      groups: Array.isArray(groups) ? groups : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    })

    if (Array.isArray(groups) && groups.length > 0) {
      await Group.updateMany(
        { _id: { $in: groups } },
        { $addToSet: { members: user._id } }
      )
      invalidatePermissionCache()
    }

    const created = await User.findById(user._id)
      .populate('roleRef', 'name slug color')
      .populate('groups', 'name slug color')
      .select('-passwordHash')
      .lean()

    return successResponse(created, 'User created successfully', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
