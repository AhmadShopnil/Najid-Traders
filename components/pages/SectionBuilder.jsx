'use client'

import { useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Image as ImageIcon, Type, AlignLeft, Hash, Layers, GripVertical
} from 'lucide-react'
import { generateId, slugify } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/ImageUpload'

const FIELD_TYPES = [
  { type: 'text', label: 'Short Text', icon: Type, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { type: 'longtext', label: 'Long Text', icon: AlignLeft, color: 'text-green-500 bg-green-50 border-green-200' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { type: 'gallery', label: 'Gallery', icon: Layers, color: 'text-orange-500 bg-orange-50 border-orange-200' },
]

const FIELD_TYPE_COLORS = {
  text: 'bg-blue-100 text-blue-700',
  longtext: 'bg-green-100 text-green-700',
  image: 'bg-purple-100 text-purple-700',
  gallery: 'bg-orange-100 text-orange-700',
}

export function SectionBuilder({ sections, section, depth = 0, onChange, onDelete, disabled = false }) {
  // Top-level array mode (when PageEditor passes sections=[...])
  if (sections !== undefined) {
    if (!Array.isArray(sections) || sections.length === 0) {
      return (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-sm text-slate-500 mb-1 font-medium">No sections added yet</p>
          <p className="text-xs text-slate-400">Click "Add Root Section" above to start building your page layout.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <SectionNode
            key={sec.id || idx}
            section={sec}
            depth={depth}
            onChange={(updated) => {
              const newSections = [...sections]
              newSections[idx] = updated
              onChange(newSections)
            }}
            onDelete={() => {
              const newSections = sections.filter((_, i) => i !== idx)
              onChange(newSections)
            }}
            disabled={disabled}
          />
        ))}
      </div>
    )
  }

  // Singular section mode
  if (!section) return null

  return (
    <SectionNode
      section={section}
      depth={depth}
      onChange={onChange}
      onDelete={onDelete}
      disabled={disabled}
    />
  )
}

