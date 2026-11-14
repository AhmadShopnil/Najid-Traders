/**
 * Master permission catalogue.
 * Format: "resource:action"
 * This is the single source of truth for all permissions in the system.
 */

export const PERMISSIONS = {
  // Module Builder (schema management)
  MODULES_CREATE:    'modules:create',
  MODULES_READ:      'modules:read',
  MODULES_UPDATE:    'modules:update',
  MODULES_DELETE:    'modules:delete',

  // Content (entries & categories inside modules)
  CONTENT_CREATE:    'content:create',
  CONTENT_READ:      'content:read',
  CONTENT_UPDATE:    'content:update',
  CONTENT_DELETE:    'content:delete',
  CONTENT_PUBLISH:   'content:publish',
  TAXONOMIES_MANAGE: 'taxonomies:manage',

  // Media library
  MEDIA_UPLOAD:      'media:upload',
  MEDIA_READ:        'media:read',
  MEDIA_DELETE:      'media:delete',

  // Page builder
  PAGES_CREATE:      'pages:create',
  PAGES_READ:        'pages:read',
  PAGES_UPDATE:      'pages:update',
  PAGES_DELETE:      'pages:delete',
  PAGES_PUBLISH:     'pages:publish',

  // User management
  USERS_CREATE:      'users:create',
  USERS_READ:        'users:read',
  USERS_UPDATE:      'users:update',
  USERS_DELETE:      'users:delete',

  // Employees & Team
  EMPLOYEES_CREATE:  'employees:create',
  EMPLOYEES_READ:    'employees:read',
  EMPLOYEES_UPDATE:  'employees:update',
  EMPLOYEES_DELETE:  'employees:delete',

  // Customer Inquiries
  INQUIRIES_READ:    'inquiries:read',
  INQUIRIES_UPDATE:  'inquiries:update',
  INQUIRIES_DELETE:  'inquiries:delete',

  // RBAC management
  ROLES_MANAGE:      'roles:manage',
  GROUPS_MANAGE:     'groups:manage',

  // Settings
  SETTINGS_READ:          'settings:read',
  SETTINGS_UPDATE:        'settings:update',
  SETTINGS_CREATE_GROUP:  'settings:create_group',
  SETTINGS_MANAGE_SCHEMA: 'settings:manage_schema',

  // Developer tools
  DEVELOPER_API:     'developer:api',
}

/** Grouped for UI display in the permission matrix */
export const PERMISSION_GROUPS = [
  {
    key: 'modules',
    label: 'Module Builder',
    description: 'Schema / structure management',
    permissions: [
      { key: 'modules:create',  label: 'Create' },
      { key: 'modules:read',    label: 'Read' },
      { key: 'modules:update',  label: 'Edit' },
      { key: 'modules:delete',  label: 'Delete' },
    ],
  },
  {
    key: 'content',
    label: 'Content',
    description: 'Manage entries and categories inside modules',
    permissions: [
      { key: 'content:create',    label: 'Create' },
      { key: 'content:read',      label: 'Read' },
      { key: 'content:update',    label: 'Edit' },
      { key: 'content:delete',    label: 'Delete' },
      { key: 'content:publish',   label: 'Publish' },
      { key: 'taxonomies:manage', label: 'Manage Categories' },
    ],
  },
  {
    key: 'media',
    label: 'Media Library',
    description: 'File uploads and assets',
    permissions: [
      { key: 'media:upload', label: 'Upload' },
      { key: 'media:read',   label: 'Read' },
      { key: 'media:delete', label: 'Delete' },
    ],
  },
  {
    key: 'pages',
    label: 'Page Builder',
    description: 'Dynamic page management',
    permissions: [
      { key: 'pages:create',  label: 'Create' },
      { key: 'pages:read',    label: 'Read' },
      { key: 'pages:update',  label: 'Edit' },
      { key: 'pages:delete',  label: 'Delete' },
      { key: 'pages:publish', label: 'Publish' },
    ],
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'Create and manage CMS users',
    permissions: [
      { key: 'users:create', label: 'Create' },
      { key: 'users:read',   label: 'Read' },
      { key: 'users:update', label: 'Edit' },
      { key: 'users:delete', label: 'Delete' },
    ],
  },
  {
    key: 'employees',
    label: 'Employees & Team',
    description: 'Manage public company team directory',
    permissions: [
      { key: 'employees:create', label: 'Create' },
      { key: 'employees:read',   label: 'Read' },
      { key: 'employees:update', label: 'Edit' },
      { key: 'employees:delete', label: 'Delete' },
    ],
  },
  {
    key: 'inquiries',
    label: 'Customer Inquiries',
    description: 'View and follow up on customer contact & product inquiries',
    permissions: [
      { key: 'inquiries:read',   label: 'Read' },
      { key: 'inquiries:update', label: 'Manage / Follow Up' },
      { key: 'inquiries:delete', label: 'Delete' },
    ],
  },
  {
    key: 'rbac',
    label: 'Access Control',
    description: 'Roles and groups management',
    permissions: [
      { key: 'roles:manage',  label: 'Manage Roles' },
      { key: 'groups:manage', label: 'Manage Groups' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Global CMS configuration',
    permissions: [
      { key: 'settings:read',          label: 'Read' },
      { key: 'settings:update',        label: 'Update Values' },
      { key: 'settings:create_group',  label: 'Create / Delete Groups' },
      { key: 'settings:manage_schema', label: 'Manage Fields & Access' },
    ],
  },
  {
    key: 'developer',
    label: 'Developer Tools',
    description: 'API inspection and developer utilities',
    permissions: [
      { key: 'developer:api', label: 'View API Endpoints' },
    ],
  },
]

/** All permission strings as a flat array */
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))

/** Default role seeds */
export const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full access to everything. Cannot be modified or deleted.',
    color: '#7c3aed',
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Full access except role and group management.',
    color: '#2563eb',
    permissions: ALL_PERMISSIONS.filter(p => p !== 'roles:manage' && p !== 'groups:manage'),
    isSystem: true,
  },
  {
    name: 'Developer',
    slug: 'developer',
    description: 'Can manage modules, content, categories, media, and pages. Cannot manage users or settings.',
    color: '#0891b2',
    permissions: [
      'modules:create','modules:read','modules:update','modules:delete',
      'content:create','content:read','content:update','content:delete','content:publish',
      'taxonomies:manage',
      'media:upload','media:read','media:delete',
      'pages:create','pages:read','pages:update','pages:delete','pages:publish',
      'developer:api',
    ],
    isSystem: true,
  },
  {
    name: 'Manager',
    slug: 'manager',
    description: 'Can manage content, categories, pages, media, and view users. Cannot touch module schemas.',
    color: '#0d9488',
    permissions: [
      'content:create','content:read','content:update','content:delete','content:publish',
      'taxonomies:manage',
      'media:upload','media:read','media:delete',
      'pages:create','pages:read','pages:update','pages:delete','pages:publish',
      'users:read',
      'employees:create','employees:read','employees:update','employees:delete',
      'inquiries:read','inquiries:update',
    ],
    isSystem: false,
  },
  {
    name: 'Editor',
    slug: 'editor',
    description: 'Can create and edit content and upload media. Cannot publish or delete.',
    color: '#d97706',
    permissions: [
      'content:create','content:read','content:update',
      'media:upload','media:read',
      'pages:read','pages:update',
    ],
    isSystem: false,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to content, media, and pages.',
    color: '#6b7280',
    permissions: [
      'content:read',
      'media:read',
      'pages:read',
    ],
    isSystem: true,
  },
]
