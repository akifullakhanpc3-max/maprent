import { create } from 'zustand';
import api from '../api/axios';

export const useBookingStore = create((set, get) => ({
  myRequests: [],
  incomingBookings: [],
  loading: false,
  processing: { loading: false, success: false, error: null, message: '' },

  setProcessing: (data) => set((state) => ({ 
    processing: { ...state.processing, ...data } 
  })),

  clearProcessing: () => set({ 
    processing: { loading: false, success: false, error: null, message: '' } 
  }),

  fetchMyRequests: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/bookings/my-requests');
      set({ myRequests: res.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  fetchIncoming: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/bookings/incoming');
      set({ incomingBookings: res.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  createBooking: async (bookingData) => {
    try {
      const res = await api.post('/bookings', bookingData);
      set((state) => ({
        myRequests: [res.data, ...state.myRequests]
      }));
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const res = await api.put(`/bookings/${id}/status`, { status });
      const updatedBooking = res.data;
      
      set((state) => ({
        myRequests: state.myRequests.map((b) => (b._id === id ? updatedBooking : b)),
        incomingBookings: state.incomingBookings.map((b) => (b._id === id ? updatedBooking : b)),
      }));
    } catch (err) {
      throw err;
    }
  }
}));
