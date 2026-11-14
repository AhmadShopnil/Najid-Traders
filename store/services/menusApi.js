import { baseApi } from './baseApi'

export const menusApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getMenus: builder.query({
      query: () => '/menus',
      providesTags: ['Menu'],
    }),
    getMenuById: builder.query({
      query: (id) => `/menus/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Menu', id }],
    }),
    createMenu: builder.mutation({
      query: (data) => ({
        url: '/menus',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Menu', 'Activity'],
    }),
    updateMenu: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/menus/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Menu', id }, 'Menu', 'Activity'],
    }),
    deleteMenu: builder.mutation({
      query: (id) => ({
        url: `/menus/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'Activity'],
    }),
  }),
})

export const {
  useGetMenusQuery,
  useGetMenuByIdQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} = menusApi
