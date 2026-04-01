import { create } from 'zustand';
import api from '../api/axios';

export const usePropertyStore = create((set, get) => ({
  properties: [],
  loading: false,

  // Discovery filters
  filters: {
    bounds: null,
    minRent: 0,
    maxRent: 200000,
    bhkType: 'All',
    city: 'All',
    radius: 5, // km
    lat: null,
    lng: null,
    amenities: [],
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    }));
    
    // Debounce to prevent rapid API calls
    if (get().fetchTimeout) clearTimeout(get().fetchTimeout);
    const timeout = setTimeout(() => get().fetchProperties(), 300);
    set({ fetchTimeout: timeout });
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    
    if (get().fetchTimeout) clearTimeout(get().fetchTimeout);
    const timeout = setTimeout(() => get().fetchProperties(), 300);
    set({ fetchTimeout: timeout });
  },

  fetchProperties: async () => {
    const { bounds, minRent, maxRent, bhkType, city, radius, lat, lng, amenities } = get().filters;
    
    // We need either bounds OR (lat/lng/radius) to fetch. 
    // This allows discovery mode (bounds) and intent mode (radius around pin)
    if (!bounds && !(lat && lng)) {
      set({ properties: [] }); 
      return;
    }

    set({ loading: true });
    try {
      const res = await api.get('/properties', {
        params: { 
          // Prioritize high-intent radius search (Lat/Lng) over discovery mode (Bounds)
          lat: (lat && lng) ? lat : undefined,
          lng: (lat && lng) ? lng : undefined,
          radius: (lat && lng) ? radius : undefined,
          bounds: !(lat && lng) ? bounds : undefined,
          minRent: minRent || undefined,
          maxRent: maxRent === 200000 ? undefined : maxRent, 
          bhkType: bhkType === 'All' ? undefined : bhkType,
          city: city === 'All' ? undefined : city,
          amenities: amenities.length > 0 ? amenities.join(',') : undefined
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
