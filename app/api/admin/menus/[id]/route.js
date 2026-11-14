import { connectDB } from '@/lib/db/mongoose'
import { Menu } from '@/lib/db/models/Menu'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { isValidObjectId } from '@/lib/utils'

export async function GET(request, { params }) {
  const { authorized, response } = await requirePermission(['pages:read', 'settings:read', 'settings:update'])
  if (!authorized) return response

  const { id } = await params

  try {
    await connectDB()
    const query = isValidObjectId(id) ? { _id: id } : { slug: id }
    const menu = await Menu.findOne(query).lean()
    if (!menu) return errorResponse('Menu not found', 404)
    return successResponse(menu)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function PUT(request, { params }) {
  const { authorized, session, response } = await requirePermission(['pages:update', 'settings:update'])
  if (!authorized) return response

  const { id } = await params
  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const query = isValidObjectId(id) ? { _id: id } : { slug: id }
    const menu = await Menu.findOne(query)
    if (!menu) return errorResponse('Menu not found', 404)

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return errorResponse('Menu name cannot be empty', 400)
      menu.name = name
    }

    if (body.slug !== undefined) {
      const cleanSlug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      if (!cleanSlug) return errorResponse('Menu slug cannot be empty', 400)
      if (cleanSlug !== menu.slug) {
        const existing = await Menu.findOne({ slug: cleanSlug, _id: { $ne: menu._id } }).select('_id').lean()
        if (existing) return errorResponse(`Slug "${cleanSlug}" is already in use`, 409)
        menu.slug = cleanSlug
      }
    }

    if (body.location !== undefined) {
      menu.location = String(body.location).trim()
    }

    if (body.description !== undefined) {
      menu.description = String(body.description).trim()
    }

    if (body.isActive !== undefined) {
      menu.isActive = Boolean(body.isActive)
    }

    if (Array.isArray(body.items)) {
      menu.items = body.items.map((item, idx) => ({
        id: String(item.id || `item-${Date.now()}-${idx}`),
        label: String(item.label || 'Link').trim(),
        url: String(item.url || '#').trim(),
        target: item.target === '_blank' ? '_blank' : '_self',
        badge: String(item.badge || '').trim(),
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : idx,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        children: Array.isArray(item.children) ? item.children : [],
      }))
    }

    await menu.save()

    await recordActivity({
      session,
      action: 'update',
      entityType: 'setting',
      entityId: menu._id,
      entityTitle: menu.name,
      metadata: { location: menu.location, slug: menu.slug, itemsCount: menu.items.length },
    })

    return successResponse(menu)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { authorized, session, response } = await requirePermission(['pages:update', 'settings:update'])
  if (!authorized) return response

  const { id } = await params

  try {
    await connectDB()
    const query = isValidObjectId(id) ? { _id: id } : { slug: id }
    const menu = await Menu.findOne(query)
    if (!menu) return errorResponse('Menu not found', 404)

    await Menu.deleteOne({ _id: menu._id })

    await recordActivity({
      session,
      action: 'delete',
      entityType: 'setting',
      entityId: menu._id,
      entityTitle: menu.name,
      metadata: { location: menu.location, slug: menu.slug },
    })

    return successResponse({ deletedId: menu._id, message: 'Menu deleted successfully' })
  } catch (err) {
    return errorResponse(err.message)
  }
}
