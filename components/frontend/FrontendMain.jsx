'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Package,
  Flame,
  ShieldCheck,
  Globe2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Info,
  Shirt,
  CupSoda,
  Layers,
  ChevronRight,
  Star,
} from 'lucide-react'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { InquiryForm } from '@/components/frontend/InquiryForm'
import { extractProductSummary } from '@/lib/product-helpers'
import { getInitials } from '@/lib/utils'

const DIVISION_ICONS = [Shirt, Flame, CupSoda, Layers]

function buildDynamicDivisions(taxonomies = [], products = []) {
  if (!Array.isArray(taxonomies) || taxonomies.length === 0) return []

  return taxonomies.map((tax, idx) => {
    const terms = Array.isArray(tax.terms) ? tax.terms : []
    const termIds = new Set(terms.map((t) => String(t._id || t.id)))
    const termSlugs = new Set(terms.map((t) => String(t.slug || '').toLowerCase()))
    const termNames = new Set(terms.map((t) => String(t.name || '').toLowerCase()))

    const productCount = products.filter((p) => {
      // 1. Direct taxonomy match
      const assigned = p.taxonomies?.[tax.slug] || p.taxonomies?.[String(tax._id)] || []
      if (Array.isArray(assigned) && assigned.some((id) => termIds.has(String(id)))) {
        return true
      }

      // 2. Resolved categories match
      const resolved = Array.isArray(p.resolvedCategories) ? p.resolvedCategories : []
      if (
        resolved.some(
          (c) =>
            termIds.has(String(c._id || c.id)) ||
            termSlugs.has(String(c.slug || '').toLowerCase()) ||
            termNames.has(String(c.name || '').toLowerCase())
        )
      ) {
        return true
      }

      // 3. Fallback title/category keyword matching
      const title = String(p.title || p.name || '').toLowerCase()
      if (tax.slug === 'china-products' && (title.includes('pot') || title.includes('pitcher') || title.includes('flask') || title.includes('china'))) {
        return true
      }
      if (tax.slug === 'dress' && (title.includes('three-piece') || title.includes('saree') || title.includes('lawn') || title.includes('silk') || title.includes('dress'))) {
        return true
      }
      if (tax.slug === 'moshola' && (title.includes('spice') || title.includes('masala') || title.includes('chili') || title.includes('turmeric') || title.includes('elaichi'))) {
        return true
      }

      return false
    }).length

    const Icon = DIVISION_ICONS[idx % DIVISION_ICONS.length]
    const firstTermSlug = terms[0]?.slug

    return {
      id: String(tax._id || tax.slug),
      title: tax.name,
      slug: tax.slug,
      badge: `${productCount} ${productCount === 1 ? 'Item' : 'Items'}`,
      description:
        tax.description?.trim() ||
        (terms.length > 0
          ? `Includes ${terms.map((t) => t.name).join(', ')} sourced directly for wholesale trade.`
          : `Imported ${tax.name} collection available for wholesale inquiry.`),
      highlights: terms.map((t) => t.name),
      href: firstTermSlug
        ? `/products?category=${encodeURIComponent(firstTermSlug)}`
        : '/products',
      icon: Icon,
    }
  })
}

const BUSINESS_PILLARS = [
  {
    icon: Globe2,
    title: 'Direct Global Sourcing',
    text: 'We partner directly with verified manufacturers and exporters across regional textile hubs and China.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality-First Inspection',
    text: 'Every batch of apparel, spices, and household goods undergoes hands-on inspection before distribution.',
  },
  {
    icon: Info,
    title: 'Inquiry-Based Wholesale',
    text: 'Review product specifications online and contact our sales desk directly for bulk pricing and availability.',
  },
]

