import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Content } from '@/lib/db/models/Content'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { isValidObjectId } from '@/lib/utils'

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission(['modules:read', 'content:read', 'content:create', 'taxonomies:manage'])
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  try {
    await connectDB()
    const mod = await Module.findById(id).lean()
    if (!mod) return errorResponse('Module not found', 404)
    return successResponse(mod)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('modules:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const existing = await Module.findById(id)
    if (!existing) return errorResponse('Module not found', 404)

    const { name, description, icon, isActive, settings } = body
    if (name !== undefined) existing.name = String(name).trim()
    if (description !== undefined) existing.description = description
    if (icon !== undefined) existing.icon = icon
    if (isActive !== undefined) existing.isActive = Boolean(isActive)
    if (settings && typeof settings === 'object') {
      existing.settings = {
        ...(existing.settings?.toObject ? existing.settings.toObject() : existing.settings || {}),
        ...settings,
      }
    }

    await existing.save()

    await recordActivity({
      session,
      action: 'update',
      entityType: 'module',
      entityId: id,
      entityTitle: existing.name,
      description: `Updated module schema/settings: ${existing.name}`,
      metadata: { slug: existing.slug },
    })

    return successResponse(existing.toObject(), 'Module updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('modules:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid module ID', 400)

  try {
    await connectDB()
    const mod = await Module.findById(id)
    if (!mod) return errorResponse('Module not found', 404)

    const moduleName = mod.name
    const moduleSlug = mod.slug

    await Promise.all([
      Content.deleteMany({ moduleId: id }),
      Taxonomy.deleteMany({ moduleId: id }),
      mod.deleteOne(),
    ])

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'module',
      entityId: id,
      entityTitle: moduleName,
      description: `Deleted module: ${moduleName} and all associated entries & taxonomies`,
      metadata: { slug: moduleSlug },
    })

    return successResponse(null, 'Module deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
