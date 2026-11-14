import { ArrowRight, Flame, Globe2, Radio, TrendingUp, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function getItemHref(item) {
  const modSlug = item.moduleSlug || item.moduleId?.slug
  const itemSlug = item.resolvedSlug || item.data?.slug || item._id
  return modSlug && itemSlug ? `/${modSlug}/${itemSlug}` : '#dynamic-feed'
}

function getTitle(item, fallback = 'Untitled') {
  return item?.data?.title || item?.data?.headline || item?.data?.name || fallback
}

export function NewsHomePage({ contents = [], modules = [], settings = {} }) {
  const siteName = settings?.siteName || 'The Daily Pulse'
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const [leadStory, secondStory, thirdStory, ...otherStories] = contents

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      {/* Newspaper Top Bar / Dateline */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-600" /> {todayStr}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:flex font-medium text-emerald-600 items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-red-600" /> LIVE EDITION
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
              CMS FEED CONNECTED
            </span>
            <Link
              href="/dashboard"
              className="text-xs text-slate-700 hover:text-red-600 font-medium inline-flex items-center gap-1"
            >
              CMS Desk <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* News Masthead */}
      <div className="bg-white border-b-2 border-slate-900 py-6 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-slate-900 uppercase">
            {siteName}
          </h1>
          <p className="text-[11px] font-sans font-semibold tracking-widest text-slate-500 uppercase mt-1">
            Dynamic News Portal &bull; Headless Multi-Taxonomy Engine
          </p>
        </div>
      </div>

      {/* Breaking News Flash */}
      <div className="bg-red-600 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="font-black flex items-center gap-1 uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-[11px] shrink-0">
            <Flame className="w-3.5 h-3.5" /> FLASH:
          </span>
          {leadStory ? (
            <Link
              href={getItemHref(leadStory)}
              className="overflow-hidden whitespace-nowrap text-ellipsis text-red-50 flex-1 text-[13px] font-medium hover:underline"
            >
              Top Story: {getTitle(leadStory)}
            </Link>
          ) : (
            <div className="overflow-hidden whitespace-nowrap text-red-50 flex-1 text-[13px] font-medium">
              Headless CMS allows instantaneous publishing across web, mobile apps, and smart news feeds.
            </div>
          )}
        </div>
      </div>

      {/* News Module Navigation */}
      <nav className="bg-slate-900 text-slate-200 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto py-2.5 text-xs font-semibold uppercase tracking-wider">
          <Link href="#dynamic-feed" className="whitespace-nowrap text-red-400 font-bold">
            Top Stories
          </Link>
          {modules.map((mod) => (
            <Link
              key={mod.slug}
              href={`/${mod.slug}`}
              className="whitespace-nowrap hover:text-red-400 transition"
            >
              {mod.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Newspaper Grid */}
      <div id="dynamic-feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {contents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <Globe2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">No News Dispatches Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Publish news items from the CMS dashboard to see them featured dynamically across this news portal.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
            >
              Open Newsroom Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Main Headline & Major Stories */}
            <div className="lg:col-span-8 space-y-8">
              {/* Lead Headline Story */}
              {leadStory && (
                <Link
                  href={getItemHref(leadStory)}
                  className="block bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition group"
                >
                  {leadStory.data?.featureImage || leadStory.data?.featured_image || leadStory.data?.image ? (
                    <div className="aspect-16/9 rounded-xl overflow-hidden mb-5 bg-slate-100">
                      <img
                        src={leadStory.data?.featureImage || leadStory.data?.featured_image || leadStory.data?.image}
                        alt={getTitle(leadStory, 'Lead story')}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                      />
                    </div>
                  ) : null}
                  <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider mb-2">
                    {leadStory.moduleId?.name || 'Exclusive'}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 group-hover:text-red-600 transition leading-tight mb-3">
                    {getTitle(leadStory, 'Breaking Headline')}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {typeof leadStory.data?.excerpt === 'string'
                      ? leadStory.data.excerpt.replace(/<[^>]+>/g, '')
                      : typeof leadStory.data?.description === 'string'
                      ? leadStory.data.description.replace(/<[^>]+>/g, '')
                      : leadStory.data?.content
                      ? String(leadStory.data.content).replace(/<[^>]+>/g, '')
                      : ''}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span>
                      Published:{' '}
                      {new Date(leadStory.publishedAt || leadStory.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-red-600 group-hover:underline flex items-center gap-1">
                      Read Full Report <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Two Column Sub-Headlines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {secondStory && <NewsGridCard item={secondStory} />}
                {thirdStory && <NewsGridCard item={thirdStory} />}
              </div>

              {/* Additional Story Feed */}
              {otherStories.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-serif font-black text-xl text-slate-900 border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-red-600" /> In-Depth Coverage
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {otherStories.map((story) => (
                      <NewsRowCard key={story._id} item={story} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Wire Feed / Trending Bar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Trending Widget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <h3 className="font-serif font-black text-base text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" /> Trending News
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Updated live</span>
                </div>
                <div className="space-y-4">
                  {contents.slice(0, 5).map((item, idx) => (
                    <Link
                      key={item._id}
                      href={getItemHref(item)}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-2xl font-serif font-black text-slate-300 group-hover:text-red-600 transition leading-none">
                        0{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-red-600 transition leading-snug">
                          {getTitle(item, 'Untitled item')}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Editorial / Callout Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl">
                <span className="text-[10px] bg-red-600 font-black px-2 py-0.5 rounded tracking-widest uppercase">
                  CMS Engine
                </span>
                <h4 className="font-serif font-bold text-lg mt-3 mb-2">Automated Publishing</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Journalists, editors, and photographers can manage real-time dispatches using our dynamic module builder with multi-taxonomies.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-white transition"
                >
                  Enter Editorial Panel <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function NewsGridCard({ item }) {
  const title = getTitle(item, 'Headline')
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || null
  const date = item.publishedAt || item.createdAt

  return (
    <Link
      href={getItemHref(item)}
      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-red-300 group flex flex-col justify-between transition"
    >
      <div>
        {image && (
          <div className="aspect-16/9 rounded-lg overflow-hidden mb-3 bg-slate-100">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
        )}
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
          {item.moduleId?.name || 'News'}
        </span>
        <h3 className="font-serif font-black text-base text-slate-900 group-hover:text-red-600 transition leading-snug line-clamp-2 mb-2">
          {title}
        </h3>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        {date
          ? new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : ''}
      </p>
    </Link>
  )
}

function NewsRowCard({ item }) {
  const title = getTitle(item, 'Headline')
  const image = item.data?.featureImage || item.data?.featured_image || item.data?.image || null
  const date = item.publishedAt || item.createdAt

  return (
    <Link
      href={getItemHref(item)}
      className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center group"
    >
      {image && (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-0.5">
          {item.moduleId?.name || 'Dispatch'}
        </span>
        <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 line-clamp-2 group-hover:text-red-600 transition leading-snug">
          {title}
        </h4>
        <p className="text-[10px] text-slate-400 mt-1">
          {date
            ? new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : ''}
        </p>
      </div>
    </Link>
  )
}
