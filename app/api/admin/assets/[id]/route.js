import { connectDB } from '@/lib/db/mongoose'
import { Asset } from '@/lib/db/models/Asset'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { isValidObjectId } from '@/lib/utils'

export async function GET(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('media:read')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid asset ID', 400)

  try {
    await connectDB()
    const asset = await Asset.findById(id).populate('uploadedBy', 'name email').lean()
    if (!asset) return errorResponse('Asset not found', 404)
    return successResponse(asset)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { authorized, response } = await requirePermission('media:delete')
  if (!authorized) return response

  if (!isValidObjectId(id)) return errorResponse('Invalid asset ID', 400)

  try {
    await connectDB()
    const asset = await Asset.findById(id)
    if (!asset) return errorResponse('Asset not found', 404)

    try {
      await deleteFromCloudinary(asset.publicId, asset.type)
    } catch {
      // Ignore Cloudinary error if file is already removed
    }

    await asset.deleteOne()
    return successResponse(null, 'Asset deleted')
  } catch (err) {
    return errorResponse(err.message)
  }
}
