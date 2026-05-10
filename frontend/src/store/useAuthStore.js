import { create } from 'zustand';
import api from '../api/axios';

/**
 * Authentication Store using Zustand
 * Manages user state, tokens, and auth actions.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,

  /**
   * Load user details from backend using the stored JWT
   */
  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') {
      localStorage.removeItem('token');
      set({ loading: false, isAuthenticated: false, user: null });
      return;
    }
    
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, loading: false });
    } catch (err) {
      console.warn('[AUTH_STORE] Session expired or invalid. Purging state.');
      get().logout();
      set({ loading: false });
    }
  },

  /**
   * Main Google Authentication Flow
   * Sends Firebase ID Token to backend for verification and JWT exchange.
   */
  firebaseAuth: async (firebaseToken, role = 'user') => {
    try {
      set({ loading: true });
      const res = await api.post('/auth/firebase-auth', { firebaseToken, role });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false 
      });
      return true;
    } catch (err) {
      console.error('[AUTH_STORE] Firebase login failed:', err.response?.data?.msg || err.message);
      set({ loading: false });
      throw err.response?.data?.msg || 'Authentication with server failed.';
    }
  },

  /**
   * Legacy/Email Login
   */
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

  /**
   * Logout and purge all local state
   */
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  /**
   * Toggle Wishlist Persistence
   */
  toggleWishlist: async (propertyId) => {
    try {
      const res = await api.put(`/auth/wishlist/${propertyId}`);
      set(state => ({
        user: { ...state.user, savedProperties: res.data }
      }));
      return true;
    } catch (err) {
      console.error('Wishlist update failed:', err);
      return false;
    }
  }
}));
