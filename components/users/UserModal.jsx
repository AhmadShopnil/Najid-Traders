'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Loader2, Shield, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useCreateUserMutation, useUpdateUserMutation } from '@/store/services/usersApi'
import { useGetRolesQuery, useGetGroupsQuery } from '@/store/services/rbacApi'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

export function UserModal({ open, user, onClose }) {
  const isEditing = !!user
  const { isSuperAdmin } = usePermission()
  const { data: rolesRes } = useGetRolesQuery(undefined, { skip: !open })
  const { data: groupsRes } = useGetGroupsQuery(undefined, { skip: !open })
  const roles = useMemo(
    () => (rolesRes?.data || []).filter((r) => isSuperAdmin || r.slug !== 'super_admin'),
    [rolesRes?.data, isSuperAdmin]
  )
  const groups = groupsRes?.data || []

  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleRef: '',
    groups: [],
    isActive: true,
  })
  const [error, setError] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      return
    }
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roleRef: user.roleRef?._id || user.roleRef || '',
        groups: (user.groups || []).map((g) => (typeof g === 'object' ? g._id : g)),
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
      initializedRef.current = true
    } else if (!initializedRef.current) {
      setForm({
        name: '',
        email: '',
        password: '',
        roleRef: roles.find((r) => r.slug === 'editor')?._id || roles[0]?._id || '',
        groups: [],
        isActive: true,
      })
      initializedRef.current = true
    }
    setError('')
  }, [user?._id, open])

  useEffect(() => {
    if (open && !isEditing && !form.roleRef && roles.length > 0) {
      setForm((prev) => ({
        ...prev,
        roleRef: roles.find((r) => r.slug === 'editor')?._id || roles[0]?._id || '',
      }))
    }
  }, [open, isEditing, form.roleRef, roles])

  if (!open) return null

  function toggleGroup(groupId) {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter((id) => id !== groupId)
        : [...prev.groups, groupId],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email) {
      setError('Name and email are required')
      return
    }

    if (!isEditing && !form.password) {
      setError('Password is required for new users')
      return
    }

    try {
      if (isEditing) {
        const payload = {
          id: user._id,
          name: form.name,
          email: form.email,
          roleRef: form.roleRef || null,
          groups: form.groups,
          isActive: form.isActive,
        }
        if (form.password) {
          payload.password = form.password
        }
        const res = await updateUser(payload).unwrap()
        if (res.success) {
          onClose()
        } else {
          setError(res.message || 'Failed to update user')
        }
      } else {
        const res = await createUser(form).unwrap()
        if (res.success) {
          onClose()
        } else {
          setError(res.message || 'Failed to create user')
        }
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'An error occurred')
    }
  }

  const saving = creating || updating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isEditing ? `Edit User: ${user.name}` : 'Create New User'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Sarah Connor"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                placeholder="sarah@example.com"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
              Password {isEditing ? <span className="text-slate-400 font-normal normal-case">(Leave blank to keep current)</span> : '*'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={isEditing ? '••••••••' : 'Enter password (min 6 characters)'}
                required={!isEditing}
                minLength={6}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
              Assign Primary Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.roleRef}
                onChange={(e) => setForm((f) => ({ ...f, roleRef: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">No Role (Restricted)</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.permissions?.length || 0} permissions)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {groups.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">
                Assign Groups (Optional)
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl max-h-36 overflow-y-auto">
                {groups.map((group) => {
                  const active = form.groups.includes(group._id)
                  return (
                    <button
                      key={group._id}
                      type="button"
                      onClick={() => toggleGroup(group._id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5',
                        active
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                      )}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color || '#6b7280' }} />
                      {group.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Account Active</p>
              <p className="text-xs text-slate-500">Allow this user to sign in to the CMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2 transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
