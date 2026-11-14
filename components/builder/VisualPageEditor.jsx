'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  Save, Loader2, Sparkles, Settings, Eye, ExternalLink,
  ArrowLeft, CheckCircle2, Layers, LayoutTemplate, Filter, Plus, RotateCcw
} from 'lucide-react'
import {
  useGetBuilderPageQuery,
  useCreateBuilderPageMutation,
  useUpdateBuilderPageMutation
} from '@/store/services/builderPagesApi'
import { ElementorBuilder } from './ElementorBuilder'
import { slugify, generateId, cn } from '@/lib/utils'

function createDefaultModuleFeedSections(mod) {
  const modSlug = mod?.slug || ''
  const modName = mod?.name || modSlug || 'Module'
  const modIcon = mod?.icon || '📦'
  return [
    {
      id: `sec-feed-${generateId()}`,
      name: `${modName} Feed Section`,
      slug: `${modSlug || 'module'}-feed`,
      columns: 1,
      settings: {
        bgType: 'light',
        bgColor: '#ffffff',
        padding: 'normal',
        containerWidth: 'boxed',
        columnRatio: 'equal',
        gap: 'normal',
        verticalAlign: 'top',
      },
      widgets: [
        {
          id: `w-feed-${generateId()}`,
          type: 'module_grid',
          column: 0,
          props: {
            moduleSlug: modSlug,
            title: `${modIcon} ${modName}`,
            subtitle: mod?.description || `Browse all ${modName} & categories`,
            layout: 'grid',
            columns: 3,
            limit: 9,
            categoryMode: 'all',
            categoryFilter: '',
            selectedCategories: [],
            showCategoryTabs: true,
            showSearch: true,
            showPagination: true,
            showImage: true,
            showCategoryBadge: true,
            showDate: true,
            showExcerpt: true,
            showCustomFields: true,
            readMoreText: 'Read More',
          },
        },
      ],
    },
  ]
}

function createDefaultSingleTemplateSections(mod) {
  const modSlug = mod?.slug || ''
  const modName = mod?.name || modSlug || 'Content'
  return [
    {
      id: `sec-single-${generateId()}`,
      name: `${modName} Single Detail Layout`,
      slug: `${modSlug || 'item'}-single-detail`,
      columns: 2,
      settings: {
        bgType: 'light',
        bgColor: '#ffffff',
        padding: 'normal',
        containerWidth: 'boxed',
        columnRatio: '66-33',
        gap: 'large',
        verticalAlign: 'top',
      },
      widgets: [
        {
          id: `w-detail-${generateId()}`,
          type: 'module_detail',
          column: 0,
          props: {
            moduleSlug: modSlug,
            showBreadcrumbs: true,
            showCategoryBadges: true,
            showAuthorAndDate: true,
            showShareButtons: true,
            showFeaturedImage: true,
            showExtraFields: true,
            showGallery: true,
            showRelated: true,
            relatedTitle: `Related ${modName}`,
            relatedCount: 3,
          },
        },
        {
          id: `w-sidebar-${generateId()}`,
          type: 'module_grid',
          column: 1,
          props: {
            moduleSlug: modSlug,
            title: `Latest ${modName}`,
            subtitle: '',
            layout: 'compact',
            columns: 1,
            limit: 6,
            categoryMode: 'all',
            showCategoryTabs: false,
            showSearch: false,
            showPagination: false,
            showImage: true,
            showCategoryBadge: true,
            showDate: true,
            showExcerpt: false,
            _boxPadding: 20,
            _boxRounded: 20,
            _boxBg: '#f8fafc',
          },
        },
      ],
    },
  ]
}

