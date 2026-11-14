import { connectDB } from '@/lib/db/mongoose'
import { BuilderPage } from '@/lib/db/models/BuilderPage'
import { successResponse, errorResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { slug } = await params
  try {
    await connectDB()
    const page = await BuilderPage.findOne({ slug, status: 'published' }).lean()
    if (!page) return errorResponse('Visual page not found', 404)

    delete page.__v
    delete page.createdBy

    return successResponse(page)
  } catch (err) {
    return errorResponse(err.message)
  }
}
