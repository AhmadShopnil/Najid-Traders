import { connectDB } from '@/lib/db/mongoose'
import { Inquiry } from '@/lib/db/models/Inquiry'
import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'

export async function GET(request) {
  const { authorized, response } = await requirePermission('inquiries:read')
  if (!authorized) return response

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const q = (searchParams.get('q') || '').trim()

    const query = {}
    if (status && ['new', 'contacted', 'closed'].includes(status)) {
      query.status = status
    }
    if (type && ['general', 'product'].includes(type)) {
      query.inquiryType = type
    }
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { company: regex },
        { productTitle: regex },
        { message: regex },
      ]
    }

    const [items, total, newCount, contactedCount, closedCount] = await Promise.all([
      Inquiry.find(query).sort({ createdAt: -1 }).limit(200).lean(),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ status: 'contacted' }),
      Inquiry.countDocuments({ status: 'closed' }),
    ])

    return successResponse({
      items,
      counts: {
        total,
        new: newCount,
        contacted: contactedCount,
        closed: closedCount,
      },
    })
  } catch (err) {
    return errorResponse(err.message)
  }
}
