'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Compass,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Menu as MenuIcon,
  Link2,
  Layers,
  Eye,
  RotateCcw,
  Tag,
  Check,
  ChevronRight,
  Sparkles,
  Building2,
  Package,
} from 'lucide-react'
import {
  useGetMenusQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} from '@/store/services/menusApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

const LOCATION_OPTIONS = [
  { value: 'main_header', label: 'Main Header Navigation', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'top_bar', label: 'Top Announcement Bar', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'footer_col1', label: 'Footer Column 1 (Quick Links / Company)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'footer_col2', label: 'Footer Column 2 (Trade Policy / Info)', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'footer_col3', label: 'Footer Column 3 (Custom Footer Slot)', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'custom', label: 'Custom / Unassigned', badgeColor: 'bg-slate-100 text-slate-600 border-slate-200' },
]

const SYSTEM_PAGE_SHORTCUTS = [
  { label: 'Home', url: '/', icon: Building2 },
  { label: 'Products Catalog', url: '/products', badge: 'Catalog', icon: Package },
  { label: 'Our Leadership & Team', url: '/team', icon: Compass },
  { label: 'About Us', url: '/#about', icon: Building2 },
  { label: 'Contact & Wholesale Desk', url: '/#contact', icon: Link2 },
]

function generateItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

export default function MenusPage() {
  const { can } = usePermission()
  const canUpdate = can(['pages:update', 'settings:update'])

  const { data: menusRes, isLoading } = useGetMenusQuery()
  const menus = menusRes?.data || []

  const [createMenu, { isLoading: isCreating }] = useCreateMenuMutation()
  const [updateMenu, { isLoading: isUpdating }] = useUpdateMenuMutation()
  const [deleteMenu, { isLoading: isDeleting }] = useDeleteMenuMutation()

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [editingMenu, setEditingMenu] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showNewMenuModal, setShowNewMenuModal] = useState(false)
  const [newMenuForm, setNewMenuForm] = useState({ name: '', slug: '', location: 'custom' })

  // Custom Item Input Form
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemTarget, setNewItemTarget] = useState('_self')
  const [newItemBadge, setNewItemBadge] = useState('')

  // Set initial active menu
  useEffect(() => {
    if (menus.length > 0 && (!activeMenuId || !menus.some((m) => m._id === activeMenuId))) {
      setActiveMenuId(menus[0]._id)
    }
  }, [menus, activeMenuId])

  // Sync editingMenu when activeMenuId changes
  useEffect(() => {
    const found = menus.find((m) => m._id === activeMenuId)
    if (found) {
      setEditingMenu(JSON.parse(JSON.stringify(found)))
      setIsDirty(false)
    } else {
      setEditingMenu(null)
    }
  }, [activeMenuId, menus])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Handle Save
  const handleSave = async () => {
    if (!editingMenu) return
    try {
      await updateMenu({
        id: editingMenu._id,
        name: editingMenu.name,
        slug: editingMenu.slug,
        location: editingMenu.location,
        description: editingMenu.description,
        isActive: editingMenu.isActive,
        items: editingMenu.items,
      }).unwrap()

      setIsDirty(false)
      showToast('Menu saved and published successfully!')
    } catch (err) {
      showToast(err?.data?.message || err.message || 'Failed to save menu', 'error')
    }
  }

  // Handle Delete Menu
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMenu(deleteTarget._id).unwrap()
      setDeleteTarget(null)
      showToast('Menu deleted successfully')
    } catch (err) {
      showToast(err?.data?.message || err.message || 'Failed to delete menu', 'error')
    }
  }

  // Handle Create Menu
  const handleCreateMenuSubmit = async (e) => {
    e.preventDefault()
    if (!newMenuForm.name.trim()) return

    try {
      const created = await createMenu({
        name: newMenuForm.name.trim(),
        slug: newMenuForm.slug.trim() || undefined,
        location: newMenuForm.location || 'custom',
        items: [],
      }).unwrap()

      setShowNewMenuModal(false)
      setNewMenuForm({ name: '', slug: '', location: 'custom' })
      setActiveMenuId(created.data._id)
      showToast('New menu created!')
    } catch (err) {
      showToast(err?.data?.message || err.message || 'Failed to create menu', 'error')
    }
  }

  // Add Item to Menu
  const handleAddItem = (label, url, badge = '', target = '_self') => {
    if (!label.trim() || !url.trim() || !editingMenu) return

    const newItem = {
      id: generateItemId(),
      label: label.trim(),
      url: url.trim(),
      target,
      badge: badge.trim(),
      order: editingMenu.items?.length || 0,
      isActive: true,
      children: [],
    }

    setEditingMenu((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }))
    setIsDirty(true)

    // Clear form
    setNewItemLabel('')
    setNewItemUrl('')
    setNewItemBadge('')
    setNewItemTarget('_self')
  }

  // Item Reorder (Move Up/Down)
  const handleMoveItem = (index, direction) => {
    if (!editingMenu?.items) return
    const newItems = [...editingMenu.items]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newItems.length) return

    const temp = newItems[index]
    newItems[index] = newItems[targetIdx]
    newItems[targetIdx] = temp

    // Update order values
    newItems.forEach((it, i) => {
      it.order = i
    })

    setEditingMenu((prev) => ({ ...prev, items: newItems }))
    setIsDirty(true)
  }

  // Item Delete
  const handleDeleteItem = (index) => {
    if (!editingMenu?.items) return
    const newItems = editingMenu.items.filter((_, i) => i !== index)
    newItems.forEach((it, i) => {
      it.order = i
    })
    setEditingMenu((prev) => ({ ...prev, items: newItems }))
    setIsDirty(true)
  }

  // Item Update
  const handleUpdateItemField = (index, field, value) => {
    if (!editingMenu?.items) return
    const newItems = [...editingMenu.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditingMenu((prev) => ({ ...prev, items: newItems }))
    setIsDirty(true)
  }

  const activeLocation = useMemo(() => {
    return (
      LOCATION_OPTIONS.find((loc) => loc.value === editingMenu?.location) ||
      LOCATION_OPTIONS[LOCATION_OPTIONS.length - 1]
    )
  }, [editingMenu?.location])

  return (
    <div className="w-full">
      <PageHeader
        title="Menu & Navigation Management"
        subtitle="Manage dynamic navigation menus for the Main Header Nav, Top Announcement Bar, and Footer Columns."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Menus' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              Footer Settings
            </Link>
            {canUpdate && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating || !editingMenu || !isDirty}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 shadow-xs disabled:opacity-45 disabled:cursor-not-allowed transition hover:brightness-110"
                style={{
                  backgroundColor: 'var(--dash-primary, #0D253F)',
                  borderBottom: '2px solid var(--dash-accent, #C89B3C)',
                }}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            )}
          </div>
        }
      />

      {toast && (
        <div
          className={cn(
            'mb-5 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2.5 shadow-xs',
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* LEFT COLUMN: Menus List */}
        <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configured Menus</h2>
              <p className="text-[11px] text-slate-500">Select a menu slot to edit</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewMenuModal(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
              title="Create New Menu"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {isLoading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
              </div>
            ) : menus.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No menus found</p>
            ) : (
              menus.map((m) => {
                const isSelected = m._id === activeMenuId
                const loc = LOCATION_OPTIONS.find((l) => l.value === m.location)

                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setActiveMenuId(m._id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/20'
                        : 'border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-xs font-bold truncate', isSelected ? 'text-indigo-950' : 'text-slate-800')}>
                        {m.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {m.items?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md border', loc?.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200')}>
                        {loc?.label?.split('(')[0]?.trim() || m.location}
                      </span>
                      {!m.isActive && (
                        <span className="text-[10px] text-slate-400 italic">Draft</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Active Menu Builder */}
        <section className="flex-1 min-w-0 w-full bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {editingMenu ? (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Menu Meta Header Form */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full border', activeLocation.badgeColor)}>
                      {activeLocation.label}
                    </span>
                    {isDirty && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {editingMenu.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(editingMenu)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Menu Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Menu Title</label>
                  <input
                    type="text"
                    value={editingMenu.name}
                    onChange={(e) => {
                      setEditingMenu({ ...editingMenu, name: e.target.value })
                      setIsDirty(true)
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Location</label>
                  <select
                    value={editingMenu.location}
                    onChange={(e) => {
                      setEditingMenu({ ...editingMenu, location: e.target.value })
                      setIsDirty(true)
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  >
                    {LOCATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    value={editingMenu.slug}
                    onChange={(e) => {
                      setEditingMenu({ ...editingMenu, slug: e.target.value })
                      setIsDirty(true)
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-slate-600"
                  />
                </div>
              </div>

              {/* Items Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900">Navigation Items ({editingMenu.items?.length || 0})</h3>
                  </div>
                  <span className="text-xs text-slate-400">Order from top to bottom (drag or arrows)</span>
                </div>

                {editingMenu.items?.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">This menu has no links yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use the quick buttons or form below to add navigation links.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {editingMenu.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Order buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, 'down')}
                              disabled={idx === editingMenu.items.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Label input */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => handleUpdateItemField(idx, 'label', e.target.value)}
                                className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none px-1 py-0.5 w-full max-w-[200px]"
                                placeholder="Link Label"
                              />
                              {item.badge && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleUpdateItemField(idx, 'url', e.target.value)}
                                className="font-mono text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none px-1 py-0.5 w-full max-w-sm"
                                placeholder="/path or https://..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Extra Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Badge editor */}
                          <input
                            type="text"
                            value={item.badge || ''}
                            onChange={(e) => handleUpdateItemField(idx, 'badge', e.target.value)}
                            placeholder="Badge (optional)"
                            className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md w-24 text-center font-medium"
                          />

                          {/* Target Select */}
                          <select
                            value={item.target || '_self'}
                            onChange={(e) => handleUpdateItemField(idx, 'target', e.target.value)}
                            className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-medium"
                          >
                            <option value="_self">Same Tab (_self)</option>
                            <option value="_blank">New Tab (_blank)</option>
                          </select>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ADD NEW ITEM SECTION */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Add Items to Menu
                  </h4>

                  {/* 1. Quick One-Click Shortcuts */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>One-Click Quick Add from Website Pages:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SYSTEM_PAGE_SHORTCUTS.map((page) => (
                        <button
                          key={page.url}
                          type="button"
                          onClick={() => handleAddItem(page.label, page.url, page.badge || '', '_self')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs"
                        >
                          <page.icon className="w-3 h-3 text-slate-500" />
                          <span>{page.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({page.url})</span>
                          <Plus className="w-3 h-3 text-indigo-600 ml-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Custom Link Form */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <p className="text-xs font-semibold text-slate-800">Add Custom Link:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Navigation Label <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newItemLabel}
                          onChange={(e) => setNewItemLabel(e.target.value)}
                          placeholder="e.g. Bulk Orders"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          URL / Target Route <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newItemUrl}
                          onChange={(e) => setNewItemUrl(e.target.value)}
                          placeholder="e.g. /#contact or https://..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Badge (optional)
                        </label>
                        <input
                          type="text"
                          value={newItemBadge}
                          onChange={(e) => setNewItemBadge(e.target.value)}
                          placeholder="e.g. New"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleAddItem(newItemLabel, newItemUrl, newItemBadge, newItemTarget)}
                          disabled={!newItemLabel.trim() || !newItemUrl.trim()}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Live Menu Preview ({activeLocation.label})
                  </h4>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm overflow-x-auto">
                  {editingMenu.items?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No links in this menu to preview.</p>
                  ) : editingMenu.location.startsWith('footer') ? (
                    <div className="space-y-2 max-w-xs">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {editingMenu.name}
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {editingMenu.items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2">
                            <span className="hover:text-white transition">{it.label}</span>
                            {it.badge && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#C89B3C] text-[#0D253F]">
                                {it.badge}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {editingMenu.items.map((it) => (
                        <div
                          key={it.id}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-default transition"
                        >
                          <span>{it.label}</span>
                          {it.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#C89B3C] text-[#0D253F]">
                              {it.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No menu selected</h3>
              <p className="text-xs text-slate-500 mt-1">Select a menu from the left or create a new one.</p>
            </div>
          )}
        </section>
      </div>

      {/* CREATE NEW MENU MODAL */}
      {showNewMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setShowNewMenuModal(false)} />
          <form
            onSubmit={handleCreateMenuSubmit}
            className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Menu</h3>
              <button
                type="button"
                onClick={() => setShowNewMenuModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Menu Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newMenuForm.name}
                onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                placeholder="e.g. Header Quick Links"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Location</label>
              <select
                value={newMenuForm.location}
                onChange={(e) => setNewMenuForm({ ...newMenuForm, location: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewMenuModal(false)}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !newMenuForm.name.trim()}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Menu</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Menu"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Any public navigation assigned to this menu will revert to default.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
        danger
      />
    </div>
  )
}
