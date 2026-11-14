import { connectDB } from '@/lib/db/mongoose'
import { Asset } from '@/lib/db/models/Asset'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'

export async function GET() {
  const { authorized, response } = await requirePermission('media:read')
  if (!authorized) return response

  try {
    await connectDB()
    const folders = await Asset.distinct('folder')
    const cleanFolders = folders.filter(Boolean).sort()
    return successResponse(cleanFolders)
  } catch (err) {
    return errorResponse(err.message)
  }
}
