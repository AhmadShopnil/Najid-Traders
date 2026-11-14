import { connectDB } from '@/lib/db/mongoose'
import { Content } from '@/lib/db/models/Content'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { isValidObjectId } from '@/lib/utils'

export async function PATCH(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('content:publish')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid content ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { status } = body
    if (!['draft', 'published', 'archived'].includes(status)) {
      return errorResponse('Invalid status', 400)
    }

    const updates = {
      status,
      publishedAt: status === 'published' ? new Date() : null,
    }

    const content = await Content.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
    if (!content) return errorResponse('Content not found', 404)

    const title = content.data?.title || content.data?.name || 'Content Entry'
    await recordActivity({
      session,
      action: status === 'published' ? 'publish' : status === 'archived' ? 'archive' : 'update',
      entityType: 'content',
      entityId: id,
      entityTitle: title,
      description: `Changed status to ${status} for: ${title}`,
      metadata: { moduleSlug: content.moduleSlug, status },
    })

    return successResponse(content, 'Status updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}
