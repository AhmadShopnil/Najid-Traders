import { baseApi } from './baseApi'

export const pagesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getPages: builder.query({
      query: (params = {}) => ({ url: '/pages', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Page', id: _id })), { type: 'Page', id: 'LIST' }]
          : [{ type: 'Page', id: 'LIST' }],
    }),
    getPage: builder.query({
      query: (id) => `/pages/${id}`,
      providesTags: (result, error, id) => [{ type: 'Page', id }],
    }),
    createPage: builder.mutation({
      query: (body) => ({ url: '/pages', method: 'POST', body }),
      invalidatesTags: [{ type: 'Page', id: 'LIST' }, 'Activity'],
    }),
    updatePage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/pages/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Page', id }, { type: 'Page', id: 'LIST' }, 'Activity'],
    }),
    deletePage: builder.mutation({
      query: (id) => ({ url: `/pages/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Page', id: 'LIST' }, 'Activity'],
    }),
  }),
})

export const {
  useGetPagesQuery,
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
} = pagesApi
