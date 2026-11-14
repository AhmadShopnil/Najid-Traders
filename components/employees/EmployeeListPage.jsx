'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Users,
  UserCheck,
  Briefcase,
  Star,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '@/store/services/employeesApi'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials, cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '',
  designation: '',
  department: 'Management',
  photo: '',
  phone: '',
  email: '',
  bio: '',
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
  featuredTitle: '',
  featuredQuote: '',
}

export function EmployeeListPage() {
  const { can } = usePermission()
  const canCreate = can('employees:create')
  const canUpdate = can('employees:update')
  const canDelete = can('employees:delete')

  const { data: res, isLoading } = useGetEmployeesQuery()
  const employees = res?.data || []

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean))
    return Array.from(set)
  }, [employees])

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesDept = deptFilter === 'all' || e.department === deptFilter
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      return matchesDept && matchesSearch
    })
  }, [employees, search, deptFilter])

  const activeCount = employees.filter((e) => e.isActive !== false).length
  const featuredCount = employees.filter((e) => Boolean(e.isFeatured)).length

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(emp) {
    setEditing(emp)
    setForm({
      name: emp.name || '',
      designation: emp.designation || '',
      department: emp.department || 'Operations',
      photo: emp.photo || '',
      phone: emp.phone || '',
      email: emp.email || '',
      bio: emp.bio || '',
      sortOrder: emp.sortOrder ?? 0,
      isActive: emp.isActive !== false,
      isFeatured: Boolean(emp.isFeatured),
      featuredTitle: emp.featuredTitle || '',
      featuredQuote: emp.featuredQuote || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.designation.trim()) {
      setFormError('Name and designation are required.')
      return
    }

    try {
      if (editing) {
        await updateEmployee({ id: editing._id, ...form }).unwrap()
      } else {
        await createEmployee(form).unwrap()
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(err?.data?.message || 'Failed to save employee.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteEmployee(deleteTarget._id)
    setDeleteTarget(null)
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Employees & Team"
        description="Manage company team members, designations, and public contact details"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees' }]}
        apiEndpoints={[
          {
            label: 'All Employees (Admin)',
            path: '/api/admin/employees',
            isPublic: false,
            description: 'Returns all company team members',
          },
          {
            label: 'Public Team Feed',
            path: '/api/public/employees',
            isPublic: true,
            description: 'Active team members displayed on the public /team page',
          },
        ]}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Employees" value={employees.length} icon={Users} color="purple" loading={isLoading} />
        <StatsCard label="Active on Website" value={activeCount} icon={UserCheck} color="green" loading={isLoading} />
        <StatsCard label="Featured Spotlight" value={featuredCount} icon={Star} color="amber" loading={isLoading} />
        <StatsCard label="Departments" value={departments.length} icon={Briefcase} color="blue" loading={isLoading} />
      </div>

      {/* Search & Department Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, designation, or department..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5f6fb] focus:bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] transition"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-full sm:w-48 px-3.5 py-2 bg-[#f5f6fb] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Add your team members so visitors can see who runs your business on the public Team page."
          action={
            canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add First Employee
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => (
            <div
              key={emp._id}
              className={cn(
                'bg-white rounded-2xl border p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4',
                emp.isActive !== false ? 'border-slate-200/80' : 'border-slate-200/80 opacity-65'
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {emp.photo ? (
                      <img
                        src={emp.photo}
                        alt={emp.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200/80 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5b5ce6] ring-1 ring-indigo-100 flex items-center justify-center font-bold text-base flex-shrink-0">
                        {getInitials(emp.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate">{emp.name}</h3>
                      <p className="text-xs font-semibold text-[#5b5ce6] truncate">{emp.designation}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5f6fb] text-slate-600 border border-slate-200/70">
                          {emp.department || 'Operations'}
                        </span>
                        {emp.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => updateEmployee({ id: emp._id, isActive: !(emp.isActive !== false) })}
                      title={emp.isActive !== false ? 'Hide from public site' : 'Show on public site'}
                      className="text-slate-400 hover:text-[#5b5ce6] transition cursor-pointer flex-shrink-0"
                    >
                      {emp.isActive !== false ? (
                        <ToggleRight className="w-7 h-7 text-[#5b5ce6]" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" />
                      )}
                    </button>
                  )}
                </div>

                {emp.bio && (
                  <p className="text-xs text-slate-500 mt-3.5 line-clamp-2 leading-relaxed">{emp.bio}</p>
                )}

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{emp.phone}</span>
                    </div>
                  )}
                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {(canUpdate || canDelete) && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => openEdit(emp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-[#f5f6fb] hover:bg-indigo-50 hover:text-[#5b5ce6] rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(emp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50/70 hover:bg-red-100 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#fafbfe] sticky top-0 z-10">
              <h2 className="text-base font-bold text-slate-900">
                {editing ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Photo</label>
                <ImageUpload
                  value={form.photo}
                  onChange={(url) => setForm((f) => ({ ...f, photo: url }))}
                  folder="employees"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Md. Najidul Islam"
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                    placeholder="e.g. Managing Director"
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. China Imports, Apparel"
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1700-000000"
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@najidtraders.com"
                    className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Short Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Role and expertise in Najid Traders..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fc] focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6]"
                />
              </div>

              {/* Executive Spotlight Section */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Executive Spotlight (Featured Member)
                    </span>
                    <p className="text-[11px] text-amber-800/80">
                      Feature this person in large prominent spotlight cards on the public Team page.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {form.isFeatured && (
                  <div className="space-y-3 pt-2 border-t border-amber-200/50">
                    <div>
                      <label className="block text-xs font-semibold text-amber-950 mb-1">
                        Featured Title / Honorific Badge
                      </label>
                      <input
                        type="text"
                        value={form.featuredTitle}
                        onChange={(e) => setForm((f) => ({ ...f, featuredTitle: e.target.value }))}
                        placeholder="e.g. Founder & Managing Director, Chief Sourcing Officer"
                        className="w-full px-3 py-1.5 bg-white border border-amber-300/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-950 mb-1">
                        Executive Quote / Leadership Vision
                      </label>
                      <textarea
                        rows={2}
                        value={form.featuredQuote}
                        onChange={(e) => setForm((f) => ({ ...f, featuredQuote: e.target.value }))}
                        placeholder="Direct factory sourcing and quality assurance are the backbone of our wholesale partnership..."
                        className="w-full px-3 py-1.5 bg-white border border-amber-300/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {(creating || updating) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editing ? 'Save Changes' : 'Add Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from the team?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
