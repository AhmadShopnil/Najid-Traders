import { ContentEditorPage } from '@/components/content/ContentEditorPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Create Content - CMS' }

export default async function NewContentPage({ params }) {
  const { slug } = await params
  await checkServerPermission('content:create', `/dashboard/content/${slug}`)
  return <ContentEditorPage moduleSlug={slug} />
}
