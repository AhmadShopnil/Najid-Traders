import { connectDB } from '@/lib/db/mongoose'
import { Role } from '@/lib/db/models/Role'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { DEFAULT_ROLES } from '@/lib/rbac/permissions'

export async function GET() {
  const { authorized, response } = await requirePermission(['roles:manage', 'groups:manage', 'users:read', 'settings:manage_schema'])
  if (!authorized) return response
  try {
    await connectDB()
    let roles = await Role.find().sort({ createdAt: 1 }).lean()
    if (roles.length === 0) {
      await Role.insertMany(DEFAULT_ROLES)
      roles = await Role.find().sort({ createdAt: 1 }).lean()
    }
    return successResponse(roles)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response } = await requirePermission('roles:manage')
  if (!authorized) return response

  const { data, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    if (!data.name || !data.slug) return errorResponse('Name and slug are required', 400)
    const cleanSlug = String(data.slug).toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!cleanSlug || cleanSlug === 'super_admin') {
      return errorResponse('Invalid or reserved role slug', 400)
    }

    const exists = await Role.findOne({ slug: cleanSlug }).select('_id').lean()
    if (exists) return errorResponse('Role with this slug already exists', 409)

    const role = await Role.create({
      name: String(data.name).trim(),
      slug: cleanSlug,
      description: data.description || '',
      color: data.color || '#6b7280',
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isSystem: false,
    })
    return successResponse(role, 'Role created', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
