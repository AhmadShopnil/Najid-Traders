import { connectDB } from '@/lib/db/mongoose'
import { BuilderPage } from '@/lib/db/models/BuilderPage'
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  buildPagination,
  parseJsonBody,
} from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { slugify, escapeRegex, parsePaginationParams } from '@/lib/utils'
import { recordActivity } from '@/lib/activity/logger'
import { sanitizeBuilderSections } from '@/lib/sanitize'

export async function GET(request) {
  const { authorized, response } = await requirePermission('pages:read')
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 50, maxLimit: 200 })
    const status = searchParams.get('status')
    const pageType = searchParams.get('pageType')
    const q = searchParams.get('q')?.trim()
    const summary = searchParams.get('summary') === 'true'

    const filter = {}
    if (status) filter.status = status
    if (pageType) filter.pageType = pageType
    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ title: safeRegex }, { slug: safeRegex }]
    }

    const query = BuilderPage.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email avatar')

    if (summary) {
      query.select('title slug status pageType targetModule publishedAt createdAt updatedAt createdBy sections.id sections.widgets.id')
    }

    const [total, items] = await Promise.all([
      BuilderPage.countDocuments(filter),
      query.lean(),
    ])

    return paginatedResponse(items, buildPagination(total, page, limit))
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('pages:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { title, slug, status, pageType, targetModule, seo, sections } = body

    if (!title || !String(title).trim()) return errorResponse('Page title is required', 400)

    const finalSlug = slugify(slug || title)
    if (!finalSlug) return errorResponse('Valid page slug is required', 400)

    const existing = await BuilderPage.findOne({ slug: finalSlug }).select('_id').lean()
    if (existing) return errorResponse('Page slug already exists', 409)

    const userPerms = session.user.permissions || []
    const canPublish =
      session.user.role === 'super_admin' ||
      session.user.roleSlug === 'super_admin' ||
      userPerms.includes('pages:publish')

    const requestedStatus = ['draft', 'published', 'archived'].includes(status) ? status : 'draft'
    const finalStatus = requestedStatus === 'published' && !canPublish ? 'draft' : requestedStatus
    const publishedAt = finalStatus === 'published' ? new Date() : null

    const page = await BuilderPage.create({
      title: String(title).trim(),
      slug: finalSlug,
      status: finalStatus,
      pageType: ['standard', 'module_feed', 'single_template', 'category_template'].includes(pageType)
        ? pageType
        : 'standard',
      targetModule: targetModule || '',
      seo: seo || {},
      sections: sanitizeBuilderSections(sections),
      createdBy: session.user.id,
      publishedAt,
    })

    await recordActivity({
      session,
      action: finalStatus === 'published' ? 'publish' : 'create',
      entityType: 'page',
      entityId: page._id,
      entityTitle: page.title,
      description: `Created visual page "${page.title}" (${page.slug})`,
    })

    return successResponse(page, 'Visual page created successfully', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
