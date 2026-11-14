'use client'

import { useState } from 'react'
import { X, Image as ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'

export function ImageUpload({ value, onChange, multiple = false, folder = 'general', disabled = false, className }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const currentImages = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (value ? [value] : [])

  function handleSelect(urls) {
    if (disabled) return
    if (multiple) {
      onChange([...currentImages, ...(Array.isArray(urls) ? urls : [urls]).filter(Boolean)])
    } else {
      onChange(urls)
    }
  }

  function handleRemove(indexToRemove) {
    if (disabled) return
    if (multiple) {
      onChange(currentImages.filter((_, i) => i !== indexToRemove))
    } else {
      onChange('')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {currentImages.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition shadow-sm"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {multiple && !disabled && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-400 hover:bg-slate-50 transition text-slate-400 hover:text-purple-500"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Add More</span>
            </button>
          )}
        </div>
      )}

      {currentImages.length === 0 && !disabled && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-purple-300 transition group"
        >
          <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-purple-500 transition mb-2" />
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-purple-600">Click to select or upload</span> media
          </p>
        </button>
      )}

      {currentImages.length === 0 && disabled && (
        <div className="flex items-center justify-center w-full h-24 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-400">
          No image uploaded
        </div>
      )}

      {!disabled && (
        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelect}
          multiple={multiple}
          defaultFolder={folder}
        />
      )}
    </div>
  )
}
