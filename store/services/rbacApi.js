import { baseApi } from './baseApi'

export const rbacApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: () => '/rbac/permissions',
    }),
    getRoles: builder.query({
      query: () => '/rbac/roles',
      providesTags: ['Role'],
    }),
    createRole: builder.mutation({
      query: (data) => ({ url: '/rbac/roles', method: 'POST', body: data }),
      invalidatesTags: ['Role', 'Activity'],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/rbac/roles/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Role', 'RbacUser', 'User', 'Activity'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/rbac/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role', 'Group', 'RbacUser', 'User', 'Activity'],
    }),
    getGroups: builder.query({
      query: () => '/rbac/groups',
      providesTags: ['Group'],
    }),
    createGroup: builder.mutation({
      query: (data) => ({ url: '/rbac/groups', method: 'POST', body: data }),
      invalidatesTags: ['Group', 'RbacUser', 'User', 'Activity'],
    }),
    updateGroup: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/rbac/groups/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Group', 'RbacUser', 'User', 'Activity'],
    }),
    deleteGroup: builder.mutation({
      query: (id) => ({ url: `/rbac/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Group', 'RbacUser', 'User', 'Activity'],
    }),
    addGroupMember: builder.mutation({
      query: ({ groupId, userId }) => ({ url: `/rbac/groups/${groupId}/members`, method: 'POST', body: { userId } }),
      invalidatesTags: ['Group', 'RbacUser', 'User'],
    }),
    removeGroupMember: builder.mutation({
      query: ({ groupId, userId }) => ({
        url: `/rbac/groups/${groupId}/members?userId=${encodeURIComponent(userId)}`,
        method: 'DELETE',
        body: { userId },
      }),
      invalidatesTags: ['Group', 'RbacUser', 'User'],
    }),
    getRbacUsers: builder.query({
      query: (params = {}) => ({ url: '/rbac/users', params }),
      providesTags: ['RbacUser'],
    }),
    updateUserRbac: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/rbac/users/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['RbacUser', 'User', 'Group', 'Activity'],
    }),
  }),
})

export const {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetRbacUsersQuery,
  useUpdateUserRbacMutation,
} = rbacApi
