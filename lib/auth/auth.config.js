// Sanitize NEXTAUTH_URL / AUTH_URL if localhost was accidentally set in production/Vercel
if (
  (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
  process.env.NEXTAUTH_URL &&
  process.env.NEXTAUTH_URL.includes('localhost')
) {
  delete process.env.NEXTAUTH_URL
}
if (
  (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
  process.env.AUTH_URL &&
  process.env.AUTH_URL.includes('localhost')
) {
  delete process.env.AUTH_URL
}

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import '@/lib/db/models/Role'
import '@/lib/db/models/Group'
import { resolveUserAuthContext } from '@/lib/rbac/resolvePermissions'
import { ALL_PERMISSIONS } from '@/lib/rbac/permissions'
import { ensureSuperAdminAndRoles } from '@/lib/auth/bootstrap'

// How often (ms) an active JWT re-syncs RBAC permissions & isActive from MongoDB
const PERMISSION_SYNC_TTL_MS = 60 * 1000

/**
 * Call whenever a user, role, or group permission changes so active sessions
 * refresh on their very next request without waiting for the TTL window.
 */
export function invalidatePermissionCache() {
  globalThis.__rbacVersion = Date.now()
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          await ensureSuperAdminAndRoles()
          await connectDB()
          const user = await User.findOne({ email: credentials.email.toLowerCase(), isActive: true })
            .populate('roleRef')
          if (!user) return null

          const isValid = await user.comparePassword(credentials.password)
          if (!isValid) return null

          // Fire-and-forget login timestamp update so login feels instant
          User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => {})

          const roleSlug = user.roleRef?.slug || user.role || null
          const roleName = user.roleRef?.name || (user.role ? user.role.replace(/_/g, ' ') : null)
          const roleColor = user.roleRef?.color || (roleSlug === 'super_admin' ? '#7c3aed' : '#6b7280')

          let permissions = []
          if (user.role === 'super_admin' || user.roleRef?.slug === 'super_admin') {
            permissions = [...ALL_PERMISSIONS]
          } else {
            try {
              const ctx = await resolveUserAuthContext(user._id.toString())
              permissions = ctx.permissions
            } catch (err) {
              console.warn('[RBAC] Error resolving permissions at login:', err.message)
              permissions = []
            }
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: roleSlug,
            roleSlug,
            roleName,
            roleColor,
            permissions,
            avatar: user.avatar,
          }
        } catch (e) {
          console.error('[Auth] authorize error:', e.message)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleSlug = user.roleSlug
        token.roleName = user.roleName
        token.roleColor = user.roleColor
        token.permissions = user.permissions
        token.avatar = user.avatar
        token.permCheckedAt = Date.now()
        token.revoked = false
        return token
      }

      if (token?.id && !token.revoked) {
        const rbacVersion = globalThis.__rbacVersion || 0
        const checkedAt = token.permCheckedAt || 0
        const needsRefresh =
          !checkedAt ||
          checkedAt < rbacVersion ||
          Date.now() - checkedAt > PERMISSION_SYNC_TTL_MS

        if (needsRefresh) {
          try {
            const ctx = await resolveUserAuthContext(token.id)
            if (!ctx.isActive || !ctx.user) {
              token.revoked = true
              token.permissions = []
              return token
            }

            token.name = ctx.user.name
            token.email = ctx.user.email
            token.avatar = ctx.user.avatar
            token.role = ctx.roleSlug
            token.roleSlug = ctx.roleSlug
            token.roleName = ctx.roleName
            token.roleColor = ctx.roleColor
            token.permissions = ctx.permissions
            token.permCheckedAt = Date.now()
            token.revoked = false
          } catch (e) {
            console.warn('[Auth] JWT permission sync error:', e.message)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!token || token.revoked || !token.id) {
        return { ...session, user: undefined }
      }
      if (!session.user) session.user = {}
      session.user.id = token.id
      session.user.name = token.name ?? session.user.name
      session.user.email = token.email ?? session.user.email
      session.user.role = token.role
      session.user.roleSlug = token.roleSlug
      session.user.roleName = token.roleName
      session.user.roleColor = token.roleColor
      session.user.permissions = token.permissions || []
      session.user.avatar = token.avatar
      return session
    },
  },
})
