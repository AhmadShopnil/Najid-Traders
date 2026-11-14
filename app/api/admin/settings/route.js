import { connectDB } from '@/lib/db/mongoose'
import { SettingGroup } from '@/lib/db/models/SettingGroup'
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/helpers'
import { ensureSystemSettings } from '@/lib/settings/defaults'

export function canAccessSettingGroup(session, group) {
  if (!session?.user) return false
  if (session.user.role === 'super_admin' || session.user.roleSlug === 'super_admin') return true
  const allowed = Array.isArray(group?.allowedRoles) ? group.allowedRoles : []
  if (allowed.length === 0) return true
  return allowed.includes(session.user.roleSlug)
}

export async function GET() {
  const { authorized, response, session } = await requirePermission(['settings:read', 'settings:update'])
  if (!authorized) return response

  try {
    await connectDB()
    await ensureSystemSettings()
    const allGroups = await SettingGroup.find().sort({ isSystem: -1, createdAt: 1 }).lean()
    const groups = allGroups.filter((group) => canAccessSettingGroup(session, group))
    return successResponse(groups)
  } catch (err) {
    return errorResponse(err.message)
  }
}

export async function POST(request) {
  const { authorized, response } = await requirePermission('settings:create_group')
  if (!authorized) return response

  const { data: body, error: jsonError } = await parseJsonBody(request)
  if (jsonError) return jsonError

  try {
    await connectDB()
    const { name, slug, description, allowedRoles } = body
    if (!name || !slug) return errorResponse('Name and slug are required', 400)

    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanSlug) return errorResponse('Valid slug is required', 400)

    const existing = await SettingGroup.findOne({ slug: cleanSlug }).select('_id').lean()
    if (existing) return errorResponse('Group slug already exists', 409)

    const cleanRoles = Array.isArray(allowedRoles)
      ? allowedRoles.map((r) => String(r).trim()).filter(Boolean)
      : []

    const group = await SettingGroup.create({
      name: String(name).trim(),
      slug: cleanSlug,
      description: description || '',
      isSystem: false,
      allowedRoles: cleanRoles,
      fields: [],
    })

    return successResponse(group, 'Group created successfully', 201)
  } catch (err) {
    return errorResponse(err.message)
  }
}
