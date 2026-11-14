'use client'

import {
  Plus, Trash2, ArrowUp, ArrowDown, Search,
  ChevronRight, GripVertical, Move, Columns
} from 'lucide-react'
import { WIDGET_TYPES, WIDGET_CATEGORIES } from './widgetDefinitions'
import { SECTION_TEMPLATES } from './templateBlocks'
import { WidgetInspector } from './inspector/WidgetInspector'
import { SectionInspector } from './inspector/SectionInspector'
import { cn } from '@/lib/utils'

export function BuilderSidebar({
  activeTab,
  setActiveTab,
  sections,
  selectedSection,
  setSelectedSection,
  selectedColumn,
  setSelectedColumn,
  selectedWidget,
  setSelectedWidget,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredWidgets,
  availableModules,
  disabled,
  addSection,
  insertTemplate,
  addWidgetToSection,
  moveSection,
  deleteSection,
  updateSectionSettings,
  updateWidgetProps,
  deleteWidget,
  handleDragStart,
  handleDragEnd,
  scrollToSectionElement,
}) {
  const activeSectionObj = selectedSection !== null ? sections[selectedSection] : null
  const activeWidgetObj =
    selectedWidget &&
    sections[selectedWidget.sectionIdx]?.widgets?.[selectedWidget.widgetIdx]
      ? sections[selectedWidget.sectionIdx].widgets[selectedWidget.widgetIdx]
      : null

  return (
    <div className="w-80 sm:w-88 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 min-h-0 overflow-hidden">
      {/* Tabs bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {activeTab === 'widgets' && 'Widget Library'}
          {activeTab === 'templates' && 'Pre-built Templates'}
          {activeTab === 'layers' && 'Page Navigator (Layers)'}
          {activeTab === 'inspector' &&
            (activeWidgetObj ? 'Widget Properties' : 'Section Settings')}
        </span>
        {activeTab === 'inspector' && (
          <button
            type="button"
            onClick={() => setActiveTab('widgets')}
            className="text-xs text-purple-400 hover:text-white flex items-center gap-1 font-semibold"
          >
            + Add Elements <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active Target Indicator */}
      {activeSectionObj && (
        <div className="px-3 py-1.5 bg-purple-950/60 border-b border-purple-800/40 flex items-center justify-between text-[11px] text-purple-200 shrink-0">
          <span className="truncate mr-2">
            Target: <b>#{selectedSection + 1} {activeSectionObj.name}</b>
            {(activeSectionObj.columns || 1) > 1 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">
                Col {(selectedColumn || 0) + 1}
              </span>
            )}
          </span>
          {(activeSectionObj.columns || 1) > 1 && (
            <div className="flex gap-1 shrink-0">
              {Array.from({ length: activeSectionObj.columns }).map((_, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => setSelectedColumn(cIdx)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold transition',
                    selectedColumn === cIdx
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  C{cIdx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: WIDGETS */}
      {activeTab === 'widgets' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-3 space-y-3">
          {/* Add New Section Quick Card */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Columns className="w-3.5 h-3.5 text-purple-400" /> Add Section (Columns)
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className="text-[10px] text-purple-400 hover:text-white font-bold"
              >
                Ready Blocks ↗
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((colNum) => (
                <button
                  key={colNum}
                  type="button"
                  onClick={() => addSection(colNum)}
                  className="py-1.5 px-1.5 bg-slate-800 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold transition text-center"
                >
                  + {colNum} Col{colNum > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${WIDGET_TYPES.length} elements...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar shrink-0">
            {WIDGET_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition',
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="px-2.5 py-1.5 bg-purple-950/40 border border-purple-800/40 rounded-lg text-[10px] text-purple-300 flex items-center gap-1.5 shrink-0">
            <Move className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              <b>Drag & Drop</b> into any column or click to insert
            </span>
          </div>

          {/* Widgets Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {filteredWidgets.map((w) => {
                const Icon = w.icon
                return (
                  <div
                    key={w.type}
                    draggable={!disabled}
                    onDragStart={(e) =>
                      handleDragStart(e, { kind: 'NEW_WIDGET', widgetType: w.type })
                    }
                    onDragEnd={handleDragEnd}
                    onClick={() =>
                      addWidgetToSection(
                        w,
                        selectedSection ?? sections.length - 1,
                        selectedColumn
                      )
                    }
                    className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-purple-500 transition group text-center relative select-none"
                    title="Drag into any column or click to add"
                  >
                    <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-purple-400 absolute top-2 right-2 opacity-60 group-hover:opacity-100" />
                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-purple-600 flex items-center justify-center text-purple-400 group-hover:text-white transition mb-2 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white leading-tight">
                      {w.name}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {w.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <p className="text-xs text-slate-400">
            1-Click or <b>Drag & Drop</b> ready multi-column & hero blocks.
          </p>
          {SECTION_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              draggable={!disabled}
              onDragStart={(e) =>
                handleDragStart(e, { kind: 'NEW_TEMPLATE', templateId: tpl.id })
              }
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 transition flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-lg mr-1">{tpl.thumbnail}</span>
                  <span className="font-bold text-xs text-white">{tpl.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-950 px-2 py-0.5 rounded shrink-0">
                  {tpl.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{tpl.description}</p>
              <button
                type="button"
                onClick={() => insertTemplate(tpl)}
                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Insert Block
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LAYERS / NAVIGATOR */}
      {activeTab === 'layers' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <p className="text-[11px] text-slate-400 mb-2">
            Click any section or widget to jump to it and edit its settings.
          </p>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No sections added yet.
            </div>
          ) : (
            sections.map((sec, sIdx) => (
              <div
                key={sec.id || sIdx}
                className={cn(
                  'rounded-xl border p-2.5 transition',
                  selectedSection === sIdx
                    ? 'bg-slate-900 border-purple-500'
                    : 'bg-slate-900/50 border-slate-800'
                )}
              >
                <div
                  onClick={() => {
                    setSelectedSection(sIdx)
                    setSelectedWidget(null)
                    setActiveTab('inspector')
                    scrollToSectionElement(sec.id, false)
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-purple-600/30 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {sIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {sec.name || `Section ${sIdx + 1}`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {sec.columns || 1} Col
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSection(sIdx, -1)
                      }}
                      disabled={sIdx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSection(sIdx, 1)
                      }}
                      disabled={sIdx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSection(sIdx)
                      }}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {Array.isArray(sec.widgets) && sec.widgets.length > 0 && (
                  <div className="mt-2 pl-4 border-l border-slate-800 space-y-1">
                    {sec.widgets.map((w, wIdx) => (
                      <div
                        key={w.id || wIdx}
                        onClick={() => {
                          setSelectedSection(sIdx)
                          setSelectedWidget({ sectionIdx: sIdx, widgetIdx: wIdx })
                          setActiveTab('inspector')
                          scrollToSectionElement(sec.id, false)
                        }}
                        className={cn(
                          'px-2 py-1 rounded-lg text-[11px] flex items-center justify-between cursor-pointer transition',
                          selectedWidget?.sectionIdx === sIdx &&
                            selectedWidget?.widgetIdx === wIdx
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <span className="capitalize">{w.type.replace('_', ' ')}</span>
                        <span className="text-[9px] opacity-75">
                          Col {((w.column ?? wIdx % (sec.columns || 1)) || 0) + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: INSPECTOR (WIDGET OR SECTION SETTINGS) */}
      {activeTab === 'inspector' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar text-white">
          {activeWidgetObj ? (
            <WidgetInspector
              widget={activeWidgetObj}
              sectionColumns={sections[selectedWidget.sectionIdx].columns || 1}
              defaultCol={
                (activeWidgetObj.column ??
                  selectedWidget.widgetIdx %
                    (sections[selectedWidget.sectionIdx].columns || 1)) ||
                0
              }
              availableModules={availableModules}
              onUpdate={(newProps, newCol) =>
                updateWidgetProps(
                  selectedWidget.sectionIdx,
                  selectedWidget.widgetIdx,
                  newProps,
                  newCol
                )
              }
              onDelete={() =>
                deleteWidget(selectedWidget.sectionIdx, selectedWidget.widgetIdx)
              }
            />
          ) : activeSectionObj ? (
            <SectionInspector
              section={activeSectionObj}
              onUpdate={(updates) => updateSectionSettings(selectedSection, updates)}
              onDelete={() => deleteSection(selectedSection)}
            />
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a section or widget on the canvas to configure its properties.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
