import { Menu } from '@/lib/db/models/Menu'

export const DEFAULT_MENUS = [
  {
    name: 'Main Navigation Menu',
    slug: 'main-navigation',
    location: 'main_header',
    description: 'Primary navigation displayed across the header and mobile menu on public pages',
    isActive: true,
    items: [
      { id: 'item-home', label: 'Home', url: '/', target: '_self', badge: '', order: 0, isActive: true },
      { id: 'item-products', label: 'Products', url: '/products', target: '_self', badge: 'Catalog', order: 1, isActive: true },
      { id: 'item-team', label: 'Our Team', url: '/team', target: '_self', badge: '', order: 2, isActive: true },
      { id: 'item-about', label: 'About', url: '/#about', target: '_self', badge: '', order: 3, isActive: true },
      { id: 'item-contact', label: 'Contact', url: '/#contact', target: '_self', badge: '', order: 4, isActive: true },
    ],
  },
  {
    name: 'Top Bar Navigation',
    slug: 'top-bar-menu',
    location: 'top_bar',
    description: 'Links optionally displayed on the top announcement corporate bar',
    isActive: true,
    items: [
      { id: 'top-wholesale', label: 'Wholesale Inquiry', url: '/#contact', target: '_self', badge: '', order: 0, isActive: true },
      { id: 'top-catalog', label: 'Import Catalog', url: '/products', target: '_self', badge: '', order: 1, isActive: true },
    ],
  },
  {
    name: 'Footer Quick Links (Company)',
    slug: 'footer-company-links',
    location: 'footer_col1',
    description: 'Links displayed under Column 1 of the public footer',
    isActive: true,
    items: [
      { id: 'foot-home', label: 'Home', url: '/', target: '_self', badge: '', order: 0, isActive: true },
      { id: 'foot-products', label: 'Product Catalog', url: '/products', target: '_self', badge: '', order: 1, isActive: true },
      { id: 'foot-team', label: 'Our Team', url: '/team', target: '_self', badge: '', order: 2, isActive: true },
      { id: 'foot-about', label: 'About Us', url: '/#about', target: '_self', badge: '', order: 3, isActive: true },
      { id: 'foot-contact', label: 'Contact Us', url: '/#contact', target: '_self', badge: '', order: 4, isActive: true },
    ],
  },
  {
    name: 'Footer Trade Policy & Info',
    slug: 'footer-trade-policy',
    location: 'footer_col2',
    description: 'Links displayed under Column 2 of the public footer',
    isActive: true,
    items: [
      { id: 'foot-policy-1', label: 'Wholesale & Bulk Supply', url: '/#contact', target: '_self', badge: '', order: 0, isActive: true },
      { id: 'foot-policy-2', label: 'Direct Import Sourcing', url: '/products', target: '_self', badge: '', order: 1, isActive: true },
      { id: 'foot-policy-3', label: 'Product Showcase Only', url: '/products', target: '_self', badge: '', order: 2, isActive: true },
      { id: 'foot-policy-4', label: 'In-Person & Phone Inquiries', url: '/#contact', target: '_self', badge: '', order: 3, isActive: true },
    ],
  },
]

export async function ensureDefaultMenus() {
  if (globalThis.__menusInitialized) return
  try {
    const count = await Menu.countDocuments()
    if (count === 0) {
      await Menu.insertMany(DEFAULT_MENUS)
      globalThis.__menusInitialized = true
      return
    }

    // Ensure all critical locations exist if missing
    for (const def of DEFAULT_MENUS) {
      const exists = await Menu.findOne({
        $or: [{ slug: def.slug }, { location: def.location }],
      }).select('_id').lean()

      if (!exists) {
        await Menu.create(def)
      }
    }
    globalThis.__menusInitialized = true
  } catch (err) {
    console.error('[ensureDefaultMenus] Error:', err.message)
  }
}
