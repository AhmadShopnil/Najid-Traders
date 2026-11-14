import { connectDB } from '@/lib/db/mongoose'
import { Page } from '@/lib/db/models/Page'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { slugify, escapeRegex } from '@/lib/utils'

export async function GET(request) {
  const { authorized, response } = await requirePermission('pages:read')
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()
    const query = {}
    if (status) query.status = status
    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i')
      query.$or = [{ title: safeRegex }, { slug: safeRegex }]
    }
    const pages = await Page.find(query).sort({ updatedAt: -1 }).lean()
    return successResponse(pages)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, session, response } = await requirePermission('pages:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { title, slug, status, seo, sections } = body
    if (!title || !String(title).trim()) {
      return errorResponse('Page title is required', 400)
    }

    const finalSlug = slugify(slug || title)
    if (!finalSlug) return errorResponse('Valid page slug is required', 400)

    const existing = await Page.findOne({ slug: finalSlug }).select('_id').lean()
    if (existing) return errorResponse('A page with this slug already exists', 409)

    // Only allow published status if user has pages:publish or is super_admin
    const userPerms = session.user.permissions || []
    const canPublish =
      session.user.role === 'super_admin' ||
      session.user.roleSlug === 'super_admin' ||
      userPerms.includes('pages:publish')

    const finalStatus = status === 'published' && canPublish ? 'published' : 'draft'

    const page = await Page.create({
      title: String(title).trim(),
      slug: finalSlug,
      status: finalStatus,
      seo: seo || {},
      sections: Array.isArray(sections) ? sections : [],
      createdBy: session.user.id,
    })
    return successResponse(page, 'Page created successfully', 201)
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('A page with this slug already exists', 409)
    }
    return errorResponse(err.message)
  }
}
