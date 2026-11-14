import { connectDB } from '@/lib/db/mongoose'
import { Page } from '@/lib/db/models/Page'
import { successResponse, errorResponse } from '@/lib/api-response'

function formatKey(name) {
  if (!name) return 'unnamed_field'
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')
}

function transformSections(sections) {
  if (!Array.isArray(sections)) return []
  return sections.map(sec => {
    const data = {}
    if (Array.isArray(sec.fields)) {
      sec.fields.forEach(f => {
        const key = f.slug || formatKey(f.name)
        data[key] = f.value
      })
    }
    return {
      id: sec.id,
      name: sec.name,
      slug: sec.slug || formatKey(sec.name).replace(/_/g, '-'),
      columns: sec.columns || 1,
      settings: sec.settings || {},
      widgets: sec.widgets || [],
      data,
      subSections: transformSections(sec.subSections)
    }
  })
}

export async function GET(request, { params }) {
  const { slug } = await params
  try {
    await connectDB()
    const page = await Page.findOne({ slug, status: 'published' }).lean()
    if (!page) return errorResponse('Page not found', 404)
    
    delete page.__v
    delete page.createdBy
    delete page.createdAt
    delete page.updatedAt

    page.sections = transformSections(page.sections)

    return successResponse(page)
  } catch (err) { return errorResponse(err.message) }
}
