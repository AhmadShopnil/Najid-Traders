import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { slugify } from '@/lib/utils'

export async function GET(request, { params }) {
  const { id, taxId } = await params
  const { authorized, response } = await requirePermission(['modules:read', 'content:read', 'content:create', 'taxonomies:manage'])
  if (!authorized) return response

  try {
    await connectDB()
    const taxonomy = await Taxonomy.findOne({ _id: taxId, moduleId: id }).lean()
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)
    return successResponse(taxonomy)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id, taxId } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update'])
  if (!authorized) return response

  try {
    await connectDB()
    const taxonomy = await Taxonomy.findOne({ _id: taxId, moduleId: id })
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)

    const module = await Module.findById(id).lean()

    const body = await request.json()
    const { name, hierarchical, allowMultiple, required, description } = body

    if (name) taxonomy.name = name.trim()
    if (body.slug) {
      const newSlug = slugify(body.slug)
      if (newSlug !== taxonomy.slug) {
        const existing = await Taxonomy.findOne({ moduleId: id, slug: newSlug, _id: { $ne: taxId } })
        if (existing) return errorResponse(`Taxonomy slug '${newSlug}' is already taken`, 409)
        taxonomy.slug = newSlug
      }
    }
    if (hierarchical !== undefined) taxonomy.hierarchical = Boolean(hierarchical)
    if (allowMultiple !== undefined) taxonomy.allowMultiple = Boolean(allowMultiple)
    if (required !== undefined) taxonomy.required = Boolean(required)
    if (description !== undefined) taxonomy.description = description.trim()

    await taxonomy.save()

    await recordActivity({
      session,
      action: 'update',
      entityType: 'module',
      entityId: id,
      entityTitle: `${module?.name || 'Module'} - ${taxonomy.name} Taxonomy`,
      description: `Updated taxonomy '${taxonomy.name}'`,
      metadata: { moduleId: id, taxonomySlug: taxonomy.slug },
    })

    return successResponse(taxonomy, 'Taxonomy updated')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id, taxId } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update', 'modules:delete'])
  if (!authorized) return response

  try {
    await connectDB()
    const taxonomy = await Taxonomy.findOneAndDelete({ _id: taxId, moduleId: id })
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)

    const module = await Module.findById(id).lean()

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'module',
      entityId: id,
      entityTitle: `${module?.name || 'Module'} - ${taxonomy.name} Taxonomy`,
      description: `Deleted taxonomy '${taxonomy.name}' from module '${module?.name || id}'`,
      metadata: { moduleId: id, taxonomySlug: taxonomy.slug },
    })

    return successResponse(null, 'Taxonomy deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
