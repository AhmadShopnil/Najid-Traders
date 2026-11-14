import { PageEditor } from '@/components/pages/PageEditor'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'Create Page | Dynamic CMS',
}

export default async function NewPageEditor() {
  await checkServerPermission('pages:create', '/dashboard/pages')
  return <PageEditor pageId={null} />
}
