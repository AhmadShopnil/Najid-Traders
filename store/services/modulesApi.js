import { baseApi } from './baseApi'

export const modulesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getModules: builder.query({
      query: (params = {}) => ({ url: '/modules', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Module', id: _id })), { type: 'Module', id: 'LIST' }]
          : [{ type: 'Module', id: 'LIST' }],
    }),
    getModule: builder.query({
      query: (id) => `/modules/${id}`,
      providesTags: (result, error, id) => [{ type: 'Module', id }],
    }),
    createModule: builder.mutation({
      query: (body) => ({ url: '/modules', method: 'POST', body }),
      invalidatesTags: [{ type: 'Module', id: 'LIST' }, 'Stats', 'Activity'],
    }),
    updateModule: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/modules/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Module', id }, { type: 'Module', id: 'LIST' }, 'Stats', 'Activity'],
    }),
    deleteModule: builder.mutation({
      query: (id) => ({ url: `/modules/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Module', id: 'LIST' }, 'Content', 'Taxonomy', 'Stats', 'Activity'],
    }),
    addField: builder.mutation({
      query: ({ moduleId, ...field }) => ({ url: `/modules/${moduleId}/fields`, method: 'POST', body: field }),
      invalidatesTags: (r, e, { moduleId }) => [{ type: 'Module', id: moduleId }, { type: 'Module', id: 'LIST' }],
    }),
    updateField: builder.mutation({
      query: ({ moduleId, fieldId, ...field }) => ({ url: `/modules/${moduleId}/fields/${fieldId}`, method: 'PUT', body: field }),
      invalidatesTags: (r, e, { moduleId }) => [{ type: 'Module', id: moduleId }],
    }),
    deleteField: builder.mutation({
      query: ({ moduleId, fieldId }) => ({ url: `/modules/${moduleId}/fields/${fieldId}`, method: 'DELETE' }),
      invalidatesTags: (r, e, { moduleId }) => [{ type: 'Module', id: moduleId }, { type: 'Module', id: 'LIST' }],
    }),
    reorderFields: builder.mutation({
      query: ({ moduleId, fields }) => ({ url: `/modules/${moduleId}/reorder-fields`, method: 'POST', body: { fields } }),
      invalidatesTags: (r, e, { moduleId }) => [{ type: 'Module', id: moduleId }],
    }),
  }),
})

export const {
  useGetModulesQuery,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useAddFieldMutation,
  useUpdateFieldMutation,
  useDeleteFieldMutation,
  useReorderFieldsMutation,
} = modulesApi
