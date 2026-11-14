import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slices/uiSlice'
import { baseApi } from './services/baseApi'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
})
