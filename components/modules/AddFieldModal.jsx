'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, X } from 'lucide-react'
import { slugify } from '@/lib/utils'

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'longtext', label: 'Long Text' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (Toggle)' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'image', label: 'Image (Single)' },
  { value: 'gallery', label: 'Gallery (Multiple Images)' },
  { value: 'file', label: 'File' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'slug', label: 'Slug' },
  { value: 'keyvalue', label: 'Key-Value Specifications (Dynamic)' },
  { value: 'json', label: 'JSON' },
]

export function AddFieldModal({ open, onClose, onSubmit, loading, initialData = null }) {
  const isEditing = !!initialData

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      label: '',
      name: '',
      type: 'text',
      required: false,
      unique: false,
      isListField: true,
      optionsText: '',
      ui: { helpText: '' },
    },
  })

  useEffect(() => {
    if (!open) return
    if (initialData) {
      reset({
        label: initialData.label || '',
        name: initialData.name || '',
        type: initialData.type || 'text',
        required: !!initialData.required,
        unique: !!initialData.unique,
        isListField: initialData.isListField ?? true,
        optionsText: Array.isArray(initialData.options)
          ? initialData.options
              .map((o) => (typeof o === 'object' ? (o.value ?? o.label) : o))
              .filter(Boolean)
              .join(', ')
          : '',
        ui: { helpText: initialData.ui?.helpText || '' },
      })
    } else {
      reset({
        label: '',
        name: '',
        type: 'text',
        required: false,
        unique: false,
        isListField: true,
        optionsText: '',
        ui: { helpText: '' },
      })
    }
  }, [open, initialData, reset])

  const selectedType = watch('type')
  const showOptions = selectedType === 'select' || selectedType === 'multiselect'

  if (!open) return null

  const handleFormSubmit = (values) => {
    const { optionsText, ...rest } = values
    const payload = {
      ...rest,
      options: showOptions
        ? (optionsText || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    }
    onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{isEditing ? 'Edit Field' : 'Add New Field'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                {...register('label', { required: 'Required' })}
                onChange={(e) => {
                  setValue('label', e.target.value)
                  if (!isEditing) {
                    setValue('name', slugify(e.target.value).replace(/-/g, '_'))
                  }
                }}
                placeholder="e.g. Article Title"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Field Name (key) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Required' })}
                placeholder="article_title"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Field Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {FIELD_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {showOptions && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Options (Comma-separated)
              </label>
              <input
                {...register('optionsText')}
                placeholder="e.g. Featured, Breaking, Opinion"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-400 mt-1">Separate selectable choices with commas.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Help Text</label>
            <input
              {...register('ui.helpText')}
              placeholder="Optional helper text shown below the field"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {[
              { key: 'required', label: 'Required' },
              { key: 'unique', label: 'Unique' },
              { key: 'isListField', label: 'Show in list' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register(key)}
                  type="checkbox"
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Update Field' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
