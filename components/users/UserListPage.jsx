'use client'

import { useState } from 'react'
import { useGetUsersQuery, useDeleteUserMutation } from '@/store/services/usersApi'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatsCard } from '@/components/ui/StatsCard'
import { UserModal } from './UserModal'
import { Plus, Edit2, Trash2, Shield, Users, UserCheck, UserX, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function UserListPage() {
  const { can } = usePermission()
  const canCreate = can('users:create')
  const canUpdate = can('users:update')
  const canDelete = can('users:delete')

  const { data: res, isLoading } = useGetUsersQuery()
  const users = res?.data || []

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation()

  const activeUsersCount = users.filter((u) => u.isActive).length
  const inactiveUsersCount = users.length - activeUsersCount
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive)
    return matchesSearch && matchesStatus
  })

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteUser(deleteTarget._id)
    setDeleteTarget(null)
  }

  function handleCreate() {
    if (!canCreate) return
    setSelectedUser(null)
    setModalOpen(true)
  }

  function handleEdit(user) {
    if (!canUpdate) return
    setSelectedUser(user)
    setModalOpen(true)
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5b5ce6] ring-1 ring-indigo-100 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
            {val ? val[0] : 'U'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-tight">{val}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (_, row) => {
        if (row.roleRef && typeof row.roleRef === 'object') {
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: row.roleRef.color || '#6b7280' }}
            >
              <Shield className="w-3 h-3" />
              {row.roleRef.name}
            </span>
          )
        }
        return <StatusBadge status={row.role || 'user'} />
      },
    },
    {
      key: 'groups',
      label: 'Groups',
      render: (_, row) => {
        const userGroups = row.groups || []
        if (userGroups.length === 0) return <span className="text-xs text-slate-400">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {userGroups.map((g, idx) => (
              <span
                key={g._id || idx}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white shadow-xs"
                style={{ backgroundColor: g.color || '#0891b2' }}
              >
                {g.name}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      label: '',
      cellClassName: 'text-right',
      render: (_, row) => {
        if (!canUpdate && !canDelete) return null
        return (
          <div className="flex justify-end gap-1">
            {canUpdate && (
              <button
                type="button"
                onClick={() => handleEdit(row)}
                title="Edit User"
                className="text-slate-400 hover:text-[#5b5ce6] hover:bg-indigo-50 p-2 rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                title="Delete User"
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage your team members, roles, and workspace access"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        apiEndpoints={[
          {
            label: 'All Users (Admin)',
            path: '/api/admin/users',
            isPublic: false,
            description: 'Returns list of CMS users with assigned roles and groups',
          },
          {
            label: 'RBAC Users (Admin)',
            path: '/api/admin/rbac/users',
            isPublic: false,
            description: 'Returns users with populated RBAC memberships',
          },
        ]}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Users" value={users.length} icon={Users} color="purple" loading={isLoading} />
        <StatsCard label="Active Users" value={activeUsersCount} icon={UserCheck} color="green" loading={isLoading} />
        <StatsCard label="Inactive Users" value={inactiveUsersCount} icon={UserX} color="amber" loading={isLoading} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 mb-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5f6fb] focus:bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/30 focus:border-[#5b5ce6] transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40 px-3.5 py-2 bg-[#f5f6fb] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/30"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
      />

      {modalOpen && (
        <UserModal
          open={modalOpen}
          user={selectedUser}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
