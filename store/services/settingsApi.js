import { baseApi } from './baseApi'

export const settingsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Setting'],
    }),
    getSettingById: builder.query({
      query: (id) => `/settings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Setting', id }],
    }),
    createSetting: builder.mutation({
      query: (data) => ({
        url: '/settings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Setting', 'Activity'],
    }),
    updateSetting: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/settings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Setting', id }, 'Setting', 'Activity'],
    }),
    deleteSetting: builder.mutation({
      query: (id) => ({
        url: `/settings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Setting', 'Activity'],
    }),
  }),
})

export const {
  useGetSettingsQuery,
  useGetSettingByIdQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useDeleteSettingMutation,
} = settingsApi
