import { cache } from 'react'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/mongoose'
import { Content } from '@/lib/db/models/Content'
import { Module } from '@/lib/db/models/Module'
import { Taxonomy } from '@/lib/db/models/Taxonomy'
import { BuilderPage } from '@/lib/db/models/BuilderPage'
import { Page } from '@/lib/db/models/Page'
import { SettingGroup } from '@/lib/db/models/SettingGroup'
import { Employee } from '@/lib/db/models/Employee'
import { Menu } from '@/lib/db/models/Menu'
import '@/lib/db/models/User'
import { resolveItemCategories } from '@/app/api/public/[module]/route'
import { resolveContentSlug, slugify } from '@/lib/utils'
import { ensureDefaultMenus } from '@/lib/menus/defaults'

import { fieldsToMap } from '@/lib/settings/defaults'

const memoryCache = new Map()

function getCached(key) {
  const entry = memoryCache.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data
  }
  return null
}

function setCached(key, data, ttlMs = 60000) {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function clearPublicDataCache() {
  memoryCache.clear()
}

export const getPublicSiteSettings = cache(async () => {
  const cachedSettings = getCached('site-settings')
  if (cachedSettings) return cachedSettings

  const settings = {
    siteName: 'Najid Traders',
    siteTagline: '',
    siteLogo: '',
    brandDisplay: 'both',
    favicon: '',
    footerText: '',
    contact: {
      email: '',
      phone: '',
      address: '',
      hours: '',
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
    },
    theme: {
      primaryColor: '#0D253F',
      secondaryColor: '#16385D',
      accentColor: '#C89B3C',
      buttonBg: '#0D253F',
      buttonText: '#ffffff',
      topbarBg: '#0D253F',
      footerBg: '#0D253F',
    },
    footer: {
      col1Title: 'Company',
      col2Title: 'Trade Policy',
      col3Title: 'Contact Information',
      copyright: '© {year} Najid Traders. All rights reserved.',
      subtext: 'Wholesale Product Catalog — Direct Trade Inquiries',
      text: '',
    },
    topbar: {
      text: 'Importer & Wholesale Trade House',
      showPhone: true,
      showHours: true,
    },
    menus: {
      main_header: [],
      top_bar: [],
      footer_col1: [],
      footer_col2: [],
      footer_col3: [],
    },
  }
  try {
    await connectDB()
    await ensureDefaultMenus()

    const [groups, allMenus] = await Promise.all([
      SettingGroup.find({
        slug: { $in: ['general', 'contact', 'seo', 'social', 'theme', 'footer'] },
      }).lean(),
      Menu.find({ isActive: true }).lean(),
    ])

    const bySlug = {}
    for (const group of groups) {
      bySlug[group.slug] = fieldsToMap(group.fields || [])
    }

    // Populate active menus mapped by location and slug
    for (const m of allMenus || []) {
      const activeItems = (m.items || [])
        .filter((i) => i.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      if (m.location) {
        settings.menus[m.location] = activeItems
      }
      settings.menus[m.slug] = activeItems
    }

    const general = bySlug.general || {}
    if (general.site_name) settings.siteName = String(general.site_name)
    if (general.site_tagline) settings.siteTagline = String(general.site_tagline)
    if (general.site_logo) settings.siteLogo = String(general.site_logo)
    if (general.brand_display_mode) settings.brandDisplay = String(general.brand_display_mode)
    if (general.favicon) settings.favicon = String(general.favicon)
    if (general.footer_text) settings.footerText = String(general.footer_text)
    settings.footer.text = settings.footerText

    const footer = bySlug.footer || {}
    if (footer.footer_col1_title) settings.footer.col1Title = String(footer.footer_col1_title)
    if (footer.footer_col2_title) settings.footer.col2Title = String(footer.footer_col2_title)
    if (footer.footer_col3_title) settings.footer.col3Title = String(footer.footer_col3_title)
    if (footer.footer_copyright) settings.footer.copyright = String(footer.footer_copyright)
    if (footer.footer_subtext) settings.footer.subtext = String(footer.footer_subtext)
    if (footer.topbar_text) settings.topbar.text = String(footer.topbar_text)
    if (footer.topbar_show_phone !== undefined) settings.topbar.showPhone = Boolean(footer.topbar_show_phone)
    if (footer.topbar_show_hours !== undefined) settings.topbar.showHours = Boolean(footer.topbar_show_hours)

    const contact = bySlug.contact || {}
    if (contact.contact_email) settings.contact.email = String(contact.contact_email)
    if (contact.contact_phone) settings.contact.phone = String(contact.contact_phone)
    if (contact.contact_address) settings.contact.address = String(contact.contact_address)
    if (contact.support_hours) settings.contact.hours = String(contact.support_hours)

    const seo = bySlug.seo || {}
    if (seo.meta_title) settings.seo.metaTitle = String(seo.meta_title)
    if (seo.meta_description) settings.seo.metaDescription = String(seo.meta_description)
    if (seo.og_image) settings.seo.ogImage = String(seo.og_image)

    const social = bySlug.social || {}
    if (social.facebook_url || seo.facebook_url) settings.social.facebook = String(social.facebook_url || seo.facebook_url)
    if (social.twitter_url || seo.twitter_url) settings.social.twitter = String(social.twitter_url || seo.twitter_url)
    if (social.instagram_url || seo.instagram_url) settings.social.instagram = String(social.instagram_url || seo.instagram_url)
    if (social.linkedin_url || seo.linkedin_url) settings.social.linkedin = String(social.linkedin_url || seo.linkedin_url)
    if (social.youtube_url || seo.youtube_url) settings.social.youtube = String(social.youtube_url || seo.youtube_url)

    const theme = bySlug.theme || {}
    if (theme.theme_primary_color) settings.theme.primaryColor = String(theme.theme_primary_color)
    if (theme.theme_secondary_color) settings.theme.secondaryColor = String(theme.theme_secondary_color)
    if (theme.theme_accent_color) settings.theme.accentColor = String(theme.theme_accent_color)
    if (theme.theme_button_bg) settings.theme.buttonBg = String(theme.theme_button_bg)
    if (theme.theme_button_text) settings.theme.buttonText = String(theme.theme_button_text)
    if (theme.theme_topbar_bg) settings.theme.topbarBg = String(theme.theme_topbar_bg)
    if (theme.theme_footer_bg) settings.theme.footerBg = String(theme.theme_footer_bg)
  } catch (err) {
    console.error('Error loading public site settings:', err)
  }
  setCached('site-settings', settings, 60000)
  return settings
})

export const getHomePageData = cache(async () => {
  let initialContents = []
  let activeModules = []
  let settings = { siteName: 'Dynamic CMS' }

  try {
    await connectDB()
    const [rawContents, rawModules, loadedSettings] = await Promise.all([
      Content.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(12)
        .populate('moduleId', 'name slug icon fields settings')
        .lean(),
      Module.find({ isActive: true })
        .select('name slug icon description settings')
        .sort({ createdAt: 1 })
        .lean(),
      getPublicSiteSettings(),
    ])

    settings = loadedSettings
    activeModules = (rawModules || [])
      .filter((m) => m.settings?.allowPublicRead !== false)
      .map((m) => ({
        _id: String(m._id),
        name: m.name,
        slug: m.slug,
        icon: m.icon || '📦',
        description: m.description || '',
      }))

    const filteredContents = (rawContents || [])
      .filter((item) => item.moduleId && item.moduleId.settings?.allowPublicRead !== false)
      .map((item) => {
        const modFields = item.moduleId?.fields || []
        const itemSlug = resolveContentSlug(item.data, modFields, String(item._id))
        return {
          ...item,
          _id: String(item._id),
          resolvedSlug: itemSlug,
          moduleSlug: item.moduleId?.slug || '',
        }
      })

    initialContents = JSON.parse(JSON.stringify(filteredContents))
  } catch (error) {
    console.error('Error fetching data for front page:', error)
  }

  return { initialContents, activeModules, settings }
})

export const getPublicPageData = cache(async (rawSlug) => {
  const slug = String(rawSlug || '').trim()
  const lowerSlug = slug.toLowerCase()

  const cached = getCached(`page:${lowerSlug}`)
  if (cached) return cached

  await connectDB()

  const [
    publishedBuilderBySlug,
    publishedBuilderByModule,
    publishedStandardPage,
    draftBuilderBySlug,
    draftBuilderByModule,
    moduleDoc,
    settings,
  ] = await Promise.all([
    BuilderPage.findOne({ slug, status: 'published' }).lean(),
    BuilderPage.findOne({
      pageType: 'module_feed',
      targetModule: lowerSlug,
      status: 'published',
    }).lean(),
    Page.findOne({ slug, status: 'published' }).lean(),
    BuilderPage.findOne({ slug }).select('_id').lean(),
    BuilderPage.findOne({
      pageType: 'module_feed',
      targetModule: lowerSlug,
    })
      .select('_id')
      .lean(),
    Module.findOne({ slug, isActive: true }).lean(),
    getPublicSiteSettings(),
  ])

  const builderPage = publishedBuilderBySlug || publishedBuilderByModule
  let page = null
  let editableBuilderPageId = null

  if (builderPage) {
    page = builderPage
    editableBuilderPageId = String(builderPage._id)
  } else {
    page = publishedStandardPage
    const draftBuilderPage = draftBuilderBySlug || draftBuilderByModule
    if (draftBuilderPage) {
      editableBuilderPageId = String(draftBuilderPage._id)
    }
  }

  const publicModule =
    moduleDoc && moduleDoc.settings?.allowPublicRead !== false ? moduleDoc : null

  const result = {
    page: page ? JSON.parse(JSON.stringify(page)) : null,
    editableBuilderPageId,
    moduleDoc: publicModule ? JSON.parse(JSON.stringify(publicModule)) : null,
    settings,
  }
  setCached(`page:${lowerSlug}`, result, 60000)
  return result
})

export const getPublicSingleItemData = cache(async (moduleSlug, itemSlug) => {
  const cacheKey = `single:${moduleSlug}:${itemSlug}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  await connectDB()
  const mod = await Module.findOne({ slug: moduleSlug, isActive: true }).lean()
  if (!mod || mod.settings?.allowPublicRead === false) return null

  const taxonomies = await Taxonomy.find({ moduleId: mod._id })
    .sort({ createdAt: 1 })
    .lean()

  let decodedSlug = itemSlug
  try {
    decodedSlug = decodeURIComponent(itemSlug)
  } catch {}

  let content = null

  if (itemSlug === 'latest') {
    content = await Content.findOne({
      moduleId: mod._id,
      status: 'published',
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate('author', 'name email avatar')
      .lean()
  } else {
    const slugCandidates = Array.from(
      new Set([itemSlug, decodedSlug, slugify(decodedSlug)].filter(Boolean))
    )
    const lookupOr = [{ 'data.slug': { $in: slugCandidates } }]
    if (mongoose.Types.ObjectId.isValid(itemSlug)) {
      lookupOr.unshift({ _id: new mongoose.Types.ObjectId(itemSlug) })
    }

    content = await Content.findOne({
      moduleId: mod._id,
      status: 'published',
      $or: lookupOr,
    })
      .populate('author', 'name email avatar')
      .lean()

    // Bounded fallback for legacy items created before data.slug was auto-generated
    if (!content) {
      const recentModuleItems = await Content.find({
        moduleId: mod._id,
        status: 'published',
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(100)
        .populate('author', 'name email avatar')
        .lean()

      const matched = recentModuleItems.find((doc) => {
        const derived = resolveContentSlug(doc.data, mod.fields, String(doc._id))
        return slugCandidates.includes(derived)
      })

      if (matched) {
        const derived = resolveContentSlug(matched.data, mod.fields, String(matched._id))
        matched.data = { ...(matched.data || {}), slug: derived }
        content = matched
      }
    }
  }

  if (!content) return null

  const mainSlug = resolveContentSlug(content.data, mod.fields, String(content._id))
  const mainData = { ...(content.data || {}), slug: mainSlug }
  const resolvedCategories = resolveItemCategories(content.taxonomies, taxonomies)
  const lowerModSlug = moduleSlug.toLowerCase()

  const [
    relatedDocs,
    pubTemplateByMod,
    pubTemplateBySlug,
    pubTemplateDefault,
    draftTemplateByMod,
    draftTemplateBySlug,
    settings,
  ] = await Promise.all([
    Content.find({
      moduleId: mod._id,
      status: 'published',
      _id: { $ne: content._id },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(4)
      .lean(),
    BuilderPage.findOne({
      status: 'published',
      pageType: 'single_template',
      targetModule: lowerModSlug,
    }).lean(),
    BuilderPage.findOne({
      status: 'published',
      slug: `${lowerModSlug}-detail`,
    }).lean(),
    BuilderPage.findOne({
      status: 'published',
      pageType: 'single_template',
      targetModule: '',
    }).lean(),
    BuilderPage.findOne({
      pageType: 'single_template',
      targetModule: lowerModSlug,
    })
      .select('_id')
      .lean(),
    BuilderPage.findOne({
      slug: `${lowerModSlug}-detail`,
    })
      .select('_id')
      .lean(),
    getPublicSiteSettings(),
  ])

  const relatedItems = relatedDocs.map((rel) => {
    const relSlug = resolveContentSlug(rel.data, mod.fields, String(rel._id))
    const relData = { ...(rel.data || {}), slug: relSlug }
    return {
      id: String(rel._id),
      _id: String(rel._id),
      ...relData,
      slug: relSlug,
      data: relData,
      resolvedCategories: resolveItemCategories(rel.taxonomies, taxonomies),
      moduleSlug: mod.slug,
      publishedAt: rel.publishedAt || rel.createdAt,
      createdAt: rel.createdAt,
    }
  })

  const contentItem = {
    id: String(content._id),
    _id: String(content._id),
    ...mainData,
    slug: mainSlug,
    data: mainData,
    seo: content.seo || {},
    taxonomies: content.taxonomies || {},
    resolvedCategories,
    author: content.author
      ? { name: content.author.name, avatar: content.author.avatar }
      : null,
    module: {
      id: String(mod._id),
      name: mod.name,
      slug: mod.slug,
      icon: mod.icon || '📦',
      fields: mod.fields || [],
    },
    relatedItems,
    publishedAt: content.publishedAt || content.createdAt,
    createdAt: content.createdAt,
  }

  const customTemplate = pubTemplateByMod || pubTemplateBySlug || pubTemplateDefault
  const editableTemplate = customTemplate || draftTemplateByMod || draftTemplateBySlug

  const result = {
    module: JSON.parse(JSON.stringify(mod)),
    contentItem: JSON.parse(JSON.stringify(contentItem)),
    customTemplate: customTemplate ? JSON.parse(JSON.stringify(customTemplate)) : null,
    editableTemplateId: editableTemplate ? String(editableTemplate._id) : null,
    settings,
  }
  setCached(cacheKey, result, 60000)
  return result
})

export const getPublicEmployees = cache(async () => {
  const cached = getCached('public-employees')
  if (cached) return cached

  try {
    await connectDB()
    const employees = await Employee.find({ isActive: true })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: 1 })
      .lean()
    const result = JSON.parse(JSON.stringify(employees))
    setCached('public-employees', result, 60000)
    return result
  } catch (err) {
    console.error('[getPublicEmployees] error:', err)
    return []
  }
})

export const getPublicMenus = cache(async () => {
  try {
    await connectDB()
    await ensureDefaultMenus()
    const menus = await Menu.find({ isActive: true }).lean()
    return JSON.parse(JSON.stringify(menus))
  } catch (err) {
    console.error('[getPublicMenus] error:', err)
    return []
  }
})

export const getPublicProductsPageData = cache(async () => {
  const cached = getCached('public-products-data')
  if (cached) return cached

  await connectDB()
  const [settings, mod] = await Promise.all([
    getPublicSiteSettings(),
    Module.findOne({
      slug: { $in: ['products', 'product'] },
      isActive: true,
    }).lean(),
  ])

  if (!mod) {
    return {
      module: null,
      taxonomies: [],
      items: [],
      settings,
    }
  }

  const [taxonomies, docs] = await Promise.all([
    Taxonomy.find({ moduleId: mod._id }).lean(),
    Content.find({ moduleId: mod._id, status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean(),
  ])

  const items = docs.map((doc) => {
    const slug = resolveContentSlug(doc.data, mod.fields, String(doc._id))
    const data = { ...(doc.data || {}), slug }
    return {
      id: String(doc._id),
      _id: String(doc._id),
      ...data,
      slug,
      data,
      taxonomies: doc.taxonomies || {},
      resolvedCategories: resolveItemCategories(doc.taxonomies, taxonomies),
      moduleSlug: mod.slug,
      publishedAt: doc.publishedAt || doc.createdAt,
      createdAt: doc.createdAt,
    }
  })

  const result = {
    module: JSON.parse(JSON.stringify(mod)),
    taxonomies: JSON.parse(JSON.stringify(taxonomies)),
    items: JSON.parse(JSON.stringify(items)),
    settings,
  }
  setCached('public-products-data', result, 60000)
  return result
})
