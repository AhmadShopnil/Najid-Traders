import Link from 'next/link'
import { Sparkles, CheckCircle2, ArrowRight, Star, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatsWidget({ props }) {
  const { columns = 4, style = 'card', items = [] } = props

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 lg:grid-cols-4'

  return (
    <div className={cn('grid gap-6', colClass)}>
      {(items || []).map((stat, idx) => (
        <div
          key={idx}
          className={cn(
            'p-6 rounded-2xl text-center transition',
            style === 'card' && 'bg-white border border-slate-200 shadow-xs',
            style === 'dark' && 'bg-slate-900 text-white border border-slate-800',
            style === 'minimal' && 'bg-transparent'
          )}
        >
          <div className="text-3xl sm:text-4xl font-black text-purple-600 mb-1 tracking-tight">
            {stat.prefix}{stat.value}{stat.suffix}
          </div>
          <div className={cn('text-xs font-bold uppercase tracking-wider', style === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export function FeaturesWidget({ props }) {
  const { columns = 3, cardStyle = 'bordered', items = [] } = props

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-3'

  return (
    <div className={cn('grid gap-6', colClass)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            'p-6 rounded-2xl transition duration-300 flex flex-col justify-between group',
            cardStyle === 'dark'
              ? 'bg-slate-900 text-white border border-slate-800 hover:border-purple-500'
              : cardStyle === 'elevated'
                ? 'bg-white text-slate-900 shadow-lg border border-slate-100 hover:shadow-xl'
                : cardStyle === 'minimal'
                  ? 'bg-transparent text-slate-900'
                  : 'bg-white text-slate-900 border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-50/50'
          )}
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 text-xl group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition duration-300 shadow-xs">
              {item.icon && item.icon.length <= 4 ? (
                <span>{item.icon}</span>
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
            <h3 className={cn('font-bold text-lg mb-2 group-hover:text-purple-600 transition', cardStyle === 'dark' ? 'text-white' : 'text-slate-900')}>
              {item.title}
            </h3>
            <p className={cn('text-sm leading-relaxed', cardStyle === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
              {item.description}
            </p>
          </div>
          {item.linkText && (
            <Link
              href={item.linkUrl || '#'}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 mt-4"
            >
              {item.linkText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

export function PricingWidget({ props }) {
  const { plans = [] } = props

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
      {plans.map((plan, idx) => (
        <div
          key={idx}
          className={cn(
            'rounded-3xl p-8 flex flex-col justify-between transition duration-300 border',
            plan.isPopular
              ? 'bg-slate-900 text-white border-purple-500 shadow-2xl relative md:-translate-y-2'
              : 'bg-white text-slate-900 border-slate-200 shadow-sm hover:border-slate-300'
          )}
        >
          {plan.isPopular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
              Most Popular
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className={cn('text-xs mb-6', plan.isPopular ? 'text-slate-400' : 'text-slate-500')}>
              {plan.description}
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className={cn('text-sm', plan.isPopular ? 'text-slate-400' : 'text-slate-500')}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {(plan.features || []).map((feat, fidx) => (
                <li key={fidx} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span className={plan.isPopular ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href={plan.buttonUrl || '#'}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-bold text-xs text-center transition flex items-center justify-center gap-1.5',
              plan.isPopular
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            )}
          >
            {plan.buttonText || 'Choose Plan'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ))}
    </div>
  )
}

export function TestimonialsWidget({ props }) {
  const { columns = 2, items = [] } = props

  const colClass = columns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'

  return (
    <div className={cn('grid gap-6', colClass)}>
      {items.map((item, idx) => (
        <div key={idx} className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between text-slate-900">
          <div>
            <div className="flex items-center gap-1 text-amber-400 mb-4">
              {Array.from({ length: item.rating || 5 }).map((_, s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-slate-700 text-base italic leading-relaxed mb-6">
              &quot;{item.quote}&quot;
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            {item.avatar && (
              <img src={item.avatar} alt={item.author} className="w-10 h-10 rounded-full object-cover" />
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{item.author}</p>
              <p className="text-xs text-slate-500">{item.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamWidget({ props }) {
  const { columns = 3, members = [] } = props

  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={cn('grid gap-8', colClass)}>
      {(members || []).map((m, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition group text-slate-900 flex flex-col justify-between"
        >
          <div>
            {m.avatar && (
              <div className="aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
            )}
            <div className="p-6">
              <h4 className="font-extrabold text-lg text-slate-900">{m.name}</h4>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mt-0.5 mb-3">
                {m.role}
              </p>
              {m.bio && <p className="text-sm text-slate-600 leading-relaxed">{m.bio}</p>}
            </div>
          </div>
          {m.linkedinUrl && m.linkedinUrl !== '#' && (
            <div className="px-6 pb-5 pt-2 border-t border-slate-100">
              <a
                href={m.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                <span>Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function CtaWidget({ props }) {
  const {
    badge = '',
    title = 'Ready to build?',
    description = '',
    buttonText = 'Get Started',
    buttonUrl = '#',
    secondaryBtnText = '',
    secondaryBtnUrl = '',
    style = 'purple',
  } = props

  const styleClasses = {
    purple: 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white shadow-xl',
    dark: 'bg-slate-900 text-white border border-slate-800 shadow-xl',
    blue: 'bg-gradient-to-r from-blue-700 to-cyan-700 text-white shadow-xl',
    emerald: 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xl',
  }[style] || 'bg-purple-600 text-white'

  return (
    <div className={cn('rounded-3xl p-10 sm:p-14 text-center max-w-5xl mx-auto', styleClasses)}>
      {badge && (
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-white mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 tracking-tight leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-white/85 text-base max-w-xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href={buttonUrl || '#'}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 shadow-lg transition transform hover:-translate-y-0.5"
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        {secondaryBtnText && (
          <Link
            href={secondaryBtnUrl || '#'}
            className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-2xl font-bold text-sm transition"
          >
            <span>{secondaryBtnText}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
