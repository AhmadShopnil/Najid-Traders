import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { generateId, isValidObjectId, slugify } from '@/lib/utils'

export async function POST(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('modules:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  const { data: field, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, label, type } = field
    if (!name || !label || !type) {
      return errorResponse('name, label, and type are required', 400)
    }

    const cleanName = slugify(name).replace(/-/g, '_')
    if (!cleanName) return errorResponse('Valid field name is required', 400)

    const mod = await Module.findById(id)
    if (!mod) return errorResponse('Module not found', 404)

    const nameExists = mod.fields.some((f) => f.name === cleanName)
    if (nameExists) return errorResponse(`Field name '${cleanName}' already exists`, 409)

    const newField = {
      ...field,
      name: cleanName,
      id: generateId(),
      order: mod.fields.length,
    }
    mod.fields.push(newField)
    await mod.save()

    return successResponse(mod, 'Field added', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
