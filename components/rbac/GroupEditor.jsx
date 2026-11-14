'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, UserPlus, UserMinus, Check } from 'lucide-react'
import {
  useGetPermissionsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useGetRbacUsersQuery,
  useGetRolesQuery,
} from '@/store/services/rbacApi'
import { PermissionMatrix } from './PermissionMatrix'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#0d9488', '#d97706', '#dc2626', '#6b7280', '#db2777']
function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function GroupEditor({ group, onClose }) {
  const isEditing = !!group
  const { isSuperAdmin } = usePermission()
  const { data: permsRes } = useGetPermissionsQuery()
  const { data: rolesRes } = useGetRolesQuery()
  const { data: usersRes } = useGetRbacUsersQuery({ limit: 100 })
  const permGroups = permsRes?.data?.groups || []
  const roles = useMemo(
    () => (rolesRes?.data || []).filter((r) => isSuperAdmin || r.slug !== 'super_admin'),
    [rolesRes?.data, isSuperAdmin]
  )
  const users = usersRes?.data || []

  const [createGroup, { isLoading: creating }] = useCreateGroupMutation()
  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation()

  const [form, setForm] = useState({
    name: group?.name || '',
    slug: group?.slug || '',
    description: group?.description || '',
    color: group?.color || '#0891b2',
    roles: (group?.roles || []).map((r) => (typeof r === 'object' ? r._id : r)),
    permissions: group?.permissions || [],
  })
  const [members, setMembers] = useState((group?.members || []).map((m) => (typeof m === 'object' ? m._id : m)))
  const [memberSearch, setMemberSearch] = useState('')
  const [tab, setTab] = useState('settings')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing && form.name) setForm((f) => ({ ...f, slug: slugify(f.name) }))
  }, [form.name, isEditing])

  const inheritedPerms = useMemo(() => {
    const set = new Set()
    form.roles.forEach((roleId) => {
      const role = roles.find((r) => r._id === roleId)
      if (role?.permissions) role.permissions.forEach((p) => set.add(p))
    })
    return [...set]
  }, [form.roles, roles])

  const effectivePerms = useMemo(() => {
    return Array.from(new Set([...inheritedPerms, ...form.permissions]))
  }, [inheritedPerms, form.permissions])

  function toggleRole(roleId) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(roleId) ? f.roles.filter((r) => r !== roleId) : [...f.roles, roleId],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setTab('settings')
      setError('Group name is required')
      return
    }
    setError('')
    try {
      const payload = { ...form, members }
      if (isEditing) {
        await updateGroup({ id: group._id, ...payload }).unwrap()
      } else {
        await createGroup(payload).unwrap()
      }
      onClose()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save group')
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      !memberSearch ||
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const saving = creating || updating
  const TABS = ['settings', 'roles', 'permissions', 'members']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{isEditing ? `Edit Group — ${group.name}` : 'Create New Group'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 overflow-x-auto flex-shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-t-lg capitalize transition',
                tab === t ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t} {t === 'members' && `(${members.length})`}
              {t === 'roles' && form.roles.length > 0 && ` (${form.roles.length})`}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            {tab === 'settings' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Group Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      placeholder="e.g. Frontend Team"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Slug *</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      required
                      disabled={isEditing}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What is this group for?"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Color Tag</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
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
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">
                    <span className="font-bold text-purple-600">{effectivePerms.length}</span> effective permissions (
                    {inheritedPerms.length} from roles + {form.permissions.length} direct)
                  </p>
                </div>
              </div>
            )}

            {tab === 'roles' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Assign roles to this group. Members will inherit all permissions from these roles.</p>
                {roles.map((role) => (
                  <div
                    key={role._id}
                    onClick={() => toggleRole(role._id)}
                    className={cn(
                      'flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition',
                      form.roles.includes(role._id) ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{role.name}</p>
                        <p className="text-xs text-slate-500">{role.permissions?.length || 0} permissions · {role.description}</p>
                      </div>
                    </div>
                    {form.roles.includes(role._id) && <Check className="w-5 h-5 text-purple-600" />}
                  </div>
                ))}
              </div>
            )}

            {tab === 'permissions' && (
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Add <strong>extra</strong> permissions on top of what the assigned roles provide.
                </p>
                <PermissionMatrix
                  permissionGroups={permGroups}
                  selected={effectivePerms}
                  onChange={(newPerms) => {
                    const direct = newPerms.filter((p) => !inheritedPerms.includes(p))
                    setForm((f) => ({ ...f, permissions: direct }))
                  }}
                />
              </div>
            )}

            {tab === 'members' && (
              <div className="space-y-4">
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => {
                    const isMember = members.includes(user._id)
                    return (
                      <div
                        key={user._id}
                        className={cn(
                          'flex items-center justify-between p-3 border-2 rounded-xl transition',
                          isMember ? 'border-purple-200 bg-purple-50' : 'border-slate-100 hover:border-slate-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMembers((prev) => (isMember ? prev.filter((id) => id !== user._id) : [...prev, user._id]))
                          }
                          className={cn(
                            'p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1',
                            isMember ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          )}
                        >
                          {isMember ? <><UserMinus className="w-3.5 h-3.5" /> Remove</> : <><UserPlus className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
