import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Content } from '@/lib/db/models/Content'
import { Asset } from '@/lib/db/models/Asset'
import { User } from '@/lib/db/models/User'
import { ActivityLog } from '@/lib/db/models/ActivityLog'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import {
  getHiddenSuperAdminIds,
  getUserVisibilityFilter,
  isSuperAdminCaller,
} from '@/lib/rbac/userVisibility'

export async function GET() {
  const { authorized, response, session } = await requirePermission()
  if (!authorized) return response
  try {
    await connectDB()
    const [visibilityFilter, hiddenSuperAdminIds] = await Promise.all([
      getUserVisibilityFilter(session),
      getHiddenSuperAdminIds(session),
    ])

    const userCountFilter =
      Object.keys(visibilityFilter).length > 0
        ? { isActive: true, ...visibilityFilter }
        : { isActive: true }

    const activityFilter = isSuperAdminCaller(session)
      ? {}
      : {
          'user.role': { $ne: 'super_admin' },
          ...(hiddenSuperAdminIds.length > 0
            ? {
                'user.id': { $nin: hiddenSuperAdminIds },
                $nor: [{ entityType: 'user', entityId: { $in: hiddenSuperAdminIds.map(String) } }],
              }
            : {}),
        }

    const [totalModules, totalContent, totalMedia, totalUsers, recentContent, recentActivities] = await Promise.all([
      Module.countDocuments({ isActive: true }),
      Content.countDocuments(),
      Asset.countDocuments(),
      User.countDocuments(userCountFilter),
      Content.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('moduleId moduleSlug status createdAt data.title data.name data.headline data.slug')
        .populate('author', 'name')
        .populate('moduleId', 'name slug icon')
        .lean(),
      ActivityLog.find(activityFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('action entityType entityId entityTitle description user createdAt')
        .lean(),
    ])
    return successResponse({ totalModules, totalContent, totalMedia, totalUsers, recentContent, recentActivities })
  } catch (err) {
    return errorResponse(err.message)
  }
}
