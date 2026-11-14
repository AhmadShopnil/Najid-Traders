/**
 * Shared field extraction and preview generation helpers for Dynamic Module Widgets.
 */

export function extractItemFields(item = {}, props = {}, moduleFields = []) {
  const data = item.data && typeof item.data === 'object' ? item.data : item

  // 1. Title
  let title = ''
  let usedTitleKey = ''
  if (props.titleField && data[props.titleField] !== undefined && data[props.titleField] !== '') {
    title = String(data[props.titleField])
    usedTitleKey = props.titleField
  } else {
    const titleKeys = ['title', 'name', 'headline', 'subject', 'heading', 'product_name', 'course_name', 'job_title', 'শিরোনাম', 'নাম']
    for (const k of titleKeys) {
      if (data[k] && typeof data[k] === 'string') {
        title = data[k]
        usedTitleKey = k
        break
      }
    }
    if (!title && moduleFields.length > 0) {
      const firstTextField = moduleFields.find((f) => f.type === 'text')
      if (firstTextField && data[firstTextField.name]) {
        title = String(data[firstTextField.name])
        usedTitleKey = firstTextField.name
      }
    }
    if (!title) {
      const firstStrKey = Object.keys(data).find(
        (k) =>
          !['id', '_id', 'status', 'moduleSlug', 'moduleName', 'createdAt', 'publishedAt', 'slug'].includes(k) &&
          typeof data[k] === 'string' &&
          !data[k].startsWith('http') &&
          data[k].length < 220
      )
      if (firstStrKey) {
        title = data[firstStrKey]
        usedTitleKey = firstStrKey
      }
    }
  }
  if (!title) title = 'Untitled Item'

  // 2. Image
  let image = ''
  let usedImageKey = ''
  if (props.imageField && data[props.imageField]) {
    image = Array.isArray(data[props.imageField]) ? data[props.imageField][0] : data[props.imageField]
    usedImageKey = props.imageField
  } else {
    const imgKeys = ['image', 'featured_image', 'featuredImage', 'featureImage', 'thumbnail', 'thumb', 'cover', 'photo', 'banner', 'picture', 'avatar', 'logo']
    for (const k of imgKeys) {
      if (data[k]) {
        image = Array.isArray(data[k]) ? data[k][0] : data[k]
        usedImageKey = k
        break
      }
    }
    if (!image && moduleFields.length > 0) {
      const imgField = moduleFields.find((f) => f.type === 'image' || f.type === 'gallery')
      if (imgField && data[imgField.name]) {
        const val = data[imgField.name]
        image = Array.isArray(val) ? val[0] : val
        usedImageKey = imgField.name
      }
    }
    if (!image) {
      const urlKey = Object.keys(data).find(
        (k) =>
          typeof data[k] === 'string' &&
          (data[k].startsWith('http://') || data[k].startsWith('https://') || data[k].startsWith('/')) &&
          (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(data[k]) || data[k].includes('cloudinary') || data[k].includes('unsplash'))
      )
      if (urlKey) {
        image = data[urlKey]
        usedImageKey = urlKey
      }
    }
  }

  // 3. Full Body & Excerpt
  let fullContent = ''
  let excerpt = ''
  let usedBodyKey = ''
  let usedExcerptKey = ''

  if (props.excerptField && data[props.excerptField]) {
    excerpt = String(data[props.excerptField])
    usedExcerptKey = props.excerptField
  }

  const bodyKeys = ['content', 'body', 'details', 'description', 'long_description', 'article', 'overview', 'বিস্তারিত', 'বিবরণ']
  const summaryKeys = ['excerpt', 'summary', 'short_description', 'subtitle', 'lead', 'সংক্ষেপ']

  for (const k of bodyKeys) {
    if (data[k] && typeof data[k] === 'string') {
      fullContent = data[k]
      usedBodyKey = k
      break
    }
  }
  if (!fullContent && moduleFields.length > 0) {
    const richField = moduleFields.find((f) => f.type === 'richtext' || f.type === 'longtext')
    if (richField && data[richField.name]) {
      fullContent = String(data[richField.name])
      usedBodyKey = richField.name
    }
  }

  if (!excerpt) {
    for (const k of summaryKeys) {
      if (data[k] && typeof data[k] === 'string') {
        excerpt = data[k]
        usedExcerptKey = k
        break
      }
    }
  }
  if (!excerpt && fullContent) {
    const plain = fullContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    excerpt = plain.length > 160 ? plain.slice(0, 160) + '…' : plain
  }
  if (!fullContent && excerpt) {
    fullContent = excerpt
  }

  // 4. Gallery
  let gallery = []
  if (Array.isArray(data.gallery)) {
    gallery = data.gallery
  } else if (moduleFields.length > 0) {
    const galField = moduleFields.find((f) => f.type === 'gallery')
    if (galField && Array.isArray(data[galField.name])) {
      gallery = data[galField.name]
    }
  }

  // 5. Extra custom fields
  const usedKeys = new Set([
    'id',
    '_id',
    'slug',
    'gallery',
    usedTitleKey,
    usedImageKey,
    usedBodyKey,
    usedExcerptKey,
    props.titleField,
    props.imageField,
    props.excerptField,
  ])

  const extraFields = []
  if (moduleFields.length > 0) {
    moduleFields.forEach((f) => {
      if (
        !usedKeys.has(f.name) &&
        f.type !== 'image' &&
        f.type !== 'gallery' &&
        f.type !== 'keyvalue' &&
        data[f.name] !== undefined &&
        data[f.name] !== null &&
        data[f.name] !== ''
      ) {
        const rawVal = data[f.name]
        const formattedVal = Array.isArray(rawVal)
          ? rawVal.join(', ')
          : typeof rawVal === 'boolean'
            ? rawVal
              ? 'Yes'
              : 'No'
            : String(rawVal)
        extraFields.push({
          name: f.name,
          label: f.label || f.name,
          value: formattedVal,
          type: f.type,
        })
      }
    })
  } else {
    Object.keys(data).forEach((k) => {
      if (
        !usedKeys.has(k) &&
        ![
          'title',
          'headline',
          'name',
          'image',
          'featured_image',
          'featuredImage',
          'featureImage',
          'thumbnail',
          'cover',
          'photo',
          'banner',
          'content',
          'body',
          'details',
          'description',
          'excerpt',
          'summary',
          'status',
          'taxonomies',
          'resolvedCategories',
          'author',
          'module',
          'moduleSlug',
          'moduleName',
          'seo',
          'relatedItems',
          'publishedAt',
          'createdAt',
          'updatedAt',
        ].includes(k) &&
        data[k] !== undefined &&
        data[k] !== null &&
        data[k] !== '' &&
        typeof data[k] !== 'object'
      ) {
        extraFields.push({
          name: k,
          label: k.replace(/_/g, ' '),
          value: String(data[k]),
          type: 'text',
        })
      }
    })
  }

  return {
    id: item.id || item._id || '',
    slug: data.slug || item.id || item._id || '',
    title,
    image,
    excerpt,
    fullContent,
    gallery,
    extraFields,
    categories: Array.isArray(item.resolvedCategories) ? item.resolvedCategories : [],
    author: item.author?.name || '',
    publishedAt: item.publishedAt || item.createdAt,
  }
}

