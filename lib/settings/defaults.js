import { cache } from 'react'
import { connectDB } from '@/lib/db/mongoose'
import { SettingGroup } from '@/lib/db/models/SettingGroup'
import { SYSTEM_SETTING_GROUPS } from './schema'

export { SYSTEM_SETTING_GROUPS }

/**
 * Non-destructively ensures all system setting groups and their default fields exist.
 * Never overwrites user-saved values or removes custom fields.
 */
export async function ensureSystemSettings() {
  const existingGroups = await SettingGroup.find({
    slug: { $in: SYSTEM_SETTING_GROUPS.map((g) => g.slug) },
  }).lean()

  const bySlug = new Map(existingGroups.map((g) => [g.slug, g]))
  const ops = []

  for (const template of SYSTEM_SETTING_GROUPS) {
    const existing = bySlug.get(template.slug)
    if (!existing) {
      ops.push({ insertOne: { document: template } })
      continue
    }

    const existingSlugs = new Set((existing.fields || []).map((f) => f.slug))
    const missingFields = template.fields.filter((f) => !existingSlugs.has(f.slug))
    if (missingFields.length > 0) {
      ops.push({
        updateOne: {
          filter: { _id: existing._id },
          update: { $push: { fields: { $each: missingFields } } },
        },
      })
    }
  }

  if (ops.length > 0) {
    await SettingGroup.bulkWrite(ops)
  }
}

export function fieldsToMap(fields = []) {
  const map = {}
  for (const field of fields) {
    if (field?.slug) {
      map[field.slug] = field.value
    }
  }
  return map
}

export const getDashboardBranding = cache(async () => {
  const branding = {
    name: 'Najid Dashboard',
    logo: '',
    loginSubtitle: 'Sign in to manage your workspace',
    sidebarBg: '#0D253F',
    primaryColor: '#0D253F',
    accentColor: '#C89B3C',
  }

  try {
    await connectDB()
    const group = await SettingGroup.findOne({ slug: 'dashboard' }).lean()
    if (group?.fields) {
      const map = fieldsToMap(group.fields)
      if (map.dashboard_name) branding.name = String(map.dashboard_name)
      if (map.dashboard_logo) branding.logo = String(map.dashboard_logo)
      if (map.login_subtitle) branding.loginSubtitle = String(map.login_subtitle)
      if (map.dashboard_sidebar_bg) branding.sidebarBg = String(map.dashboard_sidebar_bg)
      if (map.dashboard_primary_color) branding.primaryColor = String(map.dashboard_primary_color)
      if (map.dashboard_accent_color) branding.accentColor = String(map.dashboard_accent_color)
    }
  } catch (err) {
    console.error('Error loading dashboard branding:', err)
  }

  return branding
})
