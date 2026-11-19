import { connectDB } from '@/lib/db/mongoose'
import { Employee } from '@/lib/db/models/Employee'
import { successResponse, errorResponse } from '@/lib/api-response'

export const revalidate = 60

export async function GET() {
  try {
    await connectDB()
    const employees = await Employee.find({ isActive: true })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: 1 })
      .lean()
    return successResponse(employees, 'Success', 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  } catch (err) {
    return errorResponse(err.message)
  }
}
