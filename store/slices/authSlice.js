import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isLoading: false },
  reducers: {
    setUser: (state, action) => { state.user = action.payload },
    clearUser: (state) => { state.user = null },
    setLoading: (state, action) => { state.isLoading = action.payload },
  },
})

export const { setUser, clearUser, setLoading } = authSlice.actions
export default authSlice.reducer
