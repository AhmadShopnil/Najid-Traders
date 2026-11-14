import { connectDB } from '@/lib/db/mongoose'
import { Employee } from '@/lib/db/models/Employee'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { recordActivity } from '@/lib/activity/logger'

export async function GET() {
  const { authorized, response } = await requirePermission('employees:read')
  if (!authorized) return response

  try {
    await connectDB()
    const employees = await Employee.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
    return successResponse(employees)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, session, response } = await requirePermission('employees:create')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const name = String(body.name || '').trim()
    const designation = String(body.designation || '').trim()
    if (!name || !designation) {
      return errorResponse('Name and designation are required', 400)
    }

    const employee = await Employee.create({
      name,
      designation,
      department: String(body.department || 'Operations').trim(),
      photo: String(body.photo || '').trim(),
      phone: String(body.phone || '').trim(),
      email: String(body.email || '').trim(),
      bio: String(body.bio || '').trim(),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isFeatured: Boolean(body.isFeatured),
      featuredTitle: String(body.featuredTitle || '').trim(),
      featuredQuote: String(body.featuredQuote || '').trim(),
      expertise: Array.isArray(body.expertise)
        ? body.expertise.map((x) => String(x).trim()).filter(Boolean)
        : [],
    })

    await recordActivity({
      session,
      action: 'create',
      entityType: 'user',
      entityId: employee._id,
      entityTitle: employee.name,
      description: `Added team member "${employee.name}" (${employee.designation})`,
    })

    return successResponse(employee, 'Employee created successfully', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
