import { parsePaginationParams } from '@/lib/utils'

function parseFilterValue(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  if (val !== '' && !Number.isNaN(Number(val)) && /^-?\d+(\.\d+)?$/.test(val.trim())) {
    return Number(val)
  }
  return val
}

export function buildQuery(searchParams, module) {
  const filter = {}
  const sort = {}
  const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 20, maxLimit: 100 })

  for (const [key, value] of searchParams.entries()) {
    const taxMatch = key.match(/^taxonomy\[([\w-]+)\]$/)
    if (taxMatch) {
      filter[`taxonomies.${taxMatch[1]}`] = value
      continue
    }

    const filterMatch = key.match(/^filter\[([\w.]+)\](?:\[(\w+)\])?$/)
    if (filterMatch) {
      const isTax = filterMatch[1].startsWith('taxonomies.')
      const field = isTax ? filterMatch[1] : 'data.' + filterMatch[1]
      const operator = filterMatch[2]
      const parsedVal = parseFilterValue(value)
      if (operator) {
        const mongoOp = { gt: '$gt', lt: '$lt', gte: '$gte', lte: '$lte', ne: '$ne' }[operator]
        if (mongoOp) filter[field] = { ...(filter[field] || {}), [mongoOp]: parsedVal }
      } else {
        filter[field] = parsedVal
      }
    }
  }

  const status = searchParams.get('status')
  if (status) filter.status = status

  const sortParam = searchParams.get('sort')
  if (sortParam) {
    sortParam.split(',').forEach((s) => {
      const trimmed = s.trim()
      if (!trimmed) return
      const desc = trimmed.startsWith('-')
      const field = desc ? trimmed.slice(1) : trimmed
      if (!/^[\w.]+$/.test(field)) return
      const mapped = ['createdAt', 'updatedAt', 'status', 'publishedAt'].includes(field)
        ? field
        : 'data.' + field
      sort[mapped] = desc ? -1 : 1
    })
  }

  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1
  }

  return { filter, sort, page, limit, skip }
}
