import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Role } from '@/lib/db/models/Role'
import { DEFAULT_ROLES } from '@/lib/rbac/permissions'

let bootstrapPromise = null

/**
 * Ensures default RBAC roles exist and bootstraps an initial Super Admin user
 * from environment variables (SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME)
 * if no super_admin user exists in the database yet.
 */
export async function ensureSuperAdminAndRoles() {
  if (globalThis.__superAdminBootstrapped) return
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    try {
      await connectDB()

      // 1. Ensure all default roles exist
      await Promise.all(
        DEFAULT_ROLES.map((roleData) =>
          Role.findOneAndUpdate(
            { slug: roleData.slug },
            { $setOnInsert: roleData },
            { upsert: true, returnDocument: 'after' }
          )
        )
      )

      const superAdminRole = await Role.findOne({ slug: 'super_admin' }).lean()

      // 2. Check if any Super Admin already exists
      const existingSuperAdmin = await User.findOne({
        $or: [
          { role: 'super_admin' },
          ...(superAdminRole ? [{ roleRef: superAdminRole._id }] : []),
        ],
      })
        .select('_id email')
        .lean()

      if (existingSuperAdmin) {
        globalThis.__superAdminBootstrapped = true
        return
      }

      // 3. No Super Admin exists — bootstrap from .env
      const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase()
      const password = process.env.SUPER_ADMIN_PASSWORD || ''
      const name = (process.env.SUPER_ADMIN_NAME || 'Super Admin').trim()

      if (!email || !password) {
        console.warn(
          '[Bootstrap] No super_admin user found, and SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD are not set in environment.'
        )
        return
      }

      if (password.length < 8) {
        console.warn('[Bootstrap] SUPER_ADMIN_PASSWORD must be at least 8 characters.')
        return
      }

      const existingByEmail = await User.findOne({ email })
      const passwordHash = await User.hashPassword(password)

      if (existingByEmail) {
        existingByEmail.role = 'super_admin'
        existingByEmail.roleRef = superAdminRole?._id || null
        existingByEmail.isActive = true
        existingByEmail.passwordHash = passwordHash
        await existingByEmail.save()
      } else {
        await User.create({
          name,
          email,
          passwordHash,
          role: 'super_admin',
          roleRef: superAdminRole?._id || null,
          isActive: true,
        })
      }

      console.info(`[Bootstrap] Initial Super Admin created for ${email}`)
      globalThis.__superAdminBootstrapped = true
    } catch (err) {
      console.error('[Bootstrap] Super Admin bootstrap error:', err.message)
    } finally {
      bootstrapPromise = null
    }
  })()

  return bootstrapPromise
}
