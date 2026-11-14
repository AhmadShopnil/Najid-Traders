'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Phone, Mail, Clock, Package } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Our Team', href: '/team' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

export function FrontendHeader({ settings = {} }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const siteName = settings.siteName || 'Najid Traders'
  const siteTagline = settings.siteTagline || 'Importer & Wholesale Supplier'
  const siteLogo = settings.siteLogo || ''
  const brandDisplay = settings.brandDisplay || 'both'
  const showLogo = (brandDisplay === 'both' || brandDisplay === 'logo') && Boolean(siteLogo)
  const showFallbackIcon = !siteLogo && brandDisplay !== 'name'
  const showName = brandDisplay === 'both' || brandDisplay === 'name' || !siteLogo
  const contact = settings.contact || {}
  const theme = settings.theme || {}
  const primaryColor = theme.primaryColor || '#0D253F'
  const secondaryColor = theme.secondaryColor || '#16385D'
  const accentColor = theme.accentColor || '#C89B3C'
  const buttonBg = theme.buttonBg || '#0D253F'
  const buttonText = theme.buttonText || '#ffffff'
  const topbarBg = theme.topbarBg || '#0D253F'

  // Dynamic Navigation & Top Bar Settings
  const topbar = settings.topbar || {}
  const topbarText = topbar.text || 'Importer & Wholesale Trade House'
  const showTopbarPhone = topbar.showPhone !== false
  const showTopbarHours = topbar.showHours !== false

  const menuItems =
    Array.isArray(settings.menus?.main_header) && settings.menus.main_header.length > 0
      ? settings.menus.main_header.map((item) => ({
          label: item.label,
          href: item.url,
          target: item.target || '_self',
          badge: item.badge || '',
        }))
      : NAV_LINKS

  const topMenuItems = Array.isArray(settings.menus?.top_bar) ? settings.menus.top_bar : []

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/#')) return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs">
      {/* Top Corporate Bar */}
      <div
        className="text-slate-300 text-xs border-b"
        style={{ backgroundColor: topbarBg, borderColor: secondaryColor }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-white tracking-wide">
              {topbarText}
            </span>
            {showTopbarHours && contact.hours && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300/80">
                <Clock className="h-3.5 w-3.5" style={{ color: accentColor }} />
                {contact.hours}
              </span>
            )}
            {topMenuItems.length > 0 && (
              <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-white/15">
                {topMenuItems.map((item) => (
                  <Link
                    key={item.id || item.url}
                    href={item.url}
                    target={item.target || '_self'}
                    className="text-slate-300 hover:text-white transition-colors text-[11px]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-5">
            {showTopbarPhone && contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="hidden md:inline-flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <span>{contact.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto flex h-20 sm:h-22 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3.5 shrink-0 py-1">
          {showLogo ? (
            <img
              src={siteLogo}
              alt={siteName}
              className={
                brandDisplay === 'logo'
                  ? 'h-16 sm:h-[74px] w-auto max-w-[240px] object-contain'
                  : 'h-14 sm:h-16 w-auto max-w-[180px] object-contain'
              }
            />
          ) : showFallbackIcon ? (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Package className="h-5 w-5" style={{ color: accentColor }} />
            </div>
          ) : null}
          {showName && (
            <div className="leading-tight">
              <span
                className="block text-base sm:text-lg font-bold tracking-tight"
                style={{ color: primaryColor }}
              >
                {siteName}
              </span>
              <span
                className="block text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {siteTagline}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.target || '_self'}
                className={`relative rounded-md px-3.5 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={active ? { color: primaryColor } : undefined}
              >
                <span>{item.label}</span>
                {/* {item.badge && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wide text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {item.badge}
                  </span>
                )} */}
                {active && (
                  <span
                    className="absolute bottom-0.5 left-3.5 right-3.5 h-0.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Link
            href="/#contact"
            className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors hover:brightness-110 shadow-xs"
            style={{
              backgroundColor: buttonBg,
              color: buttonText,
              borderBottom: `2px solid ${accentColor}`,
            }}
          >
            Contact Sales
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex md:hidden items-center justify-center rounded-md p-2 hover:bg-slate-100"
          style={{ color: primaryColor }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.target || '_self'}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between"
                  style={
                    active
                      ? {
                          borderLeft: `3px solid ${accentColor}`,
                          color: primaryColor,
                          backgroundColor: `${primaryColor}10`,
                        }
                      : { color: '#334155' }
                  }
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
              )
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-xs"
              style={{
                backgroundColor: buttonBg,
                color: buttonText,
                borderBottom: `2px solid ${accentColor}`,
              }}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
