import { baseApi } from './baseApi'

export const assetsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getFolders: builder.query({
      query: () => '/assets/folders',
      providesTags: ['AssetFolder'],
    }),
    getAssets: builder.query({
      query: (params = {}) => ({ url: '/assets', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Asset', id: _id })), { type: 'Asset', id: 'LIST' }]
          : [{ type: 'Asset', id: 'LIST' }],
    }),
    deleteAsset: builder.mutation({
      query: (id) => ({ url: `/assets/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Asset', id: 'LIST' }, 'AssetFolder', 'Stats', 'Activity'],
    }),
    updateAsset: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/assets/${id}`, method: 'PUT', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Asset', id }, { type: 'Asset', id: 'LIST' }, 'AssetFolder'],
    }),
  }),
})

export const { useGetFoldersQuery, useGetAssetsQuery, useDeleteAssetMutation, useUpdateAssetMutation } = assetsApi
