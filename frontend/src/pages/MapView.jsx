import { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, Search, Navigation, Filter, X, ChevronRight, Navigation2, Map as MapIcon, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import MapSearchBar from '../components/MapSearchBar';
import PropertyFormModal from '../components/PropertyFormModal';
import FilterPanel from '../components/FilterPanel';
import PropertyListPane from '../components/PropertyListPane';
import NavigationPanel from '../components/NavigationPanel';
import 'leaflet/dist/leaflet.css';
import '../styles/pages/MapView.css';


// Leaflet radius auto-fitter
function AutoFitCircle({ lat, lng, radius }) {
  const map = useMap();
  useEffect(() => {
    if (radius && lat && lng) {
      const latLng = L.latLng([lat, lng]);
      const bounds = latLng.toBounds(radius * 1000);
      
      const currentBounds = map.getBounds();
      if (!currentBounds.contains(bounds)) {
        map.fitBounds(bounds, { padding: [20, 20], animate: true });
      }
    }
  }, [lat, lng, radius, map]);
  return null;
}

// Leaflet layout fix for React mount and visibility changes
function MapFixer({ showMap }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timers = [100, 300, 500].map(ms => setTimeout(() => map.invalidateSize(), ms));
    return () => timers.forEach(t => clearTimeout(t));
  }, [map, showMap]);
  return null;
}

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Red Icon for Search Anchor
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map move/zoom/click events
function MapEventsHandler({ onMapClick }) {
  const { setFilter, filters } = usePropertyStore();
  const map = useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      const stringBounds = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      // Prevent redundant updates if bounds haven't changed
      if (filters.bounds !== stringBounds) {
        setFilter('bounds', stringBounds);
      }
    },
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const { properties, filters, loading, setFilter } = usePropertyStore();
  const { user } = useAuthStore();
  const mapRef = useRef(null);
  const lastScrollTop = useRef(0);

  const [searchAnchor, setSearchAnchor] = useState(null); 
  const [showMap, setShowMap] = useState(true);

  const handlePaneScroll = useCallback((scrollTop) => {
    if (window.innerWidth > 768) return; 

    // Scrolled down past threshold -> hide map (focus on listings)
    if (scrollTop > 100 && properties.length > 0) {
      setShowMap(false);
    } 
    // RESTORE Map when back at the very top (intentional)
    else if (scrollTop <= 10) {
      setShowMap(true);
    }

    lastScrollTop.current = scrollTop;
  }, [properties.length]);

  const handleLocationSelect = useCallback((coords, name) => {
    if (mapRef.current && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
       // Search bar now ONLY moves map, it does not reset radius or anchor
       // This fulfills "The radius moves when I search; it should not."
       mapRef.current.flyTo(coords, 14);
    }
  }, []);

  const handleMapClick = useCallback((coords) => {
    setSearchAnchor(coords);
    setFilter('lat', coords[0]);
    setFilter('lng', coords[1]);
  }, [setFilter]);

  const handleShowRoute = useCallback(async (property) => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const start = [center.lng, center.lat];
    const end = [property.location.coordinates[0], property.location.coordinates[1]];

    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteData({
          coordinates,
          propertyTitle: property.title,
          distance: route.distance,
          duration: route.duration,
          steps: route.legs?.[0]?.steps || []
        });
        setIsNavigating(true);
      }
    } catch (err) {
      console.error('Routing error:', err);
    }
  }, []);

  // Called by NavigationPanel when user picks a custom start or end location
  const handleSearchRoute = useCallback(async (startCoords, endCoords) => {
    if (!routeData) return;
    // Use provided coords or fall back to current route endpoints
    const currentStart = routeData.coordinates?.[0];
    const currentEnd = routeData.coordinates?.[routeData.coordinates.length - 1];

    const from = startCoords
      ? [startCoords[1], startCoords[0]]   // [lat,lng] → [lng,lat] for OSRM
      : currentStart ? [currentStart[1], currentStart[0]] : null;
    const to = endCoords
      ? [endCoords[1], endCoords[0]]
      : currentEnd ? [currentEnd[1], currentEnd[0]] : null;

    if (!from || !to) return;
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteData(prev => ({
          ...prev,
          coordinates,
          distance: route.distance,
          duration: route.duration,
          steps: route.legs?.[0]?.steps || []
        }));
      }
    } catch (err) {
      console.error('Re-routing error:', err);
    }
  }, [routeData]);

  const handleLocate = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('No geolocation')); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          if (mapRef.current) mapRef.current.flyTo(coords, 14);
          resolve(coords);
        },
        reject
      );
    });
  }, []);

  // Synchronize local searchAnchor state with store filters
  useEffect(() => {
    if (filters.lat && filters.lng) {
      setSearchAnchor([filters.lat, filters.lng]);
    } else {
      setSearchAnchor(null);
    }
  }, [filters.lat, filters.lng]);

  const activeFiltersCount = Object.keys(filters).filter(k => filters[k] !== 'All' && filters[k] !== null && k !== 'bounds').length;

  useEffect(() => {
    if (showMap && mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [showMap]);

  return (
    <div className="map-view-container animate-fade-in">
      {/* Map Segment */}
      <div className={`map-content-wrapper ${!showMap ? 'hidden' : ''}`}>
        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={12} 
          className="leaflet-container-override"
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFixer showMap={showMap} />
          <MapEventsHandler onMapClick={handleMapClick} />

          {searchAnchor && !selectedProperty && (
            <Marker position={searchAnchor} icon={redIcon}>
              <Popup className="discovery-popup">
                <div className="flex-col gap-3 min-w-[200px]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Location</p>
                  <div className="flex-row gap-2 py-2 border-y border-slate-100">
                     <LocateFixed size={14} className="text-accent-blue" />
                     <span className="text-xs font-bold text-slate-700">Ready for Search or Listing</span>
                  </div>
                  {user && (user.role === 'owner' || user.role === 'admin') && (
                    <button 
                      onClick={() => setIsPropertyModalOpen(true)}
                      className="btn btn-cta !w-full !py-2.5 !text-[11px] uppercase tracking-widest font-bold"
                    >
                      <MapPin size={12} className="mr-2" />
                      List Property Here
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {(filters.radius && filters.lat && filters.lng) && (
            <>
              <Circle 
                center={[filters.lat, filters.lng]} 
                radius={filters.radius * 1000} 
                pathOptions={{ 
                  color: 'var(--accent-blue)', 
                  fillColor: 'var(--accent-blue)', 
                  fillOpacity: 0.1,
                  weight: 3,
                  dashArray: '5, 10'
                }} 
              />
              <AutoFitCircle lat={filters.lat} lng={filters.lng} radius={filters.radius} />
            </>
          )}

          {routeData && (
            <Polyline 
              positions={routeData.coordinates}
              color="var(--primary-color)"
              weight={4}
              opacity={0.8}
            />
          )}

          {properties.map(property => (
            <Marker 
              key={property._id} 
              position={[property.location.coordinates[1], property.location.coordinates[0]]}
              eventHandlers={{
                click: () => setSelectedProperty(property)
              }}
            >
              <Popup keepInView={true} minWidth={240}>
                <div className="flex-col gap-3">
                  <h4 className="popup-title">{property.title}</h4>
                  <div className="popup-price-row">
                    <p className="popup-price">₹{property.rent.toLocaleString()}</p>
                    <span className="badge !bg-surface !border-subtle !text-[9px]">{property.bhkType}</span>
                  </div>
                  <button 
                    onClick={() => handleShowRoute(property)}
                    className="btn btn-primary !w-full !py-2.5 !text-[11px] uppercase tracking-widest font-bold"
                  >
                    <Navigation2 size={12} className="mr-2" />
                    Get Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Header Overlay */}
        {!isFilterOpen && (
          <div className="map-discovery-unified-bar glass-panel animate-fade-in shadow-premium !w-auto !max-w-[400px]">
             <div className="search-input-section">
                <MapSearchBar onSearch={handleLocationSelect} />
             </div>
             
             {/* Cancel Radius Button — RED */}
             {filters.lat && filters.lng && (
               <button
                 className="map-cancel-radius-btn discovery-radius-cancel-btn !text-red-500 !border-red-500/30"
                 title="Cancel Radius"
                 onClick={() => {
                   setFilter('lat', null);
                   setFilter('lng', null);
                   setSearchAnchor(null);
                 }}
               >
                 X
               </button>
             )}
          </div>
        )}


        <div className="map-floating-controls">
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="map-control-btn"
             title="Adjust Search Parameters"
           >
             <Filter size={20} />
             {activeFiltersCount > 0 && <span className="control-badge">{activeFiltersCount}</span>}
           </button>
           <button 
             onClick={() => {
                if (navigator.geolocation && mapRef.current) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 14);
                  });
                }
             }}
             className="map-control-btn"
             title="Current Location"
           >
             <LocateFixed size={20} />
           </button>
        </div>
      </div>

      <div className="discovery-pane-wrapper">
         {isNavigating ? (
            <NavigationPanel 
              routeData={routeData} 
              onClear={() => { setIsNavigating(false); setRouteData(null); }} 
              propertyTitle={routeData.propertyTitle}
              onSearchRoute={handleSearchRoute}
              selectedProperty={selectedProperty}
              onLocate={handleLocate}
              isRouting={false}
            />
         ) : (
            <PropertyListPane 
              selectedProperty={selectedProperty} 
              setSelectedProperty={setSelectedProperty} 
              onShowRoute={handleShowRoute}
              onScroll={handlePaneScroll}
            />
         )}
      </div>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      
      <PropertyFormModal 
         isOpen={isPropertyModalOpen} 
         onClose={() => setIsPropertyModalOpen(false)} 
         refresh={() => setFilter('bounds', `${mapRef.current.getBounds().getWest()},${mapRef.current.getBounds().getSouth()},${mapRef.current.getBounds().getEast()},${mapRef.current.getBounds().getNorth()}`)}
         initialCoords={searchAnchor}
      />
    </div>
  );
}
