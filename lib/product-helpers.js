export function extractProductSummary(item = {}) {
  const data = item.data || item
  const title =
    data.title ||
    data.name ||
    data.product_name ||
    data.heading ||
    item.title ||
    'Untitled Product'

  const rawImage =
    data.image ||
    data.thumbnail ||
    data.featured_image ||
    data.photo ||
    data.cover ||
    (Array.isArray(data.gallery) ? data.gallery[0] : '') ||
    ''

  const image = typeof rawImage === 'string' ? rawImage : rawImage?.url || ''

  // Support multiple gallery / additional images alongside the main feature image
  const rawGallery =
    data.gallery ||
    data.images ||
    data.photos ||
    data.additional_images ||
    []

  const galleryList = Array.isArray(rawGallery)
    ? rawGallery
        .map((img) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean)
    : typeof rawGallery === 'string' && rawGallery
      ? [rawGallery]
      : []

  // Combined list: feature image first, followed by additional gallery images (no duplicates)
  const allImages = []
  if (image) allImages.push(image)
  for (const g of galleryList) {
    if (!allImages.includes(g)) {
      allImages.push(g)
    }
  }

  const description =
    data.short_description ||
    data.summary ||
    data.excerpt ||
    data.description ||
    data.details ||
    ''

  const plainDescription = String(description).replace(/<[^>]+>/g, '').trim()

  const origin = data.origin || data.country || data.import_from || ''
  const unit = data.unit || data.moq || data.packaging || ''
  const sku = data.sku || data.code || data.model || ''

  const categories = Array.isArray(item.resolvedCategories)
    ? item.resolvedCategories.map((c) => c.name).filter(Boolean)
    : []

  const slug = item.slug || data.slug || item._id || item.id

  return {
    id: String(item._id || item.id || slug),
    slug: String(slug),
    title: String(title),
    image,
    gallery: galleryList,
    images: allImages.length > 0 ? allImages : (image ? [image] : []),
    description: plainDescription,
    origin: origin ? String(origin) : '',
    unit: unit ? String(unit) : '',
    sku: sku ? String(sku) : '',
    categories,
    raw: data,
  }
}
