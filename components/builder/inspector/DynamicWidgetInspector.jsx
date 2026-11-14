'use client'

import { slugify } from '@/lib/utils'

export function DynamicWidgetInspector({
  type,
  props = {},
  activeMod,
  moduleTerms = [],
  moduleSchemaFields = [],
  availableModules = [],
  onUpdate,
}) {
  if (type === 'module_grid') {
    return (
      <div className="space-y-3.5">
        {/* 1. Module Selector */}
        <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/40 space-y-2">
          <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            1. Select Dynamic Module
          </label>
          {availableModules.length > 0 ? (
            <select
              value={props.moduleSlug || activeMod?.slug || ''}
              onChange={(e) =>
                onUpdate({
                  moduleSlug: e.target.value,
                  categoryFilter: '',
                  selectedCategories: [],
                  titleField: '',
                  imageField: '',
                  excerptField: '',
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
            >
              {availableModules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.icon || '📦'} {m.name} (/{m.slug} — {m.publishedCount || 0} items)
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. products, services, news, jobs"
              value={props.moduleSlug || ''}
              onChange={(e) => onUpdate({ moduleSlug: slugify(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Module Slug:</span>
            <input
              type="text"
              value={props.moduleSlug || activeMod?.slug || ''}
              onChange={(e) => onUpdate({ moduleSlug: slugify(e.target.value) })}
              placeholder="module-slug"
              className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-purple-300"
            />
          </div>
        </div>

        {/* 2. Category Filtering Mode */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
          <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            2. Category Display Mode
          </label>
          <select
            value={props.categoryMode || 'all'}
            onChange={(e) => onUpdate({ categoryMode: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="selected">Selected Multiple Categories</option>
            <option value="specific">Single Specific Category</option>
            <option value="url">Dynamic Category from URL (?category=slug)</option>
          </select>

          {props.categoryMode === 'specific' && (
            <div className="pt-1 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase">
                Select Category
              </label>
              {moduleTerms.length > 0 ? (
                <select
                  value={props.categoryFilter || ''}
                  onChange={(e) => onUpdate({ categoryFilter: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-purple-500 rounded-lg text-xs text-white"
                >
                  <option value="">-- Select Category --</option>
                  {moduleTerms.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.name} ({t.taxName})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Category slug or ID"
                  value={props.categoryFilter || ''}
                  onChange={(e) => onUpdate({ categoryFilter: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              )}
            </div>
          )}

          {props.categoryMode === 'selected' && (
            <div className="pt-1 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase">
                Select Categories to Display:
              </label>
              {moduleTerms.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {moduleTerms.map((t) => {
                    const currentArr = Array.isArray(props.selectedCategories)
                      ? props.selectedCategories
                      : typeof props.selectedCategories === 'string' && props.selectedCategories
                        ? props.selectedCategories.split(',').map((s) => s.trim()).filter(Boolean)
                        : []
                    const isChecked = currentArr.includes(t.slug)
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs text-slate-200 hover:bg-slate-900 px-2 py-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...currentArr, t.slug]))
                              : currentArr.filter((s) => s !== t.slug)
                            onUpdate({ selectedCategories: next })
                          }}
                        />
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.color || '#8b5cf6' }}
                        />
                        <span>{t.name}</span>
                        <span className="text-[10px] text-slate-500 ml-auto">{t.taxName}</span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Comma separated category slugs (e.g. tech, sports)"
                  value={
                    Array.isArray(props.selectedCategories)
                      ? props.selectedCategories.join(', ')
                      : props.selectedCategories || ''
                  }
                  onChange={(e) =>
                    onUpdate({
                      selectedCategories: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              )}
            </div>
          )}

          {props.categoryMode !== 'specific' && (
            <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showCategoryTabs !== false}
                onChange={(e) => onUpdate({ showCategoryTabs: e.target.checked })}
              />
              <span>Show Category Filter Tabs at Top</span>
            </label>
          )}
        </div>

        {/* 3. Layout & Columns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Layout Style
            </label>
            <select
              value={props.layout || 'grid'}
              onChange={(e) => onUpdate({ layout: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="grid">Card Grid</option>
              <option value="magazine">Featured + Grid</option>
              <option value="list">Detailed List View</option>
              <option value="compact">Compact Sidebar List</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Columns
            </label>
            <select
              value={props.columns || 3}
              onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Items Limit
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={props.limit || 6}
              onChange={(e) => onUpdate({ limit: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={props.readMoreText || 'Read More'}
              onChange={(e) => onUpdate({ readMoreText: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </div>

        {/* 4. Heading & Subtitle */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Section Heading Title (Defaults to Module Name if empty)
          </label>
          <input
            type="text"
            value={props.title ?? ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={activeMod?.name || 'All Items'}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Subtitle (Optional)
          </label>
          <input
            type="text"
            value={props.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>

        {/* 5. Schema Field Mapping */}
        {moduleSchemaFields.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Module Field Mapping (Optional)
            </span>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Title / Name Field</label>
                <select
                  value={props.titleField || ''}
                  onChange={(e) => onUpdate({ titleField: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">✨ Auto-Detect</option>
                  {moduleSchemaFields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label} ({f.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Image / Photo Field</label>
                <select
                  value={props.imageField || ''}
                  onChange={(e) => onUpdate({ imageField: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">✨ Auto-Detect</option>
                  {moduleSchemaFields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label} ({f.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Description / Summary Field</label>
                <select
                  value={props.excerptField || ''}
                  onChange={(e) => onUpdate({ excerptField: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">✨ Auto-Detect</option>
                  {moduleSchemaFields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label} ({f.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 6. Display Toggles */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Display Options
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showImage !== false}
                onChange={(e) => onUpdate({ showImage: e.target.checked })}
              />
              <span>Show Image</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showCategoryBadge !== false}
                onChange={(e) => onUpdate({ showCategoryBadge: e.target.checked })}
              />
              <span>Category Badge</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showDate !== false}
                onChange={(e) => onUpdate({ showDate: e.target.checked })}
              />
              <span>Publish Date</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showExcerpt !== false}
                onChange={(e) => onUpdate({ showExcerpt: e.target.checked })}
              />
              <span>Short Description</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
              <input
                type="checkbox"
                checked={props.showCustomFields !== false}
                onChange={(e) => onUpdate({ showCustomFields: e.target.checked })}
              />
              <span>Show Extra Module Fields on Card</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!props.showSearch}
                onChange={(e) => onUpdate({ showSearch: e.target.checked })}
              />
              <span>Search Bar</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showPagination !== false}
                onChange={(e) => onUpdate({ showPagination: e.target.checked })}
              />
              <span>Pagination</span>
            </label>
          </div>
        </div>

        {/* 7. Custom Detail Page Link Slug */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Custom Detail Page Slug (Optional)
          </label>
          <input
            type="text"
            placeholder={`Defaults to /${props.moduleSlug || activeMod?.slug || 'module'}/[slug]`}
            value={props.detailPageSlug || ''}
            onChange={(e) => onUpdate({ detailPageSlug: slugify(e.target.value) })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>
      </div>
    )
  }

  if (type === 'module_categories') {
    return (
      <div className="space-y-3.5">
        <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/40 space-y-2">
          <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            1. Select Dynamic Module
          </label>
          {availableModules.length > 0 ? (
            <select
              value={props.moduleSlug || activeMod?.slug || ''}
              onChange={(e) =>
                onUpdate({
                  moduleSlug: e.target.value,
                  selectedCategories: [],
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
            >
              {availableModules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.icon || '📦'} {m.name} (/{m.slug})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. products, services, news"
              value={props.moduleSlug || ''}
              onChange={(e) => onUpdate({ moduleSlug: slugify(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Display Style
            </label>
            <select
              value={props.displayStyle || 'blocks'}
              onChange={(e) => onUpdate({ displayStyle: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="blocks">Category Content Blocks</option>
              <option value="pills">Category Directory Cards</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Columns
            </label>
            <select
              value={props.columns || 2}
              onChange={(e) => onUpdate({ columns: parseInt(e.target.value, 10) })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns Side-by-Side</option>
              <option value={3}>3 Columns Side-by-Side</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Items Per Category
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={props.itemsPerCategory || 4}
            onChange={(e) => onUpdate({ itemsPerCategory: Number(e.target.value) })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>

        {moduleTerms.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Categories to Show
              </span>
              {(props.selectedCategories || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => onUpdate({ selectedCategories: [] })}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Show All
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Leave all unchecked to show all categories, or select specific categories:
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {moduleTerms.map((t) => {
                const sel = Array.isArray(props.selectedCategories) ? props.selectedCategories : []
                const isChecked = sel.includes(t.slug) || sel.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...sel, t.slug]
                          : sel.filter((x) => x !== t.slug && x !== t.id)
                        onUpdate({ selectedCategories: next })
                      }}
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.color || '#8b5cf6' }}
                    />
                    <span>{t.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Section Title (Optional)
          </label>
          <input
            type="text"
            value={props.title ?? ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={activeMod ? `${activeMod.name} by Category` : 'Categories'}
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

        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Archive / View All Page Slug (Optional)
            </label>
            <input
              type="text"
              placeholder={`Defaults to /${props.moduleSlug || activeMod?.slug || 'module'}`}
              value={props.archivePageSlug || ''}
              onChange={(e) => onUpdate({ archivePageSlug: slugify(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Custom Detail Page Slug (Optional)
            </label>
            <input
              type="text"
              placeholder={`Defaults to /${props.moduleSlug || activeMod?.slug || 'module'}/[slug]`}
              value={props.detailPageSlug || ''}
              onChange={(e) => onUpdate({ detailPageSlug: slugify(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'module_detail') {
    return (
      <div className="space-y-3.5">
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-700/50 text-xs text-purple-200 space-y-1">
          <p className="font-bold text-white">📄 Single Module Item Detail Widget</p>
          <p className="text-[11px] text-purple-200/90 leading-relaxed">
            Displays the complete details of a single item from any Dynamic Module (Title, Image, Categories, Custom Fields, Full Content & Related Items).
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            Select Dynamic Module
          </label>
          {availableModules.length > 0 ? (
            <select
              value={props.moduleSlug || activeMod?.slug || ''}
              onChange={(e) => onUpdate({ moduleSlug: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-semibold"
            >
              {availableModules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.icon || '📦'} {m.name} (/{m.slug})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. products, services, news"
              value={props.moduleSlug || ''}
              onChange={(e) => onUpdate({ moduleSlug: slugify(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Specific Item ID / Slug Override (Optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty to load from URL or latest item"
            value={props.previewItemId || ''}
            onChange={(e) => onUpdate({ previewItemId: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Visible Detail Elements
          </span>
          <div className="space-y-1.5 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showBreadcrumbs !== false}
                onChange={(e) => onUpdate({ showBreadcrumbs: e.target.checked })}
              />
              <span>Breadcrumb Navigation (Home / Module / Category)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showCategoryBadges !== false}
                onChange={(e) => onUpdate({ showCategoryBadges: e.target.checked })}
              />
              <span>Category Badges</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showAuthorAndDate !== false}
                onChange={(e) => onUpdate({ showAuthorAndDate: e.target.checked })}
              />
              <span>Author & Publish Date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showShareButtons !== false}
                onChange={(e) => onUpdate({ showShareButtons: e.target.checked })}
              />
              <span>Share & Print Buttons</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showFeaturedImage !== false}
                onChange={(e) => onUpdate({ showFeaturedImage: e.target.checked })}
              />
              <span>Featured Cover Image</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showExtraFields !== false}
                onChange={(e) => onUpdate({ showExtraFields: e.target.checked })}
              />
              <span>All Extra Custom Module Fields</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showGallery !== false}
                onChange={(e) => onUpdate({ showGallery: e.target.checked })}
              />
              <span>Photo Gallery</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.showRelated !== false}
                onChange={(e) => onUpdate({ showRelated: e.target.checked })}
              />
              <span>Related Items Section</span>
            </label>
          </div>
        </div>

        {props.showRelated !== false && (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Related Section Title
              </label>
              <input
                type="text"
                placeholder={`Related ${activeMod?.name || 'Items'}`}
                value={props.relatedTitle || ''}
                onChange={(e) => onUpdate({ relatedTitle: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Count
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={props.relatedCount || 3}
                onChange={(e) => onUpdate({ relatedCount: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Related Item Detail Page Slug (Optional)
          </label>
          <input
            type="text"
            placeholder={`Defaults to /${props.moduleSlug || activeMod?.slug || 'module'}/[slug]`}
            value={props.detailPageSlug || ''}
            onChange={(e) => onUpdate({ detailPageSlug: slugify(e.target.value) })}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
          />
        </div>
      </div>
    )
  }

  return null
}
