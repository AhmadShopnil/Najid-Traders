'use client'

import { useState } from 'react'
import { useGetModuleQuery } from '@/store/services/modulesApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { ModuleFormPage } from './ModuleFormPage'
import { FieldBuilder } from './FieldBuilder'
import { TaxonomyManager } from '@/components/taxonomies/TaxonomyManager'

export function ModuleEditorPage({ moduleId }) {
  const { data: res, isLoading } = useGetModuleQuery(moduleId)
  const module = res?.data
  const [tab, setTab] = useState('settings')

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }
  if (!module) return <p className="text-slate-500 text-center py-20">Module not found.</p>

  const TABS = [
    { key: 'settings', label: 'Settings' },
    { key: 'fields', label: 'Fields' },
    { key: 'taxonomies', label: 'Categories & Taxonomies' },
  ]

  return (
    <div>
      <PageHeader
        title={`${module.icon} ${module.name}`}
        description={`Module Slug: /${module.slug}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules', href: '/dashboard/modules' },
          { label: module.name },
        ]}
        apiEndpoints={[
          {
            label: 'Module Schema (Admin)',
            path: `/api/admin/modules/${module._id}`,
            isPublic: false,
            description: 'Returns schema definition, fields, and settings for this module'
          },
          {
            label: 'Module Taxonomies (Admin)',
            path: `/api/admin/modules/${module._id}/taxonomies`,
            isPublic: false,
            description: 'Fetch all category systems and terms'
          },
          {
            label: 'Content Entries (Admin)',
            path: `/api/admin/contents?moduleId=${module._id}`,
            isPublic: false,
            description: 'Fetch entries data for this module'
          },
          {
            label: 'Public Content Feed',
            path: `/api/public/${module.slug}`,
            isPublic: true,
            description: 'Public REST endpoint returning published entries'
          },
          {
            label: 'Public Taxonomies Feed',
            path: `/api/public/${module.slug}/taxonomies`,
            isPublic: true,
            description: 'Public REST endpoint returning category terms'
          }
        ]}
      />
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'settings' ? (
        <ModuleFormPage existingModule={module} embedded />
      ) : tab === 'fields' ? (
        <FieldBuilder module={module} />
      ) : (
        <TaxonomyManager module={module} />
      )}
    </div>
  )
}
