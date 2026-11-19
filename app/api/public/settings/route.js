import { connectDB } from '@/lib/db/mongoose'
import { SettingGroup } from '@/lib/db/models/SettingGroup'
import { successResponse, errorResponse } from '@/lib/api-response'

export const revalidate = 60

export async function GET() {
  try {
    await connectDB()
    const groups = await SettingGroup.find().lean()

    const settingsObject = {}
    groups.forEach((group) => {
      const groupData = {}
      if (group.fields && group.fields.length > 0) {
        group.fields.forEach((field) => {
          const fieldSlug = field.slug || field.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
          groupData[fieldSlug] = field.value
        })
      }
      settingsObject[group.slug] = groupData
    })

    return successResponse(settingsObject, 'Success', 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  } catch (err) {
    return errorResponse(err.message)
  }
}
