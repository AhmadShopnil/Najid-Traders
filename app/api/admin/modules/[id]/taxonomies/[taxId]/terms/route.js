import { connectDB } from '@/lib/db/mongoose'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { slugify } from '@/lib/utils'

export async function POST(request, { params }) {
  const { id, taxId } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update', 'content:create', 'content:update'])
  if (!authorized) return response

  try {
    await connectDB()
    const taxonomy = await Taxonomy.findOne({ _id: taxId, moduleId: id })
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)

    const module = await Module.findById(id).lean()

    const body = await request.json()
    const { name, parentId = null, description = '', color = '#8b5cf6', order = 0 } = body

    if (!name || !name.trim()) {
      return errorResponse('Term name is required', 400)
    }

    const slug = slugify(body.slug || name)
    const slugExists = taxonomy.terms.some((t) => t.slug === slug)
    if (slugExists) {
      return errorResponse(`A term with slug '${slug}' already exists in this taxonomy`, 409)
    }

    // If parentId provided, verify it exists
    if (parentId && taxonomy.hierarchical) {
      const parentExists = taxonomy.terms.some((t) => String(t._id) === String(parentId))
      if (!parentExists) {
        return errorResponse('Specified parent term does not exist', 400)
      }
    }

    const newTerm = {
      name: name.trim(),
      slug,
      parentId: taxonomy.hierarchical && parentId ? parentId : null,
      description: description.trim(),
      color: color || '#8b5cf6',
      order: Number(order) || taxonomy.terms.length,
    }

    taxonomy.terms.push(newTerm)
    await taxonomy.save()

    const addedTerm = taxonomy.terms[taxonomy.terms.length - 1]

    await recordActivity({
      session,
      action: 'create',
      entityType: 'module',
      entityId: id,
      entityTitle: `${module?.name || 'Module'} - ${taxonomy.name}: ${addedTerm.name}`,
      description: `Added term '${addedTerm.name}' to taxonomy '${taxonomy.name}'`,
      metadata: { moduleId: id, taxonomyId: taxId, termSlug: slug },
    })

    return successResponse(addedTerm, 'Term added successfully', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
