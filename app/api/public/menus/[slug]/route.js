import { connectDB } from '@/lib/db/mongoose'
import { Menu } from '@/lib/db/models/Menu'
import { successResponse, errorResponse } from '@/lib/api-response'
import { ensureDefaultMenus } from '@/lib/menus/defaults'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { slug } = await params

  try {
    await connectDB()
    await ensureDefaultMenus()

    const menu = await Menu.findOne({
      $or: [{ slug }, { location: slug }],
      isActive: true,
    }).lean()

    if (!menu) {
      return errorResponse('Menu not found', 404)
    }

    menu.items = (menu.items || [])
      .filter((i) => i.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    return successResponse(menu)
  } catch (err) {
    return errorResponse(err.message)
  }
}
