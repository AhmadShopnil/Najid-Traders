import { connectDB } from '@/lib/db/mongoose'
import { ActivityLog } from '@/lib/db/models/ActivityLog'
import { errorResponse, paginatedResponse, buildPagination } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { escapeRegex, parsePaginationParams } from '@/lib/utils'
import { getHiddenSuperAdminIds, isSuperAdminCaller } from '@/lib/rbac/userVisibility'

export async function GET(request) {
  // Audit logs contain user metadata and system events; restrict to admins, developers, or role/settings managers
  const { authorized, response, session } = await requirePermission(['roles:manage', 'settings:read', 'users:read', 'modules:create', 'developer:api'])
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 20, maxLimit: 100 })

    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const q = searchParams.get('q')?.trim()

    const conditions = []
    if (entityType && entityType !== 'all') {
      conditions.push({ entityType })
    }
    if (action && action !== 'all') {
      conditions.push({ action })
    }
    if (!isSuperAdminCaller(session)) {
      const hiddenSuperAdminIds = await getHiddenSuperAdminIds(session)
      conditions.push({ 'user.role': { $ne: 'super_admin' } })
      if (hiddenSuperAdminIds.length > 0) {
        conditions.push({ 'user.id': { $nin: hiddenSuperAdminIds } })
        conditions.push({ $nor: [{ entityType: 'user', entityId: { $in: hiddenSuperAdminIds.map(String) } }] })
      }
    }
    if (q) {
      const searchRegex = new RegExp(escapeRegex(q), 'i')
      conditions.push({
        $or: [
          { entityTitle: searchRegex },
          { description: searchRegex },
          { 'user.name': searchRegex },
          { 'user.email': searchRegex },
        ],
      })
    }

    const filter = conditions.length > 1 ? { $and: conditions } : (conditions[0] || {})

    const [total, items] = await Promise.all([
      ActivityLog.countDocuments(filter),
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])

    return paginatedResponse(items, buildPagination(total, page, limit))
  } catch (err) {
    return errorResponse(err.message)
  }
}
