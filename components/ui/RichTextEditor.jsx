'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting,
  CodeXml,
  Eye,
  FileCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function RichTextEditor({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Write detailed rich text content, format headings, bullet points, links...',
  className,
}) {
  const [mounted, setMounted] = useState(false)
  const [htmlMode, setHtmlMode] = useState(false)
  const [rawHtml, setRawHtml] = useState(value || '')
  const [showLinkPrompt, setShowLinkPrompt] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline font-medium hover:text-indigo-800 cursor-pointer',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-slate-200 shadow-xs',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML()
      setRawHtml(html)
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none focus:outline-none min-h-[200px] p-4 text-sm sm:text-base leading-relaxed text-slate-800',
      },
    },
  })

  // Sync external value changes when not focused
  useEffect(() => {
    if (!editor) return
    const currentHTML = editor.getHTML()
    if (value !== currentHTML && (value || editor.isEmpty)) {
      editor.commands.setContent(value || '', false)
      setRawHtml(value || '')
    }
  }, [value, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setShowLinkPrompt(true)
  }, [editor])

  const confirmLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      let finalUrl = linkUrl.trim()
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:') && !finalUrl.startsWith('/')) {
        finalUrl = 'https://' + finalUrl
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()
    }
    setShowLinkPrompt(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleRawHtmlChange = (e) => {
    const next = e.target.value
    setRawHtml(next)
    onChange?.(next)
    if (editor) {
      editor.commands.setContent(next, false)
    }
  }

  if (!mounted) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-[#f8f9fc] p-4 min-h-[220px] animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-full bg-slate-200 rounded mb-2" />
        <div className="h-4 w-4/5 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
      </div>
    )
  }

  const wordCount = (rawHtml || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#0D253F]/20 focus-within:border-[#0D253F]',
        disabled && 'opacity-70 bg-slate-50 pointer-events-none',
        className
      )}
    >
      {/* Formatting Toolbar */}
      <div className="bg-[#f8f9fc] border-b border-slate-200/80 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
              className={cn(
                'px-2 py-1 rounded text-xs font-bold transition cursor-pointer',
                editor?.isActive('heading', { level: 1 })
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              H1
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
              className={cn(
                'px-2 py-1 rounded text-xs font-bold transition cursor-pointer',
                editor?.isActive('heading', { level: 2 })
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              H2
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
              className={cn(
                'px-2 py-1 rounded text-xs font-bold transition cursor-pointer',
                editor?.isActive('heading', { level: 3 })
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              H3
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Inline Formats */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('bold')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('italic')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('strike')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleCode().run()}
              title="Inline Code"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('code')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Lists */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet List"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('bulletList')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('orderedList')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Quote, Divider, Code Block */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('blockquote')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('codeBlock')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              title="Divider Line"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Link Controls */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={setLink}
              title="Add / Edit Link"
              className={cn(
                'p-1.5 rounded transition cursor-pointer',
                editor?.isActive('link')
                  ? 'bg-[#0D253F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            {editor?.isActive('link') && (
              <button
                type="button"
                disabled={disabled || htmlMode}
                onClick={() => editor?.chain().focus().unsetLink().run()}
                title="Remove Link"
                className="p-1.5 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Undo / Redo / Clear */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={disabled || htmlMode || !editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode || !editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || htmlMode}
              onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
              title="Clear Formatting"
              className="p-1.5 rounded text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition cursor-pointer"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle (<> HTML / Visual) */}
        <button
          type="button"
          onClick={() => setHtmlMode((v) => !v)}
          title={htmlMode ? 'Switch to Visual WYSIWYG Editor' : 'Switch to Raw HTML Code View'}
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer',
            htmlMode
              ? 'bg-[#0D253F] text-white border-[#0D253F] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          {htmlMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Visual</span>
            </>
          ) : (
            <>
              <CodeXml className="w-3.5 h-3.5" />
              <span>HTML</span>
            </>
          )}
        </button>
      </div>

      {/* Link Popover Prompt */}
      {showLinkPrompt && (
        <div className="bg-indigo-50/80 border-b border-indigo-100 p-3 flex flex-col sm:flex-row items-center gap-2">
          <span className="text-xs font-semibold text-[#0D253F] flex items-center gap-1.5 shrink-0">
            <Link2 className="w-3.5 h-3.5 text-[#C89B3C]" />
            Insert Link:
          </span>
          <input
            type="url"
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmLink()
              } else if (e.key === 'Escape') {
                setShowLinkPrompt(false)
              }
            }}
            placeholder="https://example.com"
            className="flex-1 w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0D253F]/20 focus:border-[#0D253F]"
          />
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowLinkPrompt(false)}
              className="px-2.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmLink}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--dash-primary, #0D253F)' }}
            >
              Apply Link
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      {htmlMode ? (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          disabled={disabled}
          placeholder="<p>Enter custom HTML here...</p>"
          rows={12}
          className="w-full p-4 font-mono text-xs text-emerald-400 bg-slate-900 focus:outline-none resize-y min-h-[200px]"
        />
      ) : (
        <div className="rich-editor-content bg-white min-h-[220px]">
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-2">
          <span className="font-medium text-slate-600">{wordCount}</span> words
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          Rich Text WYSIWYG
        </span>
      </div>
    </div>
  )
}
