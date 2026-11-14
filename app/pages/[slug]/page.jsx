import { redirect } from 'next/navigation'

export default async function PagesSlugRedirect({ params }) {
  const { slug } = await params
  redirect(`/${slug}`)
}
