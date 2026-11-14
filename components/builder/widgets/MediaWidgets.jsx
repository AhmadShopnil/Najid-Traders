import Link from 'next/link'
import { cn } from '@/lib/utils'

export function ImageWidget({ props }) {
  const {
    url = '',
    alt = '',
    caption = '',
    linkUrl = '',
    rounded = 'xl',
    aspectRatio = 'auto',
    shadow = 'none',
    maxWidth = '100%',
    align = 'center',
  } = props

  const roundedClasses = {
    none: 'rounded-none',
    md: 'rounded-lg',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-2xl'

  const aspectClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-4/3',
    '1/1': 'aspect-square',
    auto: '',
  }[aspectRatio] || ''

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    lg: 'shadow-lg',
    '2xl': 'shadow-2xl',
  }[shadow] || ''

  const alignClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }[align] || 'mx-auto'

  if (!url) return null

  const imgEl = (
    <img
      src={url}
      alt={alt || ''}
      className={cn(
        'w-full object-cover transition-transform duration-300 hover:scale-101',
        roundedClasses,
        aspectClasses,
        shadowClasses
      )}
    />
  )

  return (
    <figure className={cn('overflow-hidden', alignClass)} style={{ maxWidth }}>
      {linkUrl?.trim() ? (
        <Link href={linkUrl.trim()} className="block">
          {imgEl}
        </Link>
      ) : (
        imgEl
      )}
      {caption && (
        <figcaption className="text-xs text-center text-slate-500 mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

function parseEmbedVideoUrl(rawUrl = '') {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return { type: 'none', src: '' }

  // Direct HTML5 video files
  if (/\.(mp4|webm|ogg)(?:\?.*)?$/i.test(trimmed)) {
    return { type: 'video', src: trimmed }
  }

  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()

    if (host === 'youtu.be') {
      const vid = u.pathname.split('/').filter(Boolean)[0]
      if (vid) return { type: 'iframe', src: `https://www.youtube.com/embed/${vid}` }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        return { type: 'iframe', src: trimmed }
      }
      if (u.pathname.startsWith('/shorts/')) {
        const vid = u.pathname.split('/')[2]
        if (vid) return { type: 'iframe', src: `https://www.youtube.com/embed/${vid}` }
      }
      const vid = u.searchParams.get('v')
      if (vid) {
        return { type: 'iframe', src: `https://www.youtube.com/embed/${vid}` }
      }
    }

    if (host === 'vimeo.com') {
      const vid = u.pathname.split('/').filter(Boolean)[0]
      if (vid && /^\d+$/.test(vid)) {
        return { type: 'iframe', src: `https://player.vimeo.com/video/${vid}` }
      }
    }
  } catch {
    // Fallback string matching for malformed URLs
  }

  return { type: 'iframe', src: trimmed }
}

export function VideoWidget({ props }) {
  const { url = '', title = 'Video', aspectRatio = '16/9' } = props
  const parsed = parseEmbedVideoUrl(url)
  const aspectClass = aspectRatio === '4/3' ? 'aspect-4/3' : 'aspect-video'

  if (parsed.type === 'none') return null

  return (
    <div className={cn('w-full rounded-2xl overflow-hidden shadow-lg bg-black', aspectClass)}>
      {parsed.type === 'video' ? (
        <video
          src={parsed.src}
          controls
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <iframe
          src={parsed.src}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}

export function GalleryWidget({ props }) {
  const { images = [], columns = 3, gap = 4, aspectRatio = 'square' } = props

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-3'

  const gapClass = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
  }[Number(gap)] || 'gap-4'

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio] || 'aspect-square'

  return (
    <div className={cn('grid', gapClass, colClass)}>
      {images.map((img, i) => (
        <div key={i} className={cn('rounded-2xl overflow-hidden bg-slate-100 shadow-xs group', aspectClass)}>
          <img
            src={img}
            alt={`Gallery item ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      ))}
    </div>
  )
}

export function LogoGridWidget({ props }) {
  const { title = '', columns = 5, items = [] } = props

  const colClass = {
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }[columns] || 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'

  return (
    <div className="py-4 text-center">
      {title && (
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-6">
          {title}
        </p>
      )}
      <div className={cn('grid gap-4 items-center', colClass)}>
        {(items || []).map((item, idx) => (
          <div
            key={idx}
            className="py-4 px-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition flex items-center justify-center font-extrabold text-sm text-slate-600 hover:text-purple-700"
          >
            {item.logoUrl ? (
              <img src={item.logoUrl} alt={item.name} className="h-8 object-contain" />
            ) : (
              <span>{item.badge || item.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
