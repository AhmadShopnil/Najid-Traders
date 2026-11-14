'use client'

import { useState, useRef, useMemo } from 'react'
import {
  CloudUpload,
  Search,
  Trash2,
  Image as ImageIcon,
  Film,
  FileText,
  Copy,
  Check,
  Folder,
  FolderOpen,
  X,
  LayoutGrid,
  List,
  ExternalLink,
  Loader2,
  FolderPlus,
  Filter,
  Download,
  MoreHorizontal,
  Layers,
  PlayCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useGetAssetsQuery, useDeleteAssetMutation, useGetFoldersQuery } from '@/store/services/assetsApi'
import { usePermission } from '@/hooks/usePermission'
import { useDebounce } from '@/hooks/useDebounce'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, cn } from '@/lib/utils'

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PAGE_SIZE = 12

export function MediaLibrary() {
  const { can } = usePermission()
  const canUpload = can('media:upload')
  const canDelete = can('media:delete')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [activeFolder, setActiveFolder] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [previewAsset, setPreviewAsset] = useState(null)
  const [menuAssetId, setMenuAssetId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadFolder, setUploadFolder] = useState('general')
  const [customFolders, setCustomFolders] = useState([])
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef(null)

  const { data: foldersRes } = useGetFoldersQuery()
  const serverFolders = foldersRes?.data || []
  const folders = useMemo(() => {
    const set = new Set(['general', ...serverFolders, ...customFolders])
    return Array.from(set)
  }, [serverFolders, customFolders])

  // Fetch up to 250 assets so counts per folder/type & client-side sorting/pagination feel instant
  const { data: res, isLoading, refetch } = useGetAssetsQuery({
    limit: 250,
  })
  const allAssets = res?.data || []

  // Counts across all assets
  const totalFiles = res?.pagination?.total ?? allAssets.length
  const totalSizeBytes = useMemo(
    () => allAssets.reduce((sum, a) => sum + (a.size || 0), 0),
    [allAssets]
  )
  const imagesCount = useMemo(
    () => allAssets.filter((a) => a.type === 'image').length,
    [allAssets]
  )
  const videosCount = useMemo(
    () => allAssets.filter((a) => a.type === 'video').length,
    [allAssets]
  )
  const docsCount = useMemo(
    () => allAssets.filter((a) => a.type === 'document').length,
    [allAssets]
  )
  const folderCounts = useMemo(() => {
    const map = {}
    for (const a of allAssets) {
      const f = a.folder || 'general'
      map[f] = (map[f] || 0) + 1
    }
    return map
  }, [allAssets])

  // Filtered & sorted list
  const filteredAssets = useMemo(() => {
    let list = allAssets.filter((a) => {
      if (activeType !== 'all' && a.type !== activeType) return false
      if (activeFolder && (a.folder || 'general') !== activeFolder) return false
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase()
        if (!(a.originalName || '').toLowerCase().includes(q)) return false
      }
      return true
    })

    list = [...list]
    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (sortBy === 'largest') {
      list.sort((a, b) => (b.size || 0) - (a.size || 0))
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.originalName || '').localeCompare(b.originalName || ''))
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return list
  }, [allAssets, activeType, activeFolder, debouncedSearch, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedAssets = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredAssets.slice(start, start + PAGE_SIZE)
  }, [filteredAssets, safePage])

  const [deleteAsset, { isLoading: deleting }] = useDeleteAssetMutation()

  async function uploadFiles(files) {
    if (!canUpload || !files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    const targetFolder = activeFolder || uploadFolder || 'general'
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    formData.append('folder', targetFolder)
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await response.json().catch(() => null)
      if (response.ok) {
        await refetch()
      } else {
        setUploadError(json?.message || 'Upload failed. Please verify file type and size (max 25MB).')
      }
    } catch {
      setUploadError('Network error while uploading files.')
    } finally {
      setUploading(false)
    }
  }

  async function handleFileInput(e) {
    await uploadFiles(e.target.files)
    e.target.value = ''
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (!canUpload) return
    await uploadFiles(e.dataTransfer.files)
  }

  async function handleDelete() {
    if (!canDelete || !deleteTarget) return
    await deleteAsset(deleteTarget._id)
    if (selectedAsset?._id === deleteTarget._id) setSelectedAsset(null)
    if (previewAsset?._id === deleteTarget._id) setPreviewAsset(null)
    setDeleteTarget(null)
  }

  function handleCopyUrl(url, id = 'modal') {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  function handleCreateFolder(e) {
    e.preventDefault()
    const cleaned = newFolderName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
    if (!cleaned) return
    setCustomFolders((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]))
    setUploadFolder(cleaned)
    setActiveFolder(cleaned)
    setPage(1)
    setNewFolderName('')
    setCreatingFolder(false)
  }

  function clearFilters() {
    setActiveType('all')
    setActiveFolder('')
    setSearch('')
    setPage(1)
  }

  const FILE_TYPES = [
    { key: 'all', label: 'All Files', count: allAssets.length, icon: LayoutGrid },
    { key: 'image', label: 'Images', count: imagesCount, icon: ImageIcon },
    { key: 'video', label: 'Videos', count: videosCount, icon: Film },
    { key: 'document', label: 'Documents', count: docsCount, icon: FileText },
  ]

  const startIdx = filteredAssets.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(safePage * PAGE_SIZE, filteredAssets.length)

  return (
    <div
      onDragOver={(e) => {
        if (!canUpload) return
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDragOver(false)
        }
      }}
      onDrop={handleDrop}
      className="relative w-full space-y-6"
    >
      {/* Drag-and-Drop Overlay */}
      {dragOver && canUpload && (
        <div className="fixed inset-0 z-40 bg-indigo-950/35 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#5b5ce6] px-10 py-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5b5ce6] flex items-center justify-center mx-auto mb-3">
              <CloudUpload className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-900">Drop files to upload</p>
            <p className="text-xs text-slate-500 mt-1">
              Saving into <span className="font-mono font-semibold text-[#5b5ce6]">/{activeFolder || uploadFolder}</span>
            </p>
          </div>
        </div>
      )}

      {/* Top Header + 4 Compact Stat Pills (matching reference) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            Media Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized media assets for images, videos, and documents.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2.5 flex items-center gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">{totalFiles}</p>
              <p className="text-[11px] font-medium text-slate-400">Total Files</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2.5 flex items-center gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">
                {formatSize(totalSizeBytes)}
              </p>
              <p className="text-[11px] font-medium text-slate-400">Total Size</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2.5 flex items-center gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="w-9 h-9 rounded-full bg-violet-50 text-[#5b5ce6] flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">{videosCount}</p>
              <p className="text-[11px] font-medium text-slate-400">Videos</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-2.5 flex items-center gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">{imagesCount}</p>
              <p className="text-[11px] font-medium text-slate-400">Images</p>
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Filters & Folders Sidebar Card */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#5b5ce6] hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* File Type */}
          <div className="space-y-1">
            <p className="px-2 pb-1 text-xs font-bold text-slate-800">File Type</p>
            {FILE_TYPES.map(({ key, label, count, icon: Icon }) => {
              const active = activeType === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveType(key)
                    setPage(1)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer',
                    active
                      ? 'bg-[#eef0ff] text-[#5b5ce6] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </span>
                  <span className={cn('tabular-nums text-[11px]', active ? 'text-[#5b5ce6] font-bold' : 'text-slate-400')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Folders */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="px-2 pb-1 text-xs font-bold text-slate-800">Folders</p>
            {folders.map((folder) => {
              const active = activeFolder === folder
              const count = folderCounts[folder] || 0
              return (
                <button
                  type="button"
                  key={folder}
                  onClick={() => {
                    setActiveFolder(active ? '' : folder)
                    setUploadFolder(folder)
                    setPage(1)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer',
                    active
                      ? 'bg-[#eef0ff] text-[#5b5ce6] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  )}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {active ? (
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    )}
                    <span className="capitalize truncate">{folder}</span>
                  </span>
                  <span className={cn('tabular-nums text-[11px]', active ? 'text-[#5b5ce6] font-bold' : 'text-slate-400')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Create Folders Bottom Promo Card */}
          <div className="rounded-2xl bg-[#f4f5ff] border border-indigo-100/80 p-4 text-center space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 text-[#5b5ce6] flex items-center justify-center mx-auto">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Create Folders</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Keep your media well organized.
              </p>
            </div>

            {creatingFolder ? (
              <form onSubmit={handleCreateFolder} className="space-y-2 pt-1">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="folder-name"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/30"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreatingFolder(false)}
                    className="flex-1 py-1 text-[11px] font-semibold text-slate-500 bg-white rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1 text-[11px] font-semibold text-white bg-[#5b5ce6] rounded-lg cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              canUpload && (
                <button
                  type="button"
                  onClick={() => setCreatingFolder(true)}
                  className="text-xs font-bold text-[#5b5ce6] hover:underline cursor-pointer"
                >
                  Create Folder +
                </button>
              )
            )}
          </div>
        </aside>

        {/* Right Main Gallery Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Pill Tabs + View Toggle + Upload CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {FILE_TYPES.map(({ key, label, count, icon: Icon }) => {
                const active = activeType === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveType(key)
                      setPage(1)
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer',
                      active
                        ? 'bg-[#5b5ce6] border-[#5b5ce6] text-white shadow-sm shadow-indigo-200'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>
                      {key === 'all' ? 'All Assets' : label} ({count})
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                  className={cn(
                    'p-1.5 rounded-lg transition cursor-pointer',
                    viewMode === 'grid' ? 'bg-[#eef0ff] text-[#5b5ce6]' : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                  className={cn(
                    'p-1.5 rounded-lg transition cursor-pointer',
                    viewMode === 'list' ? 'bg-[#eef0ff] text-[#5b5ce6]' : 'text-slate-400 hover:text-slate-700'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {canUpload && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    <span>{uploading ? 'Uploading...' : 'Upload Assets'}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </>
              )}
            </div>
          </div>

          {/* Search Bar + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search media files..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 focus:border-[#5b5ce6] shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition"
              />
            </div>

            <div className="relative w-full sm:w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5b5ce6]/25 cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="largest">Largest First</option>
                <option value="name">Name (A–Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Asset Cards Grid / List */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : paginatedAssets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200/90">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5b5ce6] flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">No media assets found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {canUpload
                  ? 'Drag and drop files anywhere or click Upload Assets to add media.'
                  : 'Try clearing filters or selecting another folder.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedAssets.map((asset) => {
                const isSelected = selectedAsset?._id === asset._id
                const menuOpen = menuAssetId === asset._id

                return (
                  <div
                    key={asset._id}
                    onClick={() => setSelectedAsset(asset)}
                    onDoubleClick={() => setPreviewAsset(asset)}
                    className={cn(
                      'group relative bg-white rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col overflow-visible shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md',
                      isSelected
                        ? 'border-[#5b5ce6] ring-2 ring-[#5b5ce6]/20'
                        : 'border-slate-200/80 hover:border-indigo-200'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/11] bg-[#f8f9fc] rounded-t-2xl overflow-hidden border-b border-slate-100">
                      {asset.type === 'image' ? (
                        <img
                          src={asset.url}
                          alt={asset.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                          <PlayCircle className="w-9 h-9 opacity-80" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText className="w-9 h-9" />
                        </div>
                      )}

                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#5b5ce6] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>

                    {/* Footer Info + Action Buttons (matching reference card) */}
                    <div className="p-3.5 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate" title={asset.originalName}>
                          {asset.originalName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          {asset.type === 'image' ? (
                            <ImageIcon className="w-3 h-3 flex-shrink-0" />
                          ) : asset.type === 'video' ? (
                            <Film className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {formatSize(asset.size)} · {formatDate(asset.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="relative flex items-center gap-1 flex-shrink-0">
                        <a
                          href={asset.url}
                          download={asset.originalName}
                          onClick={(e) => e.stopPropagation()}
                          title="Download file"
                          className="w-7 h-7 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuAssetId(menuOpen ? null : asset._id)
                          }}
                          title="More options"
                          className="w-7 h-7 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {menuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuAssetId(null)
                              }}
                            />
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-1.5 w-40 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1 z-20 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewAsset(asset)
                                  setMenuAssetId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                Preview Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleCopyUrl(asset.url, asset._id)
                                  setMenuAssetId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                {copiedId === asset._id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                Copy URL
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(asset)
                                    setMenuAssetId(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8f9fc] border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">File</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folder</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAssets.map((asset) => (
                      <tr
                        key={asset._id}
                        onClick={() => setPreviewAsset(asset)}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f5f6fb] overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200/70">
                              {asset.type === 'image' ? (
                                <img src={asset.url} alt={asset.originalName} className="w-full h-full object-cover" />
                              ) : asset.type === 'video' ? (
                                <Film className="w-4 h-4 text-slate-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                              {asset.originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef0ff] text-[#5b5ce6] capitalize">
                            {asset.folder}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-600">{formatSize(asset.size)}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{formatDate(asset.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyUrl(asset.url, asset._id)
                              }}
                              title="Copy URL"
                              className="p-2 text-slate-400 hover:text-[#5b5ce6] hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              {copiedId === asset._id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget(asset)
                                }}
                                title="Delete asset"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Pagination Bar (matching reference) */}
          {filteredAssets.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500 font-medium">
                Showing {startIdx}–{endIdx} of {filteredAssets.length} assets
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-semibold border transition cursor-pointer',
                        p === safePage
                          ? 'bg-[#5b5ce6] border-[#5b5ce6] text-white shadow-xs'
                          : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal (opened via double-click or More -> Preview Details) */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#fafbfe]">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{previewAsset.originalName}</h3>
                <p className="text-[11px] text-slate-400 uppercase mt-0.5">
                  {previewAsset.type} · {formatSize(previewAsset.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="aspect-video bg-[#f5f6fb] rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200/70">
                {previewAsset.type === 'image' ? (
                  <img
                    src={previewAsset.url}
                    alt={previewAsset.originalName}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : previewAsset.type === 'video' ? (
                  <video src={previewAsset.url} controls className="max-h-full max-w-full" />
                ) : (
                  <FileText className="w-14 h-14 text-slate-400" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#f8f9fc] border border-slate-200/70 rounded-xl p-3">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Dimensions</p>
                  <p className="font-mono font-semibold text-slate-800 mt-1">
                    {previewAsset.width || '—'} × {previewAsset.height || '—'}
                  </p>
                </div>
                <div className="bg-[#f8f9fc] border border-slate-200/70 rounded-xl p-3">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">File Size</p>
                  <p className="font-mono font-semibold text-slate-800 mt-1">{formatSize(previewAsset.size)}</p>
                </div>
                <div className="bg-[#f8f9fc] border border-slate-200/70 rounded-xl p-3">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Folder</p>
                  <p className="font-semibold text-[#5b5ce6] capitalize mt-1">{previewAsset.folder}</p>
                </div>
                <div className="bg-[#f8f9fc] border border-slate-200/70 rounded-xl p-3">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Uploaded</p>
                  <p className="font-semibold text-slate-800 mt-1">{formatDate(previewAsset.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={previewAsset.url}
                  className="flex-1 px-3.5 py-2.5 bg-[#f5f6fb] border border-slate-200/80 rounded-xl text-xs font-mono text-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewAsset.url)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#5b5ce6] hover:bg-[#4e4fd4] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {copiedId === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === 'modal' ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(previewAsset)
                      setPreviewAsset(null)
                    }}
                    title="Delete asset"
                    className="p-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Media Asset"
        message={`Are you sure you want to delete "${deleteTarget?.originalName}"? This file will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
