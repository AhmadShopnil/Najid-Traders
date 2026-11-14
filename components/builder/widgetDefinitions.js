import {
  Type, AlignLeft, Image as ImageIcon, MousePointerClick,
  Sparkles, Grid, HelpCircle, CheckCircle2, Video,
  Layers, MessageSquareQuote, Minus, Send, PhoneCall,
  BarChart3, Users, FolderKanban, ListChecks, Award,
  Mail, Code2, Activity, Database, Newspaper, FileText, FolderTree
} from 'lucide-react'

export const WIDGET_CATEGORIES = [
  { id: 'all', label: 'All Elements' },
  { id: 'cms', label: '📦 Dynamic Modules (CMS)' },
  { id: 'basic', label: 'Basic' },
  { id: 'media', label: 'Media & Visuals' },
  { id: 'marketing', label: 'Marketing & Conversion' },
  { id: 'interactive', label: 'Interactive & Pro' },
]

/**
 * Helper to distribute a section's widgets into columns (0 .. columns-1).
 * If a widget has an explicit `column` index within [0, columns-1], it goes there.
 * Otherwise, if `widget.column` is undefined/null, it distributes across `widx % columns`
 * so multi-column sections always display widgets side-by-side automatically!
 */
export function groupWidgetsByColumn(section) {
  const numCols = Math.max(1, parseInt(section?.columns || 1, 10))
  const cols = Array.from({ length: numCols }, () => [])
  const widgets = Array.isArray(section?.widgets) ? section.widgets : []

  widgets.forEach((widget, widx) => {
    let colIdx =
      typeof widget.column === 'number' && !Number.isNaN(widget.column)
        ? widget.column
        : widx % numCols
    if (colIdx < 0 || colIdx >= numCols) {
      colIdx = widx % numCols
    }
    cols[colIdx].push({ widget, widx, colIdx })
  })

  return cols
}

