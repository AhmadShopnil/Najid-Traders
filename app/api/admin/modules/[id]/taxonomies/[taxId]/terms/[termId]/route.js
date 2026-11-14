import { connectDB } from '@/lib/db/mongoose'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { Module } from '@/lib/db/models/Module'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { slugify, isValidObjectId } from '@/lib/utils'

function createsCycle(terms, termId, candidateParentId) {
  let current = String(candidateParentId)
  const visited = new Set([String(termId)])
  while (current) {
    if (visited.has(current)) return true
    visited.add(current)
    const parentTerm = terms.find((t) => String(t._id) === current)
    current = parentTerm?.parentId ? String(parentTerm.parentId) : ''
  }
  return false
}

export async function PUT(request, { params }) {
  const { id, taxId, termId } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update', 'content:update'])
  if (!authorized) return response

  if (!isValidObjectId(id) || !isValidObjectId(taxId) || !isValidObjectId(termId)) {
    return errorResponse('Invalid identifier', 400)
  }

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const [taxonomy, mod] = await Promise.all([
      Taxonomy.findOne({ _id: taxId, moduleId: id }),
      Module.findById(id).select('name').lean(),
    ])
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)

    const term = taxonomy.terms.id(termId)
    if (!term) return errorResponse('Term not found', 404)

    const { name, parentId, description, color, order } = body

    if (name !== undefined && String(name).trim()) term.name = String(name).trim()
    if (body.slug) {
      const newSlug = slugify(body.slug)
      if (newSlug && newSlug !== term.slug) {
        const slugExists = taxonomy.terms.some((t) => String(t._id) !== String(termId) && t.slug === newSlug)
        if (slugExists) return errorResponse(`Slug '${newSlug}' is already taken in this taxonomy`, 409)
        term.slug = newSlug
      }
    }

    if (parentId !== undefined) {
      if (parentId) {
        if (String(parentId) === String(termId)) {
          return errorResponse('A term cannot be its own parent', 400)
        }
        const parentExists = taxonomy.terms.some((t) => String(t._id) === String(parentId))
        if (!parentExists) {
          return errorResponse('Specified parent term does not exist', 400)
        }
        if (createsCycle(taxonomy.terms, termId, parentId)) {
          return errorResponse('Invalid parent term: circular hierarchy detected', 400)
        }
      }
      term.parentId = taxonomy.hierarchical && parentId ? parentId : null
    }

    if (description !== undefined) term.description = String(description).trim()
    if (color !== undefined) term.color = color
    if (order !== undefined) term.order = Number(order)

    await taxonomy.save()

    await recordActivity({
      session,
      action: 'update',
      entityType: 'module',
      entityId: id,
      entityTitle: `${mod?.name || 'Module'} - ${taxonomy.name}: ${term.name}`,
      description: `Updated term '${term.name}' in taxonomy '${taxonomy.name}'`,
      metadata: { moduleId: id, taxonomyId: taxId, termId },
    })

    return successResponse(term, 'Term updated successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id, taxId, termId } = await params
  const { authorized, response, session } = await requirePermission(['taxonomies:manage', 'modules:update'])
  if (!authorized) return response

  if (!isValidObjectId(id) || !isValidObjectId(taxId) || !isValidObjectId(termId)) {
    return errorResponse('Invalid identifier', 400)
  }

  try {
    await connectDB()
    const [taxonomy, mod] = await Promise.all([
      Taxonomy.findOne({ _id: taxId, moduleId: id }),
      Module.findById(id).select('name').lean(),
    ])
    if (!taxonomy) return errorResponse('Taxonomy not found', 404)

    const term = taxonomy.terms.id(termId)
    if (!term) return errorResponse('Term not found', 404)

    const termName = term.name

    taxonomy.terms.forEach((t) => {
      if (t.parentId && String(t.parentId) === String(termId)) {
        t.parentId = null
      }
    })

    taxonomy.terms.pull(termId)
    await taxonomy.save()

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'module',
      entityId: id,
      entityTitle: `${mod?.name || 'Module'} - ${taxonomy.name}: ${termName}`,
      description: `Deleted term '${termName}' from taxonomy '${taxonomy.name}'`,
      metadata: { moduleId: id, taxonomyId: taxId, termId },
    })

    return successResponse(null, 'Term deleted successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}
