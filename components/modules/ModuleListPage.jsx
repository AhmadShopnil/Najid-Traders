'use client'

import Link from 'next/link'
import { Plus, Search, Boxes, CheckCircle2, PauseCircle } from 'lucide-react'
import { useState } from 'react'
import { useGetModulesQuery, useDeleteModuleMutation, useUpdateModuleMutation } from '@/store/services/modulesApi'
import { useI18n } from '@/hooks/useI18n'
import { useDebounce } from '@/hooks/useDebounce'
import { usePermission } from '@/hooks/usePermission'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCard } from '@/components/ui/StatsCard'
import { ModuleCard } from './ModuleCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'

export function ModuleListPage() {
  const { translate: t } = useI18n()
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data: res, isLoading } = useGetModulesQuery()
  const [deleteModule, { isLoading: deleting }] = useDeleteModuleMutation()
  const [updateModule] = useUpdateModuleMutation()

  const allModules = res?.data || []
  const activeCount = allModules.filter((m) => m.isActive).length
  const inactiveCount = allModules.length - activeCount

  const modules = allModules.filter((m) =>
    m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    m.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  async function handleDelete() {
    await deleteModule(deleteTarget._id)
    setDeleteTarget(null)
  }

  const canCreate = can('modules:create')

  return (
    <div>
      <PageHeader
        title={t('modules.title')}
        description="Create and manage dynamic content modules"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Modules' }]}
        apiEndpoints={[
          {
            label: 'All Modules (Admin)',
            path: '/api/admin/modules',
            isPublic: false,
            description: 'Returns all module schema definitions and settings',
          },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/dashboard/modules/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition"
            >
              <Plus className="w-4 h-4" /> {t('modules.createModule')}
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Modules" value={allModules.length} icon={Boxes} color="purple" loading={isLoading} />
        <StatsCard label="Active Modules" value={activeCount} icon={CheckCircle2} color="green" loading={isLoading} />
        <StatsCard label="Inactive Modules" value={inactiveCount} icon={PauseCircle} color="amber" loading={isLoading} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 mb-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules by name or slug..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5f6fb] focus:bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/30 focus:border-[#5b5ce6] transition"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={t('modules.noModules')}
          description="Start by creating your first module to manage content."
          action={
            canCreate ? (
              <Link
                href="/dashboard/modules/new"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl"
              >
                <Plus className="w-4 h-4" /> {t('modules.createModule')}
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <ModuleCard
              key={module._id}
              module={module}
              onDelete={() => setDeleteTarget(module)}
              onToggle={() => updateModule({ id: module._id, isActive: !module.isActive })}
            />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('modules.deleteModule')}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated content will be permanently lost.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
