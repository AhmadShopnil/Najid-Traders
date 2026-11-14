import { ArrowRight, CheckCircle, Zap, Globe, Shield, BarChart3, Code2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Built on Next.js with server-side rendering and edge caching.' },
  { icon: Globe, title: 'Headless CMS', desc: 'Decouple frontend from backend — use any framework or theme.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Fine-grained permissions for super admin, admin, editor, and viewer.' },
  { icon: BarChart3, title: 'Dynamic Modules', desc: 'Create any content type with custom fields without touching code.' },
  { icon: Code2, title: 'REST API Ready', desc: 'All content is available via public REST API for any consumer.' },
  { icon: CheckCircle, title: 'Multi-Taxonomy', desc: 'Flexible category and tag systems per module, fully dynamic.' },
]

function getItemHref(item) {
  const modSlug = item.moduleSlug || item.moduleId?.slug
  const itemSlug = item.resolvedSlug || item.data?.slug || item._id
  return modSlug && itemSlug ? `/${modSlug}/${itemSlug}` : '#dynamic-feed'
}

export function AgencyHomePage({ contents = [], modules = [], settings = {} }) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white py-28 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            Powered by {settings?.siteName || 'DynamicCMS'}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            We Build Digital
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Experiences</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A modern agency powered by a headless CMS — dynamic content, clean code, and beautiful design. Swap themes without changing a single line of backend logic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-semibold text-sm shadow-xl shadow-purple-600/30 transition"
            >
              Open CMS Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#dynamic-feed"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-semibold text-sm transition"
            >
              View Content Feed
            </a>
          </div>
        </div>
      </section>

      {/* Active Modules Directory Strip */}
      {modules.length > 0 && (
        <section className="py-6 px-6 bg-slate-900 border-t border-white/10 text-white">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
              Explore Modules:
            </span>
            {modules.map((mod) => (
              <Link
                key={mod.slug}
                href={`/${mod.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-purple-600 text-xs font-semibold transition border border-white/10"
              >
                <span>{mod.icon || '📦'}</span>
                <span>{mod.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Everything You Need</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">One platform to build, manage, and publish content across any frontend.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-50 transition group">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition">
                  <f.icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS Content Feed */}
      <section id="dynamic-feed" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Latest from CMS</h2>
              <p className="text-slate-500">Dynamic content pulled directly from your CMS modules.</p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-semibold hover:underline">
              Manage in Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {contents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 mb-2 font-medium">No content published yet.</p>
              <p className="text-slate-400 text-sm">Go to the CMS dashboard and publish some content to see it here.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                Open Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((item) => (
                <ContentCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center">
        <h2 className="text-3xl font-extrabold mb-4">Ready to manage your content?</h2>
        <p className="text-purple-200 mb-8 max-w-xl mx-auto">This is a demo frontend. Your content is managed in the CMS dashboard and served via the public REST API.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold text-sm hover:bg-purple-50 shadow-lg transition"
        >
          Go to CMS Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}

function ContentCard({ item }) {
  const title = item.data?.title || item.data?.headline || item.data?.name || 'Untitled'
  const excerpt = item.data?.excerpt || item.data?.description || item.data?.content || ''
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || item.data?.thumbnail || null
  const date = item.publishedAt || item.createdAt
  const href = getItemHref(item)

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 hover:border-purple-200 transition group flex flex-col justify-between"
    >
      <div>
        {image && (
          <div className="aspect-video overflow-hidden bg-slate-100">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          </div>
        )}
        <div className="p-5">
          <p className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider mb-2">
            {item.moduleId?.name || 'Content'}
          </p>
          <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2 group-hover:text-purple-600 transition">
            {title}
          </h3>
          {excerpt && (
            <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-3">
              {typeof excerpt === 'string' ? excerpt.replace(/<[^>]+>/g, '') : ''}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 pb-5 pt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
        </span>
        <span className="font-semibold text-purple-600 group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
          Read More <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}
