import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function escapeRegex(str) {
  if (!str) return ''
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)
}

export function parsePaginationParams(searchParams, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function slugify(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolveContentSlug(data = {}, moduleFields = [], fallbackId = '') {
  if (!data || typeof data !== 'object') return fallbackId ? String(fallbackId) : ''
  if (typeof data.slug === 'string' && data.slug.trim()) {
    return slugify(data.slug.trim()) || data.slug.trim()
  }

  // Try common title/name fields first
  const candidateKeys = [
    'title',
    'headline',
    'name',
    'post_title',
    'news_title',
    'product_name',
    'course_name',
    'event_name',
    'job_title',
    'service_name',
    'subject',
  ]
  for (const key of candidateKeys) {
    if (typeof data[key] === 'string' && data[key].trim()) {
      const generated = slugify(data[key])
      if (generated) return generated
    }
  }

  // Otherwise try the first text field from module schema
  if (Array.isArray(moduleFields)) {
    const firstTextField = moduleFields.find((f) => f.type === 'text' && f.name !== 'slug')
    if (firstTextField && typeof data[firstTextField.name] === 'string' && data[firstTextField.name].trim()) {
      const generated = slugify(data[firstTextField.name])
      if (generated) return generated
    }
  }

  // Fallback to first non-empty string field in data
  for (const [k, val] of Object.entries(data)) {
    if (
      typeof val === 'string' &&
      val.trim() &&
      !val.startsWith('http') &&
      !val.startsWith('/') &&
      val.length < 150 &&
      !['status', 'id', '_id'].includes(k)
    ) {
      const generated = slugify(val)
      if (generated) return generated
    }
  }

  return fallbackId ? String(fallbackId) : ''
}

export function formatDate(date, locale = 'en-US') {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(date, locale = 'en-US') {
  if (!date) return ''
  return new Date(date).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function truncate(str, length = 100) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
