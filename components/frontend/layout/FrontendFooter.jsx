'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, Package } from 'lucide-react'

const SOCIAL_META = [
  { key: 'facebook', label: 'Facebook', short: 'FB' },
  { key: 'instagram', label: 'Instagram', short: 'IG' },
  { key: 'linkedin', label: 'LinkedIn', short: 'IN' },
  { key: 'twitter', label: 'X / Twitter', short: 'X' },
  { key: 'youtube', label: 'YouTube', short: 'YT' },
]

export function FrontendFooter({ settings = {} }) {
  const siteName = settings.siteName || 'Najid Traders'
  const siteLogo = settings.siteLogo || ''
  const brandDisplay = settings.brandDisplay || 'both'
  const showLogo = (brandDisplay === 'both' || brandDisplay === 'logo') && Boolean(siteLogo)
  const showFallbackIcon = !siteLogo && brandDisplay !== 'name'
  const showName = brandDisplay === 'both' || brandDisplay === 'name' || !siteLogo

  const footer = settings.footer || {}
  const footerText =
    footer.text ||
    settings.footerText ||
    'Trusted importer and wholesale supplier of Three-Piece, Sarees, authentic Spices, and China household & kitchenware products.'

  const col1Title = footer.col1Title || 'Company'
  const col2Title = footer.col2Title || 'Trade Policy'
  const col3Title = footer.col3Title || 'Contact Information'

  const col1Items =
    Array.isArray(settings.menus?.footer_col1) && settings.menus.footer_col1.length > 0
      ? settings.menus.footer_col1
      : [
          { label: 'Home', url: '/' },
          { label: 'Product Catalog', url: '/products' },
          { label: 'Our Team', url: '/team' },
          { label: 'About Us', url: '/#about' },
          { label: 'Contact Us', url: '/#contact' },
        ]

  const col2Items =
    Array.isArray(settings.menus?.footer_col2) && settings.menus.footer_col2.length > 0
      ? settings.menus.footer_col2
      : [
          { label: 'Wholesale & Bulk Supply', url: '/#contact' },
          { label: 'Direct Import Sourcing', url: '/products' },
          { label: 'Product Showcase Only', url: '/products' },
          { label: 'In-Person & Phone Inquiries', url: '/#contact' },
        ]

  const copyrightText = (
    footer.copyright || '© {year} {siteName}. All rights reserved.'
  )
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{siteName}', siteName)

  const subtext = footer.subtext || 'Wholesale Product Catalog — Direct Trade Inquiries'

  const contact = settings.contact || {}
  const social = settings.social || {}
  const theme = settings.theme || {}
  const footerBg = theme.footerBg || '#0D253F'
  const secondaryColor = theme.secondaryColor || '#16385D'
  const accentColor = theme.accentColor || '#C89B3C'

  const socialItems = SOCIAL_META.map((meta) => ({
    ...meta,
    href: social[meta.key],
  })).filter((item) => Boolean(item.href))

  return (
    <footer
      className="text-slate-300 border-t"
      style={{ backgroundColor: footerBg, borderColor: secondaryColor }}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3.5">
              {showLogo ? (
                <div className="inline-flex items-center justify-center rounded-lg bg-white p-2 shrink-0">
                  <img
                    src={siteLogo}
                    alt={siteName}
                    className={
                      brandDisplay === 'logo'
                        ? 'h-20 w-auto max-w-[220px] object-contain'
                        : 'h-16 w-auto max-w-[160px] object-contain'
                    }
                  />
                </div>
              ) : showFallbackIcon ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#16385D] text-white border border-[#244D78] shrink-0">
                  <Package className="h-5 w-5 text-[#D4A84B]" />
                </div>
              ) : null}
              {showName && (
                <div>
                  <span className="block text-base font-bold text-white">{siteName}</span>
                  <span className="block text-xs text-slate-400">
                    {settings.siteTagline || 'Importer & Wholesale Supplier'}
                  </span>
                </div>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">{footerText}</p>
            {socialItems.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialItems.map(({ key, href, label, short }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700 hover:text-white transition-colors"
                    style={{ '--hover-bg': secondaryColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = secondaryColor
                      e.currentTarget.style.borderColor = secondaryColor
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ''
                      e.currentTarget.style.borderColor = ''
                    }}
                  >
                    {short}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 1 Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {col1Title}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {col1Items.map((item, idx) => (
                <li key={item.id || item.url || idx}>
                  <Link
                    href={item.url}
                    target={item.target || '_self'}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wide text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 Navigation / Trade Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {col2Title}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {col2Items.map((item, idx) => (
                <li key={item.id || item.url || idx}>
                  <Link
                    href={item.url}
                    target={item.target || '_self'}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wide text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {col3Title}
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {contact.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: secondaryColor }} />
                  <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: secondaryColor }} />
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: secondaryColor }} />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: secondaryColor }} />
                  <span>{contact.hours}</span>
                </li>
              )}
              {!contact.phone && !contact.email && !contact.address && (
                <li className="text-xs text-slate-500">
                  Update contact details from Global Settings in the admin dashboard.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>{copyrightText}</p>
          <p>{subtext}</p>
        </div>
      </div>
    </footer>
  )
}
