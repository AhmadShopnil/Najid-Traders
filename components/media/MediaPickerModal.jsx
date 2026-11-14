'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, Check, Search, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { useGetAssetsQuery, useGetFoldersQuery } from '@/store/services/assetsApi'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const FOLDER_ICONS = {
  general: '🗂️',
  content: '📄',
  pages: '📑',
  blogs: '📝',
  news: '📰',
  slider: '🖼️',
  gallery: '🎨',
  services: '⚙️',
}

export function MediaPickerModal({ open, onClose, onSelect, multiple = false, defaultFolder = 'general' }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [tab, setTab] = useState('library')
  const [activeFolder, setActiveFolder] = useState(defaultFolder)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [uploadFolder, setUploadFolder] = useState(defaultFolder)

  const { data: foldersRes } = useGetFoldersQuery(undefined, { skip: !open })
  const folders = foldersRes?.data || ['general']

  const { data: res, isLoading, refetch } = useGetAssetsQuery(
    { folder: activeFolder || undefined, q: debouncedSearch || undefined, limit: 60 },
    { skip: !open }
  )
  const assets = res?.data || []

  useEffect(() => {
    if (open) {
      setSelectedIds([])
      setSelectedAssets([])
      setUploadError(null)
      setTab('library')
      setSearch('')
      setActiveFolder(defaultFolder)
      setUploadFolder(defaultFolder)
    }
  }, [open, defaultFolder])

  if (!open) return null

  function handleSelect(asset) {
    if (multiple) {
      if (selectedIds.includes(asset._id)) {
        setSelectedIds((prev) => prev.filter((id) => id !== asset._id))
        setSelectedAssets((prev) => prev.filter((a) => a._id !== asset._id))
      } else {
        setSelectedIds((prev) => [...prev, asset._id])
        setSelectedAssets((prev) => [...prev, asset])
      }
    } else {
      setSelectedIds([asset._id])
      setSelectedAssets([asset])
    }
  }

  function handleConfirm() {
    const urls = selectedAssets.map((a) => a.url)
    onSelect(multiple ? urls : (urls[0] || ''))
    onClose()
  }

  async function handleFileUpload(e) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    formData.append('folder', uploadFolder)

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await response.json().catch(() => null)
      if (response.ok) {
        await refetch()
        setActiveFolder(uploadFolder)
        setTab('library')
      } else {
        setUploadError(json?.message || 'Upload failed. Please check file type and size.')
      }
    } catch {
      setUploadError('Network error while uploading file(s).')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Media Library</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {multiple ? 'Select one or more images' : 'Select an image'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
              tab === 'library' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            Browse Library
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
              tab === 'upload' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            Upload New
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {tab === 'library' && (
            <>
              <div className="w-44 flex-shrink-0 border-r border-slate-100 bg-slate-50 overflow-y-auto py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Folders</p>
                <button
                  type="button"
                  onClick={() => { setActiveFolder(''); setSearch('') }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-left transition',
                    activeFolder === '' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <span>📁</span> All Media
                </button>
                {folders.map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => { setActiveFolder(f); setSearch('') }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-left transition capitalize',
                      activeFolder === f ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span>{FOLDER_ICONS[f] || '📂'}</span> {f}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search in ${activeFolder || 'all folders'}...`}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                      <ImageIcon className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="font-medium">No media found</p>
                      <button type="button" onClick={() => setTab('upload')} className="mt-2 text-purple-600 text-sm font-semibold hover:underline">
                        Upload to this folder →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {assets.map((asset) => {
                        const isSelected = selectedIds.includes(asset._id)
                        return (
                          <div
                            key={asset._id}
                            onClick={() => handleSelect(asset)}
                            title={asset.originalName}
                            className={cn(
                              'relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
                              isSelected
                                ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                                : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                            )}
                          >
                            <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover bg-slate-100" />
                            {activeFolder === '' && (
                              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded capitalize truncate max-w-[70%]">
                                {asset.folder}
                              </span>
                            )}
                            {isSelected && <div className="absolute inset-0 bg-purple-600/20" />}
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              {uploadError && (
                <div className="w-full max-w-md px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {uploadError}
                </div>
              )}

              <div className="w-full max-w-md">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Upload to Folder</label>
                <div className="relative">
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white pr-10"
                  >
                    {Array.from(new Set([defaultFolder, 'general', ...folders])).filter(Boolean).map((f) => (
                      <option key={f} value={f} className="capitalize">{FOLDER_ICONS[f] || '📂'} {f}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full max-w-md h-52 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition group relative">
                <div className="flex flex-col items-center justify-center">
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-purple-600">Uploading to &ldquo;{uploadFolder}&rdquo;...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-300 group-hover:text-purple-400 transition mb-3" />
                      <p className="text-sm font-semibold text-slate-700">Click to browse or drag & drop</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP, GIF — up to 25MB each</p>
                      <p className="text-xs text-purple-500 mt-2 font-medium">→ Will be saved to &ldquo;{uploadFolder}&rdquo;</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple={multiple}
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedAssets.slice(0, 4).map((a, i) => (
                    <img key={i} src={a.url} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {selectedIds.length} file{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <button type="button" onClick={() => { setSelectedIds([]); setSelectedAssets([]) }} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
              </div>
            ) : (
              <span className="text-sm text-slate-400">No items selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition shadow-sm"
            >
              Insert {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
