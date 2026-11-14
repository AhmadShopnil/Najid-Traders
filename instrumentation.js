export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureSuperAdminAndRoles } = await import('@/lib/auth/bootstrap')
    await ensureSuperAdminAndRoles()
  }
}
