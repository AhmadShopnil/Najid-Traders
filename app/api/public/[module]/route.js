import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/mongoose'
import { Module } from '@/lib/db/models/Module'
import { Content } from '@/lib/db/models/Content'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { errorResponse, buildPagination } from '@/lib/api-response'
import { buildQuery } from '@/lib/query-builder'
import { resolveContentSlug, escapeRegex } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * Helper to resolve taxonomy term IDs or slugs stored inside `content.taxonomies`
 * into rich category objects: [{ id, name, slug, color, taxSlug, taxName }]
 */
export function resolveItemCategories(itemTaxonomies = {}, taxonomiesList = []) {
  const resolved = []
  if (!itemTaxonomies || typeof itemTaxonomies !== 'object') return resolved

  for (const tax of taxonomiesList) {
    const rawVal = itemTaxonomies[tax.slug]
    if (!rawVal) continue
    const valArray = Array.isArray(rawVal) ? rawVal : [rawVal]

    for (const v of valArray) {
      if (!v) continue
      const vStr = String(v).toLowerCase()
      const matchedTerm = (tax.terms || []).find(
        (t) => String(t._id).toLowerCase() === vStr || String(t.slug).toLowerCase() === vStr
      )
      if (matchedTerm) {
        resolved.push({
          id: String(matchedTerm._id),
          name: matchedTerm.name,
          slug: matchedTerm.slug,
          color: matchedTerm.color || '#8b5cf6',
          taxSlug: tax.slug,
          taxName: tax.name,
        })
      }
    }
  }
  return resolved
}

export async function GET(request, { params }) {
  const { module: moduleSlug } = await params
  try {
    await connectDB()
    const mod = await Module.findOne({ slug: moduleSlug, isActive: true }).lean()
    if (!mod) return errorResponse('Module not found', 404)
    if (mod.settings?.allowPublicRead === false) {
      return errorResponse('Public read is disabled for this module', 403)
    }

    const { searchParams } = request.nextUrl
    const taxonomies = await Taxonomy.find({ moduleId: mod._id }).sort({ createdAt: 1 }).lean()

    const { filter, sort, page, limit, skip } = buildQuery(searchParams, mod)
    filter.moduleId = mod._id
    filter.status = 'published'

    // Flexible Safe Search (?q=...) using escaped regex across text fields
    const q = searchParams.get('q')?.trim()
    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i')
      const textFieldNames = (mod.fields || [])
        .filter((f) => ['text', 'longtext', 'richtext', 'slug'].includes(f.type))
        .map((f) => `data.${f.name}`)
      const searchFields = Array.from(
        new Set(['data.title', 'data.name', 'data.headline', 'data.description', 'data.content', ...textFieldNames])
      )
      filter.$and = filter.$and || []
      filter.$and.push({
        $or: searchFields.map((fieldKey) => ({
          [fieldKey]: safeRegex,
        })),
      })
    }

    // Flexible Category / Term filter: supports ?category=..., ?categories=..., ?term=..., ?taxSlug=...&term=...
    const categoryParam =
      searchParams.get('category')?.trim() ||
      searchParams.get('categories')?.trim() ||
      searchParams.get('term')?.trim() ||
      searchParams.get('termId')?.trim()
    const explicitTaxSlug = searchParams.get('taxSlug')?.trim()

    if (categoryParam && categoryParam !== 'all') {
      const requestedCats = categoryParam
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c && c !== 'all')

      if (requestedCats.length > 0) {
        const catOrConditions = []

        for (const tax of taxonomies) {
          if (explicitTaxSlug && tax.slug !== explicitTaxSlug) continue
          const candidateValues = []

          for (const rawCat of requestedCats) {
            const paramLower = rawCat.toLowerCase()
            const matchedTerm = (tax.terms || []).find(
              (t) =>
                String(t._id).toLowerCase() === paramLower ||
                String(t.slug).toLowerCase() === paramLower ||
                String(t.name).toLowerCase() === paramLower
            )

            candidateValues.push(rawCat)
            if (matchedTerm) {
              candidateValues.push(String(matchedTerm._id), matchedTerm.slug)
              if (mongoose.Types.ObjectId.isValid(matchedTerm._id)) {
                candidateValues.push(new mongoose.Types.ObjectId(String(matchedTerm._id)))
              }
            } else if (mongoose.Types.ObjectId.isValid(rawCat)) {
              candidateValues.push(new mongoose.Types.ObjectId(rawCat))
            }
          }

          const uniqueVals = Array.from(new Set(candidateValues))
          if (uniqueVals.length > 0) {
            catOrConditions.push({ [`taxonomies.${tax.slug}`]: { $in: uniqueVals } })
          }
        }

        if (catOrConditions.length > 0) {
          filter.$and = filter.$and || []
          filter.$and.push({ $or: catOrConditions })
        }
      }
    }

    // Normalize taxonomy[taxSlug]=value passed via buildQuery so slug or termId both match
    for (const tax of taxonomies) {
      const taxKey = `taxonomies.${tax.slug}`
      if (filter[taxKey] && typeof filter[taxKey] === 'string') {
        const raw = filter[taxKey]
        delete filter[taxKey]
        const matched = (tax.terms || []).find(
          (t) =>
            String(t._id).toLowerCase() === raw.toLowerCase() ||
            String(t.slug).toLowerCase() === raw.toLowerCase()
        )
        const vals = [raw]
        if (matched) {
          vals.push(String(matched._id), matched.slug)
          if (mongoose.Types.ObjectId.isValid(matched._id)) {
            vals.push(new mongoose.Types.ObjectId(String(matched._id)))
          }
        }
        filter[taxKey] = { $in: Array.from(new Set(vals)) }
      }
    }

    const [total, items] = await Promise.all([
      Content.countDocuments(filter),
      Content.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .lean(),
    ])

    const publicTaxonomies = taxonomies.map((tax) => ({
      id: String(tax._id),
      name: tax.name,
      slug: tax.slug,
      hierarchical: tax.hierarchical,
      terms: (tax.terms || []).map((t) => ({
        id: String(t._id),
        name: t.name,
        slug: t.slug,
        color: t.color || '#8b5cf6',
        parentId: t.parentId ? String(t.parentId) : null,
      })),
    }))

    const formattedItems = items.map((item) => {
      const resolvedSlug = resolveContentSlug(item.data, mod.fields, String(item._id))
      const itemData = { ...(item.data || {}), slug: resolvedSlug }
      return {
        ...itemData,
        id: String(item._id),
        _id: String(item._id),
        slug: resolvedSlug,
        data: itemData,
        seo: item.seo || {},
        taxonomies: item.taxonomies || {},
        resolvedCategories: resolveItemCategories(item.taxonomies, taxonomies),
        author: item.author ? { name: item.author.name, avatar: item.author.avatar } : null,
        moduleSlug: mod.slug,
        moduleName: mod.name,
        status: item.status,
        publishedAt: item.publishedAt || item.createdAt,
        createdAt: item.createdAt,
      }
    })

    return Response.json({
      success: true,
      message: 'Success',
      data: formattedItems,
      pagination: buildPagination(total, page, limit),
      meta: {
        module: {
          id: String(mod._id),
          name: mod.name,
          slug: mod.slug,
          icon: mod.icon || '📰',
          fields: mod.fields || [],
        },
        taxonomies: publicTaxonomies,
      },
    })
  } catch (err) {
    return errorResponse(err.message)
  }
}
