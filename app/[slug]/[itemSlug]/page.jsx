import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles, Edit3 } from 'lucide-react'
import { getPublicSingleItemData } from '@/lib/public-data'
import { getServerSession } from '@/lib/auth/helpers'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { LivePageRenderer } from '@/components/builder/LivePageRenderer'

export const dynamic = 'force-dynamic'

const RESERVED_SLUGS = ['dashboard', 'api', 'login', 'admin', '_next', 'favicon.ico', 'pages']

export async function generateMetadata({ params }) {
  const { slug, itemSlug } = await params
  if (RESERVED_SLUGS.includes(slug)) return {}

  try {
    const res = await getPublicSingleItemData(slug, itemSlug)
    if (!res?.contentItem) return { title: 'Content Not Found' }
    const { contentItem, module } = res
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
    return {
      title: `${title} — ${module.name}`,
      description: typeof desc === 'string' ? desc.replace(/<[^>]+>/g, '').slice(0, 160) : '',
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
  let session = null

  try {
    const [loadedSession, loadedItem] = await Promise.all([
      getServerSession().catch(() => null),
      getPublicSingleItemData(slug, itemSlug),
    ])
    session = loadedSession
    data = loadedItem
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

      {/* Floating Admin Customization Bar so logged-in user can edit this automatic/custom single page anytime */}
      {session?.user && (
        <div className="print:hidden fixed bottom-5 right-5 z-50 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/15 text-xs">
          <div className="flex items-center gap-2 pr-2 border-r border-white/15">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">
              {customTemplate ? `Custom Template: ${customTemplate.title}` : `Auto ${module.name} Detail Page`}
            </span>
            <span className="font-mono text-[11px] text-purple-300 bg-white/10 px-2 py-0.5 rounded-md">
              /{module.slug}/{contentItem.slug}
            </span>
          </div>
          <Link
            href={editTemplateUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit Single Page Design</span>
          </Link>
          <Link
            href={`/dashboard/content/${module.slug}/${contentItem._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded-xl transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Content</span>
          </Link>
        </div>
      )}

      <FrontendFooter settings={settings} />
    </div>
  )
}
