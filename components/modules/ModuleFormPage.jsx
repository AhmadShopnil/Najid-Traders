'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  ShieldAlert,
  Plus,
  Trash2,
  FolderTree,
  Folder,
  Tag,
  Boxes,
  Sparkles,
  Settings,
  X,
  FileText,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  AlignLeft,
  Check,
} from 'lucide-react'
import { useCreateModuleMutation, useUpdateModuleMutation } from '@/store/services/modulesApi'
import { useI18n } from '@/hooks/useI18n'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { slugify, generateId } from '@/lib/utils'
import { AddFieldModal } from './AddFieldModal'

const ICONS = ['📦', '📝', '🛒', '📰', '🎯', '💼', '🖼️', '🎬', '📊', '🔧', '⭐', '🗂️', '📱', '👕', '🍔', '🚀']

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  description: z.string().optional(),
  icon: z.string().default('📦'),
  settings: z.object({
    isSearchable: z.boolean().default(false),
    hasSEOFields: z.boolean().default(false),
    hasStatus: z.boolean().default(true),
    allowPublicRead: z.boolean().default(false),
  }).default({}),
})

export function ModuleFormPage({ existingModule, embedded = false }) {
  const router = useRouter()
  const { translate: t } = useI18n()
  const { can } = usePermission()

  const isEditing = !!existingModule
  const canSave = isEditing ? can('modules:update') : can('modules:create')

  const [createModule, { isLoading: creating }] = useCreateModuleMutation()
  const [updateModule, { isLoading: updating }] = useUpdateModuleMutation()
  const isLoading = creating || updating

  // In creation mode: fields and taxonomies to initialize
  const [fields, setFields] = useState([
    {
      id: generateId(),
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      unique: false,
      isListField: true,
      order: 0,
    },
  ])

  const [taxonomies, setTaxonomies] = useState([])

  // Modal states
  const [showAddField, setShowAddField] = useState(false)
  const [showAddTaxonomy, setShowAddTaxonomy] = useState(false)
  const [taxonomyForm, setTaxonomyForm] = useState({
    name: '',
    slug: '',
    hierarchical: true,
    allowMultiple: true,
    required: false,
    description: '',
    initialTerms: '',
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: existingModule
      ? { ...existingModule, settings: existingModule.settings || {} }
      : {
          icon: '📦',
          settings: {
            hasStatus: true,
            hasSEOFields: true,
            isSearchable: true,
            allowPublicRead: true,
          },
        },
  })

  const watchedIcon = watch('icon')

  async function onSubmit(data) {
    if (!canSave) return

    if (isEditing) {
      const result = await updateModule({ id: existingModule._id, ...data })
      if (!result.error) router.push('/dashboard/modules')
    } else {
      const payload = {
        ...data,
        fields,
        taxonomies: taxonomies.map((tax) => ({
          name: tax.name,
          slug: tax.slug,
          hierarchical: tax.hierarchical,
          allowMultiple: tax.allowMultiple,
          required: tax.required,
          description: tax.description,
          terms: tax.terms || [],
        })),
      }

      const result = await createModule(payload)
      if (!result.error) {
        const createdId = result.data?.data?._id
        if (createdId) {
          router.push(`/dashboard/modules/${createdId}`)
        } else {
          router.push('/dashboard/modules')
        }
      }
    }
  }

  function handleNameChange(e) {
    const val = e.target.value
    setValue('name', val)
    if (!isEditing) setValue('slug', slugify(val))
  }

  // Preset field adders
  function addFieldPreset(preset) {
    const exists = fields.some((f) => f.name === preset.name)
    if (exists) return

    setFields((prev) => [
      ...prev,
      {
        ...preset,
        id: generateId(),
        order: prev.length,
      },
    ])
  }

  function removeField(id) {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  function toggleFieldRequired(id) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f))
    )
  }

  function toggleFieldList(id) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isListField: !f.isListField } : f))
    )
  }

  // Preset taxonomy adders
  function addTaxonomyPreset(preset) {
    const slug = slugify(preset.name)
    const exists = taxonomies.some((t) => t.slug === slug)
    if (exists) return

    setTaxonomies((prev) => [
      ...prev,
      {
        ...preset,
        slug,
        terms: preset.terms || [],
      },
    ])
  }

  function removeTaxonomy(slug) {
    setTaxonomies((prev) => prev.filter((t) => t.slug !== slug))
  }

  function handleSaveCustomTaxonomy(e) {
    e.preventDefault()
    if (!taxonomyForm.name.trim()) return

    const slug = slugify(taxonomyForm.slug || taxonomyForm.name)
    const exists = taxonomies.some((t) => t.slug === slug)
    if (exists) return

    const terms = taxonomyForm.initialTerms
      ? taxonomyForm.initialTerms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name, idx) => ({
            name,
            slug: slugify(name),
            order: idx,
            color: '#8b5cf6',
          }))
      : []

    setTaxonomies((prev) => [
      ...prev,
      {
        name: taxonomyForm.name.trim(),
        slug,
        hierarchical: taxonomyForm.hierarchical,
        allowMultiple: taxonomyForm.allowMultiple,
        required: taxonomyForm.required,
        description: taxonomyForm.description.trim(),
        terms,
      },
    ])

    setShowAddTaxonomy(false)
    setTaxonomyForm({
      name: '',
      slug: '',
      hierarchical: true,
      allowMultiple: true,
      required: false,
      description: '',
      initialTerms: '',
    })
  }

  if (!canSave && !isEditing) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You do not have permission to create modules.</p>
      </div>
    )
  }

  return (
    <div>
      {!embedded && <PageHeader
        title={isEditing ? t('modules.editModule') : t('modules.createModule')}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules', href: '/dashboard/modules' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
        apiEndpoints={
          isEditing && existingModule
            ? [
                {
                  label: 'Module Schema (Admin)',
                  path: `/api/admin/modules/${existingModule._id}`,
                  isPublic: false,
                },
                {
                  label: 'Module Taxonomies (Admin)',
                  path: `/api/admin/modules/${existingModule._id}/taxonomies`,
                  isPublic: false,
                },
              ]
            : [
                {
                  label: 'All Modules (Admin)',
                  path: '/api/admin/modules',
                  isPublic: false,
                },
              ]
        }
      />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        {/* Section 1: Basic Module Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">1. Module Identity & Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the name, identifier slug, and system configuration for this dynamic content type.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('modules.moduleName')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                onChange={handleNameChange}
                disabled={!canSave}
                placeholder="e.g. Blog Posts, Products, Events"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('modules.moduleSlug')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('slug')}
                disabled={!canSave || isEditing}
                placeholder="blog-posts"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50"
              />
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('modules.description')}
            </label>
            <textarea
              {...register('description')}
              disabled={!canSave}
              rows={2}
              placeholder="Brief description of this module..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('modules.icon')}
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  disabled={!canSave}
                  onClick={() => setValue('icon', icon)}
                  className={`w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition ${
                    watchedIcon === icon
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Module Workflow & API Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'settings.hasStatus', label: 'Publish Workflow', desc: 'Enable draft/published/archived status' },
                { key: 'settings.hasSEOFields', label: 'SEO Metadata', desc: 'Add SEO title and description fields' },
                { key: 'settings.isSearchable', label: 'Full-Text Search', desc: 'Enable text index search on entries' },
                { key: 'settings.allowPublicRead', label: 'Public REST API', desc: 'Allow front-end apps to read published entries' },
              ].map(({ key, label, desc }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                >
                  <input
                    {...register(key)}
                    type="checkbox"
                    disabled={!canSave}
                    className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Initial Fields Builder (During Module Creation) */}
        {!isEditing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">2. Module Fields</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    {fields.length} Field{fields.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define what content fields this module will store (e.g., text, rich text, images, gallery, price, date).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Quick Add:
              </span>
              {[
                { label: 'Description', name: 'description', type: 'richtext', icon: AlignLeft },
                { label: 'Featured Image', name: 'image', type: 'image', icon: ImageIcon, isListField: true },
                { label: 'Photo Gallery', name: 'gallery', type: 'gallery', icon: ImageIcon },
                { label: 'Price', name: 'price', type: 'number', icon: DollarSign, isListField: true },
                { label: 'Date', name: 'date', type: 'date', icon: Calendar, isListField: true },
              ].map((preset) => {
                const Icon = preset.icon
                const isAdded = fields.some((f) => f.name === preset.name)
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={isAdded}
                    onClick={() =>
                      addFieldPreset({
                        label: preset.label,
                        name: preset.name,
                        type: preset.type,
                        required: false,
                        isListField: Boolean(preset.isListField),
                      })
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition border text-xs font-medium ${
                      isAdded
                        ? 'bg-slate-200/60 border-transparent text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {isAdded ? `✓ ${preset.label}` : `+ ${preset.label}`}
                  </button>
                )
              })}
            </div>

            {/* Fields List */}
            {fields.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 text-sm">No fields added yet. Add at least a title field.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {fields.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {field.label}
                          </span>
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                            {field.type}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                          key: {field.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={() => toggleFieldRequired(field.id)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        <span>Required</span>
                      </label>

                      <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isListField}
                          onChange={() => toggleFieldList(field.id)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        <span>List Table</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Remove Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Initial Categories & Taxonomies (During Module Creation) */}
        {!isEditing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    3. Dynamic Category & Taxonomy Systems
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    {taxonomies.length} System{taxonomies.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach custom category systems (Categories, Tags, Brands, Topics). You can connect multiple systems to this single module.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTaxonomy(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category System
              </button>
            </div>

            {/* Quick Taxonomy Presets */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-purple-600" /> Presets:
              </span>
              {[
                {
                  name: 'Categories',
                  hierarchical: true,
                  allowMultiple: true,
                  terms: [{ name: 'General', slug: 'general', color: '#8b5cf6' }],
                },
                {
                  name: 'Tags',
                  hierarchical: false,
                  allowMultiple: true,
                  terms: [{ name: 'Featured', slug: 'featured', color: '#3b82f6' }],
                },
                {
                  name: 'Brands',
                  hierarchical: false,
                  allowMultiple: false,
                  terms: [],
                },
              ].map((preset) => {
                const slug = slugify(preset.name)
                const isAdded = taxonomies.some((t) => t.slug === slug)
                return (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={isAdded}
                    onClick={() => addTaxonomyPreset(preset)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition border text-xs font-medium ${
                      isAdded
                        ? 'bg-slate-200/60 border-transparent text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                    }`}
                  >
                    {isAdded ? `✓ ${preset.name}` : `+ Add "${preset.name}" (${preset.hierarchical ? 'Tree' : 'Flat'})`}
                  </button>
                )
              })}
            </div>

            {/* Taxonomies List */}
            {taxonomies.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">No category systems configured yet.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  You can click "+ Categories" above or add a custom taxonomy. You can also configure them later.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {taxonomies.map((tax) => (
                  <div
                    key={tax.slug}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-200 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          {tax.hierarchical ? (
                            <Folder className="w-3.5 h-3.5" />
                          ) : (
                            <Tag className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900">{tax.name}</span>
                          <span className="ml-2 text-xs font-mono text-slate-400">/{tax.slug}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          {tax.hierarchical ? 'Hierarchical Tree' : 'Flat'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700">
                          {tax.allowMultiple ? 'Multi-select' : 'Single Select'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTaxonomy(tax.slug)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Remove Category System"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {tax.terms && tax.terms.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-50">
                        <span className="text-[11px] font-medium text-slate-400">Initial Items:</span>
                        {tax.terms.map((term, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 border-slate-200 text-slate-700"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: term.color || '#8b5cf6' }}
                            />
                            {term.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Bottom Bar */}
        {canSave && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-lg z-20">
            <div className="text-xs text-slate-500">
              {!isEditing && (
                <span>
                  Configured with <strong className="text-slate-800">{fields.length}</strong> field(s) and{' '}
                  <strong className="text-slate-800">{taxonomies.length}</strong> category system(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-xs"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? t('common.update') : 'Create Module & Initialize'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Custom Add Field Modal */}
      <AddFieldModal
        open={showAddField}
        onClose={() => setShowAddField(false)}
        onSubmit={(fieldData) => {
          setFields((prev) => [
            ...prev,
            {
              ...fieldData,
              id: generateId(),
              order: prev.length,
            },
          ])
          setShowAddField(false)
        }}
      />

      {/* Custom Add Taxonomy Modal */}
      {showAddTaxonomy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddTaxonomy(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Category / Taxonomy System</h3>
              <button
                type="button"
                onClick={() => setShowAddTaxonomy(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTaxonomy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taxonomy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Categories, Tags, Brands, Topics, Genres"
                  value={taxonomyForm.name}
                  onChange={(e) =>
                    setTaxonomyForm({
                      ...taxonomyForm,
                      name: e.target.value,
                      slug: slugify(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug (Identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. categories"
                  value={taxonomyForm.slug}
                  onChange={(e) =>
                    setTaxonomyForm({ ...taxonomyForm, slug: slugify(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={taxonomyForm.hierarchical}
                    onChange={(e) =>
                      setTaxonomyForm({ ...taxonomyForm, hierarchical: e.target.checked })
                    }
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Hierarchical</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Parent & sub-categories
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={taxonomyForm.allowMultiple}
                    onChange={(e) =>
                      setTaxonomyForm({ ...taxonomyForm, allowMultiple: e.target.checked })
                    }
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Allow Multiple</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Select multiple per entry
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Categories / Items (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Lifestyle, Fashion"
                  value={taxonomyForm.initialTerms}
                  onChange={(e) =>
                    setTaxonomyForm({ ...taxonomyForm, initialTerms: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  These items will be pre-created immediately inside this category system.
                </p>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaxonomy(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
                >
                  Add System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