export function FrontendMain({
  products = [],
  taxonomies = [],
  employees = [],
  settings = {},
}) {
  const siteName = settings.siteName || 'Najid Traders'
  const contact = settings.contact || {}
  const social = settings.social || {}
  const theme = settings.theme || {}
  const secondaryColor = theme.secondaryColor || '#16385D'
  const socialLinks = [
    { label: 'Facebook', href: social.facebook },
    { label: 'Instagram', href: social.instagram },
    { label: 'LinkedIn', href: social.linkedin },
    { label: 'X / Twitter', href: social.twitter },
    { label: 'YouTube', href: social.youtube },
  ].filter((item) => Boolean(item.href))
  const divisions = buildDynamicDivisions(taxonomies, products)
  const featuredProducts = products.slice(0, 6).map(extractProductSummary)
  const previewEmployees = employees.slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <FrontendHeader settings={settings} />

      <main className="flex-1">
        {/* Clean Corporate Hero */}
        <section className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-13">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-6">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: secondaryColor }}
                >
                  Direct Importer &amp; Wholesale Supplier
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-[1.15]">
                  Reliable Sourcing for Apparel, Spices &amp; Household Goods
                </h1>

                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
                  {siteName} imports quality Three-Piece &amp; Sarees, authentic Spices, and
                  China-sourced household items including thermal water pots. Browse our product
                  specifications and contact our office directly for wholesale inquiries.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white
                     hover:bg-[#16385D] transition-colors"
                    //  style={{ backgroundColor: secondaryColor }}
                  >
                    Browse Product Catalog
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/#contact"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Contact Sales Desk
                  </Link>
                </div>

                {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <span>Direct Import Sourcing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <span>Category-Specific Specs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <span>No Online Checkout (Inquiry Only)</span>
                  </div>
                </div> */}

              </div>

              {/* Dynamic Portfolio Directory */}
              <div className="lg:col-span-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-4">
                    <div>
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: secondaryColor }}
                      >
                        Import Divisions
                      </p>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">
                        {siteName} Catalog
                      </h2>
                    </div>
                    <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      B2B &amp; Wholesale
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {divisions.length > 0 ? (
                      divisions.slice(0, 4).map((div) => {
                        const Icon = div.icon
                        return (
                          <Link
                            key={div.id}
                            href={div.href}
                            className="flex items-start gap-3.5 rounded-md border border-slate-200 bg-white p-3.5 hover:border-[#16385D] transition-colors group"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 group-hover:text-[#16385D] truncate">
                                  {div.title}
                                </p>
                                <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                                  {div.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {div.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#16385D] shrink-0 mt-0.5" />
                          </Link>
                        )
                      })
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
                        Add categories inside the Products module to display import divisions here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: secondaryColor }}
                >
                  Product Catalog
                </p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Featured Imported Products
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Select any product to inspect specifications and contact us for wholesale quotes.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${encodeURIComponent(product.slug)}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-[#16385D] transition-colors"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                      {product.categories[0] && (
                        <span className="absolute top-3 left-3 rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {product.categories[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#16385D] transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 flex-1">
                        {product.description || 'Imported wholesale item available for inquiry.'}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="font-medium text-slate-500">
                          {product.origin ? `Origin: ${product.origin}` : 'Wholesale Inquiry'}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: secondaryColor }}
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
                <Package className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  No Products Published Yet
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Publish items inside the Products module from the admin dashboard to display them
                  here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Business Overview & Import Divisions */}
        <section id="about" className="py-16 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: secondaryColor }}
              >
                About Our Business
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Connecting International Suppliers with Local Trade Partners
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                {siteName} specializes in importing high-demand consumer goods. Our website acts as
                a transparent product directory so retailers and wholesale buyers can inspect product
                specifications and contact our office directly rather than placing automated online
                orders.
              </p>
            </div>

            {divisions.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                {divisions.map((div) => {
                  const Icon = div.icon
                  return (
                    <Link
                      key={div.id}
                      href={div.href}
                      className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-6 hover:border-[#16385D] transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rounded bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {div.badge}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#16385D] transition-colors">
                        {div.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                        {div.description}
                      </p>
                      {div.highlights.length > 0 && (
                        <ul className="mt-4 space-y-1.5 border-t border-slate-200/70 pt-4">
                          {div.highlights.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-xs font-medium text-slate-700"
                            >
                              <CheckCircle2
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: secondaryColor }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* 3 Business Pillars */}
            <div className="mt-8 grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-slate-50/70 p-6 md:grid-cols-3">
              {BUSINESS_PILLARS.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <div key={pillar.title} className="flex items-start gap-3.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200"
                      style={{ color: secondaryColor }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{pillar.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{pillar.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team Preview */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: secondaryColor }}
                >
                  Our Organization
                </p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Meet the {siteName} Team
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Sourcing, quality assurance, and wholesale coordination specialists.
                </p>
              </div>
              <Link
                href="/team"
                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                View Full Team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {previewEmployees.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {previewEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className={`relative rounded-xl border bg-white p-5 text-center transition shadow-xs hover:shadow-md border-slate-200 `}
                  >
                    {emp.isFeatured && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        Featured
                      </span>
                    )}
                    <div className="mx-auto h-20 w-20 overflow-hidden rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg border border-slate-200">
                      {emp.photo ? (
                        <img
                          src={emp.photo}
                          alt={emp.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(emp.name)
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{emp.name}</h3>
                    <p
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: secondaryColor }}
                    >
                      {emp.designation}
                    </p>
                    {emp.department && (
                      <span className="mt-2 inline-block rounded bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {emp.department}
                      </span>
                    )}
                    {emp.bio && (
                      <p className="mt-3 text-xs text-slate-600 line-clamp-2">{emp.bio}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <Users className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Team directory is ready to populate
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add employees from Dashboard &rarr; Employees to showcase your team here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Contact & Inquiry Section */}
        <section id="contact" className="py-16 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-3">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: secondaryColor }}
                  >
                    Trade &amp; Wholesale Inquiries
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Contact {siteName}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-600">
                    We do not process direct online purchases through this website. Submit an
                    inquiry using the form or reach out to our office directly by phone, email, or
                    in person.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                    <Phone
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Phone / Hotline
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {contact.phone || 'Configure in Global Settings'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                    <Mail
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Email Address
                      </p>
                      <p className="text-sm font-semibold text-slate-900 break-all">
                        {contact.email || 'Configure in Global Settings'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                    <MapPin
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Office Address
                      </p>
                      <p className="text-sm text-slate-700">
                        {contact.address || 'Configure office address in Global Settings'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                    <Clock
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: secondaryColor }}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Business Hours
                      </p>
                      <p className="text-sm text-slate-700">
                        {contact.hours || 'Configure support hours in Global Settings'}
                      </p>
                    </div>
                  </div>
                </div>

                {socialLinks.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Follow us:</span>
                    {socialLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#16385D] hover:text-[#16385D] transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-7">
                <InquiryForm
                  title="General Contact & Wholesale Inquiry"
                  subtitle="Send us your questions or bulk requirements and our team will contact you back."
                  settings={settings}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <FrontendFooter settings={settings} />
    </div>
  )
}
