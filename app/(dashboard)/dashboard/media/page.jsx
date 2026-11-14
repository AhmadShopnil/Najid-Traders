import { MediaLibrary } from '@/components/media/MediaLibrary'
import { checkServerPermission } from '@/lib/auth/helpers'

export const metadata = { title: 'Media - CMS' }

export default async function MediaPage() {
  await checkServerPermission(['media:read', 'media:upload'])
  return <MediaLibrary />
}
