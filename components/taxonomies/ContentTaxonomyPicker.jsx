'use client'

import { useState } from 'react'
import {
  FolderTree,
  Plus,
  ChevronRight,
  Folder,
  Tag,
  Loader2,
  Check,
} from 'lucide-react'
import {
  useGetModuleTaxonomiesQuery,
  useAddTaxonomyTermMutation,
} from '@/store/services/taxonomiesApi'

export function ContentTaxonomyPicker({
  moduleId,
  value = {},
  onChange,
  disabled = false,
}) {
  const { data: res, isLoading } = useGetModuleTaxonomiesQuery(moduleId, { skip: !moduleId })
  const taxonomies = res?.data || []

  const [addTerm] = useAddTaxonomyTermMutation()
  const [quickAddOpen, setQuickAddOpen] = useState({})
  const [quickAddName, setQuickAddName] = useState({})
  const [quickAddParent, setQuickAddParent] = useState({})
  const [savingTerm, setSavingTerm] = useState({})

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
        <div className="h-10 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  if (taxonomies.length === 0) {
    return null
  }

  function handleTermToggle(taxSlug, termId, allowMultiple) {
    if (disabled) return
    const current = value[taxSlug] || []

    let updated
    if (allowMultiple) {
      const isSelected = Array.isArray(current)
        ? current.some((id) => String(id) === String(termId))
        : String(current) === String(termId)

      if (isSelected) {
        updated = (Array.isArray(current) ? current : [current]).filter(
          (id) => String(id) !== String(termId)
        )
      } else {
        updated = [...(Array.isArray(current) ? current : [current].filter(Boolean)), termId]
      }
    } else {
      // Single select
      const isSelected = String(current) === String(termId)
      updated = isSelected ? null : termId
    }

    onChange({
      ...value,
      [taxSlug]: updated,
    })
  }

  async function handleQuickAdd(tax) {
    const name = quickAddName[tax._id]?.trim()
    if (!name || disabled) return

    setSavingTerm((prev) => ({ ...prev, [tax._id]: true }))
    try {
      const res = await addTerm({
        moduleId,
        taxId: tax._id,
        name,
        parentId: quickAddParent[tax._id] || null,
      })

      if (res?.data?.data?._id) {
        const newTermId = res.data.data._id
        // Auto-select the newly added term
        const current = value[tax.slug] || []
        const updated = tax.allowMultiple
          ? [...(Array.isArray(current) ? current : [current].filter(Boolean)), newTermId]
          : newTermId

        onChange({
          ...value,
          [tax.slug]: updated,
        })

        // Reset quick add form
        setQuickAddName((prev) => ({ ...prev, [tax._id]: '' }))
        setQuickAddParent((prev) => ({ ...prev, [tax._id]: '' }))
        setQuickAddOpen((prev) => ({ ...prev, [tax._id]: false }))
      }
    } finally {
      setSavingTerm((prev) => ({ ...prev, [tax._id]: false }))
    }
  }

  function buildTermTree(terms = []) {
    const termMap = {}
    const roots = []

    terms.forEach((t) => {
      termMap[t._id] = { ...t, children: [] }
    })

    terms.forEach((t) => {
      if (t.parentId && termMap[t.parentId]) {
        termMap[t.parentId].children.push(termMap[t._id])
      } else {
        roots.push(termMap[t._id])
      }
    })

    return roots
  }

  return (
    <div className="space-y-4">
      {taxonomies.map((tax) => {
        const selected = value[tax.slug]
        const isMulti = tax.allowMultiple !== false
        const terms = tax.terms || []
        const termTree = tax.hierarchical ? buildTermTree(terms) : terms
        const isQuickAddOpen = quickAddOpen[tax._id]
        const isSaving = savingTerm[tax._id]

        return (
          <div key={tax._id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                {tax.hierarchical ? (
                  <Folder className="w-4 h-4 text-purple-600" />
                ) : (
                  <Tag className="w-4 h-4 text-purple-600" />
                )}
                <h3 className="font-semibold text-sm text-slate-900">{tax.name}</h3>
                {tax.required && <span className="text-red-500 text-xs">*</span>}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {isMulti ? 'Multiple' : 'Single'}
              </span>
            </div>

            {terms.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No {tax.name.toLowerCase()} defined yet.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {tax.hierarchical ? (
                  termTree.map((node) => (
                    <TermSelectorItem
                      key={node._id}
                      node={node}
                      taxSlug={tax.slug}
                      level={0}
                      isMulti={isMulti}
                      selectedValues={selected}
                      disabled={disabled}
                      onToggle={handleTermToggle}
                    />
                  ))
                ) : (
                  terms.map((t) => {
                    const isChecked = isMulti
                      ? Array.isArray(selected) && selected.some((id) => String(id) === String(t._id))
                      : String(selected) === String(t._id)

                    return (
                      <label
                        key={t._id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isChecked ? 'bg-purple-50 text-purple-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`tax_${tax.slug}`}
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => handleTermToggle(tax.slug, t._id, isMulti)}
                          className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.color || '#8b5cf6' }}
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            )}

            {/* Inline Quick Add Term */}
            {!disabled && (
              <div className="pt-2 border-t border-slate-100">
                {!isQuickAddOpen ? (
                  <button
                    type="button"
                    onClick={() => setQuickAddOpen((prev) => ({ ...prev, [tax._id]: true }))}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add New {tax.name.slice(0, -1) || 'Item'}
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder={`New ${tax.name.slice(0, -1) || 'category'} name...`}
                      value={quickAddName[tax._id] || ''}
                      onChange={(e) =>
                        setQuickAddName((prev) => ({ ...prev, [tax._id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleQuickAdd(tax)
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    {tax.hierarchical && terms.length > 0 && (
                      <select
                        value={quickAddParent[tax._id] || ''}
                        onChange={(e) =>
                          setQuickAddParent((prev) => ({ ...prev, [tax._id]: e.target.value }))
                        }
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">— Top Level —</option>
                        {terms.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.parentId ? '— ' : ''}{t.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setQuickAddOpen((prev) => ({ ...prev, [tax._id]: false }))}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving || !quickAddName[tax._id]?.trim()}
                        onClick={() => handleQuickAdd(tax)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TermSelectorItem({
  node,
  taxSlug,
  level = 0,
  isMulti,
  selectedValues,
  disabled,
  onToggle,
}) {
  const isChecked = isMulti
    ? Array.isArray(selectedValues) && selectedValues.some((id) => String(id) === String(node._id))
    : String(selectedValues) === String(node._id)

  return (
    <>
      <label
        style={{ paddingLeft: `${6 + level * 16}px` }}
        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
          isChecked ? 'bg-purple-50 text-purple-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
        }`}
      >
        <input
          type={isMulti ? 'checkbox' : 'radio'}
          name={`tax_${taxSlug}`}
          checked={isChecked}
          disabled={disabled}
          onChange={() => onToggle(taxSlug, node._id, isMulti)}
          className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500 flex-shrink-0"
        />
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: node.color || '#8b5cf6' }}
        />
        <span className="truncate">{node.name}</span>
      </label>

      {node.children &&
        node.children.map((child) => (
          <TermSelectorItem
            key={child._id}
            node={child}
            taxSlug={taxSlug}
            level={level + 1}
            isMulti={isMulti}
            selectedValues={selectedValues}
            disabled={disabled}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}
