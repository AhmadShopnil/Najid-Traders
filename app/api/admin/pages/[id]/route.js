import { connectDB } from '@/lib/db/mongoose'
import { Page } from '@/lib/db/models/Page'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { isValidObjectId, slugify } from '@/lib/utils'

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('pages:read')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  try {
    await connectDB()
    const page = await Page.findById(id).lean()
    if (!page) return errorResponse('Page not found', 404)
    return successResponse(page)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const { authorized, session, response } = await requirePermission('pages:update')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const existing = await Page.findById(id)
    if (!existing) return errorResponse('Page not found', 404)

    const { title, slug, status, seo, sections } = body
    if (title !== undefined) existing.title = String(title).trim()
    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slugify(slug)
      if (!finalSlug) return errorResponse('Valid slug is required', 400)
      const duplicate = await Page.findOne({ slug: finalSlug, _id: { $ne: id } }).select('_id').lean()
      if (duplicate) return errorResponse('A page with this slug already exists', 409)
      existing.slug = finalSlug
    }
    if (seo !== undefined) existing.seo = seo
    if (sections !== undefined) existing.sections = sections
    if (status && ['draft', 'published'].includes(status)) {
      const userPerms = session.user.permissions || []
      const canPublish =
        session.user.role === 'super_admin' ||
        session.user.roleSlug === 'super_admin' ||
        userPerms.includes('pages:publish')
      if (status === 'published' && !canPublish && existing.status !== 'published') {
        return errorResponse('Forbidden — missing required permission: pages:publish', 403)
      }
      existing.status = status
    }

    await existing.save()
    return successResponse(existing.toObject(), 'Page updated successfully')
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('A page with this slug already exists', 409)
    }
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('pages:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid page ID', 400)

  try {
    await connectDB()
    const page = await Page.findByIdAndDelete(id).lean()
    if (!page) return errorResponse('Page not found', 404)
    return successResponse(null, 'Page deleted successfully')
  } catch (err) {
    return errorResponse(err.message)
  }
}
