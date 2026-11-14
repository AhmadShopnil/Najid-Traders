import { baseApi } from './baseApi'

export const activitiesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: (params = {}) => ({
        url: '/activities',
        params,
      }),
      providesTags: ['Activity'],
    }),
  }),
})

export const { useGetActivitiesQuery } = activitiesApi
