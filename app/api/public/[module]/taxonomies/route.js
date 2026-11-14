import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { module: moduleSlug } = await params

  try {
    await connectDB()
    const mod = await Module.findOne({ slug: moduleSlug, isActive: true }).lean()

    if (!mod) return errorResponse('Module not found', 404)
    if (mod.settings?.allowPublicRead === false) {
      return errorResponse('Public read is disabled for this module', 403)
    }

    const taxonomies = await Taxonomy.find({ moduleId: mod._id }).sort({ createdAt: 1 }).lean()

    const publicTaxonomies = taxonomies.map((tax) => {
      const terms = tax.terms || []
      return {
        id: String(tax._id),
        name: tax.name,
        slug: tax.slug,
        description: tax.description,
        hierarchical: tax.hierarchical,
        allowMultiple: tax.allowMultiple,
        terms: terms.map((t) => ({
          id: String(t._id),
          name: t.name,
          slug: t.slug,
          parentId: t.parentId ? String(t.parentId) : null,
          description: t.description,
          color: t.color || '#8b5cf6',
          order: t.order,
        })),
      }
    })

    return successResponse(publicTaxonomies)
  } catch (err) {
    return errorResponse(err.message)
  }
}
