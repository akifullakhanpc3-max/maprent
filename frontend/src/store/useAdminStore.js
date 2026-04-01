import { create } from 'zustand';
import api from '../api/axios';

export const useAdminStore = create((set, get) => ({
  stats: null,
  users: [],
  properties: [],
  bookings: [],
  loading: false,
  error: null,
  processing: { loading: false, success: false, error: null, message: '' },

  setProcessing: (data) => set((state) => ({ 
    processing: { ...state.processing, ...data } 
  })),

  clearProcessing: () => set({ 
    processing: { loading: false, success: false, error: null, message: '' } 
  }),

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/admin/dashboard');
      set({ 
        stats: res.data.stats, 
        recentLogs: res.data.recentLogs || [],
        loading: false 
      });
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error fetching stats', loading: false });
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/admin/users');
      set({ users: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error fetching users', loading: false });
    }
  },

  toggleBlockUser: async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      // Update local state instead of refetching everything
      set((state) => ({
        users: state.users.map((u) => 
          u._id === userId ? { ...u, isBlocked: res.data.isBlocked } : u
        )
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error blocking user' });
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      set((state) => ({
        users: state.users.filter((u) => u._id !== userId)
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error deleting user' });
    }
  },

  fetchProperties: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/admin/properties');
      set({ properties: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error fetching properties', loading: false });
    }
  },

  updatePropertyStatus: async (propertyId, status) => {
    try {
      const res = await api.put(`/admin/properties/${propertyId}/${status}`); // 'approve' or 'reject'
      set((state) => ({
        properties: state.properties.map((p) =>
          p._id === propertyId ? res.data : p
        )
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || `Error updating status to ${status}` });
    }
  },

  editProperty: async (propertyId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/admin/properties/${propertyId}`, data);
      set((state) => ({
        properties: state.properties.map((p) =>
          p._id === propertyId ? res.data : p
        ),
        loading: false
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error editing property', loading: false });
      return false;
    }
  },

  toggleFeatureProperty: async (propertyId) => {
    try {
      const res = await api.put(`/admin/properties/${propertyId}/feature`);
      set((state) => ({
        properties: state.properties.map((p) =>
          p._id === propertyId ? res.data : p
        )
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error toggling featured status' });
    }
  },
  
  deleteProperty: async (propertyId) => {
    try {
      await api.delete(`/admin/properties/${propertyId}`);
      set((state) => ({
        properties: state.properties.filter((p) => p._id !== propertyId)
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error deleting property' });
    }
  },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/admin/bookings');
      set({ bookings: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error fetching bookings', loading: false });
    }
  },

  deleteBooking: async (bookingId) => {
    try {
      await api.delete(`/admin/bookings/${bookingId}`);
      set((state) => ({
        bookings: state.bookings.filter((b) => b._id !== bookingId)
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || 'Error deleting booking' });
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    try {
      const res = await api.put(`/admin/bookings/${bookingId}/status`, { status });
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b._id === bookingId ? { ...b, status: res.data.status } : b
        )
      }));
    } catch (err) {
      set({ error: err.response?.data?.msg || `Error updating booking status to ${status}` });
    }
  }
}));
