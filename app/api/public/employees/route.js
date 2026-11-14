import { connectDB } from '@/lib/db/mongoose'
import { Employee } from '@/lib/db/models/Employee'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    await connectDB()
    const employees = await Employee.find({ isActive: true })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: 1 })
      .lean()
    return successResponse(employees)
  } catch (err) {
    return errorResponse(err.message)
  }
}
