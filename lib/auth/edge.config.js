/**
 * Edge/Proxy-safe NextAuth configuration (no database/Mongoose imports).
 * Used exclusively by proxy.js for fast optimistic JWT cookie checks.
 */
export const edgeAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (!token || token.revoked || !token.id) {
        return { ...session, user: undefined }
      }
      if (!session.user) session.user = {}
      session.user.id = token.id
      session.user.role = token.role
      session.user.roleSlug = token.roleSlug
      session.user.roleName = token.roleName
      session.user.roleColor = token.roleColor
      session.user.permissions = token.permissions || []
      session.user.avatar = token.avatar
      return session
    },
  },
}
