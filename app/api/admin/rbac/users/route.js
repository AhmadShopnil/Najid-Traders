import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { errorResponse, paginatedResponse, buildPagination } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { escapeRegex, parsePaginationParams } from '@/lib/utils'
import { getUserVisibilityFilter } from '@/lib/rbac/userVisibility'

export async function GET(request) {
  const { authorized, response, session } = await requirePermission(['users:read', 'roles:manage'])
  if (!authorized) return response
  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 20, maxLimit: 100 })
    const q = searchParams.get('q')?.trim()

    const visibilityFilter = await getUserVisibilityFilter(session)
    const conditions = []
    if (Object.keys(visibilityFilter).length > 0) {
      conditions.push(visibilityFilter)
    }
    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i')
      conditions.push({ $or: [{ name: safeRegex }, { email: safeRegex }] })
    }
    const filter = conditions.length > 1 ? { $and: conditions } : (conditions[0] || {})

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('roleRef', 'name slug color')
        .populate('groups', 'name slug color')
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    return paginatedResponse(users, buildPagination(total, page, limit))
  } catch (err) {
    return errorResponse(err.message)
  }
}
