import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/mongoose'
import { Content } from '@/lib/db/models/Content'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  buildPagination,
  parseJsonBody,
} from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { validateContent } from '@/lib/validations/content'
import { recordActivity } from '@/lib/activity/logger'
import {
  resolveContentSlug,
  slugify,
  escapeRegex,
  parsePaginationParams,
  isValidObjectId,
} from '@/lib/utils'

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

export async function GET(request) {
  const { authorized, response } = await requirePermission('content:read')
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const moduleId = searchParams.get('moduleId')
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 20, maxLimit: 100 })
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()
    const termId = searchParams.get('termId')?.trim()
    const taxSlug = searchParams.get('taxSlug')?.trim()

    if (moduleId && !isValidObjectId(moduleId)) {
      return errorResponse('Invalid moduleId', 400)
    }

    const filter = {}
    if (moduleId) filter.moduleId = moduleId
    if (status) filter.status = status

    const andConditions = []

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i')
      let searchFields = ['data.title', 'data.name', 'data.headline', 'data.slug', 'data.summary', 'data.description']
      if (moduleId) {
        const mod = await Module.findById(moduleId).select('fields').lean()
        if (mod?.fields?.length) {
          const textFields = mod.fields
            .filter((f) => ['text', 'longtext', 'richtext', 'slug', 'email'].includes(f.type))
            .map((f) => `data.${f.name}`)
          searchFields = Array.from(new Set([...searchFields, ...textFields]))
        }
      }
      andConditions.push({
        $or: searchFields.map((fieldKey) => ({ [fieldKey]: safeRegex })),
      })
    }

    if (termId) {
      const termCandidates = [termId]
      if (mongoose.Types.ObjectId.isValid(termId)) {
        termCandidates.push(new mongoose.Types.ObjectId(termId))
      }

      if (taxSlug) {
        andConditions.push({ [`taxonomies.${taxSlug}`]: { $in: termCandidates } })
      } else {
        let taxKeys = ['category', 'categories', 'tags', 'tag']
        if (moduleId) {
          const taxes = await Taxonomy.find({ moduleId }).select('slug').lean()
          if (taxes.length > 0) {
            taxKeys = Array.from(new Set([...taxKeys, ...taxes.map((t) => t.slug)]))
          }
        }
        andConditions.push({
          $or: taxKeys.map((k) => ({ [`taxonomies.${k}`]: { $in: termCandidates } })),
        })
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions
    }

    const [total, items] = await Promise.all([
      Content.countDocuments(filter),
      Content.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
    ])

    return paginatedResponse(items, buildPagination(total, page, limit))
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('content:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { moduleId, data, status, seo, taxonomies } = body

    if (!moduleId || !isValidObjectId(String(moduleId))) {
      return errorResponse('Valid moduleId is required', 400)
    }

    const module = await Module.findById(moduleId).lean()
    if (!module) return errorResponse('Module not found', 404)
    if (module.isActive === false) {
      return errorResponse('This module is currently inactive', 403)
    }

    const validation = validateContent(data, module.fields)
    if (!validation.valid) {
      return errorResponse('Validation failed', 422, validation.errors)
    }

    const finalData = { ...(data || {}), ...validation.data }
    const requestedSlug = data?.slug ? slugify(data.slug) : ''
    const baseSlug = requestedSlug || resolveContentSlug(finalData, module.fields) || `item-${Date.now().toString(36)}`
    finalData.slug = await ensureUniqueContentSlug(module._id, baseSlug)

    const resolvedStatus = ['draft', 'published', 'archived'].includes(status) ? status : 'draft'

    const content = await Content.create({
      moduleId,
      moduleSlug: module.slug,
      data: finalData,
      status: resolvedStatus,
      seo,
      taxonomies: taxonomies || {},
      author: session.user.id,
      publishedAt: resolvedStatus === 'published' ? new Date() : null,
    })

    const title = content.data?.title || content.data?.name || `${module.name} Entry`
    await recordActivity({
      session,
      action: resolvedStatus === 'published' ? 'publish' : 'create',
      entityType: 'content',
      entityId: content._id,
      entityTitle: title,
      description: `Created new ${module.name} entry: ${title}`,
      metadata: { moduleSlug: module.slug, status: content.status },
    })

    return successResponse(content, 'Content created', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
