'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Save, Loader2, Plus, LayoutTemplate, Settings, Eye, ShieldAlert, ExternalLink } from 'lucide-react'
import { useGetPageQuery, useCreatePageMutation, useUpdatePageMutation } from '@/store/services/pagesApi'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionBuilder } from '@/components/pages/SectionBuilder'
import { generateId, slugify, cn } from '@/lib/utils'

export function PageEditor({ pageId }) {
  const router = useRouter()
  const { can } = usePermission()
  const isEditing = !!pageId

  const canSave = isEditing ? can('pages:update') : can('pages:create')
  const canPublish = can('pages:publish')

  const [tab, setTab] = useState('builder')
  const [sections, setSections] = useState([])
  const [slugManual, setSlugManual] = useState(isEditing)
  const [saveError, setSaveError] = useState(null)

  const { data: res, isLoading: pageLoading } = useGetPageQuery(pageId, { skip: !pageId })
  const [createPage, { isLoading: creating }] = useCreatePageMutation()
  const [updatePage, { isLoading: updating }] = useUpdatePageMutation()

  const page = res?.data
  const isLoading = isEditing && pageLoading
  const isSaving = creating || updating

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { title: '', slug: '', status: 'draft', seo: { title: '', description: '', keywords: '' } },
  })

  const watchedSlug = watch('slug')

  useEffect(() => {
    if (page) {
      reset({
        title: page.title,
        slug: page.slug,
        status: page.status || 'draft',
        seo: {
          title: page.seo?.title || '',
          description: page.seo?.description || '',
          keywords: (page.seo?.keywords || []).join(', '),
        },
      })
      setSections(page.sections || [])
      setSlugManual(true)
    }
  }, [page, reset])

  function handleTitleChange(e) {
    const title = e.target.value
    setValue('title', title)
    if (!isEditing && !slugManual) {
      setValue('slug', slugify(title))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-slate-200 rounded-lg" />
        <div className="h-72 bg-white rounded-2xl border border-slate-200" />
      </div>
    )
  }

  if (isEditing && !page) {
    return <div className="p-8 text-center text-slate-500">Page not found.</div>
  }

  if (!canSave && !isEditing) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You do not have permission to create pages.</p>
      </div>
    )
  }

  async function onSubmit(data) {
    if (!canSave) return
    setSaveError(null)

    const status = canPublish ? data.status : 'draft'
    const payload = {
      ...data,
      status,
      sections,
      seo: {
        ...data.seo,
        keywords: data.seo?.keywords ? data.seo.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      },
    }

    try {
      if (isEditing) {
        await updatePage({ id: pageId, ...payload }).unwrap()
      } else {
        await createPage(payload).unwrap()
      }
      router.push('/dashboard/pages')
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || 'Failed to save page')
    }
  }

  function handleAddRootSection() {
    if (!canSave) return
    const newSec = {
      id: generateId(),
      name: 'New Section',
      slug: 'new-section',
      data: {},
      fields: [],
      subSections: [],
    }
    setSections([...sections, newSec])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? `Edit: ${page?.title || ''}` : 'New Page'}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages', href: '/dashboard/pages' }, { label: isEditing ? 'Edit' : 'New' }]}
        apiEndpoints={
          isEditing
            ? [
                {
                  label: 'This Page (Admin)',
                  path: `/api/admin/pages/${pageId}`,
                  isPublic: false,
                  description: 'Returns raw section tree, layout, and configuration',
                },
                ...(page?.slug
                  ? [
                      {
                        label: 'Public Page Feed',
                        path: `/api/public/pages/${page.slug}`,
                        isPublic: true,
                        description: 'Public dynamic page JSON for frontend rendering',
                      },
                    ]
                  : []),
                {
                  label: 'All Pages (Admin)',
                  path: '/api/admin/pages',
                  isPublic: false,
                },
              ]
            : [
                {
                  label: 'All Pages (Admin)',
                  path: '/api/admin/pages',
                  isPublic: false,
                },
              ]
        }
        actions={
          <div className="flex items-center gap-3">
            {watchedSlug && (
              <a
                href={`/${watchedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-xl transition"
              >
                <Eye className="w-4 h-4" />
                <span>View Live Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
              Cancel
            </button>
            {canSave && (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50 shadow-xs"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditing ? 'Save Changes' : 'Create Page'}
              </button>
            )}
          </div>
        }
      />

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
          {saveError}
        </div>
      )}

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('builder')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 -mb-px transition',
            tab === 'builder' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <LayoutTemplate className="w-4 h-4" /> Layout Builder (API Schema)
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 -mb-px transition',
            tab === 'settings' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Settings className="w-4 h-4" /> Page Settings & SEO
        </button>
      </div>

      {tab === 'builder' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-800">Sections Layout (Headless API)</h3>
              <p className="text-xs text-slate-500">Compose your page data structure using infinitely nested sections and fields for API delivery</p>
            </div>
            {canSave && (
              <button
                type="button"
                onClick={handleAddRootSection}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Add Root Section
              </button>
            )}
          </div>

          <SectionBuilder sections={sections} onChange={setSections} disabled={!canSave} />
        </div>
      ) : (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Basic Info</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Page Title *</label>
              <input
                {...register('title', { required: true })}
                onChange={handleTitleChange}
                disabled={!canSave}
                placeholder="e.g. About Us"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Page Slug *</label>
              <input
                {...register('slug', { required: true })}
                onChange={(e) => {
                  setSlugManual(true)
                  setValue('slug', e.target.value)
                }}
                disabled={!canSave || isEditing}
                placeholder="about-us"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select {...register('status')} disabled={!canSave} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-50">
                <option value="draft">Draft</option>
                {canPublish && <option value="published">Published</option>}
                <option value="archived">Archived</option>
              </select>
              {!canPublish && (
                <p className="text-[11px] text-amber-600 mt-1">Publishing requires page publish privileges.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-900 border-b pb-2">SEO Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
              <input {...register('seo.title')} disabled={!canSave} placeholder="Custom SEO Title" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
              <textarea {...register('seo.description')} disabled={!canSave} rows={3} placeholder="Brief search engine description" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keywords (Comma separated)</label>
              <input {...register('seo.keywords')} disabled={!canSave} placeholder="cms, dynamic, platform" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
