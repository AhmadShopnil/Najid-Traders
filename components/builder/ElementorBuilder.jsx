'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { WIDGET_TYPES } from './widgetDefinitions'
import { SECTION_TEMPLATES } from './templateBlocks'
import { BuilderSidebar } from './BuilderSidebar'
import { BuilderCanvas } from './BuilderCanvas'
import {
  Monitor, Tablet, Smartphone, Sparkles, Eye, ExternalLink,
  Undo2, Redo2, Layers
} from 'lucide-react'
import { generateId, cn } from '@/lib/utils'

function remapIndexAfterSectionMove(idx, fromIdx, insertIdx) {
  if (idx === null || idx === undefined) return idx
  if (idx === fromIdx) return insertIdx
  if (fromIdx < insertIdx && idx > fromIdx && idx <= insertIdx) return idx - 1
  if (fromIdx > insertIdx && idx >= insertIdx && idx < fromIdx) return idx + 1
  return idx
}

export function ElementorBuilder({
  sections = [],
  onChange,
  pageSlug = '',
  pageTitle = '',
  disabled = false,
}) {
  const [viewport, setViewport] = useState('desktop') // desktop, tablet, mobile
  const [activeTab, setActiveTab] = useState('widgets') // widgets, templates, layers, inspector
  const [selectedWidget, setSelectedWidget] = useState(null) // { sectionIdx, widgetIdx }
  const [selectedSection, setSelectedSection] = useState(null) // sectionIdx
  const [selectedColumn, setSelectedColumn] = useState(0) // active target column index inside selectedSection
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [availableModules, setAvailableModules] = useState([])

  const [historyPast, setHistoryPast] = useState([])
  const [historyFuture, setHistoryFuture] = useState([])

  const [dragItem, setDragItem] = useState(null)
  const [dropIndicator, setDropIndicator] = useState(null)

  const canvasScrollRef = useRef(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/public/modules')
      .then((r) => r.json())
      .then((json) => {
        if (mounted && json?.success && Array.isArray(json.data)) {
          setAvailableModules(json.data)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  function sanitizeSelectionAfterRestore(restoredSections) {
    if (selectedSection !== null && !restoredSections[selectedSection]) {
      setSelectedSection(restoredSections.length > 0 ? restoredSections.length - 1 : null)
      setSelectedColumn(0)
    }
    if (
      selectedWidget &&
      !restoredSections[selectedWidget.sectionIdx]?.widgets?.[selectedWidget.widgetIdx]
    ) {
      setSelectedWidget(null)
    }
  }

  function commitSections(nextSections) {
    setHistoryPast((prev) => [...prev.slice(-25), sections])
    setHistoryFuture([])
    onChange(nextSections)
  }

  function handleUndo() {
    if (historyPast.length === 0 || disabled) return
    const previous = historyPast[historyPast.length - 1]
    setHistoryPast((prev) => prev.slice(0, -1))
    setHistoryFuture((f) => [sections, ...f])
    onChange(previous)
    sanitizeSelectionAfterRestore(previous)
  }

  function handleRedo() {
    if (historyFuture.length === 0 || disabled) return
    const next = historyFuture[0]
    setHistoryFuture((f) => f.slice(1))
    setHistoryPast((prev) => [...prev, sections])
    onChange(next)
    sanitizeSelectionAfterRestore(next)
  }

  const filteredWidgets = useMemo(() => {
    return WIDGET_TYPES.filter((w) => {
      const matchCat = selectedCategory === 'all' || w.category === selectedCategory
      const matchSearch =
        !searchQuery ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCategory, searchQuery])

  function scrollToSectionElement(secId, fallbackBottom = false) {
    setTimeout(() => {
      if (!canvasScrollRef.current) return
      if (secId) {
        const el = canvasScrollRef.current.querySelector(`[data-section-id="${secId}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
      }
      if (fallbackBottom) {
        canvasScrollRef.current.scrollTo({
          top: canvasScrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 80)
  }

  function ensureExplicitColumns(sec, numCols = sec.columns || 1) {
    const cols = Math.max(1, parseInt(numCols, 10))
    return (sec.widgets || []).map((w, idx) => {
      const currentCol =
        typeof w.column === 'number' && !Number.isNaN(w.column) ? w.column : idx % cols
      return {
        ...w,
        column: currentCol >= 0 && currentCol < cols ? currentCol : idx % cols,
      }
    })
  }

  function addSection(columns = 1) {
    addSectionBelow(sections.length - 1, columns)
  }

  function addSectionBelow(insertAfterIdx, columns = 1) {
    if (disabled) return
    const newId = generateId()
    const newSection = {
      id: newId,
      name: `Section ${sections.length + 1}`,
      slug: `section-${sections.length + 1}`,
      columns,
      settings: {
        bgType: 'light',
        bgColor: '#ffffff',
        padding: 'normal',
        containerWidth: 'boxed',
        columnRatio: 'equal',
        gap: 'normal',
        verticalAlign: 'center',
      },
      widgets: [],
    }
    const updated = [...sections]
    const targetPos =
      insertAfterIdx !== null && insertAfterIdx !== undefined && insertAfterIdx >= 0
        ? insertAfterIdx + 1
        : updated.length
    updated.splice(targetPos, 0, newSection)
    commitSections(updated)
    setSelectedSection(targetPos)
    setSelectedColumn(0)
    setSelectedWidget(null)
    setActiveTab('widgets')
    scrollToSectionElement(newId, true)
  }

  function resolveDefaultModuleSlug(defaultSlug = '') {
    if (availableModules.length === 0) return defaultSlug
    if (defaultSlug) {
      const exact = availableModules.find((m) => m.slug === defaultSlug)
      if (exact) return exact.slug
    }
    return availableModules[0].slug
  }

  function insertTemplate(tpl, insertAtIdx = null) {
    if (disabled) return
    const newSection = tpl.createSection()
    if (Array.isArray(newSection.widgets) && availableModules.length > 0) {
      newSection.widgets = newSection.widgets.map((w) => {
        if (['module_grid', 'module_categories', 'module_detail'].includes(w.type)) {
          return {
            ...w,
            props: {
              ...w.props,
              moduleSlug: resolveDefaultModuleSlug(w.props?.moduleSlug || ''),
            },
          }
        }
        return w
      })
    }
    const updated = [...sections]
    const pos =
      insertAtIdx !== null && insertAtIdx >= 0 && insertAtIdx <= updated.length
        ? insertAtIdx
        : updated.length
    updated.splice(pos, 0, newSection)
    commitSections(updated)
    setSelectedSection(pos)
    setSelectedColumn(0)
    setSelectedWidget(null)
    setActiveTab('widgets')
    scrollToSectionElement(newSection.id, true)
  }

  function addWidgetToSection(
    widgetTypeObj,
    sectionIndex,
    targetColIdx = null,
    insertWidgetIdx = null
  ) {
    if (disabled) return
    let targetIdx = sectionIndex
    let updatedSections = [...sections]

    if (updatedSections.length === 0) {
      const newSec = {
        id: generateId(),
        name: 'Section 1',
        slug: 'section-1',
        columns: 1,
        settings: {
          bgType: 'light',
          bgColor: '#ffffff',
          padding: 'normal',
          containerWidth: 'boxed',
          columnRatio: 'equal',
          gap: 'normal',
          verticalAlign: 'center',
        },
        widgets: [],
      }
      updatedSections = [newSec]
      targetIdx = 0
    } else if (
      targetIdx === null ||
      targetIdx === undefined ||
      targetIdx >= updatedSections.length ||
      targetIdx < 0
    ) {
      targetIdx = updatedSections.length - 1
    }

    const sec = updatedSections[targetIdx]
    const numCols = Math.max(1, parseInt(sec.columns || 1, 10))
    const normalizedWidgets = ensureExplicitColumns(sec, numCols)

    let colToUse = 0
    if (
      targetColIdx !== null &&
      targetColIdx !== undefined &&
      targetColIdx >= 0 &&
      targetColIdx < numCols
    ) {
      colToUse = targetColIdx
    } else if (numCols > 1) {
      const colCounts = Array.from({ length: numCols }, (_, c) =>
        normalizedWidgets.filter((w) => w.column === c).length
      )
      const firstEmptyCol = colCounts.findIndex((cnt) => cnt === 0)
      if (firstEmptyCol !== -1 && (selectedSection !== targetIdx || selectedColumn === null)) {
        colToUse = firstEmptyCol
      } else if (selectedSection === targetIdx && selectedColumn !== null && selectedColumn < numCols) {
        colToUse = firstEmptyCol !== -1 && colCounts[selectedColumn] > 0 ? firstEmptyCol : selectedColumn
      } else {
        colToUse = normalizedWidgets.length % numCols
      }
    }

    const clonedProps = JSON.parse(JSON.stringify(widgetTypeObj.defaultProps))
    if (['module_grid', 'module_categories', 'module_detail'].includes(widgetTypeObj.type)) {
      clonedProps.moduleSlug = resolveDefaultModuleSlug(clonedProps.moduleSlug || '')
    }

    const newWidget = {
      id: generateId(),
      type: widgetTypeObj.type,
      column: colToUse,
      props: clonedProps,
    }

    const updatedWidgets = [...normalizedWidgets]
    let finalWidgetIdx = updatedWidgets.length
    if (
      insertWidgetIdx !== null &&
      insertWidgetIdx >= 0 &&
      insertWidgetIdx <= updatedWidgets.length
    ) {
      updatedWidgets.splice(insertWidgetIdx, 0, newWidget)
      finalWidgetIdx = insertWidgetIdx
    } else {
      updatedWidgets.push(newWidget)
      finalWidgetIdx = updatedWidgets.length - 1
    }

    updatedSections[targetIdx] = { ...sec, widgets: updatedWidgets }
    commitSections(updatedSections)
    setSelectedSection(targetIdx)
    setSelectedColumn(colToUse)
    setSelectedWidget({ sectionIdx: targetIdx, widgetIdx: finalWidgetIdx })
    setActiveTab('inspector')
    scrollToSectionElement(updatedSections[targetIdx].id, false)
  }

  function changeSectionColumns(secIdx, newColCount) {
    if (disabled) return
    const cols = Math.max(1, parseInt(newColCount, 10))
    const updated = [...sections]
    const sec = updated[secIdx]
    const rebalancedWidgets = (sec.widgets || []).map((w, idx) => ({
      ...w,
      column:
        typeof w.column === 'number' && !Number.isNaN(w.column) && w.column >= 0 && w.column < cols
          ? w.column
          : idx % cols,
    }))
    updated[secIdx] = {
      ...sec,
      columns: cols,
      widgets: rebalancedWidgets,
    }
    commitSections(updated)
    setSelectedSection(secIdx)
    if (selectedColumn >= cols) setSelectedColumn(0)
  }

  // --- DRAG & DROP HANDLERS ---

  function handleDragStart(e, item) {
    if (disabled) return
    e.stopPropagation()
    setDragItem(item)
    try {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    } catch {
      // ignore
    }
  }

  function handleDragEnd() {
    setDragItem(null)
    setDropIndicator(null)
  }

  function handleCanvasScrollOnDrag(e) {
    const container = canvasScrollRef.current
    if (!container || !dragItem) return
    const rect = container.getBoundingClientRect()
    const edgeThreshold = 90
    const mouseY = e.clientY

    if (mouseY - rect.top < edgeThreshold) {
      container.scrollBy({ top: -18, behavior: 'auto' })
    } else if (rect.bottom - mouseY < edgeThreshold) {
      container.scrollBy({ top: 18, behavior: 'auto' })
    }
  }

  function handleSectionDragOver(e, secIdx) {
    if (disabled || !dragItem) return
    if (dragItem.kind !== 'SECTION' && dragItem.kind !== 'NEW_TEMPLATE') return
    e.preventDefault()
    e.stopPropagation()
    handleCanvasScrollOnDrag(e)

    const rect = e.currentTarget.getBoundingClientRect()
    const isTopHalf = e.clientY - rect.top < rect.height / 2

    setDropIndicator({
      targetType: 'SECTION',
      sectionIdx: secIdx,
      position: isTopHalf ? 'before' : 'after',
    })
  }

  function handleColumnDragOver(e, secIdx, colIdx) {
    if (disabled || !dragItem) return
    if (dragItem.kind === 'SECTION' || dragItem.kind === 'NEW_TEMPLATE') return
    e.preventDefault()
    e.stopPropagation()
    handleCanvasScrollOnDrag(e)

    setDropIndicator({
      targetType: 'COLUMN',
      sectionIdx: secIdx,
      columnIdx: colIdx,
      position: 'inside',
    })
  }

  function handleWidgetDragOver(e, secIdx, colIdx, widx) {
    if (disabled || !dragItem) return
    if (dragItem.kind === 'SECTION' || dragItem.kind === 'NEW_TEMPLATE') return
    e.preventDefault()
    e.stopPropagation()
    handleCanvasScrollOnDrag(e)

    const rect = e.currentTarget.getBoundingClientRect()
    const isTopHalf = e.clientY - rect.top < rect.height / 2

    setDropIndicator({
      targetType: 'WIDGET',
      sectionIdx: secIdx,
      columnIdx: colIdx,
      widgetIdx: widx,
      position: isTopHalf ? 'before' : 'after',
    })
  }

  function handleDropOnSection(e, targetSecIdx) {
    if (disabled || !dragItem) return
    e.preventDefault()
    e.stopPropagation()

    const position = dropIndicator?.position || 'after'

    if (dragItem.kind === 'SECTION') {
      const fromIdx = dragItem.sectionIdx
      if (fromIdx === undefined || fromIdx === null) {
        handleDragEnd()
        return
      }
      const updated = [...sections]
      const [movedSec] = updated.splice(fromIdx, 1)
      let insertIdx = position === 'before' ? targetSecIdx : targetSecIdx + 1
      if (fromIdx < insertIdx) insertIdx -= 1
      insertIdx = Math.max(0, Math.min(updated.length, insertIdx))
      updated.splice(insertIdx, 0, movedSec)
      commitSections(updated)
      setSelectedSection(insertIdx)
      if (selectedWidget) {
        setSelectedWidget({
          ...selectedWidget,
          sectionIdx: remapIndexAfterSectionMove(selectedWidget.sectionIdx, fromIdx, insertIdx),
        })
      }
    } else if (dragItem.kind === 'NEW_TEMPLATE') {
      const tpl = SECTION_TEMPLATES.find((t) => t.id === dragItem.templateId)
      if (tpl) {
        const insertIdx = position === 'before' ? targetSecIdx : targetSecIdx + 1
        insertTemplate(tpl, insertIdx)
      }
    } else if (dragItem.kind === 'NEW_WIDGET') {
      const wDef = WIDGET_TYPES.find((w) => w.type === dragItem.widgetType)
      if (wDef) {
        addWidgetToSection(wDef, targetSecIdx, 0)
      }
    }

    handleDragEnd()
  }

  function handleDropOnColumn(e, targetSecIdx, targetColIdx) {
    if (disabled || !dragItem) return
    if (dragItem.kind === 'SECTION' || dragItem.kind === 'NEW_TEMPLATE') {
      handleDropOnSection(e, targetSecIdx)
      return
    }
    e.preventDefault()
    e.stopPropagation()

    if (dragItem.kind === 'NEW_WIDGET') {
      const wDef = WIDGET_TYPES.find((w) => w.type === dragItem.widgetType)
      if (wDef) addWidgetToSection(wDef, targetSecIdx, targetColIdx)
      handleDragEnd()
      return
    }

    if (dragItem.kind === 'WIDGET') {
      const { sectionIdx: fromSecIdx, widgetIdx: fromWidx } = dragItem
      if (fromSecIdx === undefined || fromWidx === undefined) {
        handleDragEnd()
        return
      }

      const updated = [...sections]
      const sourceSec = updated[fromSecIdx]
      const sourceWidgets = ensureExplicitColumns(sourceSec, sourceSec.columns || 1)
      const [movedWidget] = sourceWidgets.splice(fromWidx, 1)
      if (!movedWidget) {
        handleDragEnd()
        return
      }

      const updatedMovedWidget = { ...movedWidget, column: targetColIdx }

      if (fromSecIdx === targetSecIdx) {
        sourceWidgets.push(updatedMovedWidget)
        updated[fromSecIdx] = { ...sourceSec, widgets: sourceWidgets }
        commitSections(updated)
        setSelectedSection(targetSecIdx)
        setSelectedColumn(targetColIdx)
        setSelectedWidget({ sectionIdx: targetSecIdx, widgetIdx: sourceWidgets.length - 1 })
      } else {
        updated[fromSecIdx] = { ...sourceSec, widgets: sourceWidgets }
        const destSec = updated[targetSecIdx]
        const destWidgets = [
          ...ensureExplicitColumns(destSec, destSec.columns || 1),
          updatedMovedWidget,
        ]
        updated[targetSecIdx] = { ...destSec, widgets: destWidgets }
        commitSections(updated)
        setSelectedSection(targetSecIdx)
        setSelectedColumn(targetColIdx)
        setSelectedWidget({ sectionIdx: targetSecIdx, widgetIdx: destWidgets.length - 1 })
      }
      setActiveTab('inspector')
    }

    handleDragEnd()
  }

  function handleDropOnWidget(e, targetSecIdx, targetColIdx, targetWidx) {
    if (disabled || !dragItem) return
    if (dragItem.kind === 'SECTION' || dragItem.kind === 'NEW_TEMPLATE') {
      handleDropOnSection(e, targetSecIdx)
      return
    }
    e.preventDefault()
    e.stopPropagation()

    const position = dropIndicator?.position || 'after'
    const rawInsertIdx = position === 'before' ? targetWidx : targetWidx + 1

    if (dragItem.kind === 'NEW_WIDGET') {
      const wDef = WIDGET_TYPES.find((w) => w.type === dragItem.widgetType)
      if (wDef) addWidgetToSection(wDef, targetSecIdx, targetColIdx, rawInsertIdx)
      handleDragEnd()
      return
    }

    if (dragItem.kind === 'WIDGET') {
      const { sectionIdx: fromSecIdx, widgetIdx: fromWidx } = dragItem
      const updated = [...sections]
      const sourceSec = updated[fromSecIdx]
      const sourceWidgets = ensureExplicitColumns(sourceSec, sourceSec.columns || 1)
      const [movedWidget] = sourceWidgets.splice(fromWidx, 1)
      if (!movedWidget) {
        handleDragEnd()
        return
      }

      const updatedMovedWidget = { ...movedWidget, column: targetColIdx }

      if (fromSecIdx === targetSecIdx) {
        let finalInsertIdx = rawInsertIdx
        if (fromWidx < rawInsertIdx) finalInsertIdx -= 1
        finalInsertIdx = Math.max(0, Math.min(sourceWidgets.length, finalInsertIdx))
        sourceWidgets.splice(finalInsertIdx, 0, updatedMovedWidget)
        updated[fromSecIdx] = { ...sourceSec, widgets: sourceWidgets }
        commitSections(updated)
        setSelectedSection(targetSecIdx)
        setSelectedColumn(targetColIdx)
        setSelectedWidget({ sectionIdx: targetSecIdx, widgetIdx: finalInsertIdx })
      } else {
        updated[fromSecIdx] = { ...sourceSec, widgets: sourceWidgets }
        const destSec = updated[targetSecIdx]
        const destWidgets = ensureExplicitColumns(destSec, destSec.columns || 1)
        const finalInsertIdx = Math.max(0, Math.min(destWidgets.length, rawInsertIdx))
        destWidgets.splice(finalInsertIdx, 0, updatedMovedWidget)
        updated[targetSecIdx] = { ...destSec, widgets: destWidgets }
        commitSections(updated)
        setSelectedSection(targetSecIdx)
        setSelectedColumn(targetColIdx)
        setSelectedWidget({ sectionIdx: targetSecIdx, widgetIdx: finalInsertIdx })
      }
      setActiveTab('inspector')
    }

    handleDragEnd()
  }

  function handleDropOnEmptyCanvas(e) {
    if (disabled || !dragItem) return
    e.preventDefault()
    e.stopPropagation()

    if (dragItem.kind === 'NEW_WIDGET') {
      const wDef = WIDGET_TYPES.find((w) => w.type === dragItem.widgetType)
      if (wDef) addWidgetToSection(wDef, 0, 0)
    } else if (dragItem.kind === 'NEW_TEMPLATE') {
      const tpl = SECTION_TEMPLATES.find((t) => t.id === dragItem.templateId)
      if (tpl) insertTemplate(tpl)
    }
    handleDragEnd()
  }

  function duplicateSection(secIdx) {
    if (disabled) return
    const secToClone = sections[secIdx]
    const newId = generateId()
    const cloned = {
      ...JSON.parse(JSON.stringify(secToClone)),
      id: newId,
      name: `${secToClone.name || 'Section'} (Copy)`,
      slug: `${secToClone.slug || 'section'}-copy-${Date.now().toString(36).slice(2, 5)}`,
    }
    const updated = [...sections]
    updated.splice(secIdx + 1, 0, cloned)
    commitSections(updated)
    scrollToSectionElement(newId, false)
  }

  function deleteSection(secIdx) {
    if (disabled) return
    const updated = sections.filter((_, i) => i !== secIdx)
    commitSections(updated)
    setSelectedSection(null)
    setSelectedWidget(null)
    setActiveTab('widgets')
  }

  function moveSection(secIdx, direction) {
    if (disabled) return
    const newIdx = secIdx + direction
    if (newIdx < 0 || newIdx >= sections.length) return
    const updated = [...sections]
    const [moved] = updated.splice(secIdx, 1)
    updated.splice(newIdx, 0, moved)
    commitSections(updated)
    setSelectedSection(newIdx)
    if (selectedWidget) {
      setSelectedWidget({
        ...selectedWidget,
        sectionIdx: remapIndexAfterSectionMove(selectedWidget.sectionIdx, secIdx, newIdx),
      })
    }
    scrollToSectionElement(moved.id, false)
  }

  function updateSectionSettings(secIdx, updates) {
    if (disabled) return
    const updated = [...sections]
    const currentSec = updated[secIdx]
    const nextCols =
      updates.columns !== undefined ? Math.max(1, parseInt(updates.columns, 10)) : currentSec.columns || 1
    const nextWidgets =
      updates.columns !== undefined && nextCols !== currentSec.columns
        ? (currentSec.widgets || []).map((w, idx) => ({
            ...w,
            column:
              typeof w.column === 'number' && !Number.isNaN(w.column) && w.column >= 0 && w.column < nextCols
                ? w.column
                : idx % nextCols,
          }))
        : currentSec.widgets

    updated[secIdx] = {
      ...currentSec,
      ...updates,
      widgets: nextWidgets,
      settings: { ...(currentSec.settings || {}), ...(updates.settings || {}) },
    }
    commitSections(updated)
    if (selectedSection === secIdx && selectedColumn >= nextCols) {
      setSelectedColumn(0)
    }
  }

  function updateWidgetProps(secIdx, widx, newProps, newColumn = undefined) {
    if (disabled) return
    const updated = [...sections]
    const sec = updated[secIdx]
    const widgets = [...ensureExplicitColumns(sec, sec.columns || 1)]
    widgets[widx] = {
      ...widgets[widx],
      ...(newColumn !== undefined ? { column: Number(newColumn) } : {}),
      props: { ...widgets[widx].props, ...newProps },
    }
    updated[secIdx] = { ...sec, widgets }
    commitSections(updated)
    if (newColumn !== undefined) setSelectedColumn(Number(newColumn))
  }

  function deleteWidget(secIdx, widx) {
    if (disabled) return
    const updated = [...sections]
    const sec = updated[secIdx]
    const widgets = sec.widgets.filter((_, i) => i !== widx)
    updated[secIdx] = { ...sec, widgets }
    commitSections(updated)
    setSelectedWidget(null)
    setActiveTab('widgets')
  }

  function duplicateWidget(secIdx, widx) {
    if (disabled) return
    const updated = [...sections]
    const sec = updated[secIdx]
    const widgets = [...ensureExplicitColumns(sec, sec.columns || 1)]
    const widgetToClone = widgets[widx]
    const cloned = {
      ...JSON.parse(JSON.stringify(widgetToClone)),
      id: generateId(),
    }
    widgets.splice(widx + 1, 0, cloned)
    updated[secIdx] = { ...sec, widgets }
    commitSections(updated)
    setSelectedWidget({ sectionIdx: secIdx, widgetIdx: widx + 1 })
  }

  // Move widget up/down within its OWN column so multi-column ordering never jumps invisibly across columns
  function moveWidget(secIdx, widx, direction) {
    if (disabled) return
    const updated = [...sections]
    const sec = updated[secIdx]
    const widgets = [...ensureExplicitColumns(sec, sec.columns || 1)]
    const targetWidget = widgets[widx]
    if (!targetWidget) return

    const sameColIndices = widgets.reduce((acc, w, idx) => {
      if (w.column === targetWidget.column) acc.push(idx)
      return acc
    }, [])

    const posInCol = sameColIndices.indexOf(widx)
    const swapPosInCol = posInCol + direction
    if (posInCol === -1 || swapPosInCol < 0 || swapPosInCol >= sameColIndices.length) return

    const swapIdx = sameColIndices[swapPosInCol]
    ;[widgets[widx], widgets[swapIdx]] = [widgets[swapIdx], widgets[widx]]

    updated[secIdx] = { ...sec, widgets }
    commitSections(updated)
    setSelectedWidget({ sectionIdx: secIdx, widgetIdx: swapIdx })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-[700px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Builder Top Action Bar */}
      <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden md:inline">
              Elementor Pro Builder
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 ml-1 sm:ml-3">
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(false)
                setActiveTab('widgets')
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                !isPreviewMode && activeTab === 'widgets'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Elements ({WIDGET_TYPES.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(false)
                setActiveTab('templates')
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                !isPreviewMode && activeTab === 'templates'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Templates
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(false)
                setActiveTab('layers')
              }}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1',
                !isPreviewMode && activeTab === 'layers'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Navigator</span>
            </button>
            {(selectedWidget || selectedSection !== null) && (
              <button
                type="button"
                onClick={() => {
                  setIsPreviewMode(false)
                  setActiveTab('inspector')
                }}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
                  !isPreviewMode && activeTab === 'inspector'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                Inspector
              </button>
            )}
          </div>
        </div>

        {/* Undo/Redo, Viewport switch & Live Preview toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              title="Undo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              title="Redo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop View (100%)"
              className={cn(
                'p-1.5 rounded-lg transition',
                viewport === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
              className={cn(
                'p-1.5 rounded-lg transition',
                viewport === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile View (375px)"
              className={cn(
                'p-1.5 rounded-lg transition',
                viewport === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition',
              isPreviewMode
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? 'Exit Preview' : 'Clean Preview'}</span>
          </button>

          {pageSlug && (
            <a
              href={`/${pageSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <span>Live URL</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Main Builder Work Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {!isPreviewMode && (
          <BuilderSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sections={sections}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedColumn={selectedColumn}
            setSelectedColumn={setSelectedColumn}
            selectedWidget={selectedWidget}
            setSelectedWidget={setSelectedWidget}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredWidgets={filteredWidgets}
            availableModules={availableModules}
            disabled={disabled}
            addSection={addSection}
            insertTemplate={insertTemplate}
            addWidgetToSection={addWidgetToSection}
            moveSection={moveSection}
            deleteSection={deleteSection}
            updateSectionSettings={updateSectionSettings}
            updateWidgetProps={updateWidgetProps}
            deleteWidget={deleteWidget}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            scrollToSectionElement={scrollToSectionElement}
          />
        )}

        <BuilderCanvas
          canvasScrollRef={canvasScrollRef}
          viewport={viewport}
          isPreviewMode={isPreviewMode}
          sections={sections}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          selectedColumn={selectedColumn}
          setSelectedColumn={setSelectedColumn}
          selectedWidget={selectedWidget}
          setSelectedWidget={setSelectedWidget}
          setActiveTab={setActiveTab}
          dragItem={dragItem}
          dropIndicator={dropIndicator}
          setDropIndicator={setDropIndicator}
          disabled={disabled}
          addSection={addSection}
          addSectionBelow={addSectionBelow}
          changeSectionColumns={changeSectionColumns}
          moveSection={moveSection}
          duplicateSection={duplicateSection}
          deleteSection={deleteSection}
          moveWidget={moveWidget}
          duplicateWidget={duplicateWidget}
          deleteWidget={deleteWidget}
          handleCanvasScrollOnDrag={handleCanvasScrollOnDrag}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleSectionDragOver={handleSectionDragOver}
          handleDropOnSection={handleDropOnSection}
          handleColumnDragOver={handleColumnDragOver}
          handleDropOnColumn={handleDropOnColumn}
          handleWidgetDragOver={handleWidgetDragOver}
          handleDropOnWidget={handleDropOnWidget}
          handleDropOnEmptyCanvas={handleDropOnEmptyCanvas}
        />
      </div>
    </div>
  )
}
