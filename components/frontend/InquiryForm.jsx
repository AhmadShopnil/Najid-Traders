'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Send, Package } from 'lucide-react'

export function InquiryForm({ product = null, title = null, subtitle = null, settings = {} }) {
  const secondaryColor = settings?.theme?.secondaryColor || '#16385D'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState(
    product ? `Hello, I would like to inquire about wholesale pricing and availability for "${product.title}".` : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Please enter your name, phone number, and inquiry message.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          company: company.trim(),
          message: message.trim(),
          productId: product?.id || '',
          productTitle: product?.title || '',
          productSlug: product?.slug || '',
          productSku: product?.sku || '',
        }),
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Unable to submit inquiry')
      }
      setSubmitted(true)
      setName('')
      setPhone('')
      setEmail('')
      setCompany('')
      setMessage(
        product ? `Hello, I would like to inquire about wholesale pricing and availability for "${product.title}".` : ''
      )
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
        <CheckCircle2
          className="mx-auto h-9 w-9"
          style={{ color: secondaryColor }}
        />
        <h3 className="text-base font-bold text-slate-900">Inquiry Received</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you for contacting us. Our sales team has received your{' '}
          {product ? `inquiry regarding "${product.title}"` : 'message'} and will reach out by
          phone or email shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Send Another Inquiry
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          {title || (product ? 'Send Product Inquiry' : 'Send Us a Message')}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {subtitle ||
            'Fill in your contact details below and our team will call or email you back.'}
        </p>
      </div>

      {product && (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
          <Package className="h-4 w-4 shrink-0" style={{ color: secondaryColor }} />
          <div className="min-w-0 flex-1">
            <span className="text-slate-500">Referenced Product: </span>
            <span className="font-semibold text-slate-900">{product.title}</span>
            {product.sku && (
              <span className="ml-2 text-[11px] font-medium text-slate-500">
                (SKU: {product.sku})
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Your Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tariqul Islam"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Phone Number <span className="text-rose-600">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +880 17XX-XXXXXX"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional (e.g. buyer@shop.com)"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Business / Shop Name
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Inquiry Details / Quantity <span className="text-rose-600">*</span>
        </label>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your question, required quantity, or preferred callback time..."
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#16385D] focus:bg-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#16385D] transition-colors disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? 'Submitting...' : 'Submit Inquiry'}
      </button>
    </form>
  )
}
