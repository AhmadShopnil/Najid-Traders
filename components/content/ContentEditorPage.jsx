'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import {
  Loader2,
  ShieldAlert,
  AlertCircle,
  Save,
  ArrowLeft,
  Globe,
  Link2,
  Sparkles,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useGetModulesQuery } from '@/store/services/modulesApi'
import {
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
} from '@/store/services/contentsApi'
import { usePermission } from '@/hooks/usePermission'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { ContentTaxonomyPicker } from '@/components/taxonomies/ContentTaxonomyPicker'
import { cn, formatDateTime, slugify } from '@/lib/utils'
import { useEffect, useState } from 'react'

const MEDIA_TYPES = new Set(['image', 'gallery'])
const BODY_TYPES = new Set(['longtext', 'richtext', 'json'])

const SPEC_PRESETS = [
  {
    label: 'Dress / Three-Piece / Saree',
    keys: ['Fabric', 'Work / Embroidery', 'Piece Count', 'Color / Assortment'],
  },
  {
    label: 'Spices / Moshola',
    keys: ['Grade', 'Packaging', 'Shelf Life', 'Weight / Sack'],
  },
  {
    label: 'China / Water Pots',
    keys: ['Capacity', 'Material', 'Insulation', 'Box Packaging'],
  },
]

