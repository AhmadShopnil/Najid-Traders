import { baseApi } from './baseApi'

export const contentsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getContents: builder.query({
      query: ({ moduleId, ...params } = {}) => ({ url: '/contents', params: { moduleId, ...params } }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Content', id: _id })), { type: 'Content', id: 'LIST' }]
          : [{ type: 'Content', id: 'LIST' }],
    }),
    getContent: builder.query({
      query: (id) => `/contents/${id}`,
      providesTags: (r, e, id) => [{ type: 'Content', id }],
    }),
    createContent: builder.mutation({
      query: (body) => ({ url: '/contents', method: 'POST', body }),
      invalidatesTags: [{ type: 'Content', id: 'LIST' }, 'Stats', 'Activity'],
    }),
    updateContent: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/contents/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Content', id }, { type: 'Content', id: 'LIST' }, 'Stats', 'Activity'],
    }),
    deleteContent: builder.mutation({
      query: (id) => ({ url: `/contents/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Content', id: 'LIST' }, 'Stats', 'Activity'],
    }),
    updateContentStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/contents/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Content', id }, { type: 'Content', id: 'LIST' }, 'Stats', 'Activity'],
    }),
  }),
})

export const {
  useGetContentsQuery,
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
  useUpdateContentStatusMutation,
} = contentsApi
