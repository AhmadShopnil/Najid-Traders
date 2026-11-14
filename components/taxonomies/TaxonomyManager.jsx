'use client'

import { useState } from 'react'
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Folder,
  Tag,
  Check,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import {
  useGetModuleTaxonomiesQuery,
  useCreateTaxonomyMutation,
  useUpdateTaxonomyMutation,
  useDeleteTaxonomyMutation,
  useAddTaxonomyTermMutation,
  useUpdateTaxonomyTermMutation,
  useDeleteTaxonomyTermMutation,
} from '@/store/services/taxonomiesApi'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiEndpointsBadge } from '@/components/ui/ApiEndpointsBadge'
import { slugify } from '@/lib/utils'

const PRESET_COLORS = [
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
]

export function TaxonomyManager({ module }) {
  const moduleId = module?._id
  const { data: res, isLoading } = useGetModuleTaxonomiesQuery(moduleId, { skip: !moduleId })
  const taxonomies = res?.data || []

  const [createTaxonomy, { isLoading: creatingTax }] = useCreateTaxonomyMutation()
  const [updateTaxonomy, { isLoading: updatingTax }] = useUpdateTaxonomyMutation()
  const [deleteTaxonomy, { isLoading: deletingTax }] = useDeleteTaxonomyMutation()

  const [addTerm, { isLoading: addingTerm }] = useAddTaxonomyTermMutation()
  const [updateTerm, { isLoading: updatingTerm }] = useUpdateTaxonomyTermMutation()
  const [deleteTerm, { isLoading: deletingTerm }] = useDeleteTaxonomyTermMutation()

  // State for active taxonomy tab
  const [activeTaxId, setActiveTaxId] = useState(null)
  const currentTaxonomy = taxonomies.find((t) => t._id === (activeTaxId || taxonomies[0]?._id)) || taxonomies[0]

  // Modal / Form states for Taxonomy
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [taxForm, setTaxForm] = useState({
    name: '',
    slug: '',
    hierarchical: true,
    allowMultiple: true,
    required: false,
    description: '',
  })

  // Modal / Form states for Term
  const [showTermModal, setShowTermModal] = useState(false)
  const [editingTerm, setEditingTerm] = useState(null)
  const [termForm, setTermForm] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    color: '#8b5cf6',
  })

  // Confirm delete states
  const [confirmDeleteTax, setConfirmDeleteTax] = useState(null)
  const [confirmDeleteTerm, setConfirmDeleteTerm] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [taxSlugTouched, setTaxSlugTouched] = useState(false)
  const [termSlugTouched, setTermSlugTouched] = useState(false)

  function openCreateTaxModal() {
    setEditingTax(null)
    setModalError(null)
    setTaxSlugTouched(false)
    setTaxForm({
      name: '',
      slug: '',
      hierarchical: true,
      allowMultiple: true,
      required: false,
      description: '',
    })
    setShowTaxModal(true)
  }

  function openEditTaxModal(tax) {
    setEditingTax(tax)
    setModalError(null)
    setTaxSlugTouched(true)
    setTaxForm({
      name: tax.name,
      slug: tax.slug,
      hierarchical: tax.hierarchical,
      allowMultiple: tax.allowMultiple,
      required: tax.required,
      description: tax.description || '',
    })
    setShowTaxModal(true)
  }

  async function handleSaveTaxonomy(e) {
    e.preventDefault()
    if (!taxForm.name.trim()) return
    setModalError(null)
    setErrorMsg(null)

    try {
      if (editingTax) {
        await updateTaxonomy({
          moduleId,
          taxId: editingTax._id,
          ...taxForm,
        }).unwrap()
      } else {
        const created = await createTaxonomy({
          moduleId,
          ...taxForm,
        }).unwrap()
        if (created?.data?._id) {
          setActiveTaxId(created.data._id)
        }
      }
      setShowTaxModal(false)
    } catch (err) {
      setModalError(err?.data?.message || err?.message || 'Failed to save category system')
    }
  }

  async function handleDeleteTaxonomy() {
    if (!confirmDeleteTax) return
    setErrorMsg(null)
    try {
      await deleteTaxonomy({ moduleId, taxId: confirmDeleteTax._id }).unwrap()
      if (activeTaxId === confirmDeleteTax._id) {
        setActiveTaxId(null)
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to delete category system')
    } finally {
      setConfirmDeleteTax(null)
    }
  }

  function openCreateTermModal() {
    setEditingTerm(null)
    setModalError(null)
    setTermSlugTouched(false)
    setTermForm({
      name: '',
      slug: '',
      parentId: '',
      description: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    })
    setShowTermModal(true)
  }

  function openEditTermModal(term) {
    setEditingTerm(term)
    setModalError(null)
    setTermSlugTouched(true)
    setTermForm({
      name: term.name,
      slug: term.slug,
      parentId: term.parentId || '',
      description: term.description || '',
      color: term.color || '#8b5cf6',
    })
    setShowTermModal(true)
  }

  async function handleSaveTerm(e) {
    e.preventDefault()
    if (!termForm.name.trim() || !currentTaxonomy) return
    setModalError(null)
    setErrorMsg(null)

    try {
      if (editingTerm) {
        await updateTerm({
          moduleId,
          taxId: currentTaxonomy._id,
          termId: editingTerm._id,
          ...termForm,
          parentId: termForm.parentId || null,
        }).unwrap()
      } else {
        await addTerm({
          moduleId,
          taxId: currentTaxonomy._id,
          ...termForm,
          parentId: termForm.parentId || null,
        }).unwrap()
      }
      setShowTermModal(false)
    } catch (err) {
      setModalError(err?.data?.message || err?.message || 'Failed to save category term')
    }
  }

  async function handleDeleteTerm() {
    if (!confirmDeleteTerm || !currentTaxonomy) return
    setErrorMsg(null)
    try {
      await deleteTerm({
        moduleId,
        taxId: currentTaxonomy._id,
        termId: confirmDeleteTerm._id,
      }).unwrap()
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to delete category term')
    } finally {
      setConfirmDeleteTerm(null)
    }
  }

  // Build hierarchical tree for terms
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

  const terms = currentTaxonomy?.terms || []
  const termTree = currentTaxonomy?.hierarchical ? buildTermTree(terms) : terms

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
        Loading categories...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Dynamic Module Taxonomies</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {taxonomies.length} Category System{taxonomies.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Create dynamic, multi-tier categories, tags, or brands for this module with hierarchical parent-child trees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentTaxonomy && (
            <ApiEndpointsBadge
              variant="button"
              title="Taxonomy APIs"
              endpoints={[
                {
                  label: 'Module Taxonomies (Admin)',
                  path: `/api/admin/modules/${moduleId}/taxonomies`,
                  isPublic: false,
                },
                {
                  label: 'Public Taxonomies Feed',
                  path: `/api/public/${module?.slug}/taxonomies`,
                  isPublic: true,
                  description: 'All categories and nested terms for client applications',
                },
              ]}
            />
          )}

          <button
            onClick={openCreateTaxModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Category System
          </button>
        </div>
      </div>

      {taxonomies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FolderTree className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Category Systems Configured</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Add your first category system (like "Categories", "Tags", "Brands", or "Genres") to organize content entries in this module.
          </p>
          <button
            onClick={openCreateTaxModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Category System
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs for Taxonomies */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Taxonomy Systems
            </p>
            {taxonomies.map((tax) => {
              const isActive = (currentTaxonomy?._id === tax._id)
              return (
                <div
                  key={tax._id}
                  onClick={() => setActiveTaxId(tax._id)}
                  className={`group p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tax.hierarchical ? (
                        <Folder className="w-3.5 h-3.5" />
                      ) : (
                        <Tag className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{tax.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {tax.terms?.length || 0} items · {tax.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditTaxModal(tax)
                      }}
                      className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                      title="Edit Category System"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteTax(tax)
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Delete Category System"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              onClick={openCreateTaxModal}
              className="w-full mt-2 py-2 px-3 border border-dashed border-slate-300 hover:border-purple-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-600 flex items-center justify-center gap-1.5 transition bg-white"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Taxonomy
            </button>
          </div>

          {/* Main Area: Term Tree & Management */}
          {currentTaxonomy && (
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{currentTaxonomy.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      slug: {currentTaxonomy.slug}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {currentTaxonomy.hierarchical ? 'Hierarchical Tree' : 'Flat List'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {currentTaxonomy.allowMultiple ? 'Multi-select' : 'Single Select'}
                    </span>
                  </div>
                  {currentTaxonomy.description && (
                    <p className="text-sm text-slate-500 mt-1">{currentTaxonomy.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditTaxModal(currentTaxonomy)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
                  >
                    Edit Settings
                  </button>
                  <button
                    onClick={openCreateTermModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add {currentTaxonomy.name.slice(0, -1) || 'Category'}
                  </button>
                </div>
              </div>

              {/* Terms List / Tree */}
              {terms.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500 text-sm">No items in {currentTaxonomy.name} yet.</p>
                  <button
                    onClick={openCreateTermModal}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First {currentTaxonomy.name.slice(0, -1) || 'Item'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories & Terms ({terms.length})
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {currentTaxonomy.hierarchical
                      ? termTree.map((node) => (
                          <TermTreeNode
                            key={node._id}
                            node={node}
                            level={0}
                            onEdit={openEditTermModal}
                            onDelete={(item) => setConfirmDeleteTerm(item)}
                            onAddChild={(parent) => {
                              setEditingTerm(null)
                              setModalError(null)
                              setTermSlugTouched(false)
                              setTermForm({
                                name: '',
                                slug: '',
                                parentId: parent._id,
                                description: '',
                                color: parent.color || '#8b5cf6',
                              })
                              setShowTermModal(true)
                            }}
                          />
                        ))
                      : terms.map((item) => (
                          <div
                            key={item._id}
                            className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color || '#8b5cf6' }}
                              />
                              <div>
                                <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                                <span className="ml-2 text-xs font-mono text-slate-400">/{item.slug}</span>
                                {item.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditTermModal(item)}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteTerm(item)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Taxonomy Modal (Create / Edit Category System) */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowTaxModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTax ? 'Edit Category System' : 'Create Category System'}
              </h3>
              <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxonomy} className="space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-2.5">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taxonomy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Categories, Tags, Brands, Topics"
                  value={taxForm.name}
                  onChange={(e) => {
                    const nextName = e.target.value
                    setTaxForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: taxSlugTouched ? prev.slug : slugify(nextName),
                    }))
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug (Identifier)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={taxForm.slug}
                  onChange={(e) => {
                    const nextSlug = e.target.value
                    setTaxSlugTouched(nextSlug.trim().length > 0)
                    setTaxForm((prev) => ({ ...prev, slug: nextSlug }))
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={taxForm.hierarchical}
                    onChange={(e) => setTaxForm({ ...taxForm, hierarchical: e.target.checked })}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Hierarchical</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Supports parent & nested child categories
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={taxForm.allowMultiple}
                    onChange={(e) => setTaxForm({ ...taxForm, allowMultiple: e.target.checked })}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Allow Multiple</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Allow selecting more than one category per entry
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={taxForm.description}
                  onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
                  placeholder="Describe what this category system classifies..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTax || updatingTax}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
                >
                  {(creatingTax || updatingTax) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTax ? 'Update System' : 'Create System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Term Modal (Create / Edit Category Term) */}
      {showTermModal && currentTaxonomy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowTermModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTerm ? `Edit in ${currentTaxonomy.name}` : `Add to ${currentTaxonomy.name}`}
              </h3>
              <button onClick={() => setShowTermModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerm} className="space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-2.5">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technology, Mobile, Gaming"
                  value={termForm.name}
                  onChange={(e) => {
                    const nextName = e.target.value
                    setTermForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: termSlugTouched ? prev.slug : slugify(nextName),
                    }))
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated from name"
                  value={termForm.slug}
                  onChange={(e) => {
                    const nextSlug = e.target.value
                    setTermSlugTouched(nextSlug.trim().length > 0)
                    setTermForm((prev) => ({ ...prev, slug: nextSlug }))
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {currentTaxonomy.hierarchical && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={termForm.parentId}
                    onChange={(e) => setTermForm({ ...termForm, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">— None (Top-level Category) —</option>
                    {terms
                      .filter((t) => !editingTerm || t._id !== editingTerm._id)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.parentId ? '— ' : ''}{t.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setTermForm({ ...termForm, color: c })}
                      className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {termForm.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={termForm.color}
                    onChange={(e) => setTermForm({ ...termForm, color: e.target.value })}
                    className="w-7 h-7 p-0 rounded border cursor-pointer ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={termForm.description}
                  onChange={(e) => setTermForm({ ...termForm, description: e.target.value })}
                  placeholder="Short summary for this category..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTerm || updatingTerm}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
                >
                  {(addingTerm || updatingTerm) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTerm ? 'Save Term' : 'Add Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Taxonomy */}
      <ConfirmDialog
        open={!!confirmDeleteTax}
        title={`Delete "${confirmDeleteTax?.name}"?`}
        message="This will permanently delete this category system and all terms inside it."
        onConfirm={handleDeleteTaxonomy}
        onCancel={() => setConfirmDeleteTax(null)}
        loading={deletingTax}
      />

      {/* Confirm Delete Term */}
      <ConfirmDialog
        open={!!confirmDeleteTerm}
        title={`Delete "${confirmDeleteTerm?.name}"?`}
        message="Are you sure you want to delete this category term?"
        onConfirm={handleDeleteTerm}
        onCancel={() => setConfirmDeleteTerm(null)}
        loading={deletingTerm}
      />
    </div>
  )
}

function TermTreeNode({ node, level = 0, onEdit, onDelete, onAddChild }) {
  return (
    <>
      <div
        className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-4 group"
        style={{ paddingLeft: `${16 + level * 28}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {level > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-xs"
            style={{ backgroundColor: node.color || '#8b5cf6' }}
          />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">{node.name}</span>
            <span className="ml-2 text-xs font-mono text-slate-400">/{node.slug}</span>
            {node.description && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(node)}
            className="px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-md transition flex items-center gap-1"
            title="Add Subcategory"
          >
            <Plus className="w-3 h-3" /> Subcategory
          </button>
          <button
            onClick={() => onEdit(node)}
            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-md hover:bg-slate-100 transition"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(node)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {node.children &&
        node.children.map((child) => (
          <TermTreeNode
            key={child._id}
            node={child}
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </>
  )
}
