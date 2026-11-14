import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { Content } from '@/lib/db/models/Content'
import { successResponse, errorResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const modules = await Module.find({
      isActive: true,
      'settings.allowPublicRead': { $ne: false },
    })
      .sort({ createdAt: -1 })
      .lean()
    const moduleIds = modules.map((m) => m._id)

    const [taxonomies, counts] = moduleIds.length > 0
      ? await Promise.all([
          Taxonomy.find({ moduleId: { $in: moduleIds } }).sort({ createdAt: 1 }).lean(),
          Content.aggregate([
            { $match: { moduleId: { $in: moduleIds }, status: 'published' } },
            { $group: { _id: '$moduleId', count: { $sum: 1 } } },
          ]),
        ])
      : [[], []]

    const countMap = {}
    counts.forEach((c) => {
      countMap[String(c._id)] = c.count
    })

    const taxByModule = {}
    taxonomies.forEach((tax) => {
      const mKey = String(tax.moduleId)
      if (!taxByModule[mKey]) taxByModule[mKey] = []
      taxByModule[mKey].push({
        id: String(tax._id),
        name: tax.name,
        slug: tax.slug,
        hierarchical: tax.hierarchical,
        allowMultiple: tax.allowMultiple,
        terms: (tax.terms || []).map((t) => ({
          id: String(t._id),
          name: t.name,
          slug: t.slug,
          color: t.color || '#8b5cf6',
          parentId: t.parentId ? String(t.parentId) : null,
          description: t.description || '',
        })),
      })
    })

    const data = modules.map((m) => ({
      id: String(m._id),
      name: m.name,
      slug: m.slug,
      icon: m.icon || '📰',
      description: m.description || '',
      publishedCount: countMap[String(m._id)] || 0,
      fields: (m.fields || []).map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        isListField: f.isListField,
      })),
      taxonomies: taxByModule[String(m._id)] || [],
    }))

    return successResponse(data)
  } catch (err) {
    return errorResponse(err.message)
  }
}
