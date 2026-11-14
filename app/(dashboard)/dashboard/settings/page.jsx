'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Settings2,
  Loader2,
  Save,
  Trash2,
  FileText,
  Image as ImageIcon,
  ToggleLeft,
  Hash,
  Type,
  Code,
  Palette,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Globe,
  Phone,
  Share2,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ListChecks,
  Check,
  Link2,
  ShieldCheck,
  Lock,
  Users,
  Compass,
} from 'lucide-react'
import Link from 'next/link'
import {
  useGetSettingsQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useDeleteSettingMutation,
} from '@/store/services/settingsApi'
import { useGetRolesQuery } from '@/store/services/rbacApi'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { isSystemSettingField } from '@/lib/settings/schema'
import { cn } from '@/lib/utils'

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function getGroupIcon(slug) {
  switch (slug) {
    case 'general':
      return Globe
    case 'dashboard':
      return SlidersHorizontal
    case 'theme':
      return Palette
    case 'contact':
      return Phone
    case 'social':
      return Share2
    case 'seo':
      return Search
    case 'footer':
      return Compass
    default:
      return Settings2
  }
}

const FIELD_TYPES = [
  { type: 'text', icon: Type, label: 'Short Text' },
  { type: 'longtext', icon: FileText, label: 'Long Text' },
  { type: 'number', icon: Hash, label: 'Number' },
  { type: 'boolean', icon: ToggleLeft, label: 'Toggle Switch' },
  { type: 'select', icon: ListChecks, label: 'Select Option' },
  { type: 'image', icon: ImageIcon, label: 'Single Image' },
  { type: 'gallery', icon: ImageIcon, label: 'Image Gallery' },
  { type: 'url', icon: Link2, label: 'Link / URL' },
  { type: 'color', icon: Palette, label: 'Color Picker' },
  { type: 'json', icon: Code, label: 'Code / JSON' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { can } = usePermission()
  const canRead = can(['settings:read', 'settings:update'])
  const canUpdate = can('settings:update')
  const canCreateGroup = can('settings:create_group')
  const canManageSchema = can('settings:manage_schema')

  const { data: res, isLoading } = useGetSettingsQuery(undefined, { skip: !canRead })
  const groups = res?.data || []

  const { data: rolesRes } = useGetRolesQuery(undefined, { skip: !canManageSchema })
  const allRoles = (rolesRes?.data || []).filter((r) => r.slug !== 'super_admin')

  const [createSetting] = useCreateSettingMutation()
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation()
  const [deleteSetting] = useDeleteSettingMutation()

  const [activeGroupId, setActiveGroupId] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [groupSearch, setGroupSearch] = useState('')
  const [schemaMode, setSchemaMode] = useState(false)
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false)

  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [fieldDeleteTarget, setFieldDeleteTarget] = useState(null)
  const [showAddField, setShowAddField] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (groups.length > 0 && (!activeGroupId || !groups.some((g) => g._id === activeGroupId))) {
      setActiveGroupId(groups[0]._id)
    }
  }, [groups, activeGroupId])

  const originalGroup = useMemo(
    () => groups.find((grp) => grp._id === activeGroupId) || null,
    [groups, activeGroupId]
  )

  useEffect(() => {
    if (originalGroup) {
      setEditingGroup(JSON.parse(JSON.stringify(originalGroup)))
      setShowAddField(false)
    }
  }, [originalGroup])

  const isDirty = useMemo(() => {
    if (!originalGroup || !editingGroup) return false
    const fieldsChanged = JSON.stringify(originalGroup.fields) !== JSON.stringify(editingGroup.fields)
    const rolesChanged =
      JSON.stringify(originalGroup.allowedRoles || []) !== JSON.stringify(editingGroup.allowedRoles || [])
    return fieldsChanged || rolesChanged
  }, [originalGroup, editingGroup])

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups
    const q = groupSearch.toLowerCase()
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q)
    )
  }, [groups, groupSearch])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  if (!canRead) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You do not have permission to view global settings.</p>
      </div>
    )
  }

  async function handleCreateGroup(e) {
    e.preventDefault()
    if (!canCreateGroup || !newGroupName.trim()) return
    try {
      const slug = slugify(newGroupName)
      const created = await createSetting({ name: newGroupName.trim(), slug, fields: [] }).unwrap()
      setNewGroupName('')
      setShowNewGroup(false)
      setActiveGroupId(created.data._id)
      setToast({ type: 'success', message: 'Settings group created.' })
    } catch (err) {
      setToast({ type: 'error', message: err?.data?.message || 'Failed to create group.' })
    }
  }

  async function handleSaveGroup() {
    if (!canUpdate || !editingGroup) return
    try {
      const payload = { id: editingGroup._id, fields: editingGroup.fields }
      if (canManageSchema) {
        payload.name = editingGroup.name
        payload.description = editingGroup.description
        payload.allowedRoles = editingGroup.allowedRoles || []
      }
      await updateSetting(payload).unwrap()
      setToast({ type: 'success', message: 'Settings saved successfully!' })
      router.refresh()
    } catch (err) {
      setToast({ type: 'error', message: err?.data?.message || 'Failed to save settings.' })
    }
  }

  function handleResetGroup() {
    if (!originalGroup) return
    setEditingGroup(JSON.parse(JSON.stringify(originalGroup)))
  }

  async function handleDeleteGroup() {
    if (!canCreateGroup || !deleteTarget) return
    try {
      await deleteSetting(deleteTarget._id).unwrap()
      const deletedId = deleteTarget._id
      setDeleteTarget(null)
      const remaining = groups.filter((g) => g._id !== deletedId)
      setActiveGroupId(remaining[0]?._id || null)
      setToast({ type: 'success', message: 'Settings group deleted.' })
    } catch (err) {
      setToast({ type: 'error', message: err?.data?.message || 'Failed to delete group.' })
      setDeleteTarget(null)
    }
  }

  function handleAddField(type) {
    const newField = {
      id: generateId(),
      name: 'New ' + type,
      slug: 'new_' + type.toLowerCase() + '_' + generateId().slice(0, 3),
      type,
      options:
        type === 'select'
          ? [
              { value: 'option_1', label: 'Option 1' },
              { value: 'option_2', label: 'Option 2' },
            ]
          : [],
      value:
        type === 'boolean'
          ? false
          : type === 'gallery'
            ? []
            : type === 'color'
              ? '#4f46e5'
              : type === 'select'
                ? 'option_1'
                : '',
    }
    setEditingGroup((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
    setShowAddField(false)
    setSchemaMode(true)
  }

  function updateField(fieldId, updates) {
    setEditingGroup((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    }))
  }

  function updateFieldValue(fieldId, val) {
    updateField(fieldId, { value: val })
  }

  function toggleRoleAccess(roleSlug) {
    if (!canManageSchema) return
    setEditingGroup((prev) => {
      const current = Array.isArray(prev.allowedRoles) ? prev.allowedRoles : []
      const next = current.includes(roleSlug)
        ? current.filter((r) => r !== roleSlug)
        : [...current, roleSlug]
      return { ...prev, allowedRoles: next }
    })
  }

  function setAccessMode(mode) {
    if (!canManageSchema) return
    if (mode === 'all') {
      setEditingGroup((prev) => ({ ...prev, allowedRoles: [] }))
    } else if ((editingGroup?.allowedRoles || []).length === 0 && allRoles.length > 0) {
      setEditingGroup((prev) => ({ ...prev, allowedRoles: [allRoles[0].slug] }))
    }
  }

  async function handleConfirmDeleteField() {
    if (!canManageSchema || !editingGroup || !fieldDeleteTarget) return
    const nextGroup = {
      ...editingGroup,
      fields: editingGroup.fields.filter((f) => f.id !== fieldDeleteTarget.id),
    }
    setEditingGroup(nextGroup)
    setFieldDeleteTarget(null)
    try {
      await updateSetting({ id: nextGroup._id, ...nextGroup }).unwrap()
      setToast({ type: 'success', message: 'Custom field deleted.' })
      router.refresh()
    } catch (err) {
      setToast({ type: 'error', message: err?.data?.message || 'Failed to delete field.' })
    }
  }

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Loading workspace settings...</p>
      </div>
    )
  }

  const ActiveIcon = editingGroup ? getGroupIcon(editingGroup.slug) : Settings2
  const allowedRolesCount = editingGroup?.allowedRoles?.length || 0

  return (
    <div className="w-full pb-20">
      <PageHeader
        title="Settings"
        description="Configure your site identity, contact channels, social links, SEO metadata, and group access permissions"
        apiEndpoints={[
          {
            label: 'All Settings Groups (Admin)',
            path: '/api/admin/settings',
            isPublic: false,
            description: 'Returns settings groups accessible to your role',
          },
          ...(activeGroupId
            ? [
                {
                  label: 'Active Settings Group (Admin)',
                  path: `/api/admin/settings/${activeGroupId}`,
                  isPublic: false,
                  description: 'Returns current active group configuration',
                },
              ]
            : []),
          {
            label: 'Public Settings Feed',
            path: '/api/public/settings',
            isPublic: true,
            description: 'Public key-value configuration feed',
          },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {canManageSchema && (
              <button
                type="button"
                onClick={() => setShowPermissionsPanel((v) => !v)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer',
                  showPermissionsPanel
                    ? 'bg-amber-50/80 text-[#0D253F] border-[#C89B3C]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--dash-accent, #C89B3C)' }} />
                Group Access
              </button>
            )}
            {canManageSchema && (
              <button
                type="button"
                onClick={() => setSchemaMode((v) => !v)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer',
                  schemaMode
                    ? 'bg-[#0D253F] text-white border-[#0D253F]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                )}
                title="Toggle field keys and custom field builder"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {schemaMode ? 'Done Editing Fields' : 'Manage Fields'}
              </button>
            )}
            {canUpdate && (
              <button
                type="button"
                onClick={handleSaveGroup}
                disabled={saving || !editingGroup || !isDirty}
                className="text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: 'var(--dash-primary, #0D253F)',
                  borderBottom: '2px solid var(--dash-accent, #C89B3C)',
                }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            )}
          </div>
        }
      />

      {toast && (
        <div
          className={cn(
            'mb-4 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2.5 shadow-xs',
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

      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-72 flex-shrink-0 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs lg:sticky lg:top-6">
          <div className="px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Setting Groups
            </span>
            <span className="text-[11px] font-semibold text-slate-400">{groups.length}</span>
          </div>

          {groups.length > 4 && (
            <div className="relative mt-1.5 mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Filter groups..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          )}

          <nav className="space-y-1 mt-1">
            {filteredGroups.map((g) => {
              const Icon = getGroupIcon(g.slug)
              const active = activeGroupId === g._id
              const isRestricted = Array.isArray(g.allowedRoles) && g.allowedRoles.length > 0
              return (
                <button
                  type="button"
                  key={g._id}
                  onClick={() => setActiveGroupId(g._id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left relative',
                    active
                      ? 'bg-slate-100/90 text-[#0D253F] font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                      style={{ backgroundColor: 'var(--dash-accent, #C89B3C)' }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={active ? { color: 'var(--dash-accent, #C89B3C)' } : undefined}
                    />
                    <span className="truncate">{g.name}</span>
                    {isRestricted && (
                      <Lock
                        className="w-3 h-3 text-amber-500 flex-shrink-0"
                        title={`Restricted to ${g.allowedRoles.length} role(s)`}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0',
                      active ? 'text-white' : 'bg-slate-100 text-slate-500'
                    )}
                    style={active ? { backgroundColor: 'var(--dash-accent, #C89B3C)' } : undefined}
                  >
                    {g.fields?.length || 0}
                  </span>
                </button>
              )
            })}
          </nav>

          {canCreateGroup && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              {showNewGroup ? (
                <form onSubmit={handleCreateGroup} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Group name..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewGroup(false)
                        setNewGroupName('')
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewGroup(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Setting Group
                </button>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/menus"
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Menu Manager</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </aside>

        {/* Main Settings Panel (Full Remaining Width) */}
        <section className="flex-1 min-w-0 w-full bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {editingGroup ? (
            <>
              {/* Panel Header */}
              <div className="px-6 py-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(200, 155, 60, 0.1)',
                      borderColor: 'rgba(200, 155, 60, 0.3)',
                      color: 'var(--dash-accent, #C89B3C)',
                    }}
                  >
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900">{editingGroup.name}</h2>
                      {editingGroup.isSystem && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                          System
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1',
                          allowedRolesCount > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        {allowedRolesCount > 0 ? (
                          <>
                            <Lock className="w-3 h-3" />
                            {allowedRolesCount} Role{allowedRolesCount > 1 ? 's' : ''} Only
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            All Permitted Roles
                          </>
                        )}
                      </span>
                      {isDirty && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Unsaved changes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {editingGroup.description || 'Manage settings and configuration values for this section.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isDirty && canUpdate && (
                    <button
                      type="button"
                      onClick={handleResetGroup}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Discard
                    </button>
                  )}
                  {canCreateGroup && !editingGroup.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(editingGroup)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Group Access Permissions Panel */}
              {canManageSchema && showPermissionsPanel && (
                <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Group Access Permissions
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Control which user roles can view and manage <span className="font-semibold text-slate-700">{editingGroup.name}</span>. Super Admin always has full access.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 self-start">
                      <button
                        type="button"
                        onClick={() => setAccessMode('all')}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer',
                          allowedRolesCount === 0
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        All Permitted
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccessMode('restricted')}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer',
                          allowedRolesCount > 0
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        Specific Roles
                      </button>
                    </div>
                  </div>

                  {allowedRolesCount > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allRoles.map((role) => {
                        const checked = (editingGroup.allowedRoles || []).includes(role.slug)
                        return (
                          <button
                            type="button"
                            key={role._id || role.slug}
                            onClick={() => toggleRoleAccess(role.slug)}
                            className={cn(
                              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer',
                              checked
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            )}
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: role.color || '#64748b' }}
                            />
                            <span>{role.name}</span>
                            {checked && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-white border border-slate-200/80 rounded-lg px-3.5 py-2.5">
                      Any role with <code className="font-mono text-indigo-700">settings:read</code> or{' '}
                      <code className="font-mono text-indigo-700">settings:update</code> permission in RBAC can access this group.
                    </p>
                  )}
                </div>
              )}

              {/* Footer & Navigation Quick Banner */}
              {editingGroup.slug === 'footer' && (
                <div className="mx-6 my-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#16385D] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-700/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#C89B3C]" />
                      <h4 className="text-sm font-bold text-white">Interactive Menu Management System</h4>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Custom navigation links for Footer Columns, Main Header Navigation, and Top Bar can be dynamically built and ordered from the Menu Manager.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/menus"
                    className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold text-[#0D253F] bg-[#C89B3C] hover:bg-[#d8ab4c] transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Manage Menu Items</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Fields List (Standard 2-Column Enterprise Layout) */}
              <div className="divide-y divide-slate-100">
                {editingGroup.fields.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <Settings2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800">No fields configured</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Add a dynamic field to start storing configuration values in this group.
                    </p>
                    {canManageSchema && (
                      <button
                        type="button"
                        onClick={() => {
                          setSchemaMode(true)
                          setShowAddField(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Field
                      </button>
                    )}
                  </div>
                ) : (
                  editingGroup.fields.map((field) => {
                    const isSystemField = isSystemSettingField(editingGroup.slug, field.slug)
                    const selectOptions =
                      Array.isArray(field.options) && field.options.length > 0
                        ? field.options
                        : field.slug === 'brand_display_mode'
                          ? [
                              { value: 'both', label: 'Logo & Site Name (Both)' },
                              { value: 'logo', label: 'Logo Only' },
                              { value: 'name', label: 'Site Name Only' },
                            ]
                          : []

                    return (
                      <div
                        key={field.id}
                        className="px-6 py-5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start hover:bg-slate-50/40 transition-colors"
                      >
                        {/* Left Column: Label + Description (+ Schema Editor when toggled) */}
                        <div className="md:col-span-4 space-y-1.5">
                          {schemaMode && canManageSchema ? (
                            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Field Label
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                                    {field.type}
                                  </span>
                                  {!isSystemField && (
                                    <button
                                      type="button"
                                      onClick={() => setFieldDeleteTarget(field)}
                                      title="Delete custom field"
                                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => {
                                  const newName = e.target.value
                                  const autoSlug =
                                    !isSystemField && slugify(field.name) === field.slug
                                      ? slugify(newName)
                                      : field.slug
                                  updateField(field.id, { name: newName, slug: autoSlug || field.slug })
                                }}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                              />
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                  API Key (Slug)
                                </span>
                                <input
                                  type="text"
                                  value={field.slug}
                                  disabled={isSystemField}
                                  onChange={(e) => updateField(field.id, { slug: e.target.value })}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono text-indigo-700 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <label className="text-sm font-semibold text-slate-800">
                                  {field.name}
                                </label>
                                {isSystemField && (
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    Core
                                  </span>
                                )}
                              </div>
                              {field.description ? (
                                <p className="text-xs text-slate-500 leading-relaxed">{field.description}</p>
                              ) : (
                                <p className="text-[11px] font-mono text-slate-400">{field.slug}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Right Column: Field Input Control */}
                        <div className="md:col-span-8">
                          {field.type === 'color' ? (
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                disabled={!canUpdate}
                                value={field.value || '#4f46e5'}
                                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                className="w-11 h-10 p-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                              />
                              <input
                                type="text"
                                disabled={!canUpdate}
                                value={field.value || '#4f46e5'}
                                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                className="w-36 px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                              />
                            </div>
                          ) : field.type === 'url' ? (
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="url"
                                  disabled={!canUpdate}
                                  value={field.value ?? ''}
                                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                  placeholder="https://..."
                                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                                />
                              </div>
                              {field.value && (
                                <a
                                  href={String(field.value)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                  title="Open URL"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ) : field.type === 'text' ? (
                            <input
                              type="text"
                              disabled={!canUpdate}
                              value={field.value ?? ''}
                              onChange={(e) => updateFieldValue(field.id, e.target.value)}
                              placeholder={`Enter ${field.name.toLowerCase()}...`}
                              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                          ) : field.type === 'longtext' ? (
                            <textarea
                              disabled={!canUpdate}
                              value={field.value ?? ''}
                              onChange={(e) => updateFieldValue(field.id, e.target.value)}
                              placeholder="Enter text..."
                              rows={3}
                              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              disabled={!canUpdate}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                updateFieldValue(field.id, e.target.value === '' ? '' : Number(e.target.value))
                              }
                              className="w-full max-w-xs px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                          ) : field.type === 'boolean' ? (
                            <label className="inline-flex items-center gap-3 cursor-pointer select-none py-1">
                              <div
                                className={cn(
                                  'w-11 h-6 rounded-full transition-colors relative',
                                  field.value ? 'bg-indigo-600' : 'bg-slate-200'
                                )}
                              >
                                <div
                                  className={cn(
                                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-xs',
                                    field.value ? 'left-6' : 'left-1'
                                  )}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {field.value ? 'Enabled' : 'Disabled'}
                              </span>
                              <input
                                type="checkbox"
                                disabled={!canUpdate}
                                checked={!!field.value}
                                onChange={(e) => updateFieldValue(field.id, e.target.checked)}
                                className="hidden"
                              />
                            </label>
                          ) : field.type === 'image' ? (
                            <ImageUpload
                              value={field.value}
                              onChange={(val) => updateFieldValue(field.id, val)}
                              multiple={false}
                              folder={editingGroup.slug}
                              disabled={!canUpdate}
                            />
                          ) : field.type === 'gallery' ? (
                            <ImageUpload
                              value={field.value}
                              onChange={(val) => updateFieldValue(field.id, val)}
                              multiple={true}
                              folder={editingGroup.slug}
                              disabled={!canUpdate}
                            />
                          ) : field.type === 'select' ? (
                            selectOptions.length > 0 && selectOptions.length <= 4 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {selectOptions.map((opt) => {
                                  const val = typeof opt === 'object' ? opt.value : String(opt)
                                  const lbl = typeof opt === 'object' ? opt.label : String(opt)
                                  const selected = String(field.value ?? '') === String(val)
                                  return (
                                    <button
                                      type="button"
                                      key={val}
                                      disabled={!canUpdate}
                                      onClick={() => updateFieldValue(field.id, val)}
                                      className={cn(
                                        'px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-2 transition text-left cursor-pointer',
                                        selected
                                          ? 'bg-amber-50/70 border-[#C89B3C] text-[#0D253F] ring-1 ring-[#C89B3C]/30'
                                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                      )}
                                    >
                                      <span className="truncate">{lbl}</span>
                                      {selected && (
                                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--dash-accent, #C89B3C)' }} />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <select
                                disabled={!canUpdate}
                                value={field.value ?? ''}
                                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                              >
                                {selectOptions.map((opt) => {
                                  const val = typeof opt === 'object' ? opt.value : String(opt)
                                  const lbl = typeof opt === 'object' ? opt.label : String(opt)
                                  return (
                                    <option key={val} value={val}>
                                      {lbl}
                                    </option>
                                  )
                                })}
                              </select>
                            )
                          ) : field.type === 'json' ? (
                            <textarea
                              disabled={!canUpdate}
                              value={
                                typeof field.value === 'string'
                                  ? field.value
                                  : JSON.stringify(field.value ?? {}, null, 2)
                              }
                              onChange={(e) => updateFieldValue(field.id, e.target.value)}
                              placeholder="{}"
                              rows={5}
                              className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                            />
                          ) : (
                            <p className="text-sm text-red-500">Unsupported field type</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add Field Builder (shown in Schema Mode or when adding) */}
              {canManageSchema && (schemaMode || showAddField) && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  {showAddField ? (
                    <div className="p-4 border border-indigo-200 bg-white rounded-xl shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Choose Field Type
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAddField(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {FIELD_TYPES.map((ft) => (
                          <button
                            type="button"
                            key={ft.type}
                            onClick={() => handleAddField(ft.type)}
                            className="flex flex-col items-center justify-center p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/40 transition gap-1.5 cursor-pointer"
                          >
                            <ft.icon className="w-4 h-4 text-indigo-600" />
                            <span className="text-[11px] font-semibold text-slate-700">{ft.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddField(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:bg-white hover:text-indigo-600 text-xs font-semibold transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Dynamic Field
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Public API key:{' '}
                  <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    data.{editingGroup.slug}
                  </code>
                </p>

                {canUpdate && (
                  <div className="flex items-center gap-2.5">
                    {isDirty && (
                      <button
                        type="button"
                        onClick={handleResetGroup}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                      >
                        Discard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveGroup}
                      disabled={saving || !isDirty}
                      className="text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer hover:brightness-110"
                      style={{
                        backgroundColor: 'var(--dash-primary, #0D253F)',
                        borderBottom: '2px solid var(--dash-accent, #C89B3C)',
                      }}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-16 text-sm text-slate-400">
              No accessible settings groups found for your role
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Settings Group"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!fieldDeleteTarget}
        title="Delete Custom Field"
        message={`Are you sure you want to delete the custom field "${fieldDeleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteField}
        onCancel={() => setFieldDeleteTarget(null)}
      />
    </div>
  )
}
