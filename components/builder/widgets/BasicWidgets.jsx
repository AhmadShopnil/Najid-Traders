import Link from 'next/link'
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HeroWidget({ props }) {
  const {
    badge = '',
    title = 'Welcome',
    subtitle = '',
    primaryBtnText = 'Get Started',
    primaryBtnUrl = '#',
    secondaryBtnText = '',
    secondaryBtnUrl = '',
    heroImage = '',
    align = 'center',
  } = props

  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  }[align] || 'text-center items-center mx-auto'

  const btnJustifyClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align] || 'justify-center'

  return (
    <div className={cn('flex flex-col max-w-4xl py-6', alignClass)}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300 uppercase tracking-widest shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          {badge}
        </div>
      )}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base sm:text-lg opacity-85 max-w-2xl leading-relaxed mb-8">
          {subtitle}
        </p>
      )}
      <div className={cn('flex flex-wrap gap-4 items-center w-full', btnJustifyClass)}>
        {primaryBtnText && (
          <Link
            href={primaryBtnUrl || '#'}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
          >
            {primaryBtnText} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {secondaryBtnText && (
          <Link
            href={secondaryBtnUrl || '#'}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-current/20 rounded-xl font-bold text-sm transition"
          >
            {secondaryBtnText}
          </Link>
        )}
      </div>
      {heroImage && (
        <div className="mt-10 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <img src={heroImage} alt={title} className="w-full object-cover" />
        </div>
      )}
    </div>
  )
}

export function HeadingWidget({ props }) {
  const { text = '', subtitle = '', badge = '', tag = 'h2', size = 'large', align = 'left', color } = props

  const sizeClasses = {
    small: 'text-lg sm:text-xl font-bold',
    medium: 'text-xl sm:text-2xl font-bold',
    large: 'text-2xl sm:text-4xl font-extrabold tracking-tight',
    huge: 'text-4xl sm:text-6xl font-black tracking-tight',
  }[size] || 'text-2xl sm:text-4xl font-extrabold'

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align] || 'text-left'

  const Tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2'

  return (
    <div className={cn('space-y-2', alignClass)}>
      {badge && (
        <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-purple-100 text-purple-700">
          {badge}
        </span>
      )}
      <Tag className={cn(sizeClasses)} style={{ color: color || undefined }}>
        {text}
      </Tag>
      {subtitle && (
        <p
          className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed"
          style={{
            marginInline: align === 'center' ? 'auto' : undefined,
            marginLeft: align === 'right' ? 'auto' : undefined,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function TextWidget({ props }) {
  const { content = '', align = 'left', color, size = 'base' } = props

  const sizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size] || 'text-base'

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align] || 'text-left'

  return (
    <div
      className={cn(sizeClass, alignClass, 'leading-relaxed')}
      style={{ color: color || undefined }}
    >
      <p className="whitespace-pre-line">{content}</p>
    </div>
  )
}

export function ButtonWidget({ props }) {
  const {
    text = 'Button',
    url = '#',
    variant = 'primary',
    size = 'md',
    align = 'left',
    fullWidth = false,
    openNewTab = false,
  } = props

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
  }[variant] || 'bg-purple-600 hover:bg-purple-700 text-white'

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs font-semibold rounded-lg',
    md: 'px-5 py-2.5 text-sm font-bold rounded-xl',
    lg: 'px-7 py-3.5 text-base font-bold rounded-2xl',
  }[size] || 'px-5 py-2.5 text-sm font-bold rounded-xl'

  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align] || 'justify-start'

  return (
    <div className={cn('flex w-full', alignClass)}>
      <Link
        href={url || '#'}
        target={openNewTab ? '_blank' : undefined}
        rel={openNewTab ? 'noopener noreferrer' : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition duration-200',
          variantClasses,
          sizeClasses,
          fullWidth && 'w-full'
        )}
      >
        <span>{text}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function IconListWidget({ props }) {
  const { title = '', layout = 'vertical', iconColor = '#7c3aed', items = [] } = props

  const layoutClass = {
    vertical: 'flex flex-col space-y-3',
    horizontal: 'flex flex-wrap items-center gap-6',
    'grid-2': 'grid grid-cols-1 sm:grid-cols-2 gap-3.5',
  }[layout] || 'flex flex-col space-y-3'

  return (
    <div className="space-y-3">
      {title && <h4 className="font-bold text-base">{title}</h4>}
      <ul className={layoutClass}>
        {(items || []).map((item, idx) => {
          const text = typeof item === 'string' ? item : item?.text || ''
          return (
            <li key={idx} className="flex items-start gap-2.5 text-sm font-medium">
              <CheckCircle2
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: iconColor || '#7c3aed' }}
              />
              <span>{text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function DividerWidget({ props }) {
  const { height = 32, style = 'solid', color = '#e2e8f0', width = '100%' } = props
  if (style === 'none') {
    return <div style={{ height: `${height}px` }} />
  }

  return (
    <div className="flex items-center justify-center w-full" style={{ padding: `${height / 2}px 0` }}>
      <hr
        style={{
          borderColor: color,
          borderStyle: style,
          width,
        }}
        className="border-t"
      />
    </div>
  )
}

export function LegacyFieldRenderer({ field }) {
  if (!field) return null
  const { name, type, value } = field

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        {name || 'Field'}
      </span>
      {type === 'image' && value ? (
        <img src={value} alt={name} className="w-full rounded-lg object-cover max-h-60" />
      ) : type === 'gallery' && Array.isArray(value) ? (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <img key={i} src={url} alt={`${name} ${i}`} className="w-full aspect-square rounded object-cover" />
          ))}
        </div>
      ) : (
        <p className="text-slate-800 text-sm whitespace-pre-line">{value || '—'}</p>
      )}
    </div>
  )
}
