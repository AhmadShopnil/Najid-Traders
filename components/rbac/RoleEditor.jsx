'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useGetPermissionsQuery, useCreateRoleMutation, useUpdateRoleMutation } from '@/store/services/rbacApi'
import { PermissionMatrix } from './PermissionMatrix'
import { cn } from '@/lib/utils'

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#0d9488', '#d97706', '#dc2626', '#6b7280', '#db2777']

function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function RoleEditor({ role, onClose }) {
  const isEditing = !!role
  const isSuperAdminRole = role?.slug === 'super_admin'

  const { data: permsRes } = useGetPermissionsQuery()
  const permGroups = permsRes?.data?.groups || []

  const [createRole, { isLoading: creating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation()

  const [form, setForm] = useState({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || '',
    color: role?.color || '#7c3aed',
    permissions: role?.permissions || [],
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing && form.name) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name, isEditing])

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSuperAdminRole) {
      onClose()
      return
    }
    setError('')
    try {
      if (isEditing) {
        await updateRole({ id: role._id, ...form }).unwrap()
      } else {
        await createRole(form).unwrap()
      }
      onClose()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save role')
    }
  }

  const saving = creating || updating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{isEditing ? `Edit Role: ${role.name}` : 'Create New Role'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Role Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Blog Editor"
                  disabled={isSuperAdminRole}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  disabled={isEditing && role?.isSystem}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={isSuperAdminRole}
                placeholder="What can this role do?"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Color Tag</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={isSuperAdminRole}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      'w-7 h-7 rounded-full border-4 transition',
                      form.color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-3">
                Permissions <span className="text-purple-600 font-mono text-xs">({form.permissions.length} selected)</span>
              </label>
              {isSuperAdminRole ? (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-700 font-medium">
                  Super Admin has all permissions and cannot be modified.
                </div>
              ) : (
                <PermissionMatrix
                  permissionGroups={permGroups}
                  selected={form.permissions}
                  onChange={(perms) => setForm((f) => ({ ...f, permissions: perms }))}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
              {isSuperAdminRole ? 'Close' : 'Cancel'}
            </button>
            {!isSuperAdminRole && (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Role'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
