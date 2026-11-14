import { ActivityListPage } from '@/components/activity/ActivityListPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = {
  title: 'Activity Log | Dynamic CMS',
  description: 'Audit log of all actions performed in the CMS',
}

export default async function ActivityPage() {
  await checkServerPermission(['roles:manage', 'settings:read', 'users:read', 'modules:create', 'developer:api'])
  return <ActivityListPage />
}