function KeyValueFieldInput({ value, onChange, disabled }) {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.entries(value).map(([k, v]) => ({ key: k, value: String(v ?? '') }))
      : []

  const updateRow = (idx, patch) => {
    const next = rows.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    onChange(next)
  }

  const addRow = (key = '') => {
    onChange([...rows, { key, value: '' }])
  }

  const removeRow = (idx) => {
    onChange(rows.filter((_, i) => i !== idx))
  }

  const applyPreset = (keys) => {
    const existing = new Set(rows.map((r) => String(r.key || '').trim().toLowerCase()))
    const additions = keys
      .filter((k) => !existing.has(k.toLowerCase()))
      .map((k) => ({ key: k, value: '' }))
    if (additions.length > 0) {
      onChange([...rows, ...additions])
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/90 bg-[#f8f9fc] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            Category Presets:
          </span>
          {SPEC_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(preset.keys)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-[#5b5ce6] hover:text-[#5b5ce6] transition disabled:opacity-50"
            >
              + {preset.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => addRow('')}
          className="inline-flex items-center gap-1 rounded-lg bg-[#5b5ce6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4c4dd4] transition disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Attribute
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          No category-specific attributes yet. Pick a preset above or click &ldquo;Add Attribute&rdquo;.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                disabled={disabled}
                value={row.key || ''}
                onChange={(e) => updateRow(idx, { key: e.target.value })}
                placeholder="Attribute (e.g. Fabric, Capacity)"
                className="sm:col-span-5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
              />
              <input
                type="text"
                disabled={disabled}
                value={row.value || ''}
                onChange={(e) => updateRow(idx, { value: e.target.value })}
                placeholder="Value (e.g. 100% Cotton Lawn, 2.0 Liters)"
                className="sm:col-span-6 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeRow(idx)}
                className="sm:col-span-1 inline-flex items-center justify-center h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50"
                title="Remove attribute"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_PILLS = [
  { value: 'draft', label: 'Draft', dot: 'bg-amber-500', active: 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs' },
  { value: 'published', label: 'Published', dot: 'bg-emerald-500', active: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' },
  { value: 'archived', label: 'Archived', dot: 'bg-slate-400', active: 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs' },
]

export function ContentEditorPage({ moduleSlug, contentId }) {
  const router = useRouter()
  const { can } = usePermission()
  const isEditing = !!contentId

  const canPublish = can('content:publish')
  const canSave = isEditing ? can('content:update') : can('content:create')

  const { data: modulesRes, isLoading: moduleLoading } = useGetModulesQuery()
  const module = modulesRes?.data?.find((m) => m.slug === moduleSlug)

  const { data: contentRes, isLoading: contentLoading } = useGetContentQuery(contentId, {
    skip: !contentId,
  })
  const content = contentRes?.data

  const [createContent, { isLoading: creating }] = useCreateContentMutation()
  const [updateContent, { isLoading: updating }] = useUpdateContentMutation()

  const isLoading = moduleLoading || (isEditing && contentLoading)
  const isSaving = creating || updating

  const [taxonomies, setTaxonomies] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [slugOpen, setSlugOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: 'draft',
      data: {},
      seo: {},
    },
  })

  const watchedStatus = watch('status') || 'draft'
  const watchedData = watch('data') || {}
  const watchedSeoTitle = watch('seo.title') || ''
  const watchedSeoDesc = watch('seo.description') || ''

  useEffect(() => {
    if (content) {
      reset({
        data: content.data || {},
        status: content.status || 'draft',
        seo: content.seo || {},
      })
      setTaxonomies(content.taxonomies || {})
    }
  }, [content, reset])

  if (isLoading) {
    return (
      <div className="w-full space-y-5 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-slate-200/80" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-[520px] bg-white rounded-2xl border border-slate-200/80" />
          <div className="w-full lg:w-[360px] h-96 bg-white rounded-2xl border border-slate-200/80" />
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <p className="text-slate-700 font-semibold">Module not found</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/modules')}
          className="mt-4 px-4 py-2 text-sm font-semibold text-[#5b5ce6] bg-indigo-50 rounded-xl hover:bg-indigo-100 transition"
        >
          Back to Modules
        </button>
      </div>
    )
  }

  if (module.isActive === false) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
          {module.icon || '📦'}
        </div>
        <h2 className="text-lg font-bold text-slate-900">{module.name} is Currently Inactive</h2>
        <p className="text-sm text-slate-500">
          This module has been deactivated. Content cannot be created or edited while it is inactive.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (isEditing && !content) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-slate-200/80">
        <p className="text-slate-600 font-medium">Content entry not found</p>
      </div>
    )
  }

  if (!canSave && !isEditing) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 text-center bg-white rounded-2xl border border-red-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You do not have permission to create content.</p>
      </div>
    )
  }

  async function onSubmit(formData) {
    if (!canSave) return
    setSaveError(null)

    const status = canPublish ? formData.status || 'draft' : 'draft'
    const cleanData = { ...(formData.data || {}) }
    for (const [key, val] of Object.entries(cleanData)) {
      if (typeof val === 'number' && Number.isNaN(val)) {
        delete cleanData[key]
      }
    }

    const payload = {
      moduleId: module._id,
      ...formData,
      data: cleanData,
      taxonomies,
      status,
    }

    try {
      if (isEditing) {
        await updateContent({ id: contentId, ...payload }).unwrap()
      } else {
        await createContent(payload).unwrap()
      }
      router.push(`/dashboard/content/${moduleSlug}`)
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || 'Failed to save entry')
    }
  }

  const allFields = module.fields || []
  const primaryField =
    allFields.find((f) => ['title', 'headline', 'name'].includes(f.name) && !MEDIA_TYPES.has(f.type) && !BODY_TYPES.has(f.type)) ||
    allFields.find((f) => f.type === 'text' && f.name !== 'slug') ||
    null

  const remainingFields = allFields.filter((f) => f.name !== primaryField?.name && f.name !== 'slug')
  const bodyFields = remainingFields.filter((f) => BODY_TYPES.has(f.type))
  const mediaFields = remainingFields.filter((f) => MEDIA_TYPES.has(f.type))
  const attributeFields = remainingFields.filter((f) => !BODY_TYPES.has(f.type) && !MEDIA_TYPES.has(f.type))
  const explicitSlugField = allFields.find((f) => f.name === 'slug')

  const primaryTitleValue = primaryField ? watchedData?.[primaryField.name] || '' : ''
  const watchedSlug = watchedData?.slug || ''
  const previewSlug = watchedSlug || (primaryTitleValue ? slugify(primaryTitleValue) : 'your-item-slug')

  const requiredFields = allFields.filter((f) => f.required)
  const completedRequiredCount = requiredFields.filter((f) => {
    const val = watchedData?.[f.name]
    if (Array.isArray(val)) return val.length > 0
    return val !== undefined && val !== null && String(val).trim() !== ''
  }).length

  function renderFieldInput(field, { hero = false } = {}) {
    const optionsList = Array.isArray(field.options)
      ? field.options.map((o) =>
          typeof o === 'object'
            ? { value: o.value ?? o.label, label: o.label ?? o.value }
            : { value: String(o), label: String(o) }
        )
      : []

    if (field.type === 'keyvalue') {
      return (
        <Controller
          name={`data.${field.name}`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <KeyValueFieldInput value={value} onChange={onChange} disabled={!canSave} />
          )}
        />
      )
    }

    if (field.type === 'image' || field.type === 'gallery') {
      return (
        <Controller
          name={`data.${field.name}`}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { value, onChange } }) => (
            <ImageUpload
              value={value}
              onChange={onChange}
              multiple={field.type === 'gallery'}
              folder={module.slug}
              disabled={!canSave}
            />
          )}
        />
      )
    }

    if (field.type === 'richtext') {
      return (
        <Controller
          name={`data.${field.name}`}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              value={value ?? ''}
              onChange={onChange}
              disabled={!canSave}
              placeholder={`Write detailed ${field.label.toLowerCase()} here...`}
            />
          )}
        />
      )
    }

    if (field.type === 'longtext' || field.type === 'json') {
      return (
        <textarea
          {...register(`data.${field.name}`, { required: field.required })}
          disabled={!canSave}
          rows={field.type === 'json' ? 6 : 4}
          placeholder={`Write ${field.label.toLowerCase()} here...`}
          className={cn(
            'w-full px-4 py-3 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D253F]/20 focus:border-[#0D253F] transition leading-relaxed disabled:bg-slate-50',
            field.type === 'json' && 'font-mono text-xs'
          )}
        />
      )
    }

    if (field.type === 'select' && optionsList.length > 0) {
      return (
        <select
          {...register(`data.${field.name}`, { required: field.required })}
          disabled={!canSave}
          className="w-full px-3.5 py-2.5 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition disabled:bg-slate-50"
        >
          <option value="">Select {field.label}...</option>
          {optionsList.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'boolean') {
      return (
        <Controller
          name={`data.${field.name}`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <button
              type="button"
              role="switch"
              aria-checked={!!value}
              disabled={!canSave}
              onClick={() => onChange(!value)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-[#f8f9fc] hover:bg-white transition cursor-pointer disabled:opacity-60"
            >
              <span className="text-sm font-medium text-slate-700">
                {value ? 'Enabled' : 'Disabled'}
              </span>
              <span
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                  value ? 'bg-[#5b5ce6]' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow-xs transition-all',
                    value ? 'left-6' : 'left-1'
                  )}
                />
              </span>
            </button>
          )}
        />
      )
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          step="any"
          disabled={!canSave}
          placeholder="0"
          {...register(`data.${field.name}`, {
            required: field.required,
            setValueAs: (v) =>
              v === '' || v === null || v === undefined ? undefined : Number(v),
          })}
          className="w-full px-3.5 py-2.5 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition disabled:bg-slate-50"
        />
      )
    }

    if (hero) {
      return (
        <input
          type="text"
          disabled={!canSave}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
          {...register(`data.${field.name}`, { required: field.required })}
          className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 placeholder-slate-300 bg-transparent border-0 border-b-2 border-slate-100 focus:border-[#5b5ce6] pb-3 focus:outline-none transition disabled:opacity-70"
        />
      )
    }

    return (
      <input
        type={
          field.type === 'date'
            ? 'date'
            : field.type === 'datetime'
              ? 'datetime-local'
              : field.type === 'email'
                ? 'email'
                : field.type === 'url'
                  ? 'url'
                  : 'text'
        }
        disabled={!canSave}
        placeholder={`Enter ${field.label.toLowerCase()}...`}
        {...register(`data.${field.name}`, { required: field.required })}
        className="w-full px-3.5 py-2.5 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition disabled:bg-slate-50"
      />
    )
  }

  return (
    <div className="w-full pb-12">
      <form id="content-editor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full-Width Top Studio Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-[#5b5ce6] transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link href={`/dashboard/content/${moduleSlug}`} className="hover:text-[#5b5ce6] transition">
                {module.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-700 font-semibold">
                {isEditing ? 'Edit Entry' : 'New Entry'}
              </span>
            </nav>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center text-base flex-shrink-0">
                {module.icon || '📄'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                {isEditing ? `Edit ${module.name}` : `New ${module.name}`}
              </h1>
              {module.settings?.hasStatus && (
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-[#f8f9fc] border-slate-200 text-slate-600 capitalize">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      watchedStatus === 'published'
                        ? 'bg-emerald-500'
                        : watchedStatus === 'archived'
                          ? 'bg-slate-400'
                          : 'bg-amber-500'
                    )}
                  />
                  {watchedStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <ApiEndpointsBadge
              endpoints={
                isEditing
                  ? [
                      {
                        label: 'This Entry (Admin)',
                        path: `/api/admin/contents/${contentId}`,
                        isPublic: false,
                        description: 'Returns raw entry record with author and module metadata',
                      },
                      {
                        label: 'This Entry (Public)',
                        path: `/api/public/${moduleSlug}/${content?.data?.slug || contentId}`,
                        isPublic: true,
                        description: 'Public single entry JSON (returns only if published)',
                      },
                    ]
                  : [
                      {
                        label: 'Module Content Feed (Public)',
                        path: `/api/public/${moduleSlug}`,
                        isPublic: true,
                      },
                    ]
              }
            />
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{canSave ? 'Cancel' : 'Back'}</span>
            </button>
            {canSave && (
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 disabled:opacity-50 transition cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : 'Create Entry'}</span>
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="px-4 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{saveError}</span>
          </div>
        )}

        {/* Full-Width Workspace: Fluid Main Canvas + Fixed Inspector */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Left Main Document Canvas (expands full remaining width) */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* Document Hero + Permalink + Body */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] p-6 sm:p-8 space-y-6">
              {primaryField && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {primaryField.label}{' '}
                      {primaryField.required && <span className="text-rose-500">*</span>}
                    </label>
                  </div>
                  {renderFieldInput(primaryField, { hero: true })}
                  {primaryField.ui?.helpText && (
                    <p className="text-xs text-slate-400 mt-1.5">{primaryField.ui.helpText}</p>
                  )}
                  {errors.data?.[primaryField.name] && (
                    <p className="text-rose-500 text-xs font-medium mt-1.5">
                      {primaryField.label} is required
                    </p>
                  )}
                </div>
              )}

              {/* Compact Inline Permalink Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#f8f9fc] border border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0 text-xs">
                  <Link2 className="w-3.5 h-3.5 text-[#5b5ce6] flex-shrink-0" />
                  <span className="text-slate-400 font-medium flex-shrink-0">Permalink:</span>
                  <span className="font-mono text-slate-600 truncate">
                    /{module.slug}/{previewSlug}
                  </span>
                </div>
                {canSave && (
                  <button
                    type="button"
                    onClick={() => setSlugOpen((prev) => !prev)}
                    className="text-xs font-semibold text-[#5b5ce6] hover:underline cursor-pointer flex-shrink-0"
                  >
                    {slugOpen ? 'Done' : 'Edit Slug'}
                  </button>
                )}
              </div>

              {(slugOpen || explicitSlugField?.required || errors.data?.slug) && (
                <div className="p-4 rounded-xl bg-[#f8f9fc] border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {explicitSlugField?.label || 'URL Slug'}
                      {explicitSlugField?.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    {primaryTitleValue && canSave && (
                      <button
                        type="button"
                        onClick={() => setValue('data.slug', slugify(primaryTitleValue))}
                        className="text-[11px] font-semibold text-[#5b5ce6] hover:underline cursor-pointer"
                      >
                        Generate from {primaryField?.label || 'title'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#5b5ce6]/25 focus-within:border-[#5b5ce6]">
                    <span className="px-3 py-2 bg-slate-50 border-r border-slate-200 text-xs text-slate-500 font-mono">
                      /{module.slug}/
                    </span>
                    <input
                      type="text"
                      disabled={!canSave}
                      placeholder="auto-generated-slug"
                      {...register('data.slug', { required: explicitSlugField?.required })}
                      className="w-full px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                  {errors.data?.slug && (
                    <p className="text-rose-500 text-xs font-medium">Slug is required</p>
                  )}
                </div>
              )}

              {/* Body / Rich Text Fields */}
              {bodyFields.length > 0 && (
                <div className="space-y-5 pt-2">
                  {bodyFields.map((field) => (
                    <div key={field.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {field.type}
                        </span>
                      </div>
                      {renderFieldInput(field)}
                      {field.ui?.helpText && (
                        <p className="text-xs text-slate-400 mt-1.5">{field.ui.helpText}</p>
                      )}
                      {errors.data?.[field.name] && (
                        <p className="text-rose-500 text-xs font-medium mt-1.5">
                          {field.label} is required
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Structured Attributes Section */}
            {attributeFields.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-[#fafbfe] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5b5ce6] flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">Attributes & Details</h2>
                    <p className="text-xs text-slate-400">Structured fields configured for {module.name}</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {attributeFields.map((field) => (
                    <div
                      key={field.name}
                      className={field.type === 'keyvalue' ? 'sm:col-span-2 xl:col-span-3' : ''}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 truncate">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0">
                          {field.type}
                        </span>
                      </div>
                      {renderFieldInput(field)}
                      {field.ui?.helpText && (
                        <p className="text-xs text-slate-400 mt-1.5">{field.ui.helpText}</p>
                      )}
                      {errors.data?.[field.name] && (
                        <p className="text-rose-500 text-xs font-medium mt-1.5">
                          {field.label} is required
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media & Visual Assets Section */}
            {mediaFields.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-[#fafbfe] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">Media & Visuals</h2>
                    <p className="text-xs text-slate-400">Upload featured images or galleries</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediaFields.map((field) => (
                    <div key={field.name} className={field.type === 'gallery' ? 'md:col-span-2' : ''}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {field.type}
                        </span>
                      </div>
                      {renderFieldInput(field)}
                      {field.ui?.helpText && (
                        <p className="text-xs text-slate-400 mt-1.5">{field.ui.helpText}</p>
                      )}
                      {errors.data?.[field.name] && (
                        <p className="text-rose-500 text-xs font-medium mt-1.5">
                          {field.label} is required
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO & Search Preview */}
            {module.settings?.hasSEOFields && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-[#fafbfe] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">SEO & Search Preview</h2>
                    <p className="text-xs text-slate-400">Optimize how this entry appears on search engines</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">Meta Title</label>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {watchedSeoTitle.length}/60
                        </span>
                      </div>
                      <input
                        {...register('seo.title')}
                        disabled={!canSave}
                        placeholder="Recommended 50-60 characters..."
                        className="w-full px-3.5 py-2.5 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">Meta Description</label>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {watchedSeoDesc.length}/160
                        </span>
                      </div>
                      <textarea
                        {...register('seo.description')}
                        disabled={!canSave}
                        rows={3}
                        placeholder="Write a concise summary for search engines..."
                        className="w-full px-3.5 py-2.5 bg-[#f8f9fc] focus:bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Live Google Search Snippet Preview */}
                  <div className="p-5 rounded-2xl bg-[#f8f9fc] border border-slate-200/80 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Live Search Snippet
                    </p>
                    <p className="text-xs font-medium text-emerald-700 truncate">
                      yoursite.com/{module.slug}/{previewSlug}
                    </p>
                    <p className="text-base font-semibold text-[#1a0dab] truncate">
                      {watchedSeoTitle || primaryTitleValue || `${module.name} Entry Title`}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {watchedSeoDesc || 'Add a meta description to customize how this entry appears in search results.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Fixed-Width Inspector Panel */}
          <div className="w-full lg:w-[340px] xl:w-[370px] flex-shrink-0 space-y-5 lg:sticky lg:top-4">
            {/* Publishing Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-[#fafbfe] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5b5ce6]" />
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight">Publishing</h2>
                </div>
                {isEditing && content?.updatedAt && (
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(content.updatedAt)}
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {module.settings?.hasStatus ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Status</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5f6fb] rounded-xl border border-slate-200/70">
                      {STATUS_PILLS.map((opt) => {
                        const isDisabledOpt = opt.value === 'published' && !canPublish
                        const selected = watchedStatus === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!canSave || isDisabledOpt}
                            onClick={() => setValue('status', opt.value)}
                            className={cn(
                              'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed',
                              selected
                                ? opt.active
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot)} />
                            <span>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    {!canPublish && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
                        You do not have permission to publish directly. Entries are saved as drafts.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-[#f8f9fc] border border-slate-200/70 rounded-xl p-3">
                    Status workflow is disabled for this module.
                  </p>
                )}

                {requiredFields.length > 0 && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#f8f9fc] border border-slate-200/70 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Required Fields
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {completedRequiredCount} / {requiredFields.length}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {canSave && (
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 disabled:opacity-50 transition cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isEditing ? 'Save Changes' : 'Create Entry'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-2 px-4 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    {canSave ? 'Discard & Go Back' : 'Back'}
                  </button>
                </div>
              </div>
            </div>

            {/* Taxonomies & Categories */}
            <ContentTaxonomyPicker
              moduleId={module._id}
              value={taxonomies}
              onChange={setTaxonomies}
              disabled={!canSave}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
