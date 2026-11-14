import { BuilderPagesList } from '@/components/builder/BuilderPagesList'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'Page Builder — CMS',
  description: 'Design ready-to-view web pages with Elementor visual builder',
}

export default async function BuilderPage() {
  await checkServerPermission(['pages:read', 'pages:create', 'pages:update'])
  return <BuilderPagesList />
}
