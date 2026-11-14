import { baseApi } from './baseApi'

export const inquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInquiries: builder.query({
      query: (params = {}) => {
        const clean = {}
        if (params.status) clean.status = params.status
        if (params.type) clean.type = params.type
        if (params.q) clean.q = params.q
        return {
          url: '/inquiries',
          params: clean,
        }
      },
      transformResponse: (res) => res?.data || { items: [], counts: { total: 0, new: 0, contacted: 0, closed: 0 } },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ _id }) => ({ type: 'Inquiry', id: _id })),
              { type: 'Inquiry', id: 'LIST' },
            ]
          : [{ type: 'Inquiry', id: 'LIST' }],
    }),

    updateInquiry: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/inquiries/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    deleteInquiry: builder.mutation({
      query: (id) => ({
        url: `/inquiries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Inquiry', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetInquiriesQuery,
  useUpdateInquiryMutation,
  useDeleteInquiryMutation,
} = inquiriesApi
