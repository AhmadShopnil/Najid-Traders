import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { slugify } from '@/lib/utils'

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission(['modules:read', 'content:read', 'content:create', 'taxonomies:manage'])
  if (!authorized) return response

  try {
    await connectDB()
    const module = await Module.findById(id).lean()
    if (!module) return errorResponse('Module not found', 404)

    const taxonomies = await Taxonomy.find({ moduleId: id }).sort({ createdAt: 1 }).lean()
    return successResponse(taxonomies)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update', 'modules:create'])
  if (!authorized) return response

  try {
    await connectDB()
    const module = await Module.findById(id)
    if (!module) return errorResponse('Module not found', 404)

    const body = await request.json()
    const { name, hierarchical = true, allowMultiple = true, required = false, description = '' } = body

    if (!name || !name.trim()) {
      return errorResponse('Taxonomy name is required', 400)
    }

    const slug = slugify(body.slug || name)
    const existing = await Taxonomy.findOne({ moduleId: id, slug })
    if (existing) {
      return errorResponse(`Taxonomy with slug '${slug}' already exists for this module`, 409)
    }

    const taxonomy = await Taxonomy.create({
      moduleId: id,
      name: name.trim(),
      slug,
      hierarchical: Boolean(hierarchical),
      allowMultiple: Boolean(allowMultiple),
      required: Boolean(required),
      description: description.trim(),
      terms: [],
    })

    await recordActivity({
      session,
      action: 'create',
      entityType: 'module',
      entityId: id,
      entityTitle: `${module.name} - ${taxonomy.name} Taxonomy`,
      description: `Created taxonomy '${taxonomy.name}' for module '${module.name}'`,
      metadata: { moduleId: id, taxonomySlug: slug },
    })

    return successResponse(taxonomy, 'Taxonomy created', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
