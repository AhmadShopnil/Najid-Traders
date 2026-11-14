export const SYSTEM_SETTING_GROUPS = [
  {
    name: 'Frontend & General',
    slug: 'general',
    description: 'Frontend site name, logo, tagline, favicon, and footer description',
    isSystem: true,
    fields: [
      { id: 'site_name', name: 'Frontend Site Name', slug: 'site_name', type: 'text', value: 'Najid Traders', isRequired: true, description: 'Displayed in the public frontend header, footer, and page titles' },
      { id: 'site_tagline', name: 'Site Tagline', slug: 'site_tagline', type: 'text', value: 'Importer & Wholesale Supplier', isRequired: false, description: 'Short subtitle shown under the frontend brand name' },
      { id: 'site_logo', name: 'Frontend Site Logo', slug: 'site_logo', type: 'image', value: '', isRequired: false, description: 'Logo image for the public frontend header and footer' },
      {
        id: 'brand_display_mode',
        name: 'Frontend Brand Display',
        slug: 'brand_display_mode',
        type: 'select',
        options: [
          { value: 'both', label: 'Logo & Site Name (Both)' },
          { value: 'logo', label: 'Logo Only' },
          { value: 'name', label: 'Site Name Only' },
        ],
        value: 'both',
        isRequired: false,
        description: 'Choose whether the public header and footer display Logo, Site Name, or Both',
      },
      { id: 'favicon', name: 'Favicon', slug: 'favicon', type: 'image', value: '', isRequired: false, description: 'Browser tab icon for the website' },
      { id: 'footer_text', name: 'Footer Description', slug: 'footer_text', type: 'longtext', value: 'Najid Traders is a direct importer and wholesale supplier of Three-Piece, Sarees, authentic Spices, and China household & water pot products.', isRequired: false, description: 'Short about/brand summary displayed in the public footer' },
    ],
  },
  {
    name: 'Dashboard Branding & Theme',
    slug: 'dashboard',
    description: 'Admin dashboard site name, logo, theme colors, and login screen branding',
    isSystem: true,
    fields: [
      { id: 'dashboard_name', name: 'Dashboard Site Name', slug: 'dashboard_name', type: 'text', value: 'Najid Dashboard', isRequired: true, description: 'Displayed in the admin sidebar and login page independently from the frontend' },
      { id: 'dashboard_logo', name: 'Dashboard Logo', slug: 'dashboard_logo', type: 'image', value: '', isRequired: false, description: 'Logo image for the admin sidebar and login page' },
      { id: 'login_subtitle', name: 'Login Subtitle', slug: 'login_subtitle', type: 'text', value: 'Sign in to manage your workspace', isRequired: false, description: 'Subtitle shown below the dashboard title on the login page' },
      { id: 'dashboard_sidebar_bg', name: 'Sidebar Background Color', slug: 'dashboard_sidebar_bg', type: 'color', value: '#0D253F', isRequired: false, description: 'Background color of the admin dashboard sidebar (matches brand logo deep navy)' },
      { id: 'dashboard_primary_color', name: 'Primary Button Color', slug: 'dashboard_primary_color', type: 'color', value: '#0D253F', isRequired: false, description: 'Main action and primary button color across the dashboard' },
      { id: 'dashboard_accent_color', name: 'Active & Accent Color', slug: 'dashboard_accent_color', type: 'color', value: '#C89B3C', isRequired: false, description: 'Active menu indicator, highlighted buttons, and badge accent color (matches brand logo gold)' },
    ],
  },
  {
    name: 'Frontend Theme & Colors',
    slug: 'theme',
    description: 'Customize public frontend primary, secondary, button, and active/accent colors matching brand identity',
    isSystem: true,
    fields: [
      { id: 'theme_primary_color', name: 'Primary Brand Color', slug: 'theme_primary_color', type: 'color', value: '#0D253F', isRequired: false, description: 'Primary brand color used for navigation headers, main headings, and dark elements (default: Deep Navy #0D253F)' },
      { id: 'theme_secondary_color', name: 'Secondary Supporting Color', slug: 'theme_secondary_color', type: 'color', value: '#16385D', isRequired: false, description: 'Secondary supporting color used for borders, hover states, and dark cards (default: #16385D)' },
      { id: 'theme_accent_color', name: 'Active & Accent Color', slug: 'theme_accent_color', type: 'color', value: '#C89B3C', isRequired: false, description: 'Accent color for active links, highlight badges, and focus borders (default: Warm Gold #C89B3C)' },
      { id: 'theme_button_bg', name: 'CTA Button Background', slug: 'theme_button_bg', type: 'color', value: '#0D253F', isRequired: false, description: 'Main CTA action button background color across the website' },
      { id: 'theme_button_text', name: 'CTA Button Text Color', slug: 'theme_button_text', type: 'color', value: '#ffffff', isRequired: false, description: 'Text color of main CTA buttons' },
      { id: 'theme_topbar_bg', name: 'Top Corporate Bar Background', slug: 'theme_topbar_bg', type: 'color', value: '#0D253F', isRequired: false, description: 'Background color of the announcement and phone header bar' },
      { id: 'theme_footer_bg', name: 'Footer Background Color', slug: 'theme_footer_bg', type: 'color', value: '#0D253F', isRequired: false, description: 'Background color of the public footer' },
    ],
  },
  {
    name: 'Footer & Navigation Content',
    slug: 'footer',
    description: 'Customize public footer column titles, copyright, descriptions, and top announcement bar',
    isSystem: true,
    fields: [
      { id: 'footer_col1_title', name: 'Footer Column 1 Heading', slug: 'footer_col1_title', type: 'text', value: 'Company', isRequired: false, description: 'Title heading for the first footer links column' },
      { id: 'footer_col2_title', name: 'Footer Column 2 Heading', slug: 'footer_col2_title', type: 'text', value: 'Trade Policy', isRequired: false, description: 'Title heading for the second footer links column' },
      { id: 'footer_col3_title', name: 'Footer Column 3 Heading', slug: 'footer_col3_title', type: 'text', value: 'Contact Information', isRequired: false, description: 'Title heading for the footer contact column' },
      { id: 'footer_copyright', name: 'Footer Copyright Notice', slug: 'footer_copyright', type: 'text', value: '© {year} Najid Traders. All rights reserved.', isRequired: false, description: 'Copyright line at the bottom ({year} dynamically inserts current year)' },
      { id: 'footer_subtext', name: 'Footer Bottom Tagline', slug: 'footer_subtext', type: 'text', value: 'Wholesale Product Catalog — Direct Trade Inquiries', isRequired: false, description: 'Secondary tagline on the right side of the bottom footer' },
      { id: 'topbar_text', name: 'Top Bar Announcement Text', slug: 'topbar_text', type: 'text', value: 'Importer & Wholesale Trade House', isRequired: false, description: 'Left text shown in the sticky top corporate announcement bar' },
      { id: 'topbar_show_phone', name: 'Show Phone in Top Bar', slug: 'topbar_show_phone', type: 'boolean', value: true, isRequired: false, description: 'Whether to show the contact phone number in the top header bar' },
      { id: 'topbar_show_hours', name: 'Show Hours in Top Bar', slug: 'topbar_show_hours', type: 'boolean', value: true, isRequired: false, description: 'Whether to show business hours in the top header bar' },
    ],
  },
  {
    name: 'Contact Info',
    slug: 'contact',
    description: 'Public contact email, phone number, office address, and support hours',
    isSystem: true,
    fields: [
      { id: 'contact_email', name: 'Contact Email', slug: 'contact_email', type: 'text', value: 'info@najidtraders.com', isRequired: false, description: 'Primary public contact email address' },
      { id: 'contact_phone', name: 'Contact Phone', slug: 'contact_phone', type: 'text', value: '+880 1711-000000', isRequired: false, description: 'Primary public phone or hotline number' },
      { id: 'contact_address', name: 'Office Address', slug: 'contact_address', type: 'longtext', value: 'House 24, Road 6, Chawk Bazar Commercial Area, Dhaka 1211, Bangladesh', isRequired: false, description: 'Physical office or business address' },
      { id: 'support_hours', name: 'Support Hours', slug: 'support_hours', type: 'text', value: 'Sat - Thu, 9:30 AM - 7:30 PM', isRequired: false, description: 'Business or customer support hours (e.g. Mon-Fri, 9AM - 6PM)' },
    ],
  },
  {
    name: 'Social Links',
    slug: 'social',
    description: 'Public social media profile and channel URLs',
    isSystem: true,
    fields: [
      { id: 'facebook_url', name: 'Facebook URL', slug: 'facebook_url', type: 'url', value: 'https://facebook.com/najidtraders', isRequired: false, description: 'Full Facebook page or profile URL' },
      { id: 'twitter_url', name: 'X / Twitter URL', slug: 'twitter_url', type: 'url', value: 'https://x.com/najidtraders', isRequired: false, description: 'Full X (Twitter) profile URL' },
      { id: 'instagram_url', name: 'Instagram URL', slug: 'instagram_url', type: 'url', value: 'https://instagram.com/najidtraders', isRequired: false, description: 'Full Instagram profile URL' },
      { id: 'linkedin_url', name: 'LinkedIn URL', slug: 'linkedin_url', type: 'url', value: 'https://linkedin.com/company/najidtraders', isRequired: false, description: 'Full LinkedIn company or profile URL' },
      { id: 'youtube_url', name: 'YouTube URL', slug: 'youtube_url', type: 'url', value: 'https://youtube.com/@najidtraders', isRequired: false, description: 'Full YouTube channel URL' },
    ],
  },
  {
    name: 'SEO Settings',
    slug: 'seo',
    description: 'Default SEO meta tags and OpenGraph image for public pages',
    isSystem: true,
    fields: [
      { id: 'meta_title', name: 'Default Meta Title', slug: 'meta_title', type: 'text', value: '', isRequired: false, description: 'Fallback SEO title for public pages' },
      { id: 'meta_description', name: 'Default Meta Description', slug: 'meta_description', type: 'longtext', value: '', isRequired: false, description: 'Fallback SEO description for public pages' },
      { id: 'og_image', name: 'Default OpenGraph Image', slug: 'og_image', type: 'image', value: '', isRequired: false, description: 'Default social sharing preview image' },
    ],
  },
  {
    name: 'Media Settings',
    slug: 'media',
    description: 'Upload constraints, default quality and storage configurations',
    isSystem: true,
    fields: [
      { id: 'max_upload_size_mb', name: 'Max Upload Size (MB)', slug: 'max_upload_size_mb', type: 'number', value: 10, isRequired: false, description: 'Maximum allowed file upload size in megabytes' },
      { id: 'default_image_quality', name: 'Default Image Quality (%)', slug: 'default_image_quality', type: 'number', value: 85, isRequired: false, description: 'Default image optimization quality (1-100)' },
    ],
  },
]

const SYSTEM_FIELD_SLUGS_BY_GROUP = new Map(
  SYSTEM_SETTING_GROUPS.map((g) => [g.slug, new Set(g.fields.map((f) => f.slug))])
)

export function isSystemSettingField(groupSlug, fieldSlug) {
  return Boolean(SYSTEM_FIELD_SLUGS_BY_GROUP.get(groupSlug)?.has(fieldSlug))
}
