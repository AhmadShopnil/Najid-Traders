import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { isValidObjectId } from '@/lib/utils'

export async function POST(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('modules:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { fields } = body
    if (!Array.isArray(fields)) return errorResponse('fields array is required', 400)

    const mod = await Module.findById(id)
    if (!mod) return errorResponse('Module not found', 404)

    const fieldMap = new Map()
    mod.fields.forEach((f) => {
      fieldMap.set(f.id, f.toObject ? f.toObject() : { ...f })
    })

    const reordered = []
    const seen = new Set()
    for (const fid of fields) {
      if (fieldMap.has(fid) && !seen.has(fid)) {
        seen.add(fid)
        reordered.push({ ...fieldMap.get(fid), order: reordered.length })
      }
    }
    // Preserve any omitted fields at the end rather than silently dropping them
    for (const [fid, fObj] of fieldMap.entries()) {
      if (!seen.has(fid)) {
        reordered.push({ ...fObj, order: reordered.length })
      }
    }

    mod.fields = reordered
    await mod.save()
    return successResponse(mod, 'Fields reordered')
  } catch (err) {
    return errorResponse(err.message)
  }
}
