import { VisualPageEditor } from '@/components/builder/VisualPageEditor'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'Edit Visual Page — Elementor Builder',
}

export default async function EditBuilderPage({ params }) {
  const { id } = await params
  await checkServerPermission(['pages:read', 'pages:update'], '/dashboard/builder')
  return <VisualPageEditor pageId={id} />
}
