import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/admin' }),
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: [
    'Module',
    'Content',
    'Asset',
    'AssetFolder',
    'User',
    'Stats',
    'Page',
    'Setting',
    'Role',
    'Group',
    'RbacUser',
    'Activity',
    'Taxonomy',
    'BuilderPage',
    'Employee',
    'Inquiry',
    'Menu',
  ],
  endpoints: () => ({}),
})
