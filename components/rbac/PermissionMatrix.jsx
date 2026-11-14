'use client'

import { cn } from '@/lib/utils'

export function PermissionMatrix({ permissionGroups, selected, onChange, readOnly = false }) {
  function toggle(perm) {
    if (readOnly) return
    if (selected.includes(perm)) {
      onChange(selected.filter(p => p !== perm))
    } else {
      onChange([...selected, perm])
    }
  }

  function toggleGroup(group) {
    if (readOnly) return
    const keys = group.permissions.map(p => p.key)
    const allSelected = keys.every(k => selected.includes(k))
    if (allSelected) {
      onChange(selected.filter(p => !keys.includes(p)))
    } else {
      const merged = Array.from(new Set([...selected, ...keys]))
      onChange(merged)
    }
  }

  return (
    <div className="space-y-4">
      {permissionGroups.map(group => {
        const keys = group.permissions.map(p => p.key)
        const allSelected = keys.every(k => selected.includes(k))
        const someSelected = keys.some(k => selected.includes(k))
        return (
          <div key={group.key} className="border border-slate-100 rounded-xl overflow-hidden">
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100",
                !readOnly && "cursor-pointer hover:bg-slate-100 transition"
              )}
              onClick={() => toggleGroup(group)}
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{group.label}</p>
                <p className="text-xs text-slate-500">{group.description}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition",
                allSelected ? "bg-purple-600 border-purple-600" : someSelected ? "bg-purple-200 border-purple-400" : "border-slate-300"
              )}>
                {allSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                {someSelected && !allSelected && <div className="w-2 h-0.5 bg-purple-600 rounded" />}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {group.permissions.map(perm => {
                const active = selected.includes(perm.key)
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => toggle(perm.key)}
                    disabled={readOnly}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      active
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600",
                      readOnly && "cursor-default"
                    )}
                  >
                    {perm.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
