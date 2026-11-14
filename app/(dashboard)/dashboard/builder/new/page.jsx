import { VisualPageEditor } from '@/components/builder/VisualPageEditor'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'New Visual Page — Elementor Builder',
}

export default async function NewBuilderPage() {
  await checkServerPermission('pages:create', '/dashboard/builder')
  return <VisualPageEditor />
}
