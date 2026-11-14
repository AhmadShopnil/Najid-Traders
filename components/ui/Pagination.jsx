'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('ellipsis-left')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis-right')
  pages.push(totalPages)

  return pages
}

export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null
  const { page, totalPages } = pagination
  const pageItems = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} <span className="text-slate-400">({pagination.total} total)</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrev}
          aria-label="Previous page"
          className={cn(
            'p-2 rounded-lg border transition',
            pagination.hasPrev
              ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageItems.map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="w-8 h-8 flex items-center justify-center text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded-lg border text-sm transition',
                item === page
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNext}
          aria-label="Next page"
          className={cn(
            'p-2 rounded-lg border transition',
            pagination.hasNext
              ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