export function VisualPageEditor({ pageId }) {
  const router = useRouter()
  const isEditing = !!pageId

  const [tab, setTab] = useState('builder') // 'builder' | 'settings'
  const [sections, setSections] = useState([])
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [availableModules, setAvailableModules] = useState([])
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [presetInitialized, setPresetInitialized] = useState(false)
  const [slugManual, setSlugManual] = useState(isEditing)

  const { data: res, isLoading: pageLoading, isError: pageError } = useGetBuilderPageQuery(pageId, { skip: !pageId })
  const [createPage, { isLoading: creating }] = useCreateBuilderPageMutation()
  const [updatePage, { isLoading: updating }] = useUpdateBuilderPageMutation()

  const page = res?.data
  const isLoading = isEditing && pageLoading
  const isSaving = creating || updating

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      status: 'published',
      pageType: 'standard',
      targetModule: '',
      seo: { title: '', description: '', keywords: '' },
    },
  })

  const watchedTitle = watch('title')
  const watchedSlug = watch('slug')
  const watchedStatus = watch('status')
  const watchedPageType = watch('pageType')
  const watchedTargetModule = watch('targetModule')

  useEffect(() => {
    let mounted = true
    fetch('/api/public/modules')
      .then((r) => r.json())
      .then((json) => {
        if (mounted && json?.success && Array.isArray(json.data)) {
          setAvailableModules(json.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setModulesLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Handle URL query presets (?preset=single_template&module=blogs or ?preset=module_feed&module=blogs)
  useEffect(() => {
    if (isEditing || presetInitialized || !modulesLoaded || typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const preset = sp.get('preset')
    const modParam = sp.get('module')
    const slugParam = sp.get('slug')

    if (preset === 'single_template' && availableModules.length > 0) {
      const targetMod = availableModules.find((m) => m.slug === modParam) || availableModules[0]
      if (targetMod) {
        setValue('pageType', 'single_template')
        setValue('targetModule', targetMod.slug)
        setValue('title', `${targetMod.name} Single Detail Template`)
        setValue('slug', `${targetMod.slug}-detail`)
        setValue('status', 'published')
        setSections(createDefaultSingleTemplateSections(targetMod))
        setSlugManual(true)
      }
      setPresetInitialized(true)
    } else if (preset === 'module_feed' && availableModules.length > 0) {
      const targetMod = availableModules.find((m) => m.slug === modParam) || availableModules[0]
      if (targetMod) {
        setValue('pageType', 'module_feed')
        setValue('targetModule', targetMod.slug)
        setValue('title', `${targetMod.name}`)
        setValue('slug', slugParam || targetMod.slug)
        setValue('status', 'published')
        setSections(createDefaultModuleFeedSections(targetMod))
        setSlugManual(true)
      }
      setPresetInitialized(true)
    } else if (slugParam) {
      setValue('slug', slugify(slugParam))
      setSlugManual(true)
      setPresetInitialized(true)
    } else {
      setPresetInitialized(true)
    }
  }, [isEditing, presetInitialized, modulesLoaded, availableModules, setValue])

  useEffect(() => {
    if (page) {
      reset({
        title: page.title,
        slug: page.slug,
        status: page.status || 'draft',
        pageType: page.pageType || 'standard',
        targetModule: page.targetModule || '',
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

  const selectedModuleObj = useMemo(() => {
    return availableModules.find((m) => m.slug === watchedTargetModule) || null
  }, [availableModules, watchedTargetModule])

  const selectedModuleTerms = useMemo(() => {
    if (!selectedModuleObj) return []
    const list = []
    ;(selectedModuleObj.taxonomies || []).forEach((tax) => {
      ;(tax.terms || []).forEach((t) => {
        list.push({ ...t, taxSlug: tax.slug, taxName: tax.name })
      })
    })
    return list
  }, [selectedModuleObj])

  // Find primary module_grid widget on canvas (for live quick controls in module_feed mode)
  const primaryFeedWidget = useMemo(() => {
    for (const sec of sections) {
      for (const w of sec.widgets || []) {
        if (w.type === 'module_grid') return w
      }
    }
    return null
  }, [sections])

  // Find primary module_detail widget on canvas (for live quick controls in single_template mode)
  const primaryDetailWidget = useMemo(() => {
    for (const sec of sections) {
      for (const w of sec.widgets || []) {
        if (w.type === 'module_detail') return w
      }
    }
    return null
  }, [sections])

  function updatePrimaryWidgetProps(widgetType, propUpdates, targetWidgetId = null) {
    setSections((prev) => {
      let updatedFirst = false
      return prev.map((sec) => ({
        ...sec,
        widgets: (sec.widgets || []).map((w) => {
          if (w.type !== widgetType) return w
          if (targetWidgetId) {
            return w.id === targetWidgetId
              ? { ...w, props: { ...(w.props || {}), ...propUpdates } }
              : w
          }
          if (!updatedFirst) {
            updatedFirst = true
            return { ...w, props: { ...(w.props || {}), ...propUpdates } }
          }
          return w
        }),
      }))
    })
  }

  function handlePageTypeSelect(newType) {
    setValue('pageType', newType)
    const fallbackMod = selectedModuleObj || availableModules[0] || null
    const modSlug = fallbackMod?.slug || ''

    if (newType === 'module_feed') {
      if (!watchedTargetModule && modSlug) {
        setValue('targetModule', modSlug)
      }
      if (!watchedTitle && fallbackMod) {
        setValue('title', fallbackMod.name)
        setValue('slug', fallbackMod.slug)
      }
      const hasFeed = sections.some((s) => (s.widgets || []).some((w) => w.type === 'module_grid'))
      if (!hasFeed && fallbackMod) {
        setSections(createDefaultModuleFeedSections(fallbackMod))
      }
    } else if (newType === 'single_template') {
      if (!watchedTargetModule && modSlug) {
        setValue('targetModule', modSlug)
      }
      if (!watchedTitle && fallbackMod) {
        setValue('title', `${fallbackMod.name} Single Detail Template`)
        setValue('slug', `${fallbackMod.slug}-detail`)
      }
      const hasDetail = sections.some((s) => (s.widgets || []).some((w) => w.type === 'module_detail'))
      if (!hasDetail && fallbackMod) {
        setSections(createDefaultSingleTemplateSections(fallbackMod))
      }
    }
  }

  function handleTargetModuleSelect(modSlug) {
    setValue('targetModule', modSlug)
    const mod = availableModules.find((m) => m.slug === modSlug)
    if (!mod) return

    if (watchedPageType === 'module_feed') {
      if (!isEditing) {
        setValue('title', mod.name)
        setValue('slug', mod.slug)
      }
      const hasFeed = sections.some((s) => (s.widgets || []).some((w) => w.type === 'module_grid'))
      if (!hasFeed) {
        setSections(createDefaultModuleFeedSections(mod))
      } else {
        updatePrimaryWidgetProps('module_grid', {
          moduleSlug: mod.slug,
          title: `${mod.icon || '📦'} ${mod.name}`,
          subtitle: mod.description || `Browse all ${mod.name} & categories`,
          categoryFilter: '',
          selectedCategories: [],
        })
      }
    } else if (watchedPageType === 'single_template') {
      if (!isEditing) {
        setValue('title', `${mod.name} Single Detail Template`)
        setValue('slug', `${mod.slug}-detail`)
      }
      const hasDetail = sections.some((s) => (s.widgets || []).some((w) => w.type === 'module_detail'))
      if (!hasDetail) {
        setSections(createDefaultSingleTemplateSections(mod))
      } else {
        updatePrimaryWidgetProps('module_detail', {
          moduleSlug: mod.slug,
          relatedTitle: `Related ${mod.name}`,
        })
        updatePrimaryWidgetProps('module_grid', {
          moduleSlug: mod.slug,
          title: `Latest ${mod.name}`,
        })
      }
    }
  }

  function handleAddAnotherModuleSection(modSlug) {
    const mod = availableModules.find((m) => m.slug === modSlug) || selectedModuleObj || availableModules[0]
    if (!mod) return
    const newSecs = createDefaultModuleFeedSections(mod)
    setSections((prev) => [...prev, ...newSecs])
  }

  function handleTitleChange(e) {
    const title = e.target.value
    setValue('title', title, { shouldValidate: true })
    if (!isEditing && !slugManual) {
      setValue('slug', slugify(title), { shouldValidate: true })
    }
  }

  async function onSubmit(data) {
    setSaveError(null)
    setSaveSuccess(false)

    if (!data.title?.trim()) {
      setSaveError('Page title is required')
      return
    }

    const payload = {
      ...data,
      title: data.title.trim(),
      slug: data.slug ? slugify(data.slug) : slugify(data.title),
      pageType: data.pageType || 'standard',
      targetModule: data.targetModule || '',
      sections,
      seo: {
        ...data.seo,
        keywords: data.seo?.keywords
          ? data.seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
      },
    }

    try {
      if (isEditing) {
        await updatePage({ id: pageId, ...payload }).unwrap()
      } else {
        const created = await createPage(payload).unwrap()
        if (created?.data?._id) {
          router.replace(`/dashboard/builder/${created.data._id}`)
        }
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || 'Failed to save visual page')
    }
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
        <p className="text-sm">Loading visual page editor...</p>
      </div>
    )
  }

  if (isEditing && (pageError || !page)) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-red-200 max-w-lg mx-auto my-8 space-y-4">
        <p className="text-sm font-semibold text-red-700">
          Failed to load this visual page or it no longer exists.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/builder')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Page Builder
        </button>
      </div>
    )
  }

  const feedProps = primaryFeedWidget?.props || {}
  const detailProps = primaryDetailWidget?.props || {}

  return (
    <div className="space-y-4">
      {/* Editor Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-[300px] w-full lg:w-auto">
          <button
            type="button"
            onClick={() => router.push('/dashboard/builder')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition shrink-0 mt-1 sm:mt-0"
            title="Back to Page Builder"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="relative flex-1">
                <input
                  type="text"
                  {...register('title', {
                    required: 'Page title is required',
                  })}
                  onChange={handleTitleChange}
                  placeholder="Enter page title (e.g. Blogs, News, Events, Home)..."
                  className={cn(
                    'w-full font-extrabold text-slate-900 text-base sm:text-lg bg-slate-50 hover:bg-slate-100 focus:bg-white border px-3 py-1.5 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-purple-500',
                    errors.title ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400' : 'border-slate-200 focus:border-purple-600'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0',
                  watchedStatus === 'published'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                {watchedStatus}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1 ml-6">
              <span className="text-slate-400">Path: /</span>
              <input
                type="text"
                {...register('slug', {
                  required: 'Slug is required',
                  onChange: () => setSlugManual(true),
                })}
                placeholder="url-slug"
                className="bg-transparent border-b border-dashed border-slate-300 hover:border-purple-500 focus:border-purple-600 px-1 py-0.5 text-xs text-purple-700 font-semibold focus:outline-none w-48"
              />
              {watchedPageType === 'single_template' && watchedTargetModule && (
                <span className="text-[11px] font-sans bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                  Renders at: /{watchedTargetModule}/[item-slug]
                </span>
              )}
              {errors.title && (
                <span className="text-red-600 font-sans text-xs font-bold animate-pulse">
                  ⚠️ {errors.title.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          {watchedSlug && (
            <a
              href={
                watchedPageType === 'single_template' && watchedTargetModule
                  ? `/${watchedTargetModule}/latest`
                  : `/${watchedSlug}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span>Visit on Frontend</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          {/* Status Quick Switch */}
          <select
            {...register('status')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Page' : 'Publish / Create'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Purpose & Dynamic Module Quick Configurator */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-4 border border-purple-500/30 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>1. Select Page Purpose & Dynamic Module Binding</span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Build a custom page, a dynamic module listing page (with filters & categories), or a single item detail template.
            </p>
          </div>

          {/* 3 Clear Role Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageTypeSelect('standard')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border',
                watchedPageType === 'standard'
                  ? 'bg-white text-slate-900 border-white shadow-sm'
                  : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
              )}
            >
              <span>📄 Standard Custom Page</span>
            </button>

            <button
              type="button"
              onClick={() => handlePageTypeSelect('module_feed')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border',
                watchedPageType === 'module_feed'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                  : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
              )}
            >
              <span>📦 Module Feed Page (News / Blogs / Events List)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePageTypeSelect('single_template')}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border',
                watchedPageType === 'single_template'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
              )}
            >
              <span>📰 Single Item Detail Template</span>
            </button>
          </div>
        </div>

        {/* Dynamic Module Controls when module_feed is active */}
        {watchedPageType === 'module_feed' && (
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-purple-200">2. Select Module to Display:</span>
                {availableModules.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => handleTargetModuleSelect(m.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border',
                      watchedTargetModule === m.slug
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-xs'
                        : 'bg-slate-900/70 text-slate-200 border-white/15 hover:bg-slate-800'
                    )}
                  >
                    <span>{m.icon || '📦'}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAddAnotherModuleSection(watchedTargetModule)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Module Section to Canvas</span>
              </button>
            </div>

            {/* Live Filter & Category Customizer for the Primary Module Feed Widget */}
            {primaryFeedWidget && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
                {/* Filter Toggles */}
                <div className="bg-slate-900/75 rounded-xl p-3 border border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-purple-300 uppercase flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filters & Display Options</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={feedProps.showCategoryTabs !== false}
                        onChange={(e) =>
                          updatePrimaryWidgetProps('module_grid', { showCategoryTabs: e.target.checked })
                        }
                      />
                      <span>Category Filter Tabs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!feedProps.showSearch}
                        onChange={(e) =>
                          updatePrimaryWidgetProps('module_grid', { showSearch: e.target.checked })
                        }
                      />
                      <span>Search Box</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={feedProps.showPagination !== false}
                        onChange={(e) =>
                          updatePrimaryWidgetProps('module_grid', { showPagination: e.target.checked })
                        }
                      />
                      <span>Pagination</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={feedProps.showCustomFields !== false}
                        onChange={(e) =>
                          updatePrimaryWidgetProps('module_grid', { showCustomFields: e.target.checked })
                        }
                      />
                      <span>Custom Fields</span>
                    </label>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="bg-slate-900/75 rounded-xl p-3 border border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase">
                    Categories to Display
                  </div>
                  <select
                    value={feedProps.categoryMode || 'all'}
                    onChange={(e) =>
                      updatePrimaryWidgetProps('module_grid', { categoryMode: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
                  >
                    <option value="all">All Categories</option>
                    <option value="selected">Selected Multiple Categories</option>
                    <option value="specific">Single Specific Category</option>
                  </select>

                  {feedProps.categoryMode === 'specific' && selectedModuleTerms.length > 0 && (
                    <select
                      value={feedProps.categoryFilter || ''}
                      onChange={(e) =>
                        updatePrimaryWidgetProps('module_grid', { categoryFilter: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-500 rounded-lg text-xs text-white"
                    >
                      <option value="">-- Select Category --</option>
                      {selectedModuleTerms.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.name} ({t.taxName})
                        </option>
                      ))}
                    </select>
                  )}

                  {feedProps.categoryMode === 'selected' && selectedModuleTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                      {selectedModuleTerms.map((t) => {
                        const currentArr = Array.isArray(feedProps.selectedCategories)
                          ? feedProps.selectedCategories
                          : []
                        const active = currentArr.includes(t.slug)
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentArr.filter((s) => s !== t.slug)
                                : [...currentArr, t.slug]
                              updatePrimaryWidgetProps('module_grid', { selectedCategories: next })
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition',
                              active
                                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                                : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                            )}
                          >
                            {active ? '✓ ' : '+ '}
                            {t.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Layout & Columns Quick Control */}
                <div className="bg-slate-900/75 rounded-xl p-3 border border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-amber-300 uppercase">
                    Layout & Columns
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={feedProps.layout || 'grid'}
                      onChange={(e) =>
                        updatePrimaryWidgetProps('module_grid', { layout: e.target.value })
                      }
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="grid">Card Grid</option>
                      <option value="magazine">Magazine (Featured + Grid)</option>
                      <option value="list">List View</option>
                      <option value="compact">Compact</option>
                    </select>
                    <select
                      value={feedProps.columns || 3}
                      onChange={(e) =>
                        updatePrimaryWidgetProps('module_grid', {
                          columns: parseInt(e.target.value, 10),
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    💡 Click any widget on the canvas below to customize colors, typography, and advanced styles in the right inspector panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Module Controls when single_template is active */}
        {watchedPageType === 'single_template' && (
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-amber-400/30 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-amber-300">
                  2. Select Module for Single Item Detail View:
                </span>
                {availableModules.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => handleTargetModuleSelect(m.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border',
                      watchedTargetModule === m.slug
                        ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-xs'
                        : 'bg-slate-900/70 text-slate-200 border-white/15 hover:bg-slate-800'
                    )}
                  >
                    <span>{m.icon || '📦'}</span>
                    <span>{m.name}</span>
                    <span className="text-[10px] opacity-75">(/{m.slug}/[slug])</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const mod = selectedModuleObj || availableModules[0]
                  if (mod) setSections(createDefaultSingleTemplateSections(mod))
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default 2-Column Single Layout</span>
              </button>
            </div>

            {primaryDetailWidget && (
              <div className="bg-slate-900/75 rounded-xl p-3 border border-white/10 space-y-2">
                <div className="text-[11px] font-bold text-amber-300 uppercase flex items-center justify-between">
                  <span>Single Detail Page Elements (Quick Detail Customizer):</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Drag and drop any additional sections, columns, or widgets onto the canvas below to customize the full layout.
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'showBreadcrumbs', label: 'Breadcrumbs' },
                    { key: 'showCategoryBadges', label: 'Category Badges' },
                    { key: 'showAuthorAndDate', label: 'Author & Date' },
                    { key: 'showShareButtons', label: 'Share & Print Buttons' },
                    { key: 'showFeaturedImage', label: 'Featured Image' },
                    { key: 'showExtraFields', label: 'Custom Fields Table' },
                    { key: 'showGallery', label: 'Image Gallery' },
                    { key: 'showRelated', label: 'Related Items' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={detailProps[key] !== false}
                        onChange={(e) =>
                          updatePrimaryWidgetProps('module_detail', { [key]: e.target.checked })
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
          {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('builder')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 font-bold text-xs border-b-2 -mb-px transition',
            tab === 'builder'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" /> Visual Canvas
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 font-bold text-xs border-b-2 -mb-px transition',
            tab === 'settings'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Settings className="w-3.5 h-3.5" /> Page Settings & SEO
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === 'builder' ? (
        <ElementorBuilder
          sections={sections}
          onChange={setSections}
          pageSlug={watchedSlug}
          pageTitle={watchedTitle}
        />
      ) : (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Page Metadata & Dynamic Module Role</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Page Title *</label>
              <input
                {...register('title', { required: true })}
                onChange={handleTitleChange}
                placeholder="e.g. Our Products, Services, Courses, News..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Slug (Frontend Path) *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                  /
                </span>
                <input
                  {...register('slug', {
                    required: true,
                    onChange: () => setSlugManual(true),
                  })}
                  placeholder="page-slug"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-r-xl text-xs font-mono focus:outline-none focus:border-purple-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                This page will be accessible directly at http://localhost:3000/{watchedSlug || 'slug'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Type / Role
                </label>
                <select
                  {...register('pageType')}
                  onChange={(e) => handlePageTypeSelect(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                >
                  <option value="standard">📄 Standard Custom Page</option>
                  <option value="module_feed">📦 Module Feed Page (Listing & Filters)</option>
                  <option value="single_template">📰 Single Item Detail Template</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Dynamic Module
                </label>
                <select
                  {...register('targetModule')}
                  onChange={(e) => handleTargetModuleSelect(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                >
                  <option value="">-- Optional / Auto --</option>
                  {availableModules.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.icon || '📦'} {m.name} ({m.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {watchedPageType === 'single_template' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                💡 <strong>Single Detail Template Active:</strong> Whenever a visitor opens{' '}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                  /{watchedTargetModule || 'module-slug'}/[item-slug]
                </code>
                , this custom page layout will automatically render the full details for that item.
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">SEO Configuration</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meta Title</label>
              <input
                {...register('seo.title')}
                placeholder="Meta title for Google and social previews"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meta Description</label>
              <textarea
                {...register('seo.description')}
                rows={3}
                placeholder="Brief summary of the page for search results"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keywords (Comma separated)
              </label>
              <input
                {...register('seo.keywords')}
                placeholder="agency, web design, modern cms"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
