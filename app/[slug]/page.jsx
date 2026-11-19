import { notFound } from 'next/navigation'
import { getPublicPageData } from '@/lib/public-data'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { LivePageRenderer } from '@/components/builder/LivePageRenderer'
import { AdminFloatingBar } from '@/components/frontend/AdminFloatingBar'

export const revalidate = 60
export const dynamicParams = true

const RESERVED_SLUGS = ['dashboard', 'api', 'login', 'admin', '_next', 'favicon.ico']

export async function generateMetadata({ params }) {
  const { slug } = await params
  if (RESERVED_SLUGS.includes(slug)) return {}

  try {
    const { page, moduleDoc } = await getPublicPageData(slug)
    if (page) {
      return {
        title: page.seo?.title || `${page.title} — Dynamic CMS`,
        description: page.seo?.description || `Visit ${page.title} on our dynamic portal`,
        keywords: page.seo?.keywords || [],
      }
    }

    if (moduleDoc) {
      return {
        title: `${moduleDoc.name} — Dynamic CMS`,
        description: moduleDoc.description || `Browse all ${moduleDoc.name} entries`,
      }
    }

    return { title: 'Page Not Found' }
  } catch {
    return { title: 'Dynamic Page' }
  }
}

export default async function DynamicPublicPage({ params }) {
  const { slug } = await params

  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  let data = null

  try {
    data = await getPublicPageData(slug)
  } catch (error) {
    console.error('Error fetching dynamic public page:', error)
    notFound()
  }

  const { page, editableBuilderPageId, moduleDoc, settings } = data || {}

  if (!page && !moduleDoc) {
    notFound()
  }

  let sectionsToRender = []

  if (page) {
    sectionsToRender = page.sections || []
  } else if (moduleDoc) {
    sectionsToRender = [
      {
        id: `auto-module-section-${moduleDoc.slug}`,
        name: `${moduleDoc.name} Feed`,
        slug: moduleDoc.slug,
        columns: 1,
        settings: {
          bgType: 'light',
          bgColor: '#ffffff',
          padding: 'normal',
          containerWidth: 'boxed',
          columnRatio: 'equal',
          gap: 'normal',
          verticalAlign: 'top',
        },
        widgets: [
          {
            id: `auto-module-widget-${moduleDoc.slug}`,
            type: 'module_grid',
            column: 0,
            props: {
              moduleSlug: moduleDoc.slug,
              title: `${moduleDoc.icon || '📦'} ${moduleDoc.name}`,
              subtitle: moduleDoc.description || `Browse all ${moduleDoc.name} & categories`,
              layout: 'grid',
              columns: 3,
              limit: 9,
              categoryMode: 'all',
              showCategoryTabs: true,
              showSearch: true,
              showPagination: true,
              showImage: true,
              showCategoryBadge: true,
              showDate: true,
              showExcerpt: true,
              showCustomFields: true,
              readMoreText: 'Read More',
            },
          },
        ],
      },
    ]
  }

  const editBuilderUrl = editableBuilderPageId
    ? `/dashboard/builder/${editableBuilderPageId}`
    : moduleDoc
      ? `/dashboard/builder/new?preset=module_feed&module=${encodeURIComponent(moduleDoc.slug)}`
      : `/dashboard/builder/new?slug=${encodeURIComponent(slug)}`

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <FrontendHeader settings={settings} />
      <main className="flex-1">
        <LivePageRenderer sections={sectionsToRender} />
      </main>

      <AdminFloatingBar
        badgeText={page ? `Page: ${page.title}` : `Auto ${moduleDoc?.name} Page`}
        permalink={`/${slug}`}
        primaryAction={{
          label: 'Customize Page & Filters',
          href: editBuilderUrl,
        }}
        secondaryAction={
          moduleDoc
            ? {
                label: 'Single Detail Template',
                href: `/dashboard/builder/new?preset=single_template&module=${encodeURIComponent(moduleDoc.slug)}`,
              }
            : null
        }
      />

      <FrontendFooter settings={settings} />
    </div>
  )
}
