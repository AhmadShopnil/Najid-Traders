import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    mobileSidebarOpen: false,
    language: 'en',
    theme: 'light',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload },
    toggleMobileSidebar: (state) => { state.mobileSidebarOpen = !state.mobileSidebarOpen },
    setMobileSidebarOpen: (state, action) => { state.mobileSidebarOpen = action.payload },
    setLanguage: (state, action) => { state.language = action.payload },
    setTheme: (state, action) => { state.theme = action.payload },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setLanguage,
  setTheme,
} = uiSlice.actions
export default uiSlice.reducer
