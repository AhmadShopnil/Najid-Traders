import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles, Edit3 } from 'lucide-react'
import { getPublicPageData } from '@/lib/public-data'
import { getServerSession } from '@/lib/auth/helpers'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { LivePageRenderer } from '@/components/builder/LivePageRenderer'

export const dynamic = 'force-dynamic'

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
  let session = null

  try {
    const [loadedSession, loadedPageData] = await Promise.all([
      getServerSession().catch(() => null),
      getPublicPageData(slug),
    ])
    session = loadedSession
    data = loadedPageData
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
      <FrontendHeader />
      <main className="flex-1">
        <LivePageRenderer sections={sectionsToRender} />
      </main>

      {session?.user && (
        <div className="print:hidden fixed bottom-5 right-5 z-50 flex flex-wrap items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/15 text-xs">
          <div className="flex items-center gap-2 pr-2 border-r border-white/15">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">
              {page ? `Page: ${page.title}` : `Auto ${moduleDoc?.name} Page`}
            </span>
            <span className="font-mono text-[11px] text-purple-300 bg-white/10 px-2 py-0.5 rounded-md">
              /{slug}
            </span>
          </div>
          <Link
            href={editBuilderUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customize Page & Filters</span>
          </Link>
          {moduleDoc && (
            <Link
              href={`/dashboard/builder/new?preset=single_template&module=${encodeURIComponent(moduleDoc.slug)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded-xl transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Single Detail Template</span>
            </Link>
          )}
        </div>
      )}

      <FrontendFooter settings={settings} />
    </div>
  )
}
