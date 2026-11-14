import { connectDB } from '@/lib/db/mongoose'
import { Asset } from '@/lib/db/models/Asset'
import { successResponse, errorResponse, paginatedResponse, buildPagination } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { escapeRegex, parsePaginationParams } from '@/lib/utils'

export async function GET(request) {
  const { authorized, response } = await requirePermission('media:read')
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = request.nextUrl
    const folder = searchParams.get('folder')
    const type = searchParams.get('type')
    const search = searchParams.get('search')?.trim()
    const hasPagination = searchParams.has('page') || searchParams.has('limit')

    const filter = {}
    if (folder && folder !== 'all') filter.folder = folder
    if (type && type !== 'all') filter.type = type
    if (search) {
      const safeRegex = new RegExp(escapeRegex(search), 'i')
      filter.$or = [
        { originalName: safeRegex },
        { tags: safeRegex },
      ]
    }

    if (hasPagination) {
      const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 40, maxLimit: 100 })
      const [total, assets] = await Promise.all([
        Asset.countDocuments(filter),
        Asset.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('uploadedBy', 'name email')
          .lean(),
      ])
      return paginatedResponse(assets, buildPagination(total, page, limit))
    }

    const assets = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('uploadedBy', 'name email')
      .lean()

    return successResponse(assets)
  } catch (err) {
    return errorResponse(err.message)
  }
}
