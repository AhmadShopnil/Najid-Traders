import { PagesList } from '@/components/pages/PagesList'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'Pages | Dynamic CMS',
}

export default async function PagesPage() {
  await checkServerPermission(['pages:read', 'pages:create', 'pages:update'])
  return <PagesList />
}
