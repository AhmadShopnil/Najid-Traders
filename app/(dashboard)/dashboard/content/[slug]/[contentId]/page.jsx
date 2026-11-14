import { ContentEditorPage } from '@/components/content/ContentEditorPage'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Edit Content - CMS' }

export default async function EditContentPage({ params }) {
  const { slug, contentId } = await params
  await checkServerPermission(['content:read', 'content:update'], `/dashboard/content/${slug}`)
  return <ContentEditorPage moduleSlug={slug} contentId={contentId} />
}
