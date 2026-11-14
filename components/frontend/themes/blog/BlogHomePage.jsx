import { ArrowRight, BookOpen, Tag, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function getItemHref(item) {
  const modSlug = item.moduleSlug || item.moduleId?.slug
  const itemSlug = item.resolvedSlug || item.data?.slug || item._id
  return modSlug && itemSlug ? `/${modSlug}/${itemSlug}` : '#dynamic-feed'
}

export function BlogHomePage({ contents = [], modules = [], settings = {} }) {
  const siteName = settings?.siteName || 'The Dynamic Blog'
  const [featured, ...rest] = contents

  return (
    <div className="bg-white min-h-screen">
      {/* Hero / Masthead */}
      <section className="border-b-4 border-slate-900 py-14 px-6 text-center bg-amber-50">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-3">
          Editorial Edition — Headless CMS Demo
        </p>
        <h1 className="text-5xl sm:text-7xl font-black text-slate-900 mb-4 leading-none tracking-tighter">
          {siteName}
        </h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto mb-6">
          Stories, ideas, and tutorials — all powered by a dynamic headless CMS. Switch themes without touching the backend.
        </p>
        {modules.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {modules.map((mod) => (
              <Link
                key={mod.slug}
                href={`/${mod.slug}`}
                className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-amber-500 hover:text-slate-950 transition inline-flex items-center gap-1.5"
              >
                <span>{mod.icon || '📦'}</span>
                <span>{mod.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Content Layout */}
      <section id="dynamic-feed" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            Latest Posts
          </h2>
          <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1">
            Manage Content <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {contents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Post */}
            {featured && (
              <div className="lg:col-span-2">
                <FeaturedCard item={featured} />
              </div>
            )}

            {/* Sidebar Posts */}
            <div className="space-y-5">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                More Articles
              </p>
              {rest.slice(0, 5).map((item) => (
                <SidebarCard key={item._id} item={item} />
              ))}
              {rest.length === 0 && (
                <p className="text-sm text-slate-400">Publish more content from the CMS dashboard.</p>
              )}
            </div>
          </div>
        )}

        {/* More content grid */}
        {rest.length > 0 && (
          <div className="mt-14">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-8">
              All Articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((item) => (
                <BlogCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-slate-900 text-white text-center">
        <h2 className="text-3xl font-black mb-3">Stay in the loop</h2>
        <p className="text-slate-400 mb-6 text-sm">This is a demo blog theme built with the DynamicCMS headless backend.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-400 text-sm transition">
          Open CMS Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}

function FeaturedCard({ item }) {
  const title = item.data?.title || item.data?.headline || item.data?.name || 'Untitled'
  const excerpt = item.data?.excerpt || item.data?.description || item.data?.content || ''
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || null
  const date = item.publishedAt || item.createdAt
  const href = getItemHref(item)

  return (
    <Link href={href} className="block group">
      {image ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-5 bg-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        </div>
      ) : (
        <div className="aspect-video rounded-2xl mb-5 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-amber-400" />
        </div>
      )}
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold uppercase tracking-wider mb-2">
        <Tag className="w-3 h-3" /> {item.moduleId?.name || 'Featured'}
      </span>
      <h2 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-amber-600 transition">
        {title}
      </h2>
      {excerpt && (
        <p className="text-slate-600 leading-relaxed line-clamp-3">
          {typeof excerpt === 'string' ? excerpt.replace(/<[^>]+>/g, '') : ''}
        </p>
      )}
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
      </p>
    </Link>
  )
}

function SidebarCard({ item }) {
  const title = item.data?.title || item.data?.headline || item.data?.name || 'Untitled'
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || null
  const date = item.publishedAt || item.createdAt
  const href = getItemHref(item)

  return (
    <Link href={href} className="flex gap-3 group">
      {image && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-amber-600 transition">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </p>
      </div>
    </Link>
  )
}

function BlogCard({ item }) {
  const title = item.data?.title || item.data?.headline || item.data?.name || 'Untitled'
  const excerpt = item.data?.excerpt || item.data?.description || item.data?.content || ''
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || null
  const date = item.publishedAt || item.createdAt
  const href = getItemHref(item)

  return (
    <Link href={href} className="group border border-slate-200 rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-md transition block">
      {image ? (
        <div className="aspect-video overflow-hidden bg-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-amber-300" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-amber-600 transition mb-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-slate-500 text-xs line-clamp-2">
            {typeof excerpt === 'string' ? excerpt.replace(/<[^>]+>/g, '') : ''}
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-3">
          {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
        </p>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 font-medium mb-1">No blog posts published yet.</p>
      <p className="text-slate-400 text-sm mb-5">Create content in the CMS dashboard and publish it to see it here.</p>
      <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition">
        Open Dashboard
      </Link>
    </div>
  )
}
