import { NextResponse } from 'next/server'
import { ensureSuperAdminAndRoles } from '@/lib/auth/bootstrap'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Seed endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    await ensureSuperAdminAndRoles()
    return NextResponse.json({
      success: true,
      message: 'Default roles and Super Admin verified from environment configuration.',
    })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
