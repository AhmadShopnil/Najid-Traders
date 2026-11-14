import { PageEditor } from '@/components/pages/PageEditor'

export const metadata = {
  title: 'Edit Page | Dynamic CMS',
}

export default async function PageEditorPage({ params }) {
  const { id } = await params
  return <PageEditor pageId={id === 'new' ? null : id} />
}
