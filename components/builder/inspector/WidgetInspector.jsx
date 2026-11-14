'use client'

import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DynamicWidgetInspector } from './DynamicWidgetInspector'

function safeHex(val, fallback = '#ffffff') {
  return typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback
}

export function WidgetInspector({
  widget,
  sectionColumns = 1,
  defaultCol = 0,
  availableModules = [],
  onUpdate,
  onDelete,
}) {
  const { type, props = {} } = widget
  const currentCol = widget.column !== undefined ? widget.column : defaultCol

  const activeMod = useMemo(() => {
    if (!['module_grid', 'module_categories', 'module_detail'].includes(type)) return null
    if (props.moduleSlug) {
      return availableModules.find((m) => m.slug === props.moduleSlug) || null
    }
    return availableModules[0] || null
  }, [type, props.moduleSlug, availableModules])

  const moduleTerms = useMemo(() => {
    if (!activeMod) return []
    const terms = []
    ;(activeMod.taxonomies || []).forEach((tax) => {
      ;(tax.terms || []).forEach((t) => {
        terms.push({ ...t, taxName: tax.name, taxSlug: tax.slug })
      })
    })
    return terms
  }, [activeMod])

  const moduleSchemaFields = useMemo(() => {
    return activeMod?.fields || []
  }, [activeMod])

  const isDynamicType = ['module_grid', 'module_categories', 'module_detail'].includes(type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-bold text-sm text-white capitalize">
          {type.replace('_', ' ')} Settings
        </h4>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      {/* Column placement selector when section has 2+ columns */}
      {sectionColumns > 1 && (
        <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50">
          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5">
            Column Placement
          </label>
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: sectionColumns }).map((_, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => onUpdate({}, cIdx)}
                className={cn(
                  'py-1 px-2 rounded-lg text-xs font-bold transition',
                  currentCol === cIdx
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                Col {cIdx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {isDynamicType && (
        <DynamicWidgetInspector
          type={type}
          props={props}
          activeMod={activeMod}
          moduleTerms={moduleTerms}
          moduleSchemaFields={moduleSchemaFields}
          availableModules={availableModules}
          onUpdate={onUpdate}
        />
      )}

      {/* HEADING INSPECTOR */}
      {type === 'heading' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Top Badge (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. OUR SERVICES"
              value={props.badge || ''}
              onChange={(e) => onUpdate({ badge: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Headline Text
            </label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Subtitle (Optional)
            </label>
            <textarea
              rows={2}
              value={props.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                HTML Tag
              </label>
              <select
                value={props.tag || 'h2'}
                onChange={(e) => onUpdate({ tag: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Size
              </label>
              <select
                value={props.size || 'large'}
                onChange={(e) => onUpdate({ size: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Text Color & Alignment
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={safeHex(props.color, '#0f172a')}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-8 h-8 rounded bg-transparent border border-slate-700"
              />
              <input
                type="text"
                value={props.color || '#0f172a'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdate({ align: al })}
                  className={cn(
                    'flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize',
                    props.align === al ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  )}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* TEXT EDITOR INSPECTOR */}
      {type === 'text' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Content Paragraph
            </label>
            <textarea
              rows={5}
              value={props.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Font Size
              </label>
              <select
                value={props.size || 'base'}
                onChange={(e) => onUpdate({ size: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="sm">Small</option>
                <option value="base">Normal</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Color
              </label>
              <input
                type="color"
                value={safeHex(props.color, '#475569')}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-8 rounded bg-transparent border border-slate-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Alignment
            </label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdate({ align: al })}
                  className={cn(
                    'flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize',
                    props.align === al ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  )}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* BUTTON INSPECTOR */}
      {type === 'button' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Link URL
            </label>
            <input
              type="text"
              value={props.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Variant
              </label>
              <select
                value={props.variant || 'primary'}
                onChange={(e) => onUpdate({ variant: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="primary">Primary (Purple)</option>
                <option value="secondary">Dark Slate</option>
                <option value="outline">Outline</option>
                <option value="gradient">Pink-Purple Gradient</option>
                <option value="emerald">Emerald Green</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Size
              </label>
              <select
                value={props.size || 'md'}
                onChange={(e) => onUpdate({ size: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            {['left', 'center', 'right'].map((al) => (
              <button
                key={al}
                type="button"
                onClick={() => onUpdate({ align: al })}
                className={cn(
                  'flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize',
                  props.align === al ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                )}
              >
                {al}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!props.fullWidth}
                onChange={(e) => onUpdate({ fullWidth: e.target.checked })}
              />
              Full Width Button
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!props.openNewTab}
                onChange={(e) => onUpdate({ openNewTab: e.target.checked })}
              />
              Open Link in New Tab
            </label>
          </div>
        </>
      )}

      {/* ICON LIST / CHECKLIST INSPECTOR */}
      {type === 'icon_list' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              List Title (Optional)
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Layout
              </label>
              <select
                value={props.layout || 'vertical'}
                onChange={(e) => onUpdate({ layout: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="vertical">Vertical Stack</option>
                <option value="horizontal">Horizontal Inline</option>
                <option value="grid-2">2-Column Grid</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Icon Color
              </label>
              <input
                type="color"
                value={safeHex(props.iconColor, '#7c3aed')}
                onChange={(e) => onUpdate({ iconColor: e.target.value })}
                className="w-full h-8 rounded bg-transparent border border-slate-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Checklist Items (One per line)
            </label>
            <textarea
              rows={5}
              value={(props.items || []).join('\n')}
              onChange={(e) => onUpdate({ items: e.target.value.split('\n') })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </>
      )}

      {/* HERO INSPECTOR */}
      {type === 'hero' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Top Badge Text
            </label>
            <input
              type="text"
              value={props.badge || ''}
              onChange={(e) => onUpdate({ badge: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hero Headline
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Subtitle
            </label>
            <textarea
              rows={3}
              value={props.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Alignment
              </label>
              <select
                value={props.align || 'center'}
                onChange={(e) => onUpdate({ align: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Background Style
              </label>
              <select
                value={props.bgType || 'gradient'}
                onChange={(e) => onUpdate({ bgType: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="gradient">Purple Gradient</option>
                <option value="dark">Dark Slate</option>
                <option value="light">Clean Light</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Primary Btn Text
              </label>
              <input
                type="text"
                value={props.primaryBtnText || ''}
                onChange={(e) => onUpdate({ primaryBtnText: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Primary Btn URL
              </label>
              <input
                type="text"
                value={props.primaryBtnUrl || ''}
                onChange={(e) => onUpdate({ primaryBtnUrl: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Secondary Btn Text
              </label>
              <input
                type="text"
                value={props.secondaryBtnText || ''}
                onChange={(e) => onUpdate({ secondaryBtnText: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Secondary Btn URL
              </label>
              <input
                type="text"
                value={props.secondaryBtnUrl || ''}
                onChange={(e) => onUpdate({ secondaryBtnUrl: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hero Showcase Image URL (Optional)
            </label>
            <input
              type="text"
              value={props.heroImage || ''}
              onChange={(e) => onUpdate({ heroImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </>
      )}

      {/* IMAGE INSPECTOR */}
      {type === 'image' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={props.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Caption / Alt Text
            </label>
            <input
              type="text"
              value={props.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value, alt: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Click Link URL (Optional)
            </label>
            <input
              type="text"
              placeholder="https://... or /page-slug"
              value={props.linkUrl || ''}
              onChange={(e) => onUpdate({ linkUrl: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Aspect Ratio
              </label>
              <select
                value={props.aspectRatio || 'auto'}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="auto">Auto / Natural</option>
                <option value="16/9">16:9 Wide</option>
                <option value="4/3">4:3 Standard</option>
                <option value="1/1">1:1 Square</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Rounded Corners
              </label>
              <select
                value={props.rounded || 'xl'}
                onChange={(e) => onUpdate({ rounded: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="none">None</option>
                <option value="md">Medium</option>
                <option value="xl">Large (2XL)</option>
                <option value="full">Circle / Pill</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Alignment
            </label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdate({ align: al })}
                  className={cn(
                    'flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize',
                    (props.align || 'center') === al
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400'
                  )}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* VIDEO INSPECTOR */}
      {type === 'video' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              YouTube, Vimeo, or MP4 Video URL
            </label>
            <input
              type="text"
              value={props.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Video Title
              </label>
              <input
                type="text"
                value={props.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Aspect Ratio
              </label>
              <select
                value={props.aspectRatio || '16/9'}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="16/9">16:9 Widescreen</option>
                <option value="4/3">4:3 Classic</option>
                <option value="1/1">1:1 Square</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* GALLERY INSPECTOR */}
      {type === 'gallery' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Grid Columns
              </label>
              <select
                value={props.columns || 3}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Image Shape
              </label>
              <select
                value={props.aspectRatio || 'square'}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="square">Square (1:1)</option>
                <option value="video">Video (16:9)</option>
                <option value="auto">Auto / Natural</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Grid Gap Spacing
            </label>
            <select
              value={props.gap ?? 4}
              onChange={(e) => onUpdate({ gap: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value={2}>Compact (8px)</option>
              <option value={4}>Normal (16px)</option>
              <option value={6}>Relaxed (24px)</option>
              <option value={8}>Spacious (32px)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Image URLs (One URL per line)
            </label>
            <textarea
              rows={5}
              value={(props.images || []).join('\n')}
              onChange={(e) =>
                onUpdate({
                  images: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </>
      )}

      {/* STATS INSPECTOR */}
      {type === 'stats' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Columns
              </label>
              <select
                value={props.columns || 4}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Card Style
              </label>
              <select
                value={props.style || 'card'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="card">Light Card</option>
                <option value="dark">Dark Slate</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Stats Items</span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    items: [...(props.items || []), { value: '100+', label: 'New Metric' }],
                  })
                }
                className="text-xs text-purple-400 hover:text-white font-bold"
              >
                + Add Stat
              </button>
            </div>
            {(props.items || []).map((st, idx) => (
              <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Value (e.g. 99%)"
                    value={st.value || ''}
                    onChange={(e) => {
                      const next = [...props.items]
                      next[idx] = { ...st, value: e.target.value }
                      onUpdate({ items: next })
                    }}
                    className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={st.label || ''}
                    onChange={(e) => {
                      const next = [...props.items]
                      next[idx] = { ...st, label: e.target.value }
                      onUpdate({ items: next })
                    }}
                    className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ items: props.items.filter((_, i) => i !== idx) })
                    }
                    className="text-red-400 px-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FEATURES INSPECTOR */}
      {type === 'features' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Grid Columns
              </label>
              <select
                value={props.columns || 3}
                onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Card Style
              </label>
              <select
                value={props.cardStyle || 'bordered'}
                onChange={(e) => onUpdate({ cardStyle: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="bordered">Bordered</option>
                <option value="elevated">Shadow Elevated</option>
                <option value="minimal">Minimal Flat</option>
                <option value="dark">Dark Cards</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Feature Cards</span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    items: [
                      ...(props.items || []),
                      { title: 'New Feature', description: 'Feature description...', icon: '✨' },
                    ],
                  })
                }
                className="text-xs text-purple-400 hover:text-white font-bold"
              >
                + Add Card
              </button>
            </div>
            {(props.items || []).map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.icon || '✨'}
                    onChange={(e) => {
                      const next = [...props.items]
                      next[idx] = { ...item, icon: e.target.value }
                      onUpdate({ items: next })
                    }}
                    className="w-12 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-center text-white"
                    title="Emoji or Icon"
                  />
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => {
                      const next = [...props.items]
                      next[idx] = { ...item, title: e.target.value }
                      onUpdate({ items: next })
                    }}
                    className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ items: props.items.filter((_, i) => i !== idx) })
                    }
                    className="text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => {
                    const next = [...props.items]
                    next[idx] = { ...item, description: e.target.value }
                    onUpdate({ items: next })
                  }}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTA INSPECTOR */}
      {type === 'cta' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={props.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Button Label
              </label>
              <input
                type="text"
                value={props.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Button URL
              </label>
              <input
                type="text"
                value={props.buttonUrl || ''}
                onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Banner Theme
            </label>
            <select
              value={props.style || 'purple'}
              onChange={(e) => onUpdate({ style: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="purple">Purple Gradient</option>
              <option value="dark">Dark Slate</option>
              <option value="blue">Ocean Blue</option>
              <option value="emerald">Emerald Teal</option>
            </select>
          </div>
        </>
      )}

      {/* FAQ INSPECTOR */}
      {type === 'faq' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">FAQ Questions</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  items: [
                    ...(props.items || []),
                    { question: 'New Question?', answer: 'Answer goes here...' },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Question
            </button>
          </div>
          {(props.items || []).map((q, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between gap-2">
                <input
                  type="text"
                  value={q.question || ''}
                  onChange={(e) => {
                    const next = [...props.items]
                    next[idx] = { ...q, question: e.target.value }
                    onUpdate({ items: next })
                  }}
                  className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ items: props.items.filter((_, i) => i !== idx) })}
                  className="text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                value={q.answer || ''}
                onChange={(e) => {
                  const next = [...props.items]
                  next[idx] = { ...q, answer: e.target.value }
                  onUpdate({ items: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* PROGRESS BARS INSPECTOR */}
      {type === 'progress' && (
        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Skill Bars</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  items: [
                    ...(props.items || []),
                    { label: 'New Skill', percentage: 90, color: '#7c3aed' },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Bar
            </button>
          </div>
          {(props.items || []).map((bar, idx) => (
            <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <input
                type="text"
                value={bar.label || ''}
                onChange={(e) => {
                  const next = [...props.items]
                  next[idx] = { ...bar, label: e.target.value }
                  onUpdate({ items: next })
                }}
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={bar.percentage ?? 90}
                onChange={(e) => {
                  const next = [...props.items]
                  next[idx] = { ...bar, percentage: Number(e.target.value) }
                  onUpdate({ items: next })
                }}
                className="w-14 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <button
                type="button"
                onClick={() => onUpdate({ items: props.items.filter((_, i) => i !== idx) })}
                className="text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TEAM INSPECTOR */}
      {type === 'team' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Team Members</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  members: [
                    ...(props.members || []),
                    {
                      name: 'New Member',
                      role: 'Role Title',
                      bio: 'Short member bio...',
                      avatar:
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                    },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Member
            </button>
          </div>
          {(props.members || []).map((m, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between gap-1.5">
                <input
                  type="text"
                  placeholder="Name"
                  value={m.name || ''}
                  onChange={(e) => {
                    const next = [...props.members]
                    next[idx] = { ...m, name: e.target.value }
                    onUpdate({ members: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={m.role || ''}
                  onChange={(e) => {
                    const next = [...props.members]
                    next[idx] = { ...m, role: e.target.value }
                    onUpdate({ members: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ members: props.members.filter((_, i) => i !== idx) })}
                  className="text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Photo URL"
                value={m.avatar || ''}
                onChange={(e) => {
                  const next = [...props.members]
                  next[idx] = { ...m, avatar: e.target.value }
                  onUpdate({ members: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <textarea
                rows={2}
                placeholder="Bio"
                value={m.bio || ''}
                onChange={(e) => {
                  const next = [...props.members]
                  next[idx] = { ...m, bio: e.target.value }
                  onUpdate({ members: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* TABS INSPECTOR */}
      {type === 'tabs' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Content Tabs</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  tabs: [
                    ...(props.tabs || []),
                    { title: 'New Tab', badge: '', content: 'Tab content...', imageUrl: '' },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Tab
            </button>
          </div>
          {(props.tabs || []).map((t, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Tab Title"
                  value={t.title || ''}
                  onChange={(e) => {
                    const next = [...props.tabs]
                    next[idx] = { ...t, title: e.target.value }
                    onUpdate({ tabs: next })
                  }}
                  className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ tabs: props.tabs.filter((_, i) => i !== idx) })}
                  className="text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Content"
                value={t.content || ''}
                onChange={(e) => {
                  const next = [...props.tabs]
                  next[idx] = { ...t, content: e.target.value }
                  onUpdate({ tabs: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <input
                type="text"
                placeholder="Optional Image URL"
                value={t.imageUrl || ''}
                onChange={(e) => {
                  const next = [...props.tabs]
                  next[idx] = { ...t, imageUrl: e.target.value }
                  onUpdate({ tabs: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* NEWSLETTER INSPECTOR */}
      {type === 'newsletter' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Subtitle
            </label>
            <textarea
              rows={2}
              value={props.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={props.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Theme
              </label>
              <select
                value={props.style || 'dark'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="dark">Dark</option>
                <option value="purple">Purple</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* CONTACT FORM INSPECTOR */}
      {type === 'contact_form' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Form Heading
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={props.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submit Button Text
            </label>
            <input
              type="text"
              value={props.buttonText || ''}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </>
      )}

      {/* CUSTOM HTML INSPECTOR */}
      {type === 'custom_html' && (
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Custom HTML / Embed Code
          </label>
          <textarea
            rows={7}
            value={props.html || ''}
            onChange={(e) => onUpdate({ html: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Unsafe scripts and inline event handlers are automatically sanitized on render.
          </p>
        </div>
      )}

      {/* DIVIDER / SPACER INSPECTOR */}
      {type === 'divider' && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Height / Vertical Spacing (px)
            </label>
            <input
              type="number"
              min={8}
              max={200}
              value={props.height || 32}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Line Style
              </label>
              <select
                value={props.style || 'solid'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
                <option value="none">Invisible Spacer Only</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Line Color
              </label>
              <input
                type="color"
                value={safeHex(props.color, '#e2e8f0')}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-8 rounded bg-transparent border border-slate-700"
              />
            </div>
          </div>
        </>
      )}

      {/* LOGO GRID INSPECTOR */}
      {type === 'logo_grid' && (
        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Section Heading
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Partner Logos</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  items: [...(props.items || []), { name: 'New Partner', badge: '🌟 PARTNER' }],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Partner
            </button>
          </div>
          {(props.items || []).map((logo, idx) => (
            <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Brand Badge / Text"
                value={logo.badge || logo.name || ''}
                onChange={(e) => {
                  const next = [...props.items]
                  next[idx] = { ...logo, badge: e.target.value, name: e.target.value }
                  onUpdate({ items: next })
                }}
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <button
                type="button"
                onClick={() => onUpdate({ items: props.items.filter((_, i) => i !== idx) })}
                className="text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TESTIMONIALS INSPECTOR */}
      {type === 'testimonials' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Reviews</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  items: [
                    ...(props.items || []),
                    {
                      quote: 'Amazing platform and intuitive visual page builder!',
                      author: 'New Client',
                      role: 'CEO at Company',
                      rating: 5,
                    },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Review
            </button>
          </div>
          {(props.items || []).map((rev, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between gap-1.5">
                <input
                  type="text"
                  placeholder="Author"
                  value={rev.author || ''}
                  onChange={(e) => {
                    const next = [...props.items]
                    next[idx] = { ...rev, author: e.target.value }
                    onUpdate({ items: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={rev.role || ''}
                  onChange={(e) => {
                    const next = [...props.items]
                    next[idx] = { ...rev, role: e.target.value }
                    onUpdate({ items: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ items: props.items.filter((_, i) => i !== idx) })}
                  className="text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Quote"
                value={rev.quote || ''}
                onChange={(e) => {
                  const next = [...props.items]
                  next[idx] = { ...rev, quote: e.target.value }
                  onUpdate({ items: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* PRICING TABLE INSPECTOR */}
      {type === 'pricing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Pricing Plans</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  plans: [
                    ...(props.plans || []),
                    {
                      name: 'New Plan',
                      price: '$39',
                      period: '/month',
                      description: 'Great for teams.',
                      isPopular: false,
                      features: ['Feature 1', 'Feature 2'],
                      buttonText: 'Choose Plan',
                      buttonUrl: '#',
                    },
                  ],
                })
              }
              className="text-xs text-purple-400 hover:text-white font-bold"
            >
              + Add Plan
            </button>
          </div>
          {(props.plans || []).map((plan, idx) => (
            <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Plan Name"
                  value={plan.name || ''}
                  onChange={(e) => {
                    const next = [...props.plans]
                    next[idx] = { ...plan, name: e.target.value }
                    onUpdate({ plans: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Price"
                  value={plan.price || ''}
                  onChange={(e) => {
                    const next = [...props.plans]
                    next[idx] = { ...plan, price: e.target.value }
                    onUpdate({ plans: next })
                  }}
                  className="w-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ plans: props.plans.filter((_, i) => i !== idx) })}
                  className="text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-purple-300">
                <input
                  type="checkbox"
                  checked={!!plan.isPopular}
                  onChange={(e) => {
                    const next = [...props.plans]
                    next[idx] = { ...plan, isPopular: e.target.checked }
                    onUpdate({ plans: next })
                  }}
                />
                Highlight as Most Popular
              </label>
              <textarea
                rows={3}
                placeholder="Features (One per line)"
                value={(plan.features || []).join('\n')}
                onChange={(e) => {
                  const next = [...props.plans]
                  next[idx] = { ...plan, features: e.target.value.split('\n') }
                  onUpdate({ plans: next })
                }}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* UNIVERSAL ADVANCED BOX STYLING */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <span className="block text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">
          Advanced Widget Box Style
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Box Padding (px)</label>
            <input
              type="number"
              min={0}
              max={80}
              value={props._boxPadding || 0}
              onChange={(e) => onUpdate({ _boxPadding: Number(e.target.value) })}
              className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Corner Radius (px)</label>
            <input
              type="number"
              min={0}
              max={48}
              value={props._boxRounded || 0}
              onChange={(e) => onUpdate({ _boxRounded: Number(e.target.value) })}
              className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Box Shadow</label>
            <select
              value={props._boxShadow || ''}
              onChange={(e) => onUpdate({ _boxShadow: e.target.value })}
              className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="">None</option>
              <option value="sm">Subtle</option>
              <option value="lg">Medium</option>
              <option value="2xl">Deep</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Box Background</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={safeHex(props._boxBg, '#ffffff')}
                onChange={(e) => onUpdate({ _boxBg: e.target.value })}
                className="w-7 h-7 rounded bg-transparent border border-slate-700"
              />
              {props._boxBg && (
                <button
                  type="button"
                  onClick={() => onUpdate({ _boxBg: '' })}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
