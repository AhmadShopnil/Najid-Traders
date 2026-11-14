import { baseApi } from './baseApi'

export const taxonomiesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getModuleTaxonomies: builder.query({
      query: (moduleId) => `/modules/${moduleId}/taxonomies`,
      providesTags: (result, error, moduleId) => [{ type: 'Taxonomy', id: moduleId }],
    }),
    createTaxonomy: builder.mutation({
      query: ({ moduleId, ...body }) => ({
        url: `/modules/${moduleId}/taxonomies`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }, 'Activity'],
    }),
    updateTaxonomy: builder.mutation({
      query: ({ moduleId, taxId, ...body }) => ({
        url: `/modules/${moduleId}/taxonomies/${taxId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }, 'Activity'],
    }),
    deleteTaxonomy: builder.mutation({
      query: ({ moduleId, taxId }) => ({
        url: `/modules/${moduleId}/taxonomies/${taxId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }, 'Activity'],
    }),
    addTaxonomyTerm: builder.mutation({
      query: ({ moduleId, taxId, ...body }) => ({
        url: `/modules/${moduleId}/taxonomies/${taxId}/terms`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }],
    }),
    updateTaxonomyTerm: builder.mutation({
      query: ({ moduleId, taxId, termId, ...body }) => ({
        url: `/modules/${moduleId}/taxonomies/${taxId}/terms/${termId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }],
    }),
    deleteTaxonomyTerm: builder.mutation({
      query: ({ moduleId, taxId, termId }) => ({
        url: `/modules/${moduleId}/taxonomies/${taxId}/terms/${termId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { moduleId }) => [{ type: 'Taxonomy', id: moduleId }],
    }),
  }),
})

export const {
  useGetModuleTaxonomiesQuery,
  useCreateTaxonomyMutation,
  useUpdateTaxonomyMutation,
  useDeleteTaxonomyMutation,
  useAddTaxonomyTermMutation,
  useUpdateTaxonomyTermMutation,
  useDeleteTaxonomyTermMutation,
} = taxonomiesApi