export function isPreviewEntry(item) {
  const idStr = String(item?.id || item?._id || '')
  return idStr.startsWith('preview-')
}

export function buildDetailHref(item, moduleSlug = '', detailPageSlug = '') {
  if (isPreviewEntry(item)) return '#preview-item'
  const effectiveMod = moduleSlug || item?.moduleSlug || item?.module?.slug || 'item'
  const itemIdentifier = item?.data?.slug || item?.slug || item?.id || item?._id || 'latest'
  const cleanDetailSlug = (detailPageSlug || '').replace(/^\/+/, '').trim()
  if (cleanDetailSlug) {
    return `/${cleanDetailSlug}?module=${encodeURIComponent(effectiveMod)}&id=${encodeURIComponent(item?.id || item?._id || itemIdentifier)}`
  }
  return `/${effectiveMod}/${itemIdentifier}`
}

export function buildPreviewItemsForModule(moduleMeta, taxonomies = [], count = 4) {
  const modName = moduleMeta?.name || 'Module'
  const modSlug = moduleMeta?.slug || 'module'
  const fields = moduleMeta?.fields || []

  const allTerms = []
  taxonomies.forEach((tax) => {
    ;(tax.terms || []).forEach((t) => {
      allTerms.push({ ...t, taxSlug: tax.slug, taxName: tax.name })
    })
  })

  const fallbackTerms =
    allTerms.length > 0
      ? allTerms
      : [
          { id: 'cat-1', name: 'Category 1', slug: 'category-1', color: '#7c3aed' },
          { id: 'cat-2', name: 'Category 2', slug: 'category-2', color: '#059669' },
          { id: 'cat-3', name: 'Category 3', slug: 'category-3', color: '#2563eb' },
        ]

  const sampleImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=80',
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const cat = fallbackTerms[idx % fallbackTerms.length]
    const dynamicData = {
      title: `${modName} Sample Item #${idx + 1}`,
      description: `This is a sample preview item for your "${modName}" module. Once you publish entries in this module, real items and custom fields will automatically appear here.`,
      image: sampleImages[idx % sampleImages.length],
    }

    fields.forEach((f) => {
      if (f.type === 'number') {
        dynamicData[f.name] = (idx + 1) * 250
      } else if (f.type === 'select' && f.validation?.options?.length > 0) {
        dynamicData[f.name] = f.validation.options[idx % f.validation.options.length]
      } else if (!['image', 'gallery', 'richtext', 'longtext'].includes(f.type) && !dynamicData[f.name]) {
        dynamicData[f.name] = `Sample ${f.label || f.name}`
      }
    })

    return {
      id: `preview-${idx + 1}`,
      _id: `preview-${idx + 1}`,
      moduleSlug: modSlug,
      ...dynamicData,
      data: dynamicData,
      resolvedCategories: [cat],
      publishedAt: new Date(Date.now() - idx * 3600 * 1000 * 4).toISOString(),
    }
  })
}