export const WIDGET_TYPES = [
  // ================= DYNAMIC CMS MODULES (ANY MODULE) =================
  {
    type: 'module_grid',
    name: 'Dynamic Module Feed / Grid',
    category: 'cms',
    icon: Database,
    description: 'Display all data from any Dynamic Module, filter by categories, or lock to a specific category',
    defaultProps: {
      moduleSlug: '',
      title: '',
      subtitle: '',
      layout: 'grid', // 'grid' | 'magazine' | 'list' | 'compact'
      columns: 3, // 1, 2, 3, 4
      limit: 6,
      categoryMode: 'all', // 'all' | 'specific' | 'url'
      categoryFilter: '', // specific termId or slug when categoryMode === 'specific'
      showCategoryTabs: true, // interactive category filter tabs above the feed
      showSearch: false,
      showPagination: true,
      showImage: true,
      showCategoryBadge: true,
      showDate: true,
      showExcerpt: true,
      showCustomFields: true, // shows extra module fields (e.g. price, location, etc.) on cards
      readMoreText: 'Read More',
      detailPageSlug: '', // optional custom builder page slug; if empty links to /[moduleSlug]/[id]
      titleField: '', // auto-detected from module schema if empty
      excerptField: '', // auto-detected from module schema if empty
      imageField: '', // auto-detected from module schema if empty
    },
  },
  {
    type: 'module_categories',
    name: 'Category-Wise Module Blocks',
    category: 'cms',
    icon: FolderTree,
    description: 'Display separate content sections for each Category of any Dynamic Module side-by-side or as category cards',
    defaultProps: {
      moduleSlug: '',
      title: '',
      subtitle: '',
      displayStyle: 'blocks', // 'blocks' (each category with its own item list) | 'pills' (category directory cards)
      columns: 2, // 1, 2, 3 category blocks side-by-side
      itemsPerCategory: 4,
      selectedCategories: [], // empty = show all categories of the module
      detailPageSlug: '',
      archivePageSlug: '', // optional page slug for "View All"
    },
  },
  {
    type: 'module_detail',
    name: 'Single Module Item Detail',
    category: 'cms',
    icon: FileText,
    description: 'Full detail page view for any single item of a Dynamic Module (all fields, image, categories, gallery & related items)',
    defaultProps: {
      moduleSlug: '',
      previewItemId: '', // optional specific item ID; if empty loads from URL or latest item
      showBreadcrumbs: true,
      showCategoryBadges: true,
      showAuthorAndDate: true,
      showShareButtons: true,
      showFeaturedImage: true,
      showExtraFields: true,
      showGallery: true,
      showRelated: true,
      relatedTitle: '',
      relatedCount: 3,
      detailPageSlug: '',
      titleField: '',
      excerptField: '',
      imageField: '',
    },
  },

  // ================= BASIC =================
  {
    type: 'heading',
    name: 'Heading',
    category: 'basic',
    icon: Type,
    description: 'Add a title, subtitle, or section headline',
    defaultProps: {
      text: 'Add Your Compelling Headline Here',
      subtitle: '',
      badge: '',
      tag: 'h2', // h1, h2, h3, h4
      size: 'large', // small, medium, large, huge
      align: 'left', // left, center, right
      color: '#0f172a',
    },
  },
  {
    type: 'text',
    name: 'Text Editor',
    category: 'basic',
    icon: AlignLeft,
    description: 'Rich paragraph and descriptive content',
    defaultProps: {
      content:
        'Craft your paragraph here. Highlight key points, describe services, or tell your brand story with clear and legible typography.',
      align: 'left',
      color: '#475569',
      size: 'base', // sm, base, lg, xl
    },
  },
  {
    type: 'button',
    name: 'Button',
    category: 'basic',
    icon: MousePointerClick,
    description: 'Call-to-action button with custom link & style',
    defaultProps: {
      text: 'Get Started Now',
      url: '#',
      variant: 'primary', // primary, secondary, outline, gradient, emerald
      size: 'md', // sm, md, lg
      align: 'left',
      fullWidth: false,
      openNewTab: false,
    },
  },
  {
    type: 'icon_list',
    name: 'Checklist / Icon List',
    category: 'basic',
    icon: ListChecks,
    description: 'Bullet checklist with checkmarks for features or benefits',
    defaultProps: {
      title: '',
      layout: 'vertical', // vertical, horizontal, grid-2
      iconColor: '#7c3aed',
      items: [
        '100% Responsive & Mobile Optimized Layout',
        'Visual Drag & Drop Multi-Column Builder',
        'SEO-Ready Fast Server-Side Rendering',
        'Instant Live Publishing to Frontend',
      ],
    },
  },
  {
    type: 'divider',
    name: 'Divider / Spacer',
    category: 'basic',
    icon: Minus,
    description: 'Visual separation line or custom vertical spacing',
    defaultProps: {
      height: 32,
      style: 'solid', // solid, dashed, dotted, none
      color: '#e2e8f0',
      width: '100%',
    },
  },

  // ================= MEDIA & VISUALS =================
  {
    type: 'image',
    name: 'Image',
    category: 'media',
    icon: ImageIcon,
    description: 'Responsive picture with optional link, shadow & caption',
    defaultProps: {
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      alt: 'Descriptive image',
      caption: '',
      linkUrl: '',
      rounded: 'xl', // none, md, xl, full
      aspectRatio: '16/9', // auto, 16/9, 4/3, 1/1
      shadow: 'lg', // none, sm, lg, 2xl
      maxWidth: '100%',
      align: 'center',
    },
  },
  {
    type: 'video',
    name: 'Video Player',
    category: 'media',
    icon: Video,
    description: 'Embed YouTube, Vimeo, or direct MP4 video',
    defaultProps: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Product Overview Video',
      aspectRatio: '16/9',
    },
  },
  {
    type: 'gallery',
    name: 'Image Gallery',
    category: 'media',
    icon: Layers,
    description: 'Multi-image grid showcase with hover zoom',
    defaultProps: {
      images: [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
      ],
      columns: 3,
      gap: 4,
      aspectRatio: 'square', // square, video, auto
    },
  },
  {
    type: 'logo_grid',
    name: 'Logo Cloud / Partners',
    category: 'media',
    icon: Award,
    description: 'Showcase client brands, sponsors, or partner badges',
    defaultProps: {
      title: 'TRUSTED BY INNOVATIVE TEAMS WORLDWIDE',
      columns: 5,
      items: [
        { name: 'Acme Corp', badge: '⚡ ACME' },
        { name: 'Quantum AI', badge: '🔮 QUANTUM' },
        { name: 'Nebula Cloud', badge: '☁️ NEBULA' },
        { name: 'Vertex Labs', badge: '🚀 VERTEX' },
        { name: 'Pulse Media', badge: '💎 PULSE' },
      ],
    },
  },

  // ================= MARKETING & CONVERSION =================
  {
    type: 'hero',
    name: 'Hero Banner',
    category: 'marketing',
    icon: Sparkles,
    description: 'High-impact hero banner with badge, dual buttons & image',
    defaultProps: {
      badge: '🚀 NEW PLATFORM LAUNCH',
      title: 'Build Lightning Fast Web Experiences',
      subtitle:
        'Dynamic Headless CMS with modular components, intuitive drag-and-drop page builder, and instantaneous publishing.',
      primaryBtnText: 'Start Free Trial',
      primaryBtnUrl: '/dashboard',
      secondaryBtnText: 'View Documentation',
      secondaryBtnUrl: '#',
      heroImage: '',
      align: 'center',
      bgType: 'gradient', // gradient, dark, light
    },
  },
  {
    type: 'stats',
    name: 'Stats / Counter Bar',
    category: 'marketing',
    icon: BarChart3,
    description: 'Highlight key numbers, metrics, and achievements',
    defaultProps: {
      columns: 4,
      style: 'card', // card, minimal, dark
      items: [
        { value: '99.9%', label: 'Uptime SLA', prefix: '', suffix: '' },
        { value: '50K+', label: 'Active Websites', prefix: '', suffix: '' },
        { value: '10x', label: 'Faster Publishing', prefix: '', suffix: '' },
        { value: '24/7', label: 'Expert Support', prefix: '', suffix: '' },
      ],
    },
  },
  {
    type: 'features',
    name: 'Features / Services Grid',
    category: 'marketing',
    icon: Grid,
    description: '2, 3, or 4 column feature cards with icons & links',
    defaultProps: {
      columns: 3,
      cardStyle: 'bordered', // bordered, elevated, minimal, dark
      items: [
        {
          title: 'Dynamic Content Modeling',
          description:
            'Define custom fields, relations, and validation rules in seconds without database migrations.',
          icon: '⚡',
          linkText: '',
          linkUrl: '',
        },
        {
          title: 'Role-Based Access Control',
          description:
            'Granular permissions for Super Admin, Admin, Editors, and external Collaborators.',
          icon: '🛡️',
          linkText: '',
          linkUrl: '',
        },
        {
          title: 'Multi-Taxonomy Tagging',
          description:
            'Group content by unlimited custom category and taxonomy structures dynamically.',
          icon: '🗂️',
          linkText: '',
          linkUrl: '',
        },
      ],
    },
  },
  {
    type: 'cta',
    name: 'Call To Action',
    category: 'marketing',
    icon: PhoneCall,
    description: 'Conversion banner with attention-grabbing action',
    defaultProps: {
      badge: 'LIMITED TIME OFFER',
      title: 'Ready to elevate your publishing workflow?',
      description:
        'Join thousands of creators using Dynamic CMS to power modern web & mobile applications.',
      buttonText: 'Get Started Today',
      buttonUrl: '/dashboard',
      secondaryBtnText: '',
      secondaryBtnUrl: '',
      style: 'purple', // purple, dark, blue, emerald
    },
  },
  {
    type: 'pricing',
    name: 'Pricing Table',
    category: 'marketing',
    icon: CheckCircle2,
    description: 'Subscription pricing tiers with feature lists',
    defaultProps: {
      plans: [
        {
          name: 'Starter',
          price: '$0',
          period: '/month',
          description: 'For individuals exploring headless publishing.',
          isPopular: false,
          features: [
            'Up to 5 Content Modules',
            '1,000 API Requests/mo',
            'Community Support',
            'Basic Media Storage',
          ],
          buttonText: 'Get Started Free',
          buttonUrl: '#',
        },
        {
          name: 'Professional',
          price: '$49',
          period: '/month',
          description: 'For growing teams requiring custom workflows.',
          isPopular: true,
          features: [
            'Unlimited Dynamic Modules',
            '100,000 API Requests/mo',
            'Multi-Taxonomy System',
            'Custom Roles & RBAC',
            'Cloudinary Asset Sync',
          ],
          buttonText: 'Upgrade to Pro',
          buttonUrl: '#',
        },
        {
          name: 'Enterprise',
          price: '$199',
          period: '/month',
          description: 'For organizations with mission-critical workloads.',
          isPopular: false,
          features: [
            'Dedicated High-Speed Cluster',
            'Unlimited API Requests',
            'Audit Logging & Webhooks',
            'Priority 24/7 SLA Support',
          ],
          buttonText: 'Contact Sales',
          buttonUrl: '#',
        },
      ],
    },
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    category: 'marketing',
    icon: MessageSquareQuote,
    description: 'Client reviews, star ratings, and avatars',
    defaultProps: {
      columns: 2,
      items: [
        {
          quote:
            'Dynamic CMS gave our agency the superpower to spin up client portals with custom themes in hours rather than weeks.',
          author: 'Sophia Chen',
          role: 'Head of Engineering at TechVibe',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          rating: 5,
        },
        {
          quote:
            'The visual page builder feels exactly like Elementor Pro, but with native Next.js server performance.',
          author: 'Marcus Vance',
          role: 'Product Lead at Apex Digital',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          rating: 5,
        },
      ],
    },
  },
  {
    type: 'team',
    name: 'Team Members',
    category: 'marketing',
    icon: Users,
    description: 'Team profile cards with photo, role, and bio',
    defaultProps: {
      columns: 3,
      members: [
        {
          name: 'Ariana Rahman',
          role: 'Founder & CEO',
          bio: '10+ years building enterprise cloud platforms and digital experiences.',
          avatar:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
          linkedinUrl: '#',
        },
        {
          name: 'Tanvir Hasan',
          role: 'Chief Technology Officer',
          bio: 'Distributed systems architect passionate about developer tools.',
          avatar:
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
          linkedinUrl: '#',
        },
        {
          name: 'Nadia Islam',
          role: 'Head of Product Design',
          bio: 'Crafting intuitive user interfaces and design systems for global brands.',
          avatar:
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
          linkedinUrl: '#',
        },
      ],
    },
  },

  // ================= INTERACTIVE & PRO =================
  {
    type: 'tabs',
    name: 'Interactive Tabs',
    category: 'interactive',
    icon: FolderKanban,
    description: 'Switchable content tabs for features or specs',
    defaultProps: {
      style: 'pills', // pills, underline, boxed
      tabs: [
        {
          title: 'Visual Page Builder',
          badge: 'Popular',
          content:
            'Design responsive multi-column layouts using drag-and-drop widgets, live viewport previews, and 1-click block templates.',
          imageUrl:
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        },
        {
          title: 'Headless REST API',
          badge: 'Fast',
          content:
            'Fetch structured JSON content for web, mobile apps, or external frontends with built-in filtering, sorting, and pagination.',
          imageUrl: '',
        },
        {
          title: 'Enterprise Security',
          badge: 'RBAC',
          content:
            'Protect your data with role-based access control, group permissions, and comprehensive activity audit logs.',
          imageUrl: '',
        },
      ],
    },
  },
  {
    type: 'progress',
    name: 'Progress / Skill Bars',
    category: 'interactive',
    icon: Activity,
    description: 'Visual percentage bars for skills, stats, or goals',
    defaultProps: {
      title: 'Our Core Expertise',
      items: [
        { label: 'Web Application Architecture', percentage: 96, color: '#7c3aed' },
        { label: 'UI/UX & Design Systems', percentage: 92, color: '#2563eb' },
        { label: 'Cloud & Performance Optimization', percentage: 98, color: '#10b981' },
      ],
    },
  },
  {
    type: 'faq',
    name: 'FAQ Accordion',
    category: 'interactive',
    icon: HelpCircle,
    description: 'Collapsible questions & answers list',
    defaultProps: {
      items: [
        {
          question: 'Can I visit pages built here directly on the frontend?',
          answer:
            'Yes! Once you set the page status to "Published", the page is instantly accessible on the frontend via its unique slug (e.g. /about-us).',
        },
        {
          question: 'How do multi-column sections work?',
          answer:
            'Select 2, 3, or 4 columns for any section and drag widgets directly into Column 1, Column 2, etc. They will render side-by-side automatically on desktop and stack cleanly on mobile.',
        },
        {
          question: 'Is SEO metadata supported?',
          answer:
            'Yes, every page includes custom meta titles, meta descriptions, and keywords that are rendered automatically for search engines.',
        },
      ],
    },
  },
  {
    type: 'newsletter',
    name: 'Newsletter Signup',
    category: 'interactive',
    icon: Mail,
    description: 'Email subscription capture box with instant feedback',
    defaultProps: {
      badge: '📩 WEEKLY INSIGHTS',
      title: 'Subscribe to Our Newsletter',
      subtitle: 'Get product updates, tutorials, and industry news delivered straight to your inbox.',
      placeholder: 'Enter your work email...',
      buttonText: 'Subscribe Now',
      privacyNote: 'No spam ever. Unsubscribe with 1 click.',
      style: 'dark', // dark, light, purple
    },
  },
  {
    type: 'contact_form',
    name: 'Contact Form',
    category: 'interactive',
    icon: Send,
    description: 'Interactive contact submission form',
    defaultProps: {
      title: 'Send Us a Message',
      subtitle: 'Have a project in mind or want to learn more? Reach out to our team.',
      buttonText: 'Submit Inquiry',
      emailRecipient: 'info@example.com',
      showPhone: true,
      showSubject: true,
    },
  },
  {
    type: 'custom_html',
    name: 'Custom HTML / Embed',
    category: 'interactive',
    icon: Code2,
    description: 'Embed custom HTML, Google Maps iframe, scripts, or badges',
    defaultProps: {
      html: '<div style="padding:24px;border-radius:16px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;text-align:center;"><h4 style="margin:0 0 8px 0;color:#4c1d95;font-weight:800;font-size:18px;">✨ Custom HTML / Embed Block</h4><p style="margin:0;color:#6d28d9;font-size:14px;">Paste any custom HTML, Google Maps iframe, or third-party widget code here.</p></div>',
    },
  },
]
