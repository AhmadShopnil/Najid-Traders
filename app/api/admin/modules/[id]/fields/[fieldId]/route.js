import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { isValidObjectId, slugify } from '@/lib/utils'

const ALLOWED_FIELD_KEYS = [
  'name', 'label', 'type', 'required', 'unique', 'isListField',
  'order', 'validation', 'default', 'ui', 'relation',
]

export async function PUT(request, { params }) {
  const { id, fieldId } = await params
  const { authorized, response } = await requirePermission('modules:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  const { data: updates, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const mod = await Module.findById(id)
    if (!mod) return errorResponse('Module not found', 404)

    const fieldIndex = mod.fields.findIndex((f) => f.id === fieldId)
    if (fieldIndex === -1) return errorResponse('Field not found', 404)

    const safeUpdates = {}
    for (const key of ALLOWED_FIELD_KEYS) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key]
    }
    if (safeUpdates.name) {
      safeUpdates.name = slugify(safeUpdates.name).replace(/-/g, '_')
      const duplicate = mod.fields.some((f, idx) => idx !== fieldIndex && f.name === safeUpdates.name)
      if (duplicate) return errorResponse(`Field name '${safeUpdates.name}' already exists`, 409)
    }

    Object.assign(mod.fields[fieldIndex], safeUpdates)
    await mod.save()
    return successResponse(mod, 'Field updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id, fieldId } = await params
  const { authorized, response } = await requirePermission('modules:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  try {
    await connectDB()
    const mod = await Module.findById(id)
    if (!mod) return errorResponse('Module not found', 404)

    mod.fields = mod.fields.filter((f) => f.id !== fieldId)
    await mod.save()
    return successResponse(mod, 'Field deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
