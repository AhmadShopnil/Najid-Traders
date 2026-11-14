import { connectDB } from '@/lib/db/mongoose'
import { Menu } from '@/lib/db/models/Menu'
import { successResponse, errorResponse } from '@/lib/api-response'
import { ensureDefaultMenus } from '@/lib/menus/defaults'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await connectDB()
    await ensureDefaultMenus()

    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    const filter = { isActive: true }
    if (location) {
      filter.location = location
    }

    const menus = await Menu.find(filter)
      .sort({ location: 1, createdAt: 1 })
      .lean()

    // Filter inactive items
    const sanitized = menus.map((m) => ({
      ...m,
      items: (m.items || [])
        .filter((i) => i.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    }))

    return successResponse(sanitized)
  } catch (err) {
    return errorResponse(err.message)
  }
}
