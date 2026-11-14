import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { connectDB } from '@/lib/db/mongoose'
import { SettingGroup } from '@/lib/db/models/SettingGroup'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { canAccessSettingGroup } from '../route'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

function hasPerm(session, perm) {
  if (!session?.user) return false
  if (session.user.role === 'super_admin' || session.user.roleSlug === 'super_admin') return true
  return (session.user.permissions || []).includes(perm)
}

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission(['settings:read', 'settings:update'])
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid setting group ID', 400)

  try {
    await connectDB()
    const group = await SettingGroup.findById(id).lean()
    if (!group) return errorResponse('Group not found', 404)
    if (!canAccessSettingGroup(session, group)) {
      return errorResponse('Forbidden — you do not have access to this settings group', 403)
    }
    return successResponse(group)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('settings:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid setting group ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, description, fields, allowedRoles } = body

    const existing = await SettingGroup.findById(id).lean()
    if (!existing) return errorResponse('Group not found', 404)
    if (!canAccessSettingGroup(session, existing)) {
      return errorResponse('Forbidden — you do not have permission to manage this settings group', 403)
    }

    const canManageSchema = hasPerm(session, 'settings:manage_schema')
    const update = {}

    if (allowedRoles !== undefined) {
      if (!canManageSchema) {
        return errorResponse('Forbidden — missing permission: settings:manage_schema', 403)
      }
      update.allowedRoles = Array.isArray(allowedRoles)
        ? allowedRoles.map((r) => String(r).trim()).filter(Boolean)
        : []
    }

    if (canManageSchema) {
      if (name !== undefined) update.name = String(name).trim()
      if (description !== undefined) update.description = description
      if (fields !== undefined) update.fields = fields
    } else if (Array.isArray(fields)) {
      // Non-schema editors can only update values of existing fields
      const incomingById = new Map(fields.map((f) => [f.id, f]))
      update.fields = (existing.fields || []).map((f) => {
        const match = incomingById.get(f.id)
        return match ? { ...f, value: match.value } : f
      })
    }

    const updated = await SettingGroup.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean()

    try {
      revalidatePath('/dashboard', 'layout')
      revalidatePath('/', 'layout')
    } catch (_) {}

    return successResponse(updated, 'Settings updated successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('settings:create_group')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid setting group ID', 400)

  try {
    await connectDB()
    const existing = await SettingGroup.findById(id).lean()
    if (!existing) return errorResponse('Group not found', 404)
    if (!canAccessSettingGroup(session, existing)) {
      return errorResponse('Forbidden — you do not have permission to delete this settings group', 403)
    }
    if (existing.isSystem) return errorResponse('Cannot delete system settings group', 403)

    await SettingGroup.findByIdAndDelete(id)
    return successResponse(null, 'Settings group deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
