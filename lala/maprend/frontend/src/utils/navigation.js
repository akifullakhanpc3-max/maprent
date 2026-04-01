import axios from 'axios'
import polyline from '@mapbox/polyline'

let currentMapInstance = null

export const setMapInstance = (map) => {
  currentMapInstance = map
}

export const clearRoute = () => {
  if (currentMapInstance) {
    currentMapInstance.eachLayer((layer) => {
      if (layer instanceof L.Polyline && layer.options.color === 'blue') {
        currentMapInstance.removeLayer(layer)
      }
    })
  }
}

export const navigateToProperty = async (property) => {
  try {
    if (!navigator.geolocation) {
      alert('Geolocation not supported')
      return
    }

    // Get current user location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude
      const userLng = position.coords.longitude
      const propertyLat = property.location.coordinates[1]
      const propertyLng = property.location.coordinates[0]

      // Fetch route from backend
      const { data } = await axios.get('/api/navigation', {
        params: {
          from_lat: userLat,
          from_lng: userLng,
          to_lat: propertyLat,
          to_lng: propertyLng
        }
      })

      // Decode polyline geometry
      const decoded = polyline.decode(data.geometry)
      
      // Clear previous route
      clearRoute()

      // Add new route
      L.polyline(decoded, { color: 'blue', weight: 6, opacity: 0.8 }).addTo(currentMapInstance)

      // Fit map to route bounds
      currentMapInstance.fitBounds(L.latLngBounds(decoded))

      // Show route info (could be sidebar)
      console.log('Route:', data.distance.toFixed(1) + 'km', Math.round(data.duration) + 'min')

    }, (error) => {
      alert('Could not get your location: ' + error.message)
    }, { enableHighAccuracy: true })

  } catch (error) {
    console.error('Navigation error:', error)
    alert('Navigation failed. Please try again.')
  }
}

