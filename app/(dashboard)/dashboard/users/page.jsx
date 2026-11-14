import { UserListPage } from '@/components/users/UserListPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Users - CMS' }

export default async function UsersPage() {
  await checkServerPermission(['users:read', 'users:create', 'users:update'])
  return <UserListPage />
}
