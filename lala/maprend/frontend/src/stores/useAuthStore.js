import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post('/api/auth/login', credentials)
          set({ user: data.user, token: data.token })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          return data
        } catch (error) {
          throw error.response.data
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post('/api/auth/register', userData)
          set({ user: data.user, token: data.token })
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          return data
        } catch (error) {
          throw error.response.data
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete axios.defaults.headers.common['Authorization']
      },

      setUser: (user) => set({ user }),

      checkAuth: async () => {
        const token = localStorage.getItem('zustand')
        if (token) {
          try {
            // Could add token verify endpoint later
            set({ token })
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          } catch {}
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)

export default useAuthStore

