import { ContentListPage } from '@/components/content/ContentListPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Content - CMS' }

export default async function ContentPage({ params, searchParams }) {
  const { slug } = await params
  const sp = await searchParams
  const initialTab = sp?.tab === 'categories' ? 'categories' : 'entries'
  await checkServerPermission(['content:read', 'content:create', 'taxonomies:manage'])
  return <ContentListPage moduleSlug={slug} initialTab={initialTab} />
}
