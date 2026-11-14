import { connectDB } from '@/lib/db/mongoose'
import { ActivityLog } from '@/lib/db/models/ActivityLog'

/**
 * Safely records an audit activity log entry.
 * Never throws an error or disrupts caller business logic.
 *
 * @param {Object} params
 * @param {Object} [params.session]
 * @param {Object} [params.user]
 * @param {'create'|'update'|'delete'|'publish'|'unpublish'|'archive'|'upload'|'assign'|'remove'} params.action
 * @param {'content'|'module'|'page'|'media'|'user'|'setting'|'role'|'group'} params.entityType
 * @param {string} [params.entityId]
 * @param {string} [params.entityTitle]
 * @param {string} [params.description]
 * @param {Object} [params.metadata]
 */
export async function recordActivity({
  session,
  user,
  action,
  entityType,
  entityId = null,
  entityTitle = '',
  description = '',
  metadata = {},
}) {
  try {
    await connectDB()
    const activeUser = user || session?.user

    await ActivityLog.create({
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      entityTitle: String(entityTitle || '').slice(0, 200),
      description: String(description || '').slice(0, 500),
      user: activeUser ? {
        id: activeUser.id || activeUser._id,
        name: activeUser.name || 'Anonymous',
        email: activeUser.email || '',
        role: activeUser.roleSlug || activeUser.role || '',
        avatar: activeUser.avatar || null,
      } : {
        name: 'System',
        email: 'system@cms',
        role: 'system',
      },
      metadata,
    })
  } catch (err) {
    console.error('[ActivityLog] Error recording activity:', err.message)
  }
}
