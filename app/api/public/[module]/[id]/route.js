import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Content } from '@/lib/db/models/Content'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { successResponse, errorResponse } from '@/lib/api-response'
import { resolveContentSlug, slugify } from '@/lib/utils'
import { resolveItemCategories } from '../route'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { module: moduleSlug, id } = await params
  try {
    await connectDB()
    const mod = await Module.findOne({ slug: moduleSlug, isActive: true }).lean()
    if (!mod) return errorResponse('Module not found', 404)
    if (mod.settings?.allowPublicRead === false) {
      return errorResponse('Public read is disabled for this module', 403)
    }

    let decodedId = id
    try {
      decodedId = decodeURIComponent(id)
    } catch {}

    const taxonomiesPromise = Taxonomy.find({ moduleId: mod._id }).sort({ createdAt: 1 }).lean()

    let contentPromise
    if (id === 'latest') {
      contentPromise = Content.findOne({
        moduleId: mod._id,
        status: 'published',
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .populate('author', 'name avatar')
        .lean()
    } else {
      const slugCandidates = Array.from(new Set([id, decodedId, slugify(decodedId)].filter(Boolean)))
      const lookupOr = [{ 'data.slug': { $in: slugCandidates } }]
      if (mongoose.Types.ObjectId.isValid(id)) {
        lookupOr.unshift({ _id: new mongoose.Types.ObjectId(id) })
      }
      contentPromise = Content.findOne({
        moduleId: mod._id,
        status: 'published',
        $or: lookupOr,
      })
        .populate('author', 'name avatar')
        .lean()
    }

    let [taxonomies, content] = await Promise.all([taxonomiesPromise, contentPromise])

    // Bounded legacy fallback only for items missing stored data.slug
    if (!content && id !== 'latest') {
      const slugCandidates = Array.from(new Set([id, decodedId, slugify(decodedId)].filter(Boolean)))
      const legacyCandidates = await Content.find({
        moduleId: mod._id,
        status: 'published',
        'data.slug': { $exists: false },
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('author', 'name avatar')
        .lean()

      content =
        legacyCandidates.find((doc) => {
          const derived = resolveContentSlug(doc.data, mod.fields, String(doc._id))
          return slugCandidates.includes(derived)
        }) || null
    }

    if (!content) return errorResponse('Content not found', 404)

    const mainSlug = resolveContentSlug(content.data, mod.fields, String(content._id))
    const mainData = { ...(content.data || {}), slug: mainSlug }
    const resolvedCategories = resolveItemCategories(content.taxonomies, taxonomies)

    const relatedDocs = await Content.find({
      moduleId: mod._id,
      status: 'published',
      _id: { $ne: content._id },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(4)
      .lean()

    const relatedItems = relatedDocs.map((rel) => {
      const relSlug = resolveContentSlug(rel.data, mod.fields, String(rel._id))
      const relData = { ...(rel.data || {}), slug: relSlug }
      return {
        ...relData,
        id: String(rel._id),
        _id: String(rel._id),
        slug: relSlug,
        data: relData,
        resolvedCategories: resolveItemCategories(rel.taxonomies, taxonomies),
        moduleSlug: mod.slug,
        publishedAt: rel.publishedAt || rel.createdAt,
        createdAt: rel.createdAt,
      }
    })

    return successResponse({
      ...mainData,
      id: String(content._id),
      _id: String(content._id),
      slug: mainSlug,
      data: mainData,
      seo: content.seo || {},
      taxonomies: content.taxonomies || {},
      resolvedCategories,
      author: content.author
        ? { name: content.author.name, avatar: content.author.avatar }
        : null,
      module: {
        id: String(mod._id),
        name: mod.name,
        slug: mod.slug,
        icon: mod.icon || '📦',
        fields: mod.fields || [],
      },
      relatedItems,
      publishedAt: content.publishedAt || content.createdAt,
      createdAt: content.createdAt,
    })
  } catch (err) {
    return errorResponse(err.message)
  }
}
