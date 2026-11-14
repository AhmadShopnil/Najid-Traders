import { connectDB } from '@/lib/db/mongoose'
import { BuilderPage } from '@/lib/db/models/BuilderPage'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { slugify, isValidObjectId } from '@/lib/utils'
import { recordActivity } from '@/lib/activity/logger'
import { sanitizeBuilderSections } from '@/lib/sanitize'

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('pages:read')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  try {
    await connectDB()
    const page = await BuilderPage.findById(id).populate('createdBy', 'name email avatar').lean()
    if (!page) return errorResponse('Visual page not found', 404)
    return successResponse(page)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('pages:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { title, slug, status, pageType, targetModule, seo, sections } = body

    const existing = await BuilderPage.findById(id)
    if (!existing) return errorResponse('Visual page not found', 404)

    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slugify(slug)
      if (!finalSlug) return errorResponse('Valid page slug is required', 400)
      const duplicate = await BuilderPage.findOne({ slug: finalSlug, _id: { $ne: id } }).select('_id').lean()
      if (duplicate) return errorResponse('Page slug already exists', 409)
      existing.slug = finalSlug
    }

    if (title !== undefined && String(title).trim()) existing.title = String(title).trim()
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      const userPerms = session.user.permissions || []
      const canPublish =
        session.user.role === 'super_admin' ||
        session.user.roleSlug === 'super_admin' ||
        userPerms.includes('pages:publish')

      if (status === 'published' && !canPublish && existing.status !== 'published') {
        return errorResponse('Forbidden — missing required permission: pages:publish', 403)
      }
      existing.status = status
      if (status === 'published' && !existing.publishedAt) {
        existing.publishedAt = new Date()
      } else if (status !== 'published') {
        existing.publishedAt = null
      }
    }
    if (pageType !== undefined && ['standard', 'module_feed', 'single_template', 'category_template'].includes(pageType)) {
      existing.pageType = pageType
    }
    if (targetModule !== undefined) existing.targetModule = targetModule
    if (seo !== undefined) existing.seo = seo
    if (sections !== undefined) existing.sections = sanitizeBuilderSections(sections)

    await existing.save()

    await recordActivity({
      session,
      action: status === 'published' ? 'publish' : 'update',
      entityType: 'page',
      entityId: existing._id,
      entityTitle: existing.title,
      description: `Updated visual page "${existing.title}"`,
    })

    return successResponse(existing.toObject(), 'Visual page updated successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response, session } = await requirePermission('pages:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  try {
    await connectDB()
    const page = await BuilderPage.findByIdAndDelete(id).lean()
    if (!page) return errorResponse('Visual page not found', 404)

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'page',
      entityId: id,
      entityTitle: page.title,
      description: `Deleted visual page "${page.title}"`,
    })

    return successResponse(null, 'Visual page deleted successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}
