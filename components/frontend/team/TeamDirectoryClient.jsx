'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Building2,
  Phone,
  Mail,
  Copy,
  Check,
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Star,
  UserCheck,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

export function TeamDirectoryClient({
  employees = [],
  featuredMembers = [],
  regularMembers = [],
  primaryColor = '#0D253F',
  accentColor = '#C89B3C',
  secondaryColor = '#16385D',
  siteName = 'Najid Traders',
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All')
  const [copiedId, setCopiedId] = useState(null)

  // Extract unique departments with accurate counts from all employees
  const departmentStats = useMemo(() => {
    const counts = { All: employees.length }
    employees.forEach((emp) => {
      const dept = emp.department?.trim() || 'General'
      counts[dept] = (counts[dept] || 0) + 1
    })
    return counts
  }, [employees])

  const departmentsList = useMemo(() => {
    const list = Object.keys(departmentStats).filter((d) => d !== 'All')
    list.sort((a, b) => departmentStats[b] - departmentStats[a])
    return ['All', ...list]
  }, [departmentStats])

  // Filter members based on search and department across the full directory
  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return employees.filter((emp) => {
      const dept = emp.department?.trim() || 'General'
      const matchesDept =
        selectedDepartment === 'All' ||
        dept.toLowerCase() === selectedDepartment.toLowerCase()

      if (!matchesDept) return false

      if (!query) return true

      const nameMatch = emp.name?.toLowerCase().includes(query)
      const designationMatch = emp.designation?.toLowerCase().includes(query)
      const titleMatch = emp.featuredTitle?.toLowerCase().includes(query)
      const deptMatch = emp.department?.toLowerCase().includes(query)
      const bioMatch = emp.bio?.toLowerCase().includes(query)
      const quoteMatch = emp.featuredQuote?.toLowerCase().includes(query)
      const phoneMatch = emp.phone?.toLowerCase().includes(query)
      const emailMatch = emp.email?.toLowerCase().includes(query)

      return (
        nameMatch ||
        designationMatch ||
        titleMatch ||
        deptMatch ||
        bioMatch ||
        quoteMatch ||
        phoneMatch ||
        emailMatch
      )
    })
  }, [employees, searchQuery, selectedDepartment])

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  return (
    <div className="space-y-16">
      {/* 1. EXECUTIVE LEADERSHIP SPOTLIGHT */}
      {featuredMembers.length > 0 && !searchQuery && selectedDepartment === 'All' && (
        <section aria-labelledby="executive-leadership-heading">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                Executive Governance &amp; Strategy
              </div>
              <h2
                id="executive-leadership-heading"
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
              >
                Board of Directors &amp; Executive Leadership
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Overseeing strategic international procurement, factory compliance in China &amp; India,
              and enterprise wholesale fulfillment across Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredMembers.map((emp) => {
              const quote = emp.featuredQuote?.trim()
              const title = emp.featuredTitle?.trim() || emp.designation
              const initials = getInitials(emp.name)

              return (
                <div
                  key={emp._id}
                  className="relative group rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg 
                  transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between"
                >
                

                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                      {/* Portrait Frame */}
                      <div className="relative shrink-0">
                        <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs group-hover:border-slate-300 transition-colors">
                          {emp.photo ? (
                            <img
                              src={emp.photo}
                              alt={emp.name}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
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
                        <span
                          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-xs whitespace-nowrap"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Executive
                        </span>
                      </div>

                      {/* Header Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          {emp.department && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {emp.department}
                            </span>
                          )}
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              color: primaryColor,
                              backgroundColor: 'rgba(13, 37, 63, 0.08)',
                            }}
                          >
                            Director
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {emp.name}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                          {title}
                        </p>
                        {emp.designation && emp.designation !== title && (
                          <p className="text-xs text-slate-500 font-medium">
                            {emp.designation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Editorial Leadership Quote */}
                    {quote && (
                      <div className="mt-6 pl-4 border-l-2 border-slate-300 py-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-700 italic leading-relaxed">
                          &ldquo;{quote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Bio */}
                    {emp.bio && (
                      <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {emp.bio}
                      </p>
                    )}

                    {/* Expertise Tags */}
                    {Array.isArray(emp.expertise) && emp.expertise.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {emp.expertise.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Contact Links */}
                  {(emp.phone || emp.email) && (
                    <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      {emp.phone && (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition"
                            title="Call directly"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{emp.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(emp.phone, `phone-${emp._id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copy phone number"
                          >
                            {copiedId === `phone-${emp._id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {emp.email && (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`mailto:${emp.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition"
                            title="Send email"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{emp.email}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(emp.email, `email-${emp._id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copy email address"
                          >
                            {copiedId === `email-${emp._id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 2. TEAM & OPERATIONS DIRECTORY */}
      <section aria-labelledby="team-directory-heading" className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              Organizational Directory
            </div>
            <h2
              id="team-directory-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              Company Personnel &amp; Operations Directory
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
            Browse our full team by department or search directly for wholesale account managers.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, designation, department or contact..."
                className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Total Count Pill */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end md:self-center">
              <span>Showing:</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Department Filter Pills */}
          {departmentsList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 no-scrollbar">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Department:
              </span>
              {departmentsList.map((dept) => {
                const isSelected = selectedDepartment.toLowerCase() === dept.toLowerCase()
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDepartment(dept)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                    style={isSelected ? { backgroundColor: primaryColor } : undefined}
                  >
                    <span>{dept}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {departmentStats[dept] || 0}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Member Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((emp) => {
              const initials = getInitials(emp.name)
              const isLead = Boolean(emp.isFeatured)

              return (
                <div
                  key={emp._id}
                  className="group rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-2xs group-hover:border-slate-300 transition-colors">
                        {emp.photo ? (
                          <img
                            src={emp.photo}
                            alt={emp.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="h-full w-full flex items-center justify-center font-bold text-base text-white"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                            }}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-slate-800 transition-colors">
                            {emp.name}
                          </h3>
                          {isLead && (
                            <span
                              className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded tracking-wider text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Executive
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs font-semibold truncate mt-0.5 text-slate-700"
                        >
                          {emp.featuredTitle || emp.designation}
                        </p>
                        {emp.department && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {emp.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {emp.bio ? (
                      <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {emp.bio}
                      </p>
                    ) : emp.featuredQuote ? (
                      <p className="mt-4 text-xs sm:text-sm text-slate-500 italic leading-relaxed line-clamp-2">
                        &ldquo;{emp.featuredQuote}&rdquo;
                      </p>
                    ) : null}

                    {Array.isArray(emp.expertise) && emp.expertise.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {emp.expertise.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions / Contacts */}
                  {(emp.phone || emp.email) && (
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      {emp.phone && (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{emp.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(emp.phone, `dir-phone-${emp._id}`)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copy phone"
                          >
                            {copiedId === `dir-phone-${emp._id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {emp.email && (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`mailto:${emp.email}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{emp.email}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(emp.email, `dir-email-${emp._id}`)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copy email"
                          >
                            {copiedId === `dir-email-${emp._id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900">
              {searchQuery || selectedDepartment !== 'All'
                ? 'No matching team members found'
                : 'Team Directory'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedDepartment !== 'All'
                ? 'Try adjusting your search criteria or switching department filters.'
                : 'Operational team members will be presented here as onboarding expands.'}
            </p>
            {(searchQuery || selectedDepartment !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDepartment('All')
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
