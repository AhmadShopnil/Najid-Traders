# Dynamic CMS - API Documentation

The Dynamic CMS provides a powerful RESTful API. It is split into two primary areas:
1. **Public API (`/api/public/*`)**: Designed for your front-end apps to safely consume published data. Requires no authentication.
2. **Admin API (`/api/admin/*` & `/api/upload`)**: Used by the CMS Dashboard to manage content, settings, users, and media. Requires NextAuth authentication (Session Cookie). Unauthenticated requests return `401 Unauthorized` JSON.

---

## 1. Public API (Front-End Consumption)

The Public API is read-only and exclusively returns content marked as `published`.

> [!WARNING]
> For a module to be accessible via `/api/public/[module_slug]`, `/api/public/[module_slug]/[id]`, or `/api/public/[module_slug]/taxonomies`, `settings.allowPublicRead` must be enabled (`true`, the default). If disabled (`false`), the endpoint returns `403 Forbidden`. Inactive modules (`isActive: false`) return `404 Not Found`.

### `GET /api/public/pages/[slug]`
Fetch a headless page's raw data schema by its unique slug. This is the **Headless Page API system** intended for frontend applications, mobile apps, or headless consumers to consume structured field data.

- **URL Params**: `slug=[string]`
- **Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "64f...",
    "title": "Home Page",
    "slug": "home",
    "seo": { "title": "My Home", "description": "..." },
    "sections": [
      {
        "id": "sec-1",
        "name": "Hero Section",
        "slug": "hero-section",
        "data": {
          "title": "Welcome to our portal",
          "feature_image": "https://..."
        },
        "subSections": []
      }
    ]
  }
}
```

### `GET /api/public/builder-pages/[slug]`
Fetch a published visual page layout constructed with the **Elementor Visual Page Builder**.

- **URL Params**: `slug=[string]`
- **Frontend Direct URL**: `http://localhost:3000/[slug]` (Rendered live in browser with Header, Widgets, and Footer)
- **Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "64f...",
    "title": "Landing Page",
    "slug": "landing",
    "status": "published",
    "sections": [
      {
        "id": "sec-1",
        "name": "Hero Section",
        "slug": "hero-section",
        "columns": 1,
        "settings": { "bgType": "gradient", "bgColor": "#0f172a", "padding": "large" },
        "widgets": [
          { "id": "w1", "type": "hero", "props": { "title": "Build Fast", "primaryBtnText": "Get Started" } }
        ]
      }
    ]
  }
}
```

### `GET /api/public/modules`
Fetch all active Dynamic Modules where `settings.allowPublicRead !== false`, along with their schema `fields`, `publishedCount`, and `taxonomies` (including all category/tag `terms` with `id, name, slug, color`). Used by the Visual Page Builder and frontend consumers to populate live module and category selectors.

### `GET /api/public/[module_slug]`
Fetch a paginated list of published content for a specific module (e.g., `/api/public/news`, `/api/public/blogs`). Automatically resolves assigned categories/terms into `resolvedCategories` on every item, derives a normalized `slug` fallback if missing (without mutating the database on GET), and returns module metadata (`meta.module` and `meta.taxonomies`).

- **Query Parameters**:
  - `page` (Number) - Default: `1` (minimum `1`)
  - `limit` (Number) - Default: `20` (clamped between `1` and `100`)
  - `category`, `categories`, or `term` (String) - Filter content by one or more comma-separated Category/Term IDs or Slugs across any taxonomy of the module (e.g., `?category=politics` or `?category=politics,sports,tech`).
  - `taxonomy[tax_slug]` (String) - Filter content by a specific taxonomy's term ID or slug (e.g., `?taxonomy[categories]=sports`).
  - `q` (String) - Safe escaped regex search across the module's text fields (`title`, `headline`, `summary`, `content`, etc.).
  - `sort` (String) - E.g., `sort=-createdAt,title` (prefix `-` for descending). Validated against safe field keys (`createdAt`, `updatedAt`, `publishedAt`, `status`, or `data.<field>`).
  - `filter[field]` - Exact match filtering (with automatic boolean/numeric coercion). E.g., `filter[featured]=true`.
  - `filter[field][operator]` - Advanced filtering using operators (`gt`, `lt`, `gte`, `lte`, `ne`). E.g., `filter[price][gt]=50`.

- **Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "64f...",
      "_id": "64f...",
      "slug": "breaking-news-headline",
      "moduleSlug": "news",
      "title": "Breaking News Headline",
      "featured_image": "https://cloudinary...",
      "resolvedCategories": [
        { "id": "67a...", "name": "জাতীয়", "slug": "national", "color": "#8b5cf6", "taxSlug": "categories", "taxName": "Categories" }
      ],
      "author": { "name": "Admin" },
      "publishedAt": "2026-09-10T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "module": { "id": "64m...", "name": "News", "slug": "news", "icon": "📰", "fields": [] },
    "taxonomies": []
  }
}
```

