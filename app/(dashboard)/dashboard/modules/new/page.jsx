import { ModuleFormPage } from '@/components/modules/ModuleFormPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Create Module - CMS' }

export default async function NewModulePage() {
  await checkServerPermission('modules:create', '/dashboard/modules')
  return <ModuleFormPage />
}
