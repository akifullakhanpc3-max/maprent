import { create } from 'zustand'
import axios from 'axios'

const usePropertyStore = create((set, get) => ({
  properties: [],
  isLoading: false,
  filters: {
    minRent: '',
    maxRent: '',
    bhkType: ''
  },
  mapBounds: null,

  setFilters: (filters) => set({ filters }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),

  fetchProperties: async (bounds = null) => {
    set({ isLoading: true })
    try {
      const params = { ...get().filters }
      if (bounds) {
        params.ne_lat = bounds._northEast.lat
        params.ne_lng = bounds._northEast.lng
        params.sw_lat = bounds._southWest.lat
        params.sw_lng = bounds._southWest.lng
      }
      const { data } = await axios.get('/api/properties', { params })
      set({ properties: data })
    } catch (error) {
      console.error(error)
    } finally {
      set({ isLoading: false })
    }
  }
}))

export default usePropertyStore

