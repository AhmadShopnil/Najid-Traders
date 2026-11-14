import { successResponse, errorResponse } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from '@/lib/rbac/permissions'

export async function GET() {
  const { authorized, response } = await requirePermission()
  if (!authorized) return response
  try {
    return successResponse({ groups: PERMISSION_GROUPS, all: ALL_PERMISSIONS })
  } catch (err) { return errorResponse(err.message) }
}
