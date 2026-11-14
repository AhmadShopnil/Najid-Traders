'use client'

import { Loader2, AlertTriangle } from 'lucide-react'

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-sm w-full p-6 z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            danger ? 'bg-red-50 ring-4 ring-red-50/70' : 'bg-amber-50 ring-4 ring-amber-50/70'
          }`}
        >
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <h3 className="text-center text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="text-center text-slate-500 text-sm mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
