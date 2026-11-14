'use client'

import { useState, useRef, useEffect } from 'react'
import { Code2, ExternalLink, Copy, Check, Globe, Lock, ChevronDown, Terminal } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

/**
 * Developer API Inspector & Quick-Visit Badge.
 * Renders only for users with API inspection privileges (controlled via RBAC).
 */
export function ApiEndpointsBadge({ endpoints, title = 'API Endpoints', variant = 'button', className }) {
  const { canViewApi } = usePermission()
  const [open, setOpen] = useState(false)
  const [copiedPath, setCopiedPath] = useState(null)
  const dropdownRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (!canViewApi || !endpoints) return null

  const items = (Array.isArray(endpoints) ? endpoints : [endpoints]).map((ep) => {
    if (typeof ep === 'string') {
      const isPub = ep.includes('/api/public/')
      return {
        label: isPub ? 'Public Feed' : 'Admin API',
        path: ep,
        isPublic: isPub,
        method: 'GET',
      }
    }
    return {
      label: ep.label || (ep.isPublic ? 'Public Feed' : 'Admin API'),
      path: ep.path,
      isPublic: ep.isPublic ?? ep.path?.includes('/api/public/'),
      method: ep.method || 'GET',
      description: ep.description,
    }
  }).filter(item => item.path)

  if (items.length === 0) return null

  function handleCopy(path, e) {
    e.stopPropagation()
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    navigator.clipboard?.writeText(fullUrl)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  function handleOpen(path, e) {
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      window.open(path, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          title="Inspect GET API Endpoint"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900 text-emerald-400 hover:bg-slate-800 transition shadow-2xs border border-slate-800"
        >
          <Terminal className="w-3 h-3 text-emerald-400" />
          <span>API</span>
          <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 rounded-xl text-xs font-mono font-semibold shadow-sm transition active:scale-95 group"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>GET API</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                {title}
              </h4>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              Developer Preview
            </span>
          </div>

          {/* Endpoints list */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {items.map((ep, idx) => {
              const isCopied = copiedPath === ep.path
              return (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      {ep.isPublic ? (
                        <Globe className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      )}
                      {ep.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold",
                      ep.isPublic
                        ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
                        : "bg-purple-950/80 text-purple-300 border border-purple-800/40"
                    )}>
                      {ep.isPublic ? 'Public' : 'Admin Auth'}
                    </span>
                  </div>

                  {/* URL path box */}
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 break-all select-all">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-950/80 border border-emerald-800/40 px-1 rounded flex-shrink-0">
                      {ep.method}
                    </span>
                    <span className="flex-1 truncate" title={ep.path}>{ep.path}</span>
                  </div>

                  {ep.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {ep.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpen(ep.path, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold transition active:scale-95 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit Endpoint</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(ep.path, e)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition active:scale-95 border border-slate-700/60"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-1 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Admins/Developers only · controlled via RBAC</span>
          </div>
        </div>
      )}
    </div>
  )
}
