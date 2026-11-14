'use client'

import { useState } from 'react'
import { ChevronDown, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'

export function TabsWidget({ props }) {
  const { tabs = [] } = props
  const [activeIdx, setActiveIdx] = useState(0)
  const current = tabs[activeIdx] || tabs[0]

  if (!tabs.length) return null

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-slate-900">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-6">
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2',
              activeIdx === i
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <span>{t.title}</span>
            {t.badge && (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full',
                  activeIdx === i ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div className={cn('grid gap-8 items-center', current.imageUrl ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{current.title}</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
              {current.content}
            </p>
          </div>
          {current.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img src={current.imageUrl} alt={current.title} className="w-full object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProgressWidget({ props }) {
  const { title = '', items = [] } = props

  return (
    <div className="space-y-4">
      {title && <h4 className="font-bold text-base mb-2">{title}</h4>}
      <div className="space-y-4">
        {(items || []).map((bar, idx) => {
          const pct = Math.min(100, Math.max(0, Number(bar.percentage) || 0))
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{bar.label}</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: bar.color || '#7c3aed',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FaqWidget({ props }) {
  const { items = [] } = props
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="max-w-3xl mx-auto space-y-3 text-slate-900">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-purple-600 transition"
            >
              <span className="text-base">{item.question}</span>
              <ChevronDown className={cn('w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-purple-600')} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function NewsletterWidget({ props }) {
  const {
    badge = '',
    title = 'Subscribe to Our Newsletter',
    subtitle = '',
    placeholder = 'Enter your email...',
    buttonText = 'Subscribe',
    privacyNote = '',
    style = 'dark',
  } = props

  const [subscribed, setSubscribed] = useState(false)
  const [email, setEmail] = useState('')

  const boxClass = {
    dark: 'bg-slate-900 text-white border border-slate-800',
    purple: 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white',
    light: 'bg-slate-50 text-slate-900 border border-slate-200',
  }[style] || 'bg-slate-900 text-white'

  return (
    <div className={cn('rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-lg', boxClass)}>
      {badge && (
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 mb-3">
          {badge}
        </span>
      )}
      <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">{title}</h3>
      {subtitle && <p className="text-sm opacity-80 max-w-lg mx-auto mb-6">{subtitle}</p>}

      {subscribed ? (
        <div className="py-3 px-6 bg-emerald-500/20 border border-emerald-400/30 rounded-xl inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
          <Check className="w-4 h-4" /> Subscribed ({email})!
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!email.trim()) return
            setSubscribed(true)
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 text-sm focus:outline-none border border-slate-200"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shrink-0 shadow-md"
          >
            {buttonText}
          </button>
        </form>
      )}
      {privacyNote && <p className="text-[11px] opacity-60 mt-3">{privacyNote}</p>}
    </div>
  )
}

export function ContactFormWidget({ props }) {
  const {
    title = 'Contact Us',
    subtitle = 'Drop us a message and we will respond within 24 hours.',
    buttonText = 'Send Message',
    showPhone = false,
    showSubject = false,
  } = props

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 400)
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-lg text-slate-900">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      {submitted ? (
        <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-2">
          <Check className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-base">Message Recorded!</h4>
          <p className="text-xs text-emerald-700">Thank you. Our team will get back to you shortly.</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-xs text-emerald-700 font-bold underline mt-2"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
          {(showPhone || showSubject) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showPhone && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}
              {showSubject && (
                <div className={!showPhone ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Project Inquiry"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Message</label>
            <textarea
              required
              rows={4}
              placeholder="Write your message here..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
          >
            {loading ? 'Sending...' : buttonText}
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}

export function CustomHtmlWidget({ props }) {
  const { html = '' } = props
  if (!html) return null
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}
