import { baseApi } from './baseApi'

export const statsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getStats: builder.query({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
  }),
})

export const { useGetStatsQuery } = statsApi
