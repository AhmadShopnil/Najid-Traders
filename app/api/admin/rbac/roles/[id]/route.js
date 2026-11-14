import { connectDB } from '@/lib/db/mongoose'
import { Role } from '@/lib/db/models/Role'
import { User } from '@/lib/db/models/User'
import { Group } from '@/lib/db/models/Group'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { invalidatePermissionCache } from '@/lib/auth/auth.config'
import { isValidObjectId } from '@/lib/utils'

export async function GET(request, { params }) {
  const { authorized, response } = await requirePermission('roles:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid role ID', 400)

  try {
    await connectDB()
    const role = await Role.findById(id).lean()
    if (!role) return errorResponse('Role not found', 404)
    return successResponse(role)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { authorized, response } = await requirePermission('roles:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid role ID', 400)

  const { data, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const existing = await Role.findById(id)
    if (!existing) return errorResponse('Role not found', 404)

    if (existing.slug === 'super_admin') {
      return errorResponse('Super admin role cannot be modified', 403)
    }
    if (existing.isSystem && data.slug && data.slug !== existing.slug) {
      return errorResponse('Cannot change the slug of a system role', 400)
    }

    const update = {}
    if (data.name !== undefined) update.name = String(data.name).trim()
    if (data.description !== undefined) update.description = String(data.description)
    if (data.color !== undefined) update.color = String(data.color)
    if (Array.isArray(data.permissions)) update.permissions = data.permissions
    if (!existing.isSystem && data.slug) {
      const cleanSlug = String(data.slug).toLowerCase().replace(/[^a-z0-9]+/g, '_')
      if (cleanSlug === 'super_admin') {
        return errorResponse('Reserved role slug', 400)
      }
      update.slug = cleanSlug
    }

    const updated = await Role.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    invalidatePermissionCache()
    return successResponse(updated, 'Role updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requirePermission('roles:manage')
  if (!authorized) return response

  const { id } = await params
  if (!isValidObjectId(id)) return errorResponse('Invalid role ID', 400)

  try {
    await connectDB()
    const role = await Role.findById(id)
    if (!role) return errorResponse('Role not found', 404)
    if (role.isSystem) return errorResponse('Cannot delete a system role', 400)

    await Promise.all([
      User.updateMany({ roleRef: id }, { $set: { roleRef: null, role: 'viewer' } }),
      Group.updateMany({ roles: id }, { $pull: { roles: id } }),
      role.deleteOne(),
    ])

    invalidatePermissionCache()
    return successResponse(null, 'Role deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
