import { notFound } from 'next/navigation'
import { getPublicSingleItemData } from '@/lib/public-data'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { LivePageRenderer } from '@/components/builder/LivePageRenderer'
import { AdminFloatingBar } from '@/components/frontend/AdminFloatingBar'

export const revalidate = 60
export const dynamicParams = true

const RESERVED_SLUGS = ['dashboard', 'api', 'login', 'admin', '_next', 'favicon.ico', 'pages']

export async function generateMetadata({ params }) {
  const { slug, itemSlug } = await params
  if (RESERVED_SLUGS.includes(slug)) return {}

  try {
    const res = await getPublicSingleItemData(slug, itemSlug)
    if (!res?.contentItem) return { title: 'Content Not Found' }
    const { contentItem, module, settings } = res
    const title =
      contentItem.seo?.title ||
      contentItem.data?.title ||
      contentItem.data?.headline ||
      contentItem.data?.name ||
      `${module.name} Detail`
    const desc =
      contentItem.seo?.description ||
      contentItem.data?.excerpt ||
      contentItem.data?.summary ||
      contentItem.data?.description ||
      ''
    const favicon = settings?.favicon
    return {
      title: `${title} — ${module.name}`,
      description: typeof desc === 'string' ? desc.replace(/<[^>]+>/g, '').slice(0, 160) : '',
      ...(favicon
        ? {
            icons: {
              icon: [{ url: favicon }, { url: '/favicon.ico' }],
              shortcut: [favicon],
              apple: [{ url: favicon }],
            },
          }
        : {}),
    }
  } catch {
    return { title: 'Detail View' }
  }
}

export default async function SingleModuleContentPage({ params }) {
  const { slug, itemSlug } = await params
  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  let data = null

  try {
    data = await getPublicSingleItemData(slug, itemSlug)
  } catch (err) {
    console.error('Error rendering single module item page:', err)
    notFound()
  }

  if (!data?.contentItem) {
    notFound()
  }

  const { module, contentItem, customTemplate, editableTemplateId, settings } = data

  // Default 2-Column Single Detail Layout if no custom BuilderPage template was created yet
  const defaultSections = [
    {
      id: 'default-single-detail-section',
      name: 'Single Content Detail Section',
      slug: 'single-content-detail',
      columns: 2,
      settings: {
        bgType: 'light',
        bgColor: '#ffffff',
        padding: 'normal',
        containerWidth: 'boxed',
        columnRatio: '66-33',
        gap: 'large',
        verticalAlign: 'top',
      },
      widgets: [
        {
          id: 'default-detail-widget',
          type: 'module_detail',
          column: 0,
          props: {
            moduleSlug: module.slug,
            showBreadcrumbs: true,
            showCategoryBadges: true,
            showAuthorAndDate: true,
            showShareButtons: true,
            showFeaturedImage: true,
            showExtraFields: true,
            showGallery: true,
            showRelated: true,
            relatedTitle: `Related ${module.name}`,
            relatedCount: 3,
          },
        },
        {
          id: 'default-sidebar-latest-widget',
          type: 'module_grid',
          column: 1,
          props: {
            moduleSlug: module.slug,
            title: `Latest ${module.name}`,
            subtitle: '',
            layout: 'compact',
            columns: 1,
            limit: 6,
            categoryMode: 'all',
            showCategoryTabs: false,
            showSearch: false,
            showPagination: false,
            showImage: true,
            showCategoryBadge: true,
            showDate: true,
            showExcerpt: false,
            _boxPadding: 20,
            _boxRounded: 20,
            _boxBg: '#f8fafc',
          },
        },
      ],
    },
  ]

  const sectionsToRender =
    customTemplate && Array.isArray(customTemplate.sections) && customTemplate.sections.length > 0
      ? customTemplate.sections
      : defaultSections

  const editTemplateUrl = editableTemplateId
    ? `/dashboard/builder/${editableTemplateId}`
    : `/dashboard/builder/new?preset=single_template&module=${encodeURIComponent(module.slug)}`

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <FrontendHeader />
      <main className="flex-1">
        <LivePageRenderer
          sections={sectionsToRender}
          dynamicContext={{
            moduleSlug: module.slug,
            contentItem,
          }}
        />
      </main>

      {/* Floating Admin Customization Bar for logged-in admins */}
      <AdminFloatingBar
        badgeText={customTemplate ? `Custom Template: ${customTemplate.title}` : `Auto ${module.name} Detail Page`}
        permalink={`/${module.slug}/${contentItem.slug}`}
        primaryAction={{
          label: 'Edit Single Page Design',
          href: editTemplateUrl,
        }}
        secondaryAction={{
          label: 'Edit Content',
          href: `/dashboard/content/${module.slug}/${contentItem._id}`,
        }}
      />

      <FrontendFooter settings={settings} />
    </div>
  )
}
