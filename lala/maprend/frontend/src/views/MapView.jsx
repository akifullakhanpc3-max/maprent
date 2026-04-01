import { useEffect, useCallback } from 'react'
import { setMapInstance, navigateToProperty } from '@/utils/navigation'
import '../utils/navigation.js'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import usePropertyStore from '@/stores/usePropertyStore'
import PropertyPopup from '@/components/PropertyPopup'
import PropertyFilters from '@/components/PropertyFilters'
import PropertyList from '@/components/PropertyList'
import Navbar from '@/components/Navbar'
import { MapPin, Filter, Search, Navigation } from 'lucide-react'
// polyline import will be available after npm install @mapbox/polyline
import { useState } from 'react'
import { Polyline } from 'react-leaflet'
import useAuthStore from '@/stores/useAuthStore'
import axios from 'axios'

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapView() {
  const { properties, isLoading, fetchProperties, setMapBounds } = usePropertyStore()
  const [position, setPosition] = useState([20.5937, 78.9629]) // India center
const [map, setMap] = useState(null)
  const [currentRoute, setCurrentRoute] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const authStore = useAuthStore()

  // Navigation setup
  useEffect(() => {
    if (map) {
      window.setMapInstance = (m) => setMapInstance(m)
      window.navigateToProperty = navigateToProperty
    }
  }, [map])

// Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude]
        setPosition(loc)
        setUserLocation(loc)
      },
      () => {}, 
      { enableHighAccuracy: true }
    )
  }, [])

  // Fetch properties on bounds change
  const handleMapMoveEnd = useCallback(() => {
    if (map) {
      const bounds = map.getBounds()
      setMapBounds(bounds)
      fetchProperties(bounds)
    }
  }, [map, fetchProperties, setMapBounds])

  // Map event handler
  function LocationMarker() {
    useMapEvents({
      moveend: handleMapMoveEnd,
      load: handleMapMoveEnd
    })
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-white/80 backdrop-blur-md border-r border-gray-200 lg:flex flex-col hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                MapRent
              </h1>
            </div>
            <PropertyFilters />
          </div>
          <PropertyList properties={properties} isLoading={isLoading} />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={position}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(m) => {
              setMap(m)
              window.mapInstance = m
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            
{properties.map((property) => (
              <Marker 
                key={property._id}
                position={property.location.coordinates.reverse()}
              >
                <Popup>
                  <PropertyPopup property={property} />
                </Popup>
              </Marker>
            ))}
            {currentRoute && (
              <Polyline positions={currentRoute} color="blue" weight={5} opacity={0.8} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

export default MapView

