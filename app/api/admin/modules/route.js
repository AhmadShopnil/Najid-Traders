import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { slugify, generateId } from '@/lib/utils'
import { recordActivity } from '@/lib/activity/logger'

export async function GET(request) {
  // Allow reading modules for module managers or anyone who can read/manage content or categories
  const { authorized, response } = await requirePermission(['modules:read', 'content:read', 'content:create', 'pages:read', 'taxonomies:manage'])
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const filter = {}
    if (searchParams.get('active') === 'true') filter.isActive = true
    if (searchParams.get('active') === 'false') filter.isActive = false

    const modules = await Module.find(filter).sort({ createdAt: -1 }).lean()
    return successResponse(modules)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('modules:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, description, icon, settings, fields = [], taxonomies = [] } = body

    if (!name || !String(name).trim()) return errorResponse('Module name is required', 400)

    const slug = slugify(body.slug || name)
    if (!slug) return errorResponse('Valid module slug is required', 400)

    const existing = await Module.findOne({ slug }).select('_id').lean()
    if (existing) return errorResponse('Module slug already exists', 409)

    // Prepare initial fields if provided
    const preparedFields = Array.isArray(fields)
      ? fields.map((f, idx) => ({
          id: f.id || generateId(),
          name: f.name ? slugify(f.name).replace(/-/g, '_') : `field_${idx}`,
          label: f.label || f.name,
          type: f.type || 'text',
          required: Boolean(f.required),
          unique: Boolean(f.unique),
          isListField: f.isListField !== false,
          order: Number(f.order !== undefined ? f.order : idx),
          validation: f.validation || {},
          default: f.default,
          ui: f.ui || {},
          relation: f.relation || {},
        }))
      : []

    const createdModule = await Module.create({
      name: String(name).trim(),
      slug,
      description,
      icon: icon || '📦',
      settings,
      fields: preparedFields,
      createdBy: session.user.id,
    })

    // Bulk-create initial taxonomies/categories if provided
    const taxDocs = []
    const seenTaxSlugs = new Set()
    if (Array.isArray(taxonomies) && taxonomies.length > 0) {
      for (const tax of taxonomies) {
        if (!tax.name || !tax.name.trim()) continue
        const taxSlug = slugify(tax.slug || tax.name)
        if (!taxSlug || seenTaxSlugs.has(taxSlug)) continue
        seenTaxSlugs.add(taxSlug)

        const terms = Array.isArray(tax.terms)
          ? tax.terms
              .map((t, tIdx) => {
                const tName = typeof t === 'string' ? t.trim() : t.name?.trim()
                if (!tName) return null
                return {
                  name: tName,
                  slug: slugify(t.slug || tName),
                  parentId: t.parentId || null,
                  color: t.color || '#8b5cf6',
                  description: t.description || '',
                  order: t.order || tIdx,
                }
              })
              .filter(Boolean)
          : []

        taxDocs.push({
          moduleId: createdModule._id,
          name: tax.name.trim(),
          slug: taxSlug,
          hierarchical: tax.hierarchical !== false,
          allowMultiple: tax.allowMultiple !== false,
          required: Boolean(tax.required),
          description: tax.description || '',
          terms,
        })
      }
      if (taxDocs.length > 0) {
        await Taxonomy.insertMany(taxDocs)
      }
    }

    await recordActivity({
      session,
      action: 'create',
      entityType: 'module',
      entityId: createdModule._id,
      entityTitle: createdModule.name,
      description: `Created new module: ${createdModule.name} with ${preparedFields.length} field(s) and ${taxDocs.length} taxonomy system(s)`,
      metadata: {
        slug: createdModule.slug,
        fieldsCount: preparedFields.length,
        taxonomiesCount: taxDocs.length,
      },
    })

    return successResponse(createdModule, 'Module created', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
