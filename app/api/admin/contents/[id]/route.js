import { connectDB } from '@/lib/db/mongoose'
import { Content } from '@/lib/db/models/Content'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { validateContent } from '@/lib/validations/content'
import { recordActivity } from '@/lib/activity/logger'
import { resolveContentSlug, slugify, escapeRegex, isValidObjectId } from '@/lib/utils'

async function ensureUniqueContentSlug(moduleId, baseSlug, excludeId = null) {
  if (!baseSlug) return ''
  const regex = new RegExp(`^${escapeRegex(baseSlug)}(?:-(\\d+))?$`)
  const query = { moduleId, 'data.slug': regex }
  if (excludeId) query._id = { $ne: excludeId }

  const existingDocs = await Content.find(query).select('data.slug').lean()
  if (existingDocs.length === 0) return baseSlug

  const taken = new Set(existingDocs.map((d) => d.data?.slug).filter(Boolean))
  if (!taken.has(baseSlug)) return baseSlug

  let counter = 2
  while (taken.has(`${baseSlug}-${counter}`)) {
    counter++
  }
  return `${baseSlug}-${counter}`
}

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('content:read')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid content ID', 400)

  try {
    await connectDB()
    const content = await Content.findById(id).populate('author', 'name email').lean()
    if (!content) return errorResponse('Content not found', 404)
    return successResponse(content)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('content:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid content ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { data, status, seo, taxonomies } = body

    const content = await Content.findById(id).lean()
    if (!content) return errorResponse('Content not found', 404)

    const module = await Module.findById(content.moduleId).lean()
    if (!module) return errorResponse('Module not found', 404)
    if (module.isActive === false) {
      return errorResponse('This module is currently inactive', 403)
    }

    const validation = validateContent(data, module.fields)
    if (!validation.valid) {
      return errorResponse('Validation failed', 422, validation.errors)
    }

    const finalData = { ...(content.data || {}), ...(data || {}), ...validation.data }
    const requestedSlug = data?.slug ? slugify(data.slug) : ''
    const existingSlug = content.data?.slug ? slugify(content.data.slug) : ''
    const baseSlug =
      requestedSlug ||
      existingSlug ||
      resolveContentSlug(finalData, module.fields, String(content._id))
    finalData.slug = await ensureUniqueContentSlug(module._id, baseSlug, content._id)

    const updates = { data: finalData }
    if (seo !== undefined) updates.seo = seo
    if (taxonomies !== undefined) updates.taxonomies = taxonomies
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      updates.status = status
      if (status === 'published') {
        updates.publishedAt = content.publishedAt || new Date()
      } else {
        updates.publishedAt = null
      }
    }

    const updated = await Content.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('author', 'name email')
      .lean()

    const title = updated.data?.title || updated.data?.name || `${module.name} Entry`
    await recordActivity({
      session,
      action: status && status !== content.status ? (status === 'published' ? 'publish' : 'update') : 'update',
      entityType: 'content',
      entityId: id,
      entityTitle: title,
      description: `Updated ${module.name} entry: ${title}`,
      metadata: { moduleSlug: module.slug, status: updated.status },
    })

    return successResponse(updated, 'Content updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('content:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid content ID', 400)

  try {
    await connectDB()
    const content = await Content.findByIdAndDelete(id).lean()
    if (!content) return errorResponse('Content not found', 404)

    const title = content.data?.title || content.data?.name || 'Content Entry'
    await recordActivity({
      session,
      action: 'delete',
      entityType: 'content',
      entityId: id,
      entityTitle: title,
      description: `Deleted content entry: ${title}`,
      metadata: { moduleSlug: content.moduleSlug },
    })

    return successResponse(null, 'Content deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
