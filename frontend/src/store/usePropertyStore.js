import { create } from 'zustand';
import api from '../api/axios';

export const usePropertyStore = create((set, get) => ({
  properties: [],
  loading: false,

  // Discovery filters
  filters: {
    bounds: null,
    minPrice: 0,
    maxPrice: 200000,
    bhkType: 'All',
    city: 'All',
    radius: 5, // km
    lat: null,
    lng: null,
    amenities: [],
    allowedFor: [], // Multi-select filters
    floorType: 'All', // ground, 1-4, 5-10, 11+
    advancedFeatures: [],
  },

  setFilter: (key, value) => {
    const currentFilters = get().filters;
    if (currentFilters[key] === value) return; // Skip redundant updates
    
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    }));
    
    // Debounce to prevent rapid API calls
    if (get().fetchTimeout) clearTimeout(get().fetchTimeout);
    const timeout = setTimeout(() => get().fetchProperties(), 300);
    set({ fetchTimeout: timeout });
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const hasChange = Object.keys(newFilters).some(k => currentFilters[k] !== newFilters[k]);
    if (!hasChange) return;

    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    
    if (get().fetchTimeout) clearTimeout(get().fetchTimeout);
    const timeout = setTimeout(() => get().fetchProperties(), 300);
    set({ fetchTimeout: timeout });
  },

  resetFilters: () => {
    set({
      filters: {
        bounds: null,
        minPrice: 0,
        maxPrice: 200000,
        bhkType: 'All',
        city: 'All',
        radius: 5,
        lat: null,
        lng: null,
        amenities: [],
        allowedFor: [],
        floorType: 'All',
        advancedFeatures: [],
      }
    });
    get().fetchProperties();
  },

  fetchProperties: async () => {
    const { bounds, minPrice, maxPrice, bhkType, city, radius, lat, lng, amenities, allowedFor, floorType } = get().filters;
    
    // Fetch properties - allow discovery mode even without strict location pinning
    set({ loading: true });
    try {
      const res = await api.get('/properties', {
        params: { 
          // Prioritize high-intent radius search (Lat/Lng) over discovery mode (Bounds)
          lat: (lat && lng) ? lat : undefined,
          lng: (lat && lng) ? lng : undefined,
          radius: (lat && lng) ? radius : undefined,
          bounds: !(lat && lng) ? bounds : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice === 200000 ? undefined : maxPrice, 
          bhkType: bhkType === 'All' ? undefined : bhkType,
          city: city === 'All' ? undefined : city,
          amenities: amenities.length > 0 ? amenities.join(',') : undefined,
          filter: allowedFor.length > 0 ? allowedFor.join(',') : undefined,
          floor: floorType === 'All' ? undefined : floorType,
          advancedFeatures: (get().filters.advancedFeatures || []).length > 0 ? get().filters.advancedFeatures.join(',') : undefined
        }
      });
      set({ properties: res.data || [], loading: false });
    } catch (err) {
      console.error('[PROPERTY_STORE]', err);
      set({ loading: false, properties: [] });
    }
  },

  fetchPropertyById: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get(`/properties/${id}`);
      set({ loading: false });
      return res.data;
    } catch (err) {
      console.error('[SINGLE_FETCH_ERROR]', err);
      set({ loading: false });
      return null;
    }
  }
}));
