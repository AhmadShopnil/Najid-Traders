import { baseApi } from './baseApi'

export const builderPagesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getBuilderPages: builder.query({
      query: (params = {}) => ({ url: '/builder-pages', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'BuilderPage', id: _id })), { type: 'BuilderPage', id: 'LIST' }]
          : [{ type: 'BuilderPage', id: 'LIST' }],
    }),
    getBuilderPage: builder.query({
      query: (id) => `/builder-pages/${id}`,
      providesTags: (result, error, id) => [{ type: 'BuilderPage', id }],
    }),
    createBuilderPage: builder.mutation({
      query: (body) => ({ url: '/builder-pages', method: 'POST', body }),
      invalidatesTags: [{ type: 'BuilderPage', id: 'LIST' }, 'Activity'],
    }),
    updateBuilderPage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/builder-pages/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'BuilderPage', id }, { type: 'BuilderPage', id: 'LIST' }, 'Activity'],
    }),
    deleteBuilderPage: builder.mutation({
      query: (id) => ({ url: `/builder-pages/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'BuilderPage', id: 'LIST' }, 'Activity'],
    }),
  }),
})

export const {
  useGetBuilderPagesQuery,
  useGetBuilderPageQuery,
  useCreateBuilderPageMutation,
  useUpdateBuilderPageMutation,
  useDeleteBuilderPageMutation,
} = builderPagesApi
