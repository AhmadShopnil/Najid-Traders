import { connectDB } from '@/lib/db/mongoose'
import { Inquiry } from '@/lib/db/models/Inquiry'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX_REQUESTS = 10
const rateBucket = globalThis.__inquiryRateBucket || new Map()
globalThis.__inquiryRateBucket = rateBucket

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateBucket.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateBucket.set(ip, { windowStart: now, count: 1 })
    return false
  }
  entry.count += 1
  return entry.count > RATE_MAX_REQUESTS
}

export async function POST(request) {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const clientIp = forwarded.split(',')[0].trim() || 'unknown'
  if (isRateLimited(clientIp)) {
    return errorResponse('Too many inquiries submitted. Please try again later.', 429)
  }

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const name = String(body.name || '').trim().slice(0, 120)
    const phone = String(body.phone || '').trim().slice(0, 40)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160)
    const company = String(body.company || '').trim().slice(0, 160)
    const subject = String(body.subject || '').trim().slice(0, 200)
    const message = String(body.message || '').trim().slice(0, 2000)

    if (!name || !phone || !message) {
      return errorResponse('Name, phone number, and message are required.', 400)
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Please enter a valid email address.', 400)
    }

    const productId = String(body.productId || '').trim().slice(0, 64)
    const productTitle = String(body.productTitle || '').trim().slice(0, 200)
    const productSlug = String(body.productSlug || '').trim().slice(0, 200)
    const productSku = String(body.productSku || '').trim().slice(0, 80)
    const isProductInquiry = Boolean(productTitle || productSlug || productId)

    const inquiry = await Inquiry.create({
      name,
      phone,
      email,
      company,
      subject: subject || (isProductInquiry ? `Product Inquiry: ${productTitle}` : 'General Contact'),
      message,
      inquiryType: isProductInquiry ? 'product' : 'general',
      productId,
      productTitle,
      productSlug,
      productSku,
      status: 'new',
    })

    return successResponse(
      { id: String(inquiry._id), status: inquiry.status },
      'Your inquiry has been submitted. Our team will contact you shortly.',
      201
    )
  } catch (err) {
    return errorResponse(err.message || 'Failed to submit inquiry')
  }
}
