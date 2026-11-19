import Link from 'next/link'
import {
  ChevronRight,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Award,
} from 'lucide-react'
import { getPublicEmployees, getPublicSiteSettings } from '@/lib/public-data'
import { FrontendHeader } from '@/components/frontend/layout/FrontendHeader'
import { FrontendFooter } from '@/components/frontend/layout/FrontendFooter'
import { getInitials } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  const siteName = settings?.siteName || 'Najid Traders'
  return {
    title: `Corporate Leadership — ${siteName}`,
    description: `Meet the governing leadership behind ${siteName}. Direct factory wholesale sourcing and nationwide distribution.`,
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

  // Partition into Featured / Executive leaders and any additional team members
  const featuredLeaders = employees.filter((e) => Boolean(e.isFeatured))
  const otherMembers = employees.filter((e) => !e.isFeatured)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 antialiased selection:bg-slate-200">
      <FrontendHeader settings={settings} />

      <main className="flex-1">
        {/* Minimal & Elegant Header */}
        <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 mb-6"
            >
              <Link href="/" className="hover:text-slate-800 transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">Leadership</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 mb-4 border border-slate-200">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span>Corporate Leadership</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Executive Leadership
            </h1>

            <p className="mt-3.5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              Guiding the corporate governance, international sourcing, and wholesale excellence of {siteName}.
            </p>
          </div>
        </section>

        {/* Executive Leaders Grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 ${featuredLeaders.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-8`}>
              {featuredLeaders.map((leader) => {
                const initials = getInitials(leader.name)
                const isChairman = leader.designation?.toLowerCase().includes('chairman')

                return (
                  <div
                    key={leader._id || leader.id || leader.name}
                    className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar with Badge */}
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: isChairman ? 'rgba(200, 155, 60, 0.12)' : 'rgba(13, 37, 63, 0.08)',
                            color: isChairman ? accentColor : primaryColor,
                          }}
                        >
                          {leader.designation}
                        </span>

                        {leader.department && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {leader.department}
                          </span>
                        )}
                      </div>

                      {/* Photo & Identity */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left mb-6">
                        <div className="relative shrink-0">
                          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                            {leader.photo ? (
                              <img
                                src={leader.photo}
                                alt={leader.name}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <div
                                className="h-full w-full flex items-center justify-center font-bold text-2xl text-white tracking-wider"
                                style={{
                                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                                }}
                              >
                                {initials}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {leader.name}
                          </h2>
                          <p
                            className="text-sm font-bold mt-1"
                            style={{ color: secondaryColor }}
                          >
                            {leader.designation}
                          </p>
                          {leader.bio && (
                            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {leader.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Editorial Leadership Quote */}
                      {leader.featuredQuote && (
                        <div className="pl-4 border-l-2 border-slate-200 py-1 my-4">
                          <p className="text-xs sm:text-sm font-medium text-slate-700 italic leading-relaxed">
                            &ldquo;{leader.featuredQuote}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Key Expertise / Focus */}
                      {Array.isArray(leader.expertise) && leader.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {leader.expertise.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Direct Contact Links */}
                    {(leader.phone || leader.email) && (
                      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        {leader.phone && (
                          <a
                            href={`tel:${leader.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition"
                            title="Call directly"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{leader.phone}</span>
                          </a>
                        )}
                        {leader.email && (
                          <a
                            href={`mailto:${leader.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition"
                            title="Send email"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{leader.email}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Additional Team Members Grid (if any added in the future) */}
            {otherMembers.length > 0 && (
              <div className="mt-16 pt-12 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
                  Team Members &amp; Sourcing Operations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherMembers.map((member) => (
                    <div
                      key={member._id || member.id || member.name}
                      className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs text-center"
                    >
                      <div className="mx-auto h-20 w-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold text-lg text-slate-600">
                            {getInitials(member.name)}
                          </div>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{member.name}</h4>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{member.designation}</p>
                      {member.department && (
                        <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {member.department}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Clean Wholesale Desk Contact */}
        <section className="border-t border-slate-200 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-2xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="space-y-2">
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white/90"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <Award className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  Executive Trade Desk
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Direct Wholesale Inquiries &amp; Consignments
                </h3>
                <p className="text-sm text-white/80 max-w-xl">
                  Contact our corporate trade desk directly to discuss factory sourcing, bulk lot availability, and nationwide dealer terms.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/#contact"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:opacity-95 transition"
                  style={{
                    backgroundColor: accentColor,
                    color: '#0D253F',
                  }}
                >
                  Send Inquiry
                </Link>
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition flex items-center gap-1.5"
                >
                  View Products
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
