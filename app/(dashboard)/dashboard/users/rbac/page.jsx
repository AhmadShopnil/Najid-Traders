'use client'

import { useState } from 'react'
import { Shield, Users, Boxes, Plus, Edit2, Trash2, Search, ShieldAlert, AlertCircle } from 'lucide-react'
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useGetGroupsQuery,
  useDeleteGroupMutation,
  useGetRbacUsersQuery,
  useUpdateUserRbacMutation,
} from '@/store/services/rbacApi'
import { usePermission } from '@/hooks/usePermission'
import { useDebounce } from '@/hooks/useDebounce'
import { RoleEditor } from '@/components/rbac/RoleEditor'
import { GroupEditor } from '@/components/rbac/GroupEditor'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/utils'

function RoleBadge({ color, name }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs" style={{ backgroundColor: color || '#6b7280' }}>
      {name}
    </span>
  )
}

export default function RbacPage() {
  const { can, isSuperAdmin } = usePermission()
  const canManageRoles = can('roles:manage')
  const canManageGroups = can(['roles:manage', 'groups:manage'])
  const canUpdateUsers = can(['roles:manage', 'users:update'])

  const [tab, setTab] = useState(canManageRoles ? 'roles' : canManageGroups ? 'groups' : 'users')
  const [roleModal, setRoleModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const debouncedUserSearch = useDebounce(userSearch, 300)
  const [actionError, setActionError] = useState('')

  const hasAnyRbacAccess = canManageRoles || canManageGroups || canUpdateUsers

  const { data: rolesRes, isLoading: rolesLoading } = useGetRolesQuery(undefined, { skip: !hasAnyRbacAccess })
  const { data: groupsRes, isLoading: groupsLoading } = useGetGroupsQuery(undefined, { skip: !hasAnyRbacAccess })
  const { data: usersRes } = useGetRbacUsersQuery({ q: debouncedUserSearch || undefined }, { skip: !canUpdateUsers })

  const roles = rolesRes?.data || []
  const groups = groupsRes?.data || []
  const users = usersRes?.data || []

  const [deleteRole, { isLoading: deletingRole }] = useDeleteRoleMutation()
  const [deleteGroup, { isLoading: deletingGroup }] = useDeleteGroupMutation()
  const [updateUserRbac] = useUpdateUserRbacMutation()

  if (!hasAnyRbacAccess) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">You do not have permission to manage roles or access control.</p>
      </div>
    )
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setActionError('')
    try {
      if (deleteTarget.type === 'role' && canManageRoles) {
        await deleteRole(deleteTarget.item._id).unwrap()
      } else if (deleteTarget.type === 'group' && canManageGroups) {
        await deleteGroup(deleteTarget.item._id).unwrap()
      }
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err?.data?.message || 'Delete action failed')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        description="Manage roles, groups, and user permissions"
        apiEndpoints={[
          {
            label: 'Roles List (Admin)',
            path: '/api/admin/rbac/roles',
            isPublic: false,
            description: 'Returns all defined RBAC roles and permissions',
          },
          {
            label: 'Groups List (Admin)',
            path: '/api/admin/rbac/groups',
            isPublic: false,
            description: 'Returns all groups and assigned roles/permissions',
          },
          {
            label: 'Master Permissions Matrix (Admin)',
            path: '/api/admin/rbac/permissions',
            isPublic: false,
            description: 'Returns complete catalogue of system resources and permissions',
          },
          {
            label: 'RBAC Users (Admin)',
            path: '/api/admin/rbac/users',
            isPublic: false,
            description: 'Returns users with populated RBAC memberships',
          },
        ]}
        actions={
          tab === 'roles' && canManageRoles ? (
            <button
              type="button"
              onClick={() => setRoleModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Role
            </button>
          ) : tab === 'groups' && canManageGroups ? (
            <button
              type="button"
              onClick={() => setGroupModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Group
            </button>
          ) : null
        }
      />

      {actionError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          canManageRoles && { key: 'roles', icon: Shield, label: 'Roles' },
          canManageGroups && { key: 'groups', icon: Boxes, label: 'Groups' },
          canUpdateUsers && { key: 'users', icon: Users, label: 'Users & Assignments' },
        ]
          .filter(Boolean)
          .map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
                tab === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
      </div>

      {tab === 'roles' && canManageRoles && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)
          ) : (
            roles.map((role) => (
              <div key={role._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <RoleBadge color={role.color} name={role.name} />
                    {role.isSystem ? (
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">System</span>
                    ) : (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setRoleModal(role)} className="p-1 text-slate-400 hover:text-purple-600 rounded">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: 'role', item: role })} className="p-1 text-slate-400 hover:text-red-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-2">/{role.slug}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{role.description || 'No description provided.'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{role.permissions?.length || 0} permissions</span>
                  {role.isSystem && (
                    <button type="button" className="text-purple-600 font-semibold hover:underline" onClick={() => setRoleModal(role)}>
                      {role.slug === 'super_admin' ? 'View Details' : 'Customize Permissions'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'groups' && canManageGroups && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)
          ) : groups.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Groups Created</p>
              <p className="text-xs text-slate-400 mt-1">Create a group to cluster roles and permissions together.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <RoleBadge color={group.color} name={group.name} />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setGroupModal(group)} className="p-1 text-slate-400 hover:text-purple-600 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ type: 'group', item: group })} className="p-1 text-slate-400 hover:text-red-600 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-2">/{group.slug}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{group.description || 'No description'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{group.members?.length || 0} members</span>
                  <span>{group.roles?.length || 0} roles · {group.permissions?.length || 0} direct</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && canUpdateUsers && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Primary Role</th>
                  <th className="px-5 py-3">Groups</th>
                  <th className="px-5 py-3 text-right">Effective Perms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={u.roleRef?._id || ''}
                        disabled={!canUpdateUsers}
                        onChange={async (e) => {
                          setActionError('')
                          try {
                            await updateUserRbac({ id: u._id, roleRef: e.target.value || null }).unwrap()
                          } catch (err) {
                            setActionError(err?.data?.message || 'Failed to update user role')
                          }
                        }}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">No Role (Restricted)</option>
                        {roles
                          .filter((r) => isSuperAdmin || r.slug !== 'super_admin')
                          .map((r) => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.groups || []).map((g) => (
                          <span key={g._id} className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: g.color || '#6b7280' }}>
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-purple-600">
                      {u.resolvedPermissionsCount || 0} permissions
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {roleModal && canManageRoles && (
        <RoleEditor role={roleModal === 'new' ? null : roleModal} onClose={() => setRoleModal(null)} />
      )}
      {groupModal && canManageGroups && (
        <GroupEditor group={groupModal === 'new' ? null : groupModal} onClose={() => setGroupModal(null)} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'role' ? 'Role' : 'Group'}`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingRole || deletingGroup}
      />
    </div>
  )
}
