import Link from 'next/link'
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Package,
  Globe2,
  ArrowRight,
  PhoneCall,
  Mail,
  Award,
} from 'lucide-react'
import { getPublicEmployees, getPublicSiteSettings } from '@/lib/public-data'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { TeamDirectoryClient } from '@/components/frontend/team/TeamDirectoryClient'

export const revalidate = 60

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  const siteName = settings?.siteName || 'Najid Traders'
  return {
    title: `Corporate Leadership & Sourcing Team — ${siteName}`,
    description: `Meet the executive board, international sourcing specialists, and wholesale operations managers at ${siteName}. Direct factory importing and nationwide distribution.`,
  }
}

export default async function TeamPage() {
  const [employees, settings] = await Promise.all([
    getPublicEmployees(),
    getPublicSiteSettings(),
  ])

  const siteName = settings?.siteName || 'Najid Traders'
  const contact = settings?.contact || {}
  const theme = settings?.theme || {}
  const primaryColor = theme.primaryColor || '#0D253F'
  const accentColor = theme.accentColor || '#C89B3C'
  const secondaryColor = theme.secondaryColor || '#16385D'

  // Partition into Featured / Executive members and Regular members
  const featuredMembers = employees.filter((e) => Boolean(e.isFeatured))
  const regularMembers = employees.filter((e) => !e.isFeatured)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 antialiased selection:bg-slate-200">
      <FrontendHeader settings={settings} />

      <main className="flex-1">
        {/* 1. SOPHISTICATED EDITORIAL HERO MASTHEAD */}
        <section className="relative border-b border-slate-200/80 bg-gradient-to-b from-slate-100/70 via-slate-50/40 to-white pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6"
            >
              <Link href="/" className="hover:text-slate-800 transition">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500">Company</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-900">Leadership &amp; Team</span>
            </nav>

            {/* Header Content */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-200/70 text-slate-800 mb-4 border border-slate-300/60">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span>Corporate Directory &amp; Governance</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                The Leadership &amp; Sourcing Team Behind{' '}
                <span style={{ color: primaryColor }}>{siteName}</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                We coordinate direct factory procurement, strict origin-batch inspections,
                and responsive wholesale fulfillment for retail partners and commercial buyers across Bangladesh.
              </p>
            </div>

            {/* Operational Capabilities & Credibility Highlights */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80">
              <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(13, 37, 63, 0.08)',
                      color: primaryColor,
                    }}
                  >
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Direct Global Sourcing
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      China, India &amp; regional manufacturing hubs
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(13, 37, 63, 0.08)',
                      color: primaryColor,
                    }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Origin Quality Control
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Multi-tier pre-shipment inspections
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(13, 37, 63, 0.08)',
                      color: primaryColor,
                    }}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Wholesale Supply Flow
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Reliable container &amp; pallet dispatches
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'rgba(13, 37, 63, 0.08)',
                      color: primaryColor,
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Direct Trade Access
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dedicated corporate account executives
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. MAIN DIRECTORY SECTION (EXECUTIVE SPOTLIGHT + FILTERABLE TEAM GRID) */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <TeamDirectoryClient
            employees={employees}
            featuredMembers={featuredMembers}
            regularMembers={regularMembers}
            primaryColor={primaryColor}
            accentColor={accentColor}
            secondaryColor={secondaryColor}
            siteName={siteName}
          />
        </div>

        {/* 3. CORPORATE OPERATIONAL STANDARDS & ETHICS */}
        <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Operating Principles
              </span>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How Our Team Delivers Wholesale Integrity
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Importing and wholesale supply require deep manufacturing relationships, honest trade
                terms, and dependable delivery timelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-5 text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    01
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Direct Factory Liaison
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We eliminate middlemen by stationing sourcing personnel directly with partner
                    factories in Guangzhou, Yiwu, Surat, and Mumbai to secure verified wholesale pricing.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Uncompromised Factory Authenticity</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-5 text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    02
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Rigorous Inspection at Origin
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Every batch of Three-Piece sets, Sarees, authentic Spices, and China household
                    wares is verified against material specifications and container seal guidelines.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero-Defect Quality Assurance</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-5 text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    03
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Long-Term Dealer Partnership
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We support retail shop owners and regional wholesale distributors with reliable inventory
                    reservations, priority dispatches, and transparent credit arrangements.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dedicated Wholesale Growth</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CORPORATE CONTACT & WHOLESALE DESK CTA */}
        <section className="border-t border-slate-200 bg-slate-100/60 py-14 sm:py-16">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl p-8 sm:p-12 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <div className="max-w-2xl space-y-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white/90"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <Award className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  Direct Trade Desk
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Discuss Bulk Consignments or Sourcing Partnerships
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Our management and sourcing desk are readily accessible to wholesale dealers,
                  retail chains, and institutional procurement officers. Contact us directly or visit our
                  wholesale distribution center.
                </p>
                {contact.phone && (
                  <p className="text-xs text-white/70 flex items-center gap-2 pt-1">
                    <span>Direct Wholesale Line:</span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="font-bold text-white hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/#contact"
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:opacity-95 transition"
                  style={{
                    backgroundColor: accentColor,
                    color: '#0D253F',
                  }}
                >
                  Send Wholesale Inquiry
                </Link>
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition flex items-center gap-1.5"
                >
                  Browse Wholesale Catalog
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FrontendFooter settings={settings} />
    </div>
  )
}