### `GET /api/public/[module_slug]/[id]`
Fetch a single published content entry by its URL `slug` (`data.slug`, supporting both English and Bangla/Unicode slugs), MongoDB `_id`, or `'latest'` (fetches the most recently published item for live builder previews). Also includes a bounded fallback scan (up to 100 recent entries) matching legacy items without a stored `data.slug` by generated title slug.
- **Returns**: Item fields, `slug`, `resolvedCategories`, `author`, `module` schema definition, and up to 4 `relatedItems` (each with resolved `slug`) from the same module.
- **Frontend Direct Detail URL**: `http://localhost:3000/[module_slug]/[item_slug]` (Automatically renders either a custom published `single_template` BuilderPage for that module or the default 2-column Single Detail layout, with a floating "Edit Single Page Design" bar for logged-in admins).

### `GET /api/public/[module_slug]/taxonomies`
Fetch all dynamic taxonomies (e.g., categories, tags, brands) and their hierarchical or flat terms for a module. Returns `403` if `settings.allowPublicRead === false`.
- **URL Params**: `module_slug=[string]`
- **Response**:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "67...",
      "name": "Categories",
      "slug": "categories",
      "hierarchical": true,
      "allowMultiple": true,
      "terms": [
        {
          "id": "67a...",
          "name": "Electronics",
          "slug": "electronics",
          "parentId": null,
          "color": "#8b5cf6"
        },
        {
          "id": "67b...",
          "name": "Laptops",
          "slug": "laptops",
          "parentId": "67a...",
          "color": "#3b82f6"
        }
      ]
    }
  ]
}
```

---

## 2. Admin API

Admin endpoints require NextAuth session authentication and permission checks. Unauthenticated requests receive `401 Unauthorized` JSON; insufficient permissions receive `403 Forbidden`; invalid MongoDB IDs receive `400 Bad Request`; malformed JSON bodies receive `400 Bad Request`.

### Content Management
- `GET /api/admin/contents?moduleId=[id]` - Get paginated content for a specific module (`page`, `limit`, `status`, `q`, `termId`). Requires `content:read`.
- `POST /api/admin/contents` - Create new content entry. Dynamically validates fields against module schema (required non-empty check, number coercion, relation arrays), rejects inactive modules (`isActive: false`) with `403`, and generates a unique `data.slug` in a single collision check. Requires `content:create` (and `content:publish` if created directly as `published`).
- `GET /api/admin/contents/[id]` - Get single content by ID. Requires `content:read`.
- `PUT /api/admin/contents/[id]` - Update single content, rejecting inactive modules (`403`), preserving existing `seo` fields on partial updates, keeping `publishedAt` synchronized with status, and ensuring unique `data.slug`. Requires `content:update` (and `content:publish` if transitioning status to/from `published`).
- `DELETE /api/admin/contents/[id]` - Delete content. Requires `content:delete`.
- `PATCH /api/admin/contents/[id]/status` - Update publishing status (`draft` | `published` | `archived`), syncing `publishedAt` accordingly. Requires `content:publish`.

### Headless Pages (Data API)
- `GET /api/admin/pages` - List all headless data pages (`page`, `limit`, `status`, `q`). Requires `pages:read`.
- `POST /api/admin/pages` - Create a new headless data page (`createdBy` attributed from session). Requires `pages:create` (and `pages:publish` if `status === 'published'`).
- `GET /api/admin/pages/[id]` - Get a specific page and its section tree. Requires `pages:read`.
- `PUT /api/admin/pages/[id]` - Update headless page and fields (whitelisted fields only). Requires `pages:update` (and `pages:publish` if publishing).
- `DELETE /api/admin/pages/[id]` - Delete page. Requires `pages:delete`.

### Visual Page Builder (Elementor Ready Pages & Dynamic Module Templates)
- `GET /api/admin/builder-pages` - List visual web pages with `pageType` (`standard` | `module_feed` | `single_template` | `category_template`), `targetModule`, status, and layout stats. Supports `?page=1&limit=20&status=&q=&summary=true` (`summary=true` omits heavy `sections` JSON for lightweight template lookups). Requires `pages:read`.
- `POST /api/admin/builder-pages` - Create a new visual ready page with Elementor widgets (`{ id, type, column, props }`) and multi-column section settings (`columns: 1..4`, `settings: { bgType, bgColor, bgImage, bgOverlay, padding, containerWidth, columnRatio, gap, verticalAlign }`). Requires `pages:create` (and `pages:publish` if `status === 'published'`). Automatically sanitizes `custom_html` widget blocks before persistence. Supports 25 widget types including 3 Dynamic CMS / News widgets:
  - `module_grid` (**Dynamic News / Module Feed**): Displays items from a dynamic module with interactive category filter tabs (`categoryMode: 'all'`), locked to specific categories (`categoryMode: 'specific'`), or dynamically filtered by URL query `?category=...` (`categoryMode: 'url'`). Supports `grid`, `magazine`, `list`, and `compact` (sidebar) layouts, search bar, and pagination.
  - `module_categories` (**Category-Wise News Blocks**): Renders side-by-side category news sections (`blocks` style with featured lead story + list per category) or category directory cards (`pills` style). Supports showing all categories or specific selected categories and configurable archive page links.
  - `module_detail` (**Single News / Content Detail**): Renders the full single news/article detail view (breadcrumbs, category badges, headline, author/date, share & print buttons, featured image, sanitized rich text body, additional custom fields table, image gallery, and related news cards).
- `GET /api/admin/builder-pages/[id]` - Get single visual page configuration. Requires `pages:read`.
- `PUT /api/admin/builder-pages/[id]` - Update visual page layout, `pageType`, `targetModule`, sections, and widgets. Requires `pages:update` (and `pages:publish` if status transitions to/from `published`).
- `DELETE /api/admin/builder-pages/[id]` - Delete a visual page. Requires `pages:delete`.

### Module Builder
- `GET /api/admin/modules` - List all module structures (supports `?active=true`). Requires `modules:read` or `content:read`.
- `POST /api/admin/modules` - Create a new module schema. Supports initial `fields` array and bulk-inserted `taxonomies` array (`{ name, slug, icon, description, settings, fields: [...], taxonomies: [...] }`). Requires `modules:create`.
- `GET /api/admin/modules/[id]` - Get module details and fields. Requires `modules:read` or `content:read`.
- `PUT /api/admin/modules/[id]` - Update module settings (shallow-merges `settings` so partial updates preserve flags like `allowPublicRead`). Requires `modules:update`.
- `DELETE /api/admin/modules/[id]` - Delete module along with its associated `Content` entries and `Taxonomy` definitions. Requires `modules:delete`.
- `POST /api/admin/modules/[id]/fields` - Append a new field to a module (sanitized field slug name). Requires `modules:update`.
- `PUT /api/admin/modules/[id]/fields/[fieldId]` - Update a module field (whitelisted field properties). Requires `modules:update`.
- `DELETE /api/admin/modules/[id]/fields/[fieldId]` - Remove a field from module. Requires `modules:update`.
- `POST /api/admin/modules/[id]/reorder-fields` - Update field ordering (validates full ordered field ID list). Requires `modules:update`.

### Dynamic Categories & Taxonomies
Dynamic modules support multiple configurable taxonomies (e.g., Categories, Tags, Brands, Topics, Genres) with hierarchical parent-child trees or flat tagging. Category systems and terms can be managed both from Module Settings and directly inside each module's Content Workspace (`/dashboard/content/[slug]?tab=categories`) without granting module schema permissions:
- `GET /api/admin/modules/[id]/taxonomies` - List all taxonomies and their terms for a module. Requires `modules:read`, `content:read`, `content:create`, or `taxonomies:manage`.
- `POST /api/admin/modules/[id]/taxonomies` - Create a new taxonomy system for a module (`{ name, slug, hierarchical, allowMultiple, required, description }`). Requires `taxonomies:manage`, `modules:create`, or `modules:update`.
- `GET /api/admin/modules/[id]/taxonomies/[taxId]` - Get single taxonomy definition. Requires `modules:read`, `content:read`, `content:create`, or `taxonomies:manage`.
- `PUT /api/admin/modules/[id]/taxonomies/[taxId]` - Update taxonomy properties. Requires `taxonomies:manage` or `modules:update`.
- `DELETE /api/admin/modules/[id]/taxonomies/[taxId]` - Delete taxonomy and all its associated terms. Requires `taxonomies:manage`, `modules:delete`, or `modules:update`.
- `POST /api/admin/modules/[id]/taxonomies/[taxId]/terms` - Create a term/category inside a taxonomy (`{ name, slug, parentId, color, description, order }`). Requires `taxonomies:manage`, `content:create`, `content:update`, or `modules:update`.
- `PUT /api/admin/modules/[id]/taxonomies/[taxId]/terms/[termId]` - Update term properties (with cycle detection preventing circular `parentId` ancestors). Requires `taxonomies:manage`, `content:update`, or `modules:update`.
- `DELETE /api/admin/modules/[id]/taxonomies/[taxId]/terms/[termId]` - Delete a term and re-parent its children. Requires `taxonomies:manage` or `modules:update`.

### Audit Activity Logs
- `GET /api/admin/activities` - Fetch system-wide activity audit trail with pagination and filters (`?page=1&limit=20&entityType=content&action=create&q=search`). Requires one of `roles:manage`, `settings:read`, `users:read`, `modules:create`, or `developer:api`. When requested by non-Super-Admin callers, Super Admin user activities and user-entity events targeting Super Admin accounts are excluded.

### Media & Assets
- `GET /api/admin/assets` - Get media library items. Supports `?folder=blogs`, `?type=image`, `?q=search`, and optional pagination (`?page=1&limit=30`, bounded at 200 when unpaginated). Requires `media:read`.
- `GET /api/admin/assets/folders` - Get a distinct list of all media folders. Requires `media:read`.
- `DELETE /api/admin/assets/[id]` - Delete a file from the DB and Cloudinary. Requires `media:delete`.
- `POST /api/upload` - Upload media to Cloudinary (supports multiple files processed in parallel). Accepts `multipart/form-data`, validates safe `folder`, enforces 25MB max per file (`413`), and enforces a safe MIME allowlist (`415`, blocking SVG/HTML/scripts). Requires `media:upload`.

### Users & Access
> [!NOTE]
> **Super Admin Visibility Isolation**: Only authenticated `super_admin` callers can view, search, count, or target Super Admin user accounts. Non-Super-Admin callers (even with `users:read`, `users:update`, `users:delete`, `roles:manage`, or `groups:manage`) never receive Super Admin records in user lists, group member lists, user counts, or activity trails, and receive `404 User not found` when attempting to target a Super Admin ID directly.

- `GET /api/admin/users` - List CMS users with populated `roleRef` and `groups` (Super Admin accounts are excluded for non-Super-Admin callers). Requires `users:read`.
- `POST /api/admin/users` - Create a new user with `name`, `email`, `password`, `roleRef`, `groups`, and `isActive`. Automatically syncs group memberships and sets legacy `role` from the selected role. Only a `super_admin` can assign the `super_admin` role (`403` otherwise). Requires `users:create`.
- `PUT /api/admin/users/[id]` - Update user profile, password, role assignment (`roleRef`, synced to `role`), `groups` (synced atomically with `Group.members`), and `isActive`. Immediately invalidates RBAC session cache. Non-Super-Admins cannot view/modify Super Admin accounts (`404`) or assign the `super_admin` role (`403`). Requires `users:update`.
- `DELETE /api/admin/users/[id]` - Delete user account and remove from all groups. Prevents deleting own account (`400`), and hides/blocks deleting a `super_admin` account (`404`) for non-Super-Admin callers. Invalidates RBAC session cache. Requires `users:delete`.

### System & Settings
- `GET /api/admin/stats` - Returns dashboard statistics (`totalUsers` and `recentActivities` automatically exclude Super Admin accounts/activities for non-Super-Admin callers).
- `POST /api/seed` - Development-only initializer (`403` in production) to seed default roles and super admin user.
- `GET /api/public/settings` - Fetches global dynamic settings grouped by group slug into clean JSON (`{ general: { site_name, site_tagline, site_logo, brand_display, favicon, footer_text }, footer: { footer_col1_title, footer_col2_title, footer_col3_title, footer_copyright, footer_subtext, topbar_text, topbar_show_phone, topbar_show_hours }, theme: { theme_primary_color, theme_secondary_color, theme_accent_color, theme_button_bg, theme_button_text, theme_topbar_bg, theme_footer_bg }, dashboard: { dashboard_name, dashboard_logo, login_subtitle, dashboard_sidebar_bg, dashboard_primary_color, dashboard_accent_color }, contact: { contact_email, contact_phone, contact_address, support_hours }, seo: { meta_title, meta_description, og_image, facebook_url, twitter_url, instagram_url, linkedin_url, youtube_url }, media: { max_upload_size_mb, default_image_quality }, ... }`).
- `GET /api/admin/settings` - List dynamic setting groups accessible to the current user's role (`allowedRoles` empty or matching `roleSlug`, or all for `super_admin`), non-destructively ensuring all system groups and their default fields exist without overwriting saved values. Requires `settings:read` or `settings:update`.
- `POST /api/admin/settings` - Create a new custom setting group (optionally with `allowedRoles`). Requires `settings:create_group`.
- `PUT /api/admin/settings/[id]` - Update setting group values (requires `settings:update` + group access). Modifying field schemas, group metadata, or `allowedRoles` additionally requires `settings:manage_schema`.
- `DELETE /api/admin/settings/[id]` - Delete a non-system custom setting group. Requires `settings:create_group` + group access.

### RBAC — Roles
All role mutation endpoints require `roles:manage` (read requires `roles:manage`, `groups:manage`, `users:read`, or `settings:manage_schema`) and call `invalidatePermissionCache()` on updates.
- `GET /api/admin/rbac/permissions` - Returns the full permission catalogue organized by resource group.
- `GET /api/admin/rbac/roles` - List all roles (auto-seeds defaults on first call).
- `POST /api/admin/rbac/roles` - Create a new custom role with a permission set.
- `GET /api/admin/rbac/roles/[id]` - Get a specific role.
- `PUT /api/admin/rbac/roles/[id]` - Update role name, description, and permissions (`super_admin` permissions cannot be modified).
- `DELETE /api/admin/rbac/roles/[id]` - Delete a non-system role and pull references from affected users and groups.

### RBAC — Groups
All group endpoints call `invalidatePermissionCache()` on mutations.
- `GET /api/admin/rbac/groups` - List all groups with populated roles and members (Super Admin members are filtered out for non-Super-Admin callers). Requires `groups:manage` or `users:read`.
- `POST /api/admin/rbac/groups` - Create a new group and sync initial members' `groups` arrays. Non-Super-Admins cannot assign the `super_admin` role (`403`) or inject Super Admin members. Requires `groups:manage`.
- `GET /api/admin/rbac/groups/[id]` - Get a single group with populated roles and visible members (Super Admin members omitted for non-Super-Admin callers). Requires `groups:manage`.
- `PUT /api/admin/rbac/groups/[id]` - Update group (`name`, `description`, `roles`, `permissions`, `members`) and sync added/removed `User.groups`. Non-Super-Admins cannot attach `super_admin` role (`403`), inject Super Admins, or remove hidden Super Admin memberships. Requires `groups:manage`.
- `DELETE /api/admin/rbac/groups/[id]` - Delete group and remove from all member users. Requires `groups:manage`.
- `POST /api/admin/rbac/groups/[id]/members` - Add a user to a group (`{ userId }`). Rejects targeting Super Admin users with `404` when caller is not a Super Admin. Requires `groups:manage`.
- `DELETE /api/admin/rbac/groups/[id]/members` - Remove a user from a group (supports `?userId=...` query param or JSON `{ userId }` body). Rejects targeting Super Admin users with `404` when caller is not a Super Admin. Requires `groups:manage`.

### RBAC — Users
- `GET /api/admin/rbac/users` - Paginated list of users with roles and groups (Super Admin accounts are excluded for non-Super-Admin callers, including during `?q=` search). Requires `users:read` or `roles:manage`.
- `PUT /api/admin/rbac/users/[id]` - Assign `roleRef` (synced to legacy `role`), update `directPermissions` (requires `roles:manage`), `groups` (synced with `Group.members`), and `isActive`. Immediately invalidates RBAC session cache. Non-Super-Admins receive `404` if targeting a Super Admin account and `403` if trying to assign the `super_admin` role. Requires `users:update` or `roles:manage`.

---

## 3. Developer Tools & API Inspection
The CMS includes built-in developer quick-visit and inspection badges for all core GET API endpoints.
- **Permission**: `developer:api` ("View API Endpoints") under Developer Tools.
- **Default Roles with Access**: `super_admin`, `admin`, `developer`.
- **Features**:
  - Direct 1-click visit in new browser tab (`window.open(url, '_blank')`).
  - 1-click full absolute URL clipboard copy.
  - Distinguishes between `Admin (Auth required)` and `Public (Open)` endpoints.
  - Fully governed by RBAC — users without `developer:api` permission cannot see the API inspection buttons.


---

## 4. Employees / Team Directory API

### Admin Endpoints (Auth & RBAC Required)
- `GET /api/admin/employees` - List all employees ordered by `sortOrder` (ascending) and `createdAt` (descending). Supports optional `?department=...` and `?q=...` search filters. Requires `employees:read`.
- `POST /api/admin/employees` - Create a new employee (`name`, `designation`, `department`, `photo`, `phone`, `email`, `bio`, `sortOrder`, `isActive`, `isFeatured`, `featuredTitle`, `featuredQuote`, `expertise`). Logs an activity entry. Requires `employees:create`.
- `PUT /api/admin/employees/[id]` - Update an existing employee by ID (supports executive spotlight fields `isFeatured`, `featuredTitle`, `featuredQuote`). Logs an activity entry. Requires `employees:update`.
- `DELETE /api/admin/employees/[id]` - Permanently delete an employee by ID. Logs an activity entry. Requires `employees:delete`.

### Public Endpoint
- `GET /api/public/employees` - Returns all active (`isActive: true`) employees sorted by `{ isFeatured: -1, sortOrder: 1, createdAt: 1 }` (featured executive leadership first, followed by sort order and creation date) for the public `/team` page and homepage team preview.


---

## 5. Customer Inquiries & Contact API

### Public Endpoint
- `POST /api/public/inquiries` - Submit a general contact or product-referenced inquiry (`name`, `phone`, `email`, `company`, `subject`, `message`, optional `productId`, `productTitle`, `productSlug`, `productSku`). Automatically classifies `inquiryType` as `'product'` or `'general'`, enforces field length caps and IP rate limiting (10 requests per 10 minutes), and sets initial `status: 'new'`.

### Admin Endpoints (Auth & RBAC Required)
- `GET /api/admin/inquiries` - List inquiries ordered by newest first, along with status counts (`total`, `new`, `contacted`, `closed`). Supports `?status=new|contacted|closed`, `?type=general|product`, and `?q=...` search. Requires `inquiries:read`.
- `PUT /api/admin/inquiries/[id]` - Update inquiry `status` (`new`, `contacted`, `closed`) and/or `adminNotes` follow-up notes. Logs an activity entry. Requires `inquiries:update`.
- `DELETE /api/admin/inquiries/[id]` - Delete an inquiry by ID. Logs an activity entry. Requires `inquiries:delete`.


---

## 6. Navigation & Menus API

Dynamic multi-location navigation system managing menu links across the public site (Main Header, Top Bar, Footer Columns, and custom slots).

### Public Endpoints (Read-Only)
- `GET /api/public/menus` - Returns all active navigation menus (`isActive: true`) with only active items, ordered sequentially. Supports optional `?location=main_header|top_bar|footer_col1|footer_col2|footer_col3` query filter.
- `GET /api/public/menus/[slug]` - Returns a single active navigation menu by its unique `slug` or assigned `location`.

### Admin Endpoints (Auth & RBAC Required)
- `GET /api/admin/menus` - List all configured menus along with their item arrays and assigned display locations (`main_header`, `top_bar`, `footer_col1`, `footer_col2`, `footer_col3`, `custom`). Automatically seeds default system menus if empty. Requires `pages:read`, `settings:read`, or `settings:update`.
- `POST /api/admin/menus` - Create a new menu (`name`, `slug`, `location`, `description`, `isActive`, `items`). Validates name and uniqueness of slug. Logs an activity entry. Requires `pages:update` or `settings:update`.
- `GET /api/admin/menus/[id]` - Retrieve a single menu by MongoDB `_id` or unique `slug`. Requires `pages:read`, `settings:read`, or `settings:update`.
- `PUT /api/admin/menus/[id]` - Update menu metadata, display location assignment, active status, and menu items (`[{ id, label, url, target, badge, order, isActive, children }]`). Logs an activity entry. Requires `pages:update` or `settings:update`.
- `DELETE /api/admin/menus/[id]` - Permanently delete a menu by `_id` or `slug`. Logs an activity entry. Requires `pages:update` or `settings:update`.
