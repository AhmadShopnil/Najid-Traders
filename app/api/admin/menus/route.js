import { connectDB } from '@/lib/db/mongoose'
import { Menu } from '@/lib/db/models/Menu'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'
import { ensureDefaultMenus } from '@/lib/menus/defaults'

export async function GET() {
  const { authorized, response } = await requirePermission(['pages:read', 'settings:read', 'settings:update'])
  if (!authorized) return response

  try {
    await connectDB()
    await ensureDefaultMenus()
    const menus = await Menu.find().sort({ location: 1, createdAt: 1 }).lean()
    return successResponse(menus)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, session, response } = await requirePermission(['pages:update', 'settings:update'])
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const name = String(body.name || '').trim()
    const rawSlug = String(body.slug || '').trim().toLowerCase()
    const location = String(body.location || 'custom').trim()

    if (!name) {
      return errorResponse('Menu name is required', 400)
    }

    const slug = (rawSlug || name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')).replace(/^-+|-+$/g, '')
    if (!slug) {
      return errorResponse('Valid slug is required', 400)
    }

    const existing = await Menu.findOne({ slug }).select('_id').lean()
    if (existing) {
      return errorResponse(`A menu with slug "${slug}" already exists`, 409)
    }

    // Sanitize items
    const rawItems = Array.isArray(body.items) ? body.items : []
    const items = rawItems.map((item, idx) => ({
      id: String(item.id || `item-${Date.now()}-${idx}`),
      label: String(item.label || 'Link').trim(),
      url: String(item.url || '#').trim(),
      target: item.target === '_blank' ? '_blank' : '_self',
      badge: String(item.badge || '').trim(),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : idx,
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
      children: Array.isArray(item.children) ? item.children : [],
    }))

    const menu = await Menu.create({
      name,
      slug,
      location,
      description: String(body.description || '').trim(),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      items,
    })

    await recordActivity({
      session,
      action: 'create',
      entityType: 'setting',
      entityId: menu._id,
      entityTitle: menu.name,
      metadata: { location: menu.location, slug: menu.slug, itemsCount: menu.items.length },
    })

    return successResponse(menu, 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
