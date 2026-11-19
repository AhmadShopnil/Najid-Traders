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
        <div className="space-y-2">
          {multiple && (
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{currentImages.length} image{currentImages.length > 1 ? 's' : ''} in gallery</span>
              <span className="text-[11px] text-slate-400">Click &ldquo;Add More&rdquo; to add additional photos</span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentImages.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                {multiple && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/75 text-[10px] font-bold text-white backdrop-blur-xs">
                    #{i + 1}
                  </span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition shadow-sm"
                    aria-label="Remove image"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {!multiple && !disabled && (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white transition shadow-sm"
                  >
                    Change
                  </button>
                )}
              </div>
            ))}
            {multiple && !disabled && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 transition text-slate-400 hover:text-purple-600 cursor-pointer"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Add More</span>
              </button>
            )}
          </div>
        </div>
      )}

      {currentImages.length === 0 && !disabled && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-purple-300 transition group cursor-pointer"
        >
          <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-purple-500 transition mb-2" />
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-purple-600">
              {multiple ? 'Click to select or upload multiple images' : 'Click to select or upload image'}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {multiple ? 'Select multiple photos from media library' : 'Select single feature/cover image'}
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