function SectionNode({ section, depth = 0, onChange, onDelete, disabled = false }) {
  const [expanded, setExpanded] = useState(true)
  const [showAddField, setShowAddField] = useState(false)

  function updateSection(updates) {
    if (disabled) return
    onChange({ ...section, ...updates })
  }

  function handleNameChange(name) {
    if (disabled) return
    const autoSlug = slugify(name)
    const wasAutoSlug = section.slug === slugify(section.name || '')
    updateSection({ name, slug: wasAutoSlug ? autoSlug : (section.slug || '') })
  }

  function updateField(fieldId, updates) {
    if (disabled) return
    onChange({
      ...section,
      fields: (section.fields || []).map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    })
  }

  function addField(type) {
    if (disabled) return
    const newField = {
      id: generateId(),
      name: '',
      slug: '',
      type,
      value: type === 'gallery' ? [] : '',
    }
    onChange({ ...section, fields: [...(section.fields || []), newField] })
    setShowAddField(false)
  }

  function deleteField(fieldId) {
    if (disabled) return
    onChange({ ...section, fields: (section.fields || []).filter((f) => f.id !== fieldId) })
  }

  function handleFieldNameChange(fieldId, name) {
    if (disabled) return
    const field = (section.fields || []).find((f) => f.id === fieldId)
    if (!field) return
    const wasAutoSlug = field.slug === slugify(field.name || '')
    updateField(fieldId, { name, slug: wasAutoSlug ? slugify(name) : field.slug })
  }

  function addSubSection() {
    if (disabled) return
    const newSub = { id: generateId(), name: '', slug: '', fields: [], subSections: [] }
    onChange({ ...section, subSections: [...(section.subSections || []), newSub] })
  }

  function updateSubSection(index, updated) {
    if (disabled) return
    const newSubs = [...(section.subSections || [])]
    newSubs[index] = updated
    onChange({ ...section, subSections: newSubs })
  }

  function deleteSubSection(index) {
    if (disabled) return
    const newSubs = [...(section.subSections || [])]
    newSubs.splice(index, 1)
    onChange({ ...section, subSections: newSubs })
  }

  const depthColors = [
    'border-l-purple-400 bg-white',
    'border-l-blue-400 bg-slate-50/50',
    'border-l-green-400 bg-slate-50/80',
    'border-l-orange-400 bg-white',
  ]
  const headerColors = [
    'bg-purple-50 border-purple-100',
    'bg-blue-50 border-blue-100',
    'bg-green-50 border-green-100',
    'bg-orange-50 border-orange-100',
  ]
  const colorIdx = depth % 4

  return (
    <div
      className={cn(
        'rounded-xl border border-l-4 overflow-hidden shadow-xs',
        depthColors[colorIdx]
      )}
    >
      {/* Section Header */}
      <div className={cn('flex items-center gap-3 px-4 py-3 border-b', headerColors[colorIdx])}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md hover:bg-white/60 text-slate-500 flex-shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={section.name || ''}
                disabled={disabled}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Section Name (e.g. Hero, Features)"
                className="w-full bg-transparent font-semibold text-slate-800 placeholder-slate-400 focus:outline-none text-sm border-b border-dashed border-slate-300 focus:border-purple-400 pb-0.5 disabled:opacity-70"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/70 border border-slate-200 rounded-md px-2 py-1 min-w-[160px]">
              <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={section.slug || ''}
                disabled={disabled}
                onChange={(e) => updateSection({ slug: slugify(e.target.value) })}
                placeholder="section-slug"
                className="bg-transparent text-xs text-slate-500 font-mono focus:outline-none w-full disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">
            {section.fields?.length || 0} field{section.fields?.length !== 1 ? 's' : ''}
            {section.subSections?.length > 0 && ` · ${section.subSections.length} sub`}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section Body */}
      {expanded && (
        <div className="p-4 space-y-5">
          {/* Fields */}
          {section.fields?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Fields
              </p>
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition"
                  >
                    {/* Field Header */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-100">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide',
                          FIELD_TYPE_COLORS[field.type]
                        )}
                      >
                        {field.type}
                      </span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <input
                          type="text"
                          value={field.name || ''}
                          disabled={disabled}
                          onChange={(e) => handleFieldNameChange(field.id, e.target.value)}
                          placeholder="Field label (e.g. Title)"
                          className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none border-b border-dashed border-slate-300 focus:border-purple-400 pb-0.5 disabled:opacity-70"
                        />
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={field.slug || ''}
                            disabled={disabled}
                            onChange={(e) => updateField(field.id, { slug: slugify(e.target.value) })}
                            placeholder="field-slug"
                            className="bg-transparent text-[11px] text-slate-400 font-mono focus:outline-none w-20 disabled:opacity-70"
                          />
                        </div>
                      </div>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => deleteField(field.id)}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Field Value Input */}
                    <div className="p-3">
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={field.value || ''}
                          disabled={disabled}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          placeholder="Enter text..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition disabled:opacity-70"
                        />
                      )}
                      {field.type === 'longtext' && (
                        <textarea
                          value={field.value || ''}
                          disabled={disabled}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          placeholder="Enter long text..."
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition resize-none disabled:opacity-70"
                        />
                      )}
                      {(field.type === 'image' || field.type === 'gallery') && (
                        <ImageUpload
                          value={field.value}
                          onChange={(val) => updateField(field.id, { value: val })}
                          multiple={field.type === 'gallery'}
                          folder="pages"
                          disabled={disabled}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Field Picker */}
          {!disabled && (
            <>
              {showAddField ? (
                <div className="rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 p-4">
                  <p className="text-xs font-semibold text-purple-700 mb-3">Choose Field Type</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FIELD_TYPES.map((ft) => (
                      <button
                        key={ft.type}
                        type="button"
                        onClick={() => addField(ft.type)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center hover:scale-105 transition-transform cursor-pointer',
                          ft.color
                        )}
                      >
                        <ft.icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{ft.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddField(false)}
                    className="mt-3 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddField(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition"
                >
                  <Plus className="w-4 h-4" /> Add Field
                </button>
              )}
            </>
          )}

          {/* Sub-sections */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Sub-Sections
              </p>
              {!disabled && (
                <button
                  type="button"
                  onClick={addSubSection}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                >
                  <Plus className="w-3 h-3" /> Add Sub-Section
                </button>
              )}
            </div>

            {section.subSections?.length > 0 ? (
              <div className="space-y-3 pl-3 border-l-2 border-slate-100">
                {section.subSections.map((sub, idx) => (
                  <SectionNode
                    key={sub.id || idx}
                    section={sub}
                    depth={depth + 1}
                    onChange={(updated) => updateSubSection(idx, updated)}
                    onDelete={() => deleteSubSection(idx)}
                    disabled={disabled}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-3 bg-slate-50 rounded-lg">
                No sub-sections yet — click "Add Sub-Section" to nest content inside this section.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
