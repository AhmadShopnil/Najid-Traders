import { ModuleListPage } from '@/components/modules/ModuleListPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Modules - CMS' }

export default async function ModulesPage() {
  await checkServerPermission(['modules:read', 'modules:create', 'modules:update'])
  return <ModuleListPage />
}
