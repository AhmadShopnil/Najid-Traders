import { connectDB } from '@/lib/db/mongoose'
import { Asset } from '@/lib/db/models/Asset'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { uploadToCloudinary } from '@/lib/cloudinary'

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB per file
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'text/plain']
const BLOCKED_MIMES = new Set(['image/svg+xml', 'text/html', 'application/javascript', 'text/javascript'])

function isAllowedMime(mime) {
  if (!mime) return false
  if (BLOCKED_MIMES.has(mime.toLowerCase())) return false
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.toLowerCase().startsWith(prefix))
}

export async function POST(request) {
  const { authorized, response, session } = await requirePermission('media:upload')
  if (!authorized) return response

  try {
    await connectDB()
    const formData = await request.formData()
    const files = formData.getAll('files').filter((f) => f && typeof f !== 'string')
    const rawFolder = String(formData.get('folder') || 'cms-media').trim()
    const folder = rawFolder.replace(/[^a-zA-Z0-9_/-]/g, '') || 'cms-media'

    if (files.length === 0) {
      return errorResponse('No files provided', 400)
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return errorResponse(`File "${file.name}" exceeds the 25MB size limit`, 413)
      }
      if (file.type && !isAllowedMime(file.type)) {
        return errorResponse(`File type "${file.type}" is not permitted`, 415)
      }
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const result = await uploadToCloudinary(buffer, { folder })

        const assetType = file.type?.startsWith('image/')
          ? 'image'
          : file.type?.startsWith('video/')
          ? 'video'
          : 'document'

        return Asset.create({
          filename: `${result.public_id}.${result.format || 'bin'}`,
          originalName: file.name,
          url: result.secure_url,
          publicId: result.public_id,
          type: assetType,
          mimeType: file.type,
          size: result.bytes,
          width: result.width,
          height: result.height,
          folder,
          uploadedBy: session.user.id,
        })
      })
    )

    return successResponse(uploaded, `${uploaded.length} file(s) uploaded`, 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
