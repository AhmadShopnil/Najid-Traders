'use client'

import { useState } from 'react'
import { Package, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductGallery({ images = [], title = 'Product', className = '' }) {
  const validImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : []

  const [activeIndex, setActiveIndex] = useState(0)

  // Fallback: No images
  if (validImages.length === 0) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[4/3] flex items-center justify-center text-slate-300', className)}>
        <Package className="h-16 w-16" />
      </div>
    )
  }

  const currentImage = validImages[activeIndex] || validImages[0]
  const hasMultiple = validImages.length > 1

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Preview Container */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white aspect-[4/3] group shadow-xs">
        <img
          src={currentImage}
          alt={`${title} - view ${activeIndex + 1}`}
          className="h-full w-full object-contain p-2 transition-all duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {activeIndex === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Cover Image
            </span>
          )}
        </div>

        {hasMultiple && (
          <span className="absolute top-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
            {activeIndex + 1} / {validImages.length}
          </span>
        )}

        {/* Prev / Next Arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-md border border-slate-200 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-md border border-slate-200 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {hasMultiple && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {validImages.map((img, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'relative aspect-square w-16 sm:w-20 rounded-lg overflow-hidden border bg-white transition cursor-pointer p-1',
                  isActive
                    ? 'ring-2 ring-[#16385D] border-transparent shadow-sm'
                    : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                )}
                title={idx === 0 ? 'Cover Image' : `Additional photo ${idx}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                {idx === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white text-center font-semibold py-0.5">
                    Cover
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
