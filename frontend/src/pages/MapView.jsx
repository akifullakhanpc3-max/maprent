import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

// Memoized Property Marker to prevent un-necessary map re-renders
const PropertyMarker = React.memo(({ property, onClick, onShowRoute }) => {
  const map = useMap();

  return (
    <Marker
      position={[property.location.coordinates[1], property.location.coordinates[0]]}
      eventHandlers={{ click: onClick }}
    >
      <Popup keepInView={true} minWidth={240}>
        <div className="flex-col gap-3">
          <h4 className="popup-title">{property.title}</h4>
          <div className="popup-price-row">
            <p className="popup-price">₹{property.rent.toLocaleString()}</p>
            <span className="badge !bg-surface !border-subtle !text-[9px]">{property.bhkType}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onShowRoute(property)}
              className="btn btn-primary flex-1 !py-2.5 !text-[11px] uppercase tracking-widest font-bold"
            >
              <Navigation2 size={12} className="mr-2" />
              Directions
            </button>
            <button
              onClick={() => map.closePopup()}
              className="btn btn-ghost !border !border-slate-200 !px-4 !text-[10px] uppercase font-bold tracking-tight"
              title="Close Popup"
            >
              Close
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}, (prev, next) => prev.property._id === next.property._id);

// Component to handle map move/zoom/click events
function MapEventsHandler({ onMapClick }) {
  const { setFilter, filters } = usePropertyStore();
  const moveEndTimeout = useRef(null);

  const map = useMapEvents({
    moveend() {
      if (moveEndTimeout.current) clearTimeout(moveEndTimeout.current);

      moveEndTimeout.current = setTimeout(() => {
        const bounds = map.getBounds();
        const stringBounds = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        if (filters.bounds !== stringBounds) {
          setFilter('bounds', stringBounds);
        }
      }, 400); // 400ms debounce for panning
    },
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });

  useEffect(() => {
    return () => {
      if (moveEndTimeout.current) clearTimeout(moveEndTimeout.current);
    };
  }, []);

  return null;
}

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const { properties, filters, loading, setFilter, setFilters } = usePropertyStore();
  const { user } = useAuthStore();
  const mapRef = useRef(null);
  const lastScrollTop = useRef(0);

  const [searchAnchor, setSearchAnchor] = useState(null);

  const handleLocationSelect = useCallback((coords, name) => {
    if (mapRef.current && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      // Search bar now ONLY moves map, it does not reset radius or anchor
      // This fulfills "The radius moves when I search; it should not."
      mapRef.current.flyTo(coords, 14);
    }
  }, []);

  const handleMapClick = useCallback((coords) => {
    // Switch focus back to Listings View by closing index panel and navigation
    setSelectedProperty(null);
    setIsNavigating(false);
    setRouteData(null);

    // Update Proximity Search with atomic filters
    setSearchAnchor(coords);
    setFilters({ lat: coords[0], lng: coords[1] });
  }, [setSelectedProperty, setIsNavigating, setRouteData, setFilters]);

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

  const circleOptions = useMemo(() => ({
    color: 'var(--accent-blue)',
    fillColor: 'var(--accent-blue)',
    fillOpacity: 0.1,
    weight: 3,
    dashArray: '5, 10'
  }), []);

  return (
    <div className="map-view-container animate-fade-in">
      {/* Natural Scroll Layout - Map Top, List Below */}
      <div className="map-content-wrapper">
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
                  <div className="flex gap-2 w-full">
                    {user && (user.role === 'owner' || user.role === 'admin') && (
                      <button
                        onClick={() => setIsPropertyModalOpen(true)}
                        className="btn btn-cta flex-1 !py-2.5 !text-[11px] uppercase tracking-widest font-bold"
                      >
                        <MapPin size={12} className="mr-2" />
                        List Property
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setFilters({ lat: null, lng: null });
                        mapRef.current?.closePopup();
                      }}
                      className="btn btn-ghost !border !border-slate-200 !px-4 !text-[10px] uppercase font-bold tracking-tight"
                      title="Clear Search Radius"
                    >
                      Clear Section
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {(filters.radius && filters.lat && filters.lng) && (
            <>
              <Circle
                center={[filters.lat, filters.lng]}
                radius={filters.radius * 1000}
                pathOptions={circleOptions}
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

          {useMemo(() => properties.map(property => (
            <PropertyMarker
              key={property._id}
              property={property}
              onClick={() => setSelectedProperty(property)}
              onShowRoute={handleShowRoute}
            />
          )), [properties, setSelectedProperty, handleShowRoute])}
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
                  setFilters({ lat: null, lng: null });
                  setSearchAnchor(null);
                }}
              >
                Close
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
            isFluid={true}
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
