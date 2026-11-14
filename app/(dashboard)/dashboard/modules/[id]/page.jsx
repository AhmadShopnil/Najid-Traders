import { ModuleEditorPage } from '@/components/modules/ModuleEditorPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Edit Module - CMS' }

export default async function ModuleEditPage({ params }) {
  const { id } = await params
  await checkServerPermission(['modules:read', 'modules:update', 'modules:create'])
  return <ModuleEditorPage moduleId={id} />
}
