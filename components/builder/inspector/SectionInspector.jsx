'use client'

import { Trash2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

function safeHex(val, fallback = '#ffffff') {
  return typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback
}

export function SectionInspector({ section, onUpdate, onDelete }) {
  const settings = section.settings || {}
  const cols = section.columns || 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-bold text-sm text-white">Section Properties</h4>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Section Name
        </label>
        <input
          type="text"
          value={section.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          HTML Anchor / ID (slug)
        </label>
        <input
          type="text"
          value={section.slug || ''}
          onChange={(e) => onUpdate({ slug: slugify(e.target.value) })}
          placeholder="features-section"
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Columns Count
          </label>
          <select
            value={cols}
            onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          >
            <option value={1}>1 Column (100%)</option>
            <option value={2}>2 Columns Side-by-Side</option>
            <option value={3}>3 Columns Side-by-Side</option>
            <option value={4}>4 Columns Grid</option>
          </select>
        </div>

        {cols >= 2 && (
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Column Ratio
            </label>
            <select
              value={settings.columnRatio || 'equal'}
              onChange={(e) => onUpdate({ settings: { columnRatio: e.target.value } })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="equal">Equal Width</option>
              {cols === 2 && <option value="66-33">Wide Left (66% / 33%)</option>}
              {cols === 2 && <option value="33-66">Wide Right (33% / 66%)</option>}
              {cols === 3 && <option value="25-50-25">Center Wide (25/50/25)</option>}
            </select>
          </div>
        )}
      </div>

      {cols >= 2 && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Column Gap
            </label>
            <select
              value={settings.gap || 'normal'}
              onChange={(e) => onUpdate({ settings: { gap: e.target.value } })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="none">None (0px)</option>
              <option value="small">Small (16px)</option>
              <option value="normal">Normal (32px)</option>
              <option value="large">Large (48px)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Vertical Align
            </label>
            <select
              value={settings.verticalAlign || 'center'}
              onChange={(e) => onUpdate({ settings: { verticalAlign: e.target.value } })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="top">Top</option>
              <option value="center">Middle / Center</option>
              <option value="bottom">Bottom</option>
              <option value="stretch">Stretch Equal</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Background Style
        </label>
        <select
          value={settings.bgType || 'light'}
          onChange={(e) => onUpdate({ settings: { bgType: e.target.value } })}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
        >
          <option value="light">Light / Custom Color</option>
          <option value="dark">Dark Slate (#0f172a)</option>
          <option value="gradient">Deep Purple Gradient</option>
          <option value="transparent">Transparent</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Custom Background Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={safeHex(settings.bgColor, '#ffffff')}
            onChange={(e) => onUpdate({ settings: { bgColor: e.target.value } })}
            className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={settings.bgColor || '#ffffff'}
            onChange={(e) => onUpdate({ settings: { bgColor: e.target.value } })}
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Background Image URL (Optional)
        </label>
        <input
          type="text"
          placeholder="https://images.unsplash.com/..."
          value={settings.bgImage || ''}
          onChange={(e) => onUpdate({ settings: { bgImage: e.target.value } })}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
        />
        {settings.bgImage && (
          <label className="flex items-center gap-2 text-xs text-slate-300 mt-2">
            <input
              type="checkbox"
              checked={!!settings.bgOverlay}
              onChange={(e) => onUpdate({ settings: { bgOverlay: e.target.checked } })}
            />
            Add Dark Contrast Overlay
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Vertical Padding
          </label>
          <select
            value={settings.padding || 'normal'}
            onChange={(e) => onUpdate({ settings: { padding: e.target.value } })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          >
            <option value="none">Compact (py-2)</option>
            <option value="small">Small (py-8)</option>
            <option value="normal">Normal (py-16)</option>
            <option value="large">Spacious (py-24)</option>
            <option value="xl">Extra Large (py-32)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Container Width
          </label>
          <select
            value={settings.containerWidth || 'boxed'}
            onChange={(e) => onUpdate({ settings: { containerWidth: e.target.value } })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          >
            <option value="narrow">Narrow (Max 4XL)</option>
            <option value="boxed">Boxed (Max 7XL)</option>
            <option value="full">Full Width (100%)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
