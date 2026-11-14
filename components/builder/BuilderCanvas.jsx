'use client'

import {
  Plus, Trash2, Copy, ArrowUp, ArrowDown,
  Settings, Sparkles, Layout, GripVertical, Columns
} from 'lucide-react'
import { groupWidgetsByColumn } from './widgetDefinitions'
import {
  LivePageRenderer,
  WidgetRenderer,
  getSectionStyleAndClasses,
} from './LivePageRenderer'
import { cn } from '@/lib/utils'

export function BuilderCanvas({
  canvasScrollRef,
  viewport,
  isPreviewMode,
  sections,
  selectedSection,
  setSelectedSection,
  selectedColumn,
  setSelectedColumn,
  selectedWidget,
  setSelectedWidget,
  setActiveTab,
  dragItem,
  dropIndicator,
  setDropIndicator,
  disabled,
  addSection,
  addSectionBelow,
  changeSectionColumns,
  moveSection,
  duplicateSection,
  deleteSection,
  moveWidget,
  duplicateWidget,
  deleteWidget,
  handleCanvasScrollOnDrag,
  handleDragStart,
  handleDragEnd,
  handleSectionDragOver,
  handleDropOnSection,
  handleColumnDragOver,
  handleDropOnColumn,
  handleWidgetDragOver,
  handleDropOnWidget,
  handleDropOnEmptyCanvas,
}) {
  return (
    <div
      ref={canvasScrollRef}
      onDragOver={handleCanvasScrollOnDrag}
      className="flex-1 min-h-0 bg-slate-900/50 overflow-y-auto p-4 sm:p-8 custom-scrollbar"
    >
      <div
        className={cn(
          'w-full mx-auto transition-all duration-300 bg-white rounded-2xl shadow-2xl min-h-[520px] mb-16',
          viewport === 'desktop' && 'max-w-full',
          viewport === 'tablet' && 'max-w-[768px] border-8 border-slate-800 rounded-3xl',
          viewport === 'mobile' && 'max-w-[380px] border-8 border-slate-800 rounded-3xl'
        )}
      >
        {isPreviewMode ? (
          <LivePageRenderer sections={sections} />
        ) : sections.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDropIndicator({ targetType: 'CANVAS', position: 'inside' })
            }}
            onDragLeave={() => setDropIndicator(null)}
            onDrop={handleDropOnEmptyCanvas}
            className={cn(
              'py-24 px-6 text-center rounded-2xl transition border-2 border-dashed m-4',
              dropIndicator?.targetType === 'CANVAS'
                ? 'border-purple-500 bg-purple-50/60'
                : 'border-slate-200'
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Layout className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Start Building Your Page
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              <b>Drag & Drop</b> any element or template from the left sidebar, or select a column structure below.
            </p>

            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Choose Section Structure (Columns)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addSection(c)}
                    className="p-3 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-400 rounded-xl flex flex-col items-center gap-1 transition"
                  >
                    <div className="w-full h-5 flex gap-1">
                      {Array.from({ length: c }).map((_, idx) => (
                        <div key={idx} className="flex-1 h-full bg-purple-200 rounded" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">
                      {c} Col{c > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Browse Ready Multi-Column Templates
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sections.map((section, secIdx) => {
              const {
                columns,
                settings,
                containerClasses,
                gapClasses,
                alignClasses,
                gridColsClass,
                sectionBgClass,
                sectionInlineStyle,
                getColumnSpanClass,
              } = getSectionStyleAndClasses(section)

              const columnGroups = groupWidgetsByColumn(section)

              const isDraggingThisSection =
                dragItem?.kind === 'SECTION' && dragItem?.sectionIdx === secIdx
              const showDropBeforeSection =
                dropIndicator?.targetType === 'SECTION' &&
                dropIndicator?.sectionIdx === secIdx &&
                dropIndicator?.position === 'before'
              const showDropAfterSection =
                dropIndicator?.targetType === 'SECTION' &&
                dropIndicator?.sectionIdx === secIdx &&
                dropIndicator?.position === 'after'

              return (
                <div
                  key={section.id || secIdx}
                  data-section-id={section.id}
                  onDragOver={(e) => handleSectionDragOver(e, secIdx)}
                  onDrop={(e) => handleDropOnSection(e, secIdx)}
                  className={cn(
                    'relative group/sec transition border-2 border-transparent',
                    selectedSection === secIdx && 'border-purple-500',
                    isDraggingThisSection && 'opacity-40 bg-purple-50/30'
                  )}
                  onClick={() => {
                    setSelectedSection(secIdx)
                  }}
                >
                  {showDropBeforeSection && (
                    <div className="h-2 bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse z-30">
                      <span>⬇️ Drop Section Above</span>
                    </div>
                  )}

                  {/* Section Top Control Bar */}
                  <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div
                        draggable={!disabled}
                        onDragStart={(e) =>
                          handleDragStart(e, { kind: 'SECTION', sectionIdx: secIdx })
                        }
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing px-2 py-0.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 transition select-none"
                        title="Drag to reorder section"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-purple-300" />
                        <span className="text-[11px] font-bold text-purple-200">
                          #{secIdx + 1} {section.name || `Section ${secIdx + 1}`}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                        {[1, 2, 3, 4].map((colCount) => (
                          <button
                            key={colCount}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              changeSectionColumns(secIdx, colCount)
                            }}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold transition',
                              columns === colCount
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            )}
                            title={`Switch to ${colCount} column(s) side-by-side`}
                          >
                            {colCount}C
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Move Up"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(secIdx, -1)
                        }}
                        disabled={secIdx === 0}
                        className="p-1 hover:text-purple-400 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Move Down"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(secIdx, 1)
                        }}
                        disabled={secIdx === sections.length - 1}
                        className="p-1 hover:text-purple-400 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Add Section Below"
                        onClick={(e) => {
                          e.stopPropagation()
                          addSectionBelow(secIdx, 1)
                        }}
                        className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-md flex items-center gap-0.5 text-[10px] font-bold transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Section</span>
                      </button>
                      <button
                        type="button"
                        title="Edit Section Settings"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSection(secIdx)
                          setSelectedWidget(null)
                          setActiveTab('inspector')
                        }}
                        className="p-1 hover:text-purple-400"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Duplicate Section"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateSection(secIdx)
                        }}
                        className="p-1 hover:text-purple-400"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete Section"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSection(secIdx)
                        }}
                        className="p-1 hover:text-red-400 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Columns Content */}
                  <div style={sectionInlineStyle} className={sectionBgClass}>
                    {settings.bgImage && settings.bgOverlay && (
                      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
                    )}
                    <div className={cn('relative z-10', containerClasses)}>
                      <div className={cn('grid', gridColsClass, gapClasses, alignClasses)}>
                        {columnGroups.map((colItems, colIdx) => {
                          const isTargetCol =
                            selectedSection === secIdx && selectedColumn === colIdx
                          const isDropOverCol =
                            dropIndicator?.targetType === 'COLUMN' &&
                            dropIndicator?.sectionIdx === secIdx &&
                            dropIndicator?.columnIdx === colIdx

                          return (
                            <div
                              key={colIdx}
                              onDragOver={(e) => handleColumnDragOver(e, secIdx, colIdx)}
                              onDrop={(e) => handleDropOnColumn(e, secIdx, colIdx)}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSection(secIdx)
                                setSelectedColumn(colIdx)
                              }}
                              className={cn(
                                'w-full rounded-2xl transition p-2 min-h-[110px] border-2',
                                getColumnSpanClass(colIdx),
                                isDropOverCol
                                  ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400'
                                  : columns > 1 && isTargetCol
                                  ? 'border-dashed border-purple-400/70 bg-purple-500/5'
                                  : columns > 1
                                  ? 'border-dashed border-slate-300/50 hover:border-purple-400/50'
                                  : 'border-transparent'
                              )}
                            >
                              {columns > 1 && (
                                <div className="flex items-center justify-between mb-2 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[10px]">
                                  <span className="font-bold text-purple-300 flex items-center gap-1">
                                    <Columns className="w-3 h-3" /> Column {colIdx + 1} of{' '}
                                    {columns}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSection(secIdx)
                                      setSelectedColumn(colIdx)
                                      setActiveTab('widgets')
                                    }}
                                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-0.5 transition"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Add Widget Here
                                  </button>
                                </div>
                              )}

                              {colItems.length > 0 ? (
                                <div className="space-y-4">
                                  {colItems.map(({ widget, widx }, posInCol) => {
                                    const isSelected =
                                      selectedWidget?.sectionIdx === secIdx &&
                                      selectedWidget?.widgetIdx === widx
                                    const isDraggingThisWidget =
                                      dragItem?.kind === 'WIDGET' &&
                                      dragItem?.sectionIdx === secIdx &&
                                      dragItem?.widgetIdx === widx
                                    const showWidgetDropBefore =
                                      dropIndicator?.targetType === 'WIDGET' &&
                                      dropIndicator?.sectionIdx === secIdx &&
                                      dropIndicator?.widgetIdx === widx &&
                                      dropIndicator?.position === 'before'
                                    const showWidgetDropAfter =
                                      dropIndicator?.targetType === 'WIDGET' &&
                                      dropIndicator?.sectionIdx === secIdx &&
                                      dropIndicator?.widgetIdx === widx &&
                                      dropIndicator?.position === 'after'

                                    return (
                                      <div
                                        key={widget.id || widx}
                                        draggable={!disabled}
                                        onDragStart={(e) =>
                                          handleDragStart(e, {
                                            kind: 'WIDGET',
                                            sectionIdx: secIdx,
                                            widgetIdx: widx,
                                          })
                                        }
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) =>
                                          handleWidgetDragOver(e, secIdx, colIdx, widx)
                                        }
                                        onDrop={(e) =>
                                          handleDropOnWidget(e, secIdx, colIdx, widx)
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedSection(secIdx)
                                          setSelectedColumn(colIdx)
                                          setSelectedWidget({
                                            sectionIdx: secIdx,
                                            widgetIdx: widx,
                                          })
                                          setActiveTab('inspector')
                                        }}
                                        className={cn(
                                          'relative group/widget p-2 rounded-xl transition border-2 border-transparent cursor-grab active:cursor-grabbing',
                                          isSelected
                                            ? 'border-purple-600 ring-2 ring-purple-500/20'
                                            : 'hover:border-purple-400/60',
                                          isDraggingThisWidget &&
                                            'opacity-40 border-dashed border-purple-400'
                                        )}
                                      >
                                        {showWidgetDropBefore && (
                                          <div className="h-1.5 bg-purple-600 rounded-full mb-2 shadow-md animate-pulse" />
                                        )}

                                        {/* Widget Action Pill */}
                                        <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover/widget:opacity-100 transition flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-lg text-[10px] shadow-md">
                                          <GripVertical className="w-3 h-3 text-purple-200 cursor-grab" />
                                          <span className="font-bold uppercase tracking-wider">
                                            {widget.type.replace('_', ' ')}
                                          </span>
                                          <button
                                            type="button"
                                            title="Move Up"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              moveWidget(secIdx, widx, -1)
                                            }}
                                            disabled={posInCol === 0}
                                            className="hover:text-purple-200 disabled:opacity-30"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Move Down"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              moveWidget(secIdx, widx, 1)
                                            }}
                                            disabled={posInCol === colItems.length - 1}
                                            className="hover:text-purple-200 disabled:opacity-30"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Duplicate Widget"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              duplicateWidget(secIdx, widx)
                                            }}
                                            className="hover:text-purple-200"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Delete Widget"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              deleteWidget(secIdx, widx)
                                            }}
                                            className="hover:text-red-300"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <WidgetRenderer widget={widget} />

                                        {showWidgetDropAfter && (
                                          <div className="h-1.5 bg-purple-600 rounded-full mt-2 shadow-md animate-pulse" />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="py-8 px-4 text-center border-2 border-dashed border-slate-300/70 rounded-xl bg-slate-50/70 text-slate-600">
                                  <p className="text-xs font-semibold mb-2">
                                    {columns > 1
                                      ? `Empty Column ${colIdx + 1}: Drag a widget here`
                                      : 'Empty Section: Drag a widget here or click below'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSection(secIdx)
                                      setSelectedColumn(colIdx)
                                      setActiveTab('widgets')
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Widget
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section Inserter Bar */}
                  <div className="py-2.5 px-4 bg-slate-100/90 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-purple-600" /> Add Section Below:
                    </span>
                    {[1, 2, 3, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          addSectionBelow(secIdx, c)
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white text-slate-800 border border-slate-200 hover:border-purple-600 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> {c} Col{c > 1 ? 's' : ''}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSection(secIdx)
                        setActiveTab('widgets')
                      }}
                      className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-1"
                    >
                      <Plus className="w-3 h-3" /> Add Widget
                    </button>
                  </div>

                  {showDropAfterSection && (
                    <div className="h-2 bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse z-30">
                      <span>⬇️ Drop Section Below</span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add Another Section Bar at Bottom */}
            <div className="p-8 text-center bg-slate-50 border-t border-slate-100 rounded-b-2xl">
              <div className="inline-flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Add New Section at Bottom
                </span>
                <div className="flex flex-wrap items-center gap-2 justify-center">
                  {[1, 2, 3, 4].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => addSection(c)}
                      className="px-4 py-2 bg-white hover:bg-purple-50 text-slate-700 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> {c} Column{c > 1 ? 's' : ''}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Template Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
