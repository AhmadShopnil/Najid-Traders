import { connectDB } from '@/lib/db/mongoose'
import { Employee } from '@/lib/db/models/Employee'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { isValidObjectId } from '@/lib/utils'

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, session, response } = await requirePermission('employees:update')
  if (!authorized) return response
  if (!isValidObjectId(id)) return errorResponse('Invalid employee ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const update = {}
    if (body.name !== undefined) update.name = String(body.name).trim()
    if (body.designation !== undefined) update.designation = String(body.designation).trim()
    if (body.department !== undefined) update.department = String(body.department).trim()
    if (body.photo !== undefined) update.photo = String(body.photo).trim()
    if (body.phone !== undefined) update.phone = String(body.phone).trim()
    if (body.email !== undefined) update.email = String(body.email).trim()
    if (body.bio !== undefined) update.bio = String(body.bio).trim()
    if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder) || 0
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive)
    if (body.isFeatured !== undefined) update.isFeatured = Boolean(body.isFeatured)
    if (body.featuredTitle !== undefined) update.featuredTitle = String(body.featuredTitle).trim()
    if (body.featuredQuote !== undefined) update.featuredQuote = String(body.featuredQuote).trim()
    if (body.expertise !== undefined) {
      update.expertise = Array.isArray(body.expertise)
        ? body.expertise.map((x) => String(x).trim()).filter(Boolean)
        : []
    }

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    if (!updated) return errorResponse('Employee not found', 404)

    await recordActivity({
      session,
      action: 'update',
      entityType: 'user',
      entityId: updated._id,
      entityTitle: updated.name,
      description: `Updated team member "${updated.name}"`,
    })

    return successResponse(updated, 'Employee updated successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, session, response } = await requirePermission('employees:delete')
  if (!authorized) return response
  if (!isValidObjectId(id)) return errorResponse('Invalid employee ID', 400)

  try {
    await connectDB()
    const deleted = await Employee.findByIdAndDelete(id).lean()
    if (!deleted) return errorResponse('Employee not found', 404)

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'user',
      entityId: deleted._id,
      entityTitle: deleted.name,
      description: `Removed team member "${deleted.name}"`,
    })

    return successResponse(null, 'Employee deleted successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}
