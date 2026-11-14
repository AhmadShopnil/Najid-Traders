import { connectDB } from '@/lib/db/mongoose'
import { Inquiry } from '@/lib/db/models/Inquiry'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { isValidObjectId } from '@/lib/utils'

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, session, response } = await requirePermission('inquiries:update')
  if (!authorized) return response
  if (!isValidObjectId(id)) return errorResponse('Invalid inquiry ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const update = {}
    if (body.status && ['new', 'contacted', 'closed'].includes(body.status)) {
      update.status = body.status
    }
    if (body.adminNotes !== undefined) {
      update.adminNotes = String(body.adminNotes).trim()
    }

    const updated = await Inquiry.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    if (!updated) return errorResponse('Inquiry not found', 404)

    await recordActivity({
      session,
      action: 'update',
      entityType: 'content',
      entityId: updated._id,
      entityTitle: updated.name,
      description: `Updated inquiry from "${updated.name}" to status "${updated.status}"`,
    })

    return successResponse(updated, 'Inquiry updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, session, response } = await requirePermission('inquiries:delete')
  if (!authorized) return response
  if (!isValidObjectId(id)) return errorResponse('Invalid inquiry ID', 400)

  try {
    await connectDB()
    const deleted = await Inquiry.findByIdAndDelete(id).lean()
    if (!deleted) return errorResponse('Inquiry not found', 404)

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'content',
      entityId: deleted._id,
      entityTitle: deleted.name,
      description: `Deleted inquiry from "${deleted.name}"`,
    })

    return successResponse(null, 'Inquiry deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
