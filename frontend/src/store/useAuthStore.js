import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') {
      localStorage.removeItem('token');
      set({ loading: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, loading: false });
      } else {
        throw new Error('Signal integrity failure');
      }
    } catch (err) {
      console.warn('[AUTH_STORE] Verification failed. Session purged.');
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
      return true;
    } catch (err) {
      throw err.response?.data?.msg || 'Login failed';
    }
  },

  register: async (name, email, password, role = 'user') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
      return true;
    } catch (err) {
      throw err.response?.data?.msg || 'Registration failed';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
