import { EmployeeListPage } from '@/components/employees/EmployeeListPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Employees - CMS' }

export default async function EmployeesPage() {
  await checkServerPermission(['users:read', 'content:read'])
  return <EmployeeListPage />
}
