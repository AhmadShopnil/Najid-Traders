'use client'

import { useState, useEffect } from 'react'
import {
  useAddFieldMutation,
  useDeleteFieldMutation,
  useUpdateFieldMutation,
  useReorderFieldsMutation,
} from '@/store/services/modulesApi'
import { usePermission } from '@/hooks/usePermission'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Edit2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddFieldModal } from './AddFieldModal'

function SortableField({ field, onDelete, onEdit, canUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
    disabled: !canUpdate,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-purple-200 transition"
    >
      {canUpdate && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{field.label}</span>
          {field.required && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
              required
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-mono">
          {field.name} · {field.type}
        </p>
      </div>
      {canUpdate && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(field)}
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
            aria-label={`Edit ${field.label}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(field)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            aria-label={`Delete ${field.label}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export function FieldBuilder({ module }) {
  const { can } = usePermission()
  const canUpdate = can('modules:update')

  const [addOpen, setAddOpen] = useState(false)
  const [editField, setEditField] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [fields, setFields] = useState(module.fields || [])
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    setFields(module.fields || [])
  }, [module.fields])

  const [addField, { isLoading: adding }] = useAddFieldMutation()
  const [deleteField, { isLoading: deleting }] = useDeleteFieldMutation()
  const [updateField, { isLoading: updating }] = useUpdateFieldMutation()
  const [reorderFields] = useReorderFieldsMutation()

  async function handleDragEnd(event) {
    if (!canUpdate) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const prevFields = fields
    const reordered = arrayMove(fields, oldIndex, newIndex)
    setFields(reordered)
    try {
      await reorderFields({ moduleId: module._id, fields: reordered.map((f) => f.id) }).unwrap()
    } catch (err) {
      setFields(prevFields)
      setActionError(err?.data?.message || 'Failed to save field order')
    }
  }

  async function handleSaveField(fieldData) {
    setActionError(null)
    try {
      if (editField) {
        await updateField({ moduleId: module._id, fieldId: editField.id, ...fieldData }).unwrap()
        setEditField(null)
      } else {
        await addField({ moduleId: module._id, ...fieldData }).unwrap()
      }
      setAddOpen(false)
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to save field')
    }
  }

  async function handleDeleteField() {
    if (!deleteTarget) return
    setActionError(null)
    try {
      await deleteField({ moduleId: module._id, fieldId: deleteTarget.id }).unwrap()
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to delete field')
    }
  }

  return (
    <div className="max-w-2xl">
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">
          {fields.length} Field{fields.length !== 1 ? 's' : ''}
        </h3>
        {canUpdate && (
          <button
            type="button"
            onClick={() => {
              setEditField(null)
              setAddOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add Field
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm">
            No fields yet. {canUpdate ? 'Add your first field to define the content structure.' : 'No fields defined.'}
          </p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onDelete={setDeleteTarget}
                  onEdit={(f) => {
                    setEditField(f)
                    setAddOpen(true)
                  }}
                  canUpdate={canUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {canUpdate && (
        <AddFieldModal
          open={addOpen}
          initialData={editField}
          onClose={() => {
            setAddOpen(false)
            setEditField(null)
          }}
          onSubmit={handleSaveField}
          loading={adding || updating}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Field"
        message={`Delete field "${deleteTarget?.label}"? Existing content data for this field will remain but won't be editable.`}
        onConfirm={handleDeleteField}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
