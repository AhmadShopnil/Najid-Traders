'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Inbox,
  Search,
  Phone,
  Mail,
  Building2,
  Package,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  MessageSquare,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  useGetInquiriesQuery,
  useUpdateInquiryMutation,
  useDeleteInquiryMutation,
} from '@/store/services/inquiriesApi'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/lib/utils'

const STATUS_BADGE = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_LABEL = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
}

export function InquiriesPage() {
  const { can } = usePermission()
  const canUpdate = can('inquiries:update')
  const canDelete = can('inquiries:delete')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('new')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data, isLoading, isFetching } = useGetInquiriesQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    q: search.trim() || undefined,
  })
  const [updateInquiry, { isLoading: saving }] = useUpdateInquiryMutation()
  const [deleteInquiry, { isLoading: deleting }] = useDeleteInquiryMutation()

  const items = data?.items || []
  const counts = data?.counts || { total: 0, new: 0, contacted: 0, closed: 0 }

  const openDetail = (item) => {
    setSelected(item)
    setStatusDraft(item.status || 'new')
    setNotesDraft(item.adminNotes || '')
  }

  const handleSaveDetail = async () => {
    if (!selected) return
    await updateInquiry({
      id: selected._id,
      status: statusDraft,
      adminNotes: notesDraft,
    })
    setSelected(null)
  }

  const handleQuickStatus = async (item, nextStatus) => {
    await updateInquiry({ id: item._id, status: nextStatus })
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteInquiry(confirmDelete._id)
    setConfirmDelete(null)
    if (selected?._id === confirmDelete._id) setSelected(null)
  }

  const kpis = useMemo(
    () => [
      { label: 'Total Inquiries', value: counts.total, icon: Inbox, color: 'text-[#5b5ce6] bg-indigo-50' },
      { label: 'New / Pending', value: counts.new, icon: Clock, color: 'text-amber-600 bg-amber-50' },
      { label: 'Contacted', value: counts.contacted, icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
      { label: 'Closed', value: counts.closed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    ],
    [counts]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Inquiries</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track product-specific and general contact inquiries submitted from the website.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or product..."
            className="w-full pl-10 pr-4 py-2 bg-[#f8f9fc] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="product">Product Inquiries</option>
            <option value="general">General Contact</option>
          </select>

          {['all', 'new', 'contacted', 'closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-[#5b5ce6] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] overflow-hidden">
        {isLoading || isFetching ? (
          <div className="p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#5b5ce6]" />
            Loading inquiries...
          </div>
        ) : items.length === 0 ? (
          <div className="p-14 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">No Inquiries Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Customer inquiries submitted from product pages or the contact form will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#fafbfe] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-4">Type / Referenced Product</th>
                  <th className="py-3.5 px-4">Message</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 align-top">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1 text-[#5b5ce6] hover:underline font-medium"
                        >
                          <Phone className="w-3 h-3" />
                          {item.phone}
                        </a>
                        {item.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${item.email}`} className="hover:underline">
                              {item.email}
                            </a>
                          </div>
                        )}
                        {item.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {item.company}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {item.inquiryType === 'product' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-[#5b5ce6]">
                            <Package className="w-3 h-3" />
                            Product Inquiry
                          </span>
                          <p className="text-xs font-semibold text-slate-800 max-w-[220px] truncate">
                            {item.productTitle}
                          </p>
                          {item.productSlug && (
                            <Link
                              href={`/products/${encodeURIComponent(item.productSlug)}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#5b5ce6]"
                            >
                              View Product <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          General Contact
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2">{item.message}</p>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <select
                        value={item.status}
                        disabled={!canUpdate}
                        onChange={(e) => handleQuickStatus(item, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                          STATUS_BADGE[item.status] || STATUS_BADGE.new
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 align-top text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>

                    <td className="py-3.5 px-5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#5b5ce6] hover:border-[#5b5ce6]/40 transition"
                          title="View & Follow Up"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Follow-up Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#fafbfe]">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inquiry Details</h3>
                <p className="text-xs text-slate-500">
                  Received {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Name</p>
                  <p className="font-semibold text-slate-900">{selected.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Phone</p>
                  <a
                    href={`tel:${selected.phone}`}
                    className="font-semibold text-[#5b5ce6] hover:underline"
                  >
                    {selected.phone}
                  </a>
                </div>
                {selected.email && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Email</p>
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-slate-700 hover:underline break-all"
                    >
                      {selected.email}
                    </a>
                  </div>
                )}
                {selected.company && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Company</p>
                    <p className="text-slate-700">{selected.company}</p>
                  </div>
                )}
              </div>

              {selected.productTitle && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#5b5ce6] uppercase">
                      Referenced Product
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selected.productTitle}</p>
                    {selected.productSku && (
                      <p className="text-xs text-slate-500">SKU: {selected.productSku}</p>
                    )}
                  </div>
                  {selected.productSlug && (
                    <Link
                      href={`/products/${encodeURIComponent(selected.productSlug)}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-[#5b5ce6] hover:bg-indigo-50"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Customer Message</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Follow-up Status
                  </label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  {selected.email && (
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(
                        `Re: ${selected.subject || 'Your Inquiry'}`
                      )}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Follow-up Notes
                </label>
                <textarea
                  rows={2}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record call outcome, quoted price, or follow-up date..."
                  className="w-full rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-[#fafbfe]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              {canUpdate && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDetail}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b5ce6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4c4dd4] disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Update ({STATUS_LABEL[statusDraft]})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Inquiry?</h3>
            <p className="text-xs text-slate-600">
              Permanently remove the inquiry from <strong>{confirmDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
