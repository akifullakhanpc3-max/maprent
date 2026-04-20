import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapPin, Search, Navigation, Filter, X, ChevronRight, Navigation2, Map as MapIcon, LocateFixed, Layers, LayoutGrid, Target, RotateCcw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import MapSearchBar from '../components/MapSearchBar';
import FilterPanel from '../components/FilterPanel';
import PropertyListPane from '../components/PropertyListPane';
import NavigationPanel from '../components/NavigationPanel';
import PropertyDetailsOverlay from '../components/PropertyDetailsOverlay';
import 'leaflet/dist/leaflet.css';
import '../styles/pages/MapView.css';

// Tile Providers for road visualization
// Professional-Grade Tile Providers (Google Maps–like Density)
const TILE_PROVIDERS = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 18,
    maxZoom: 20
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
    maxNativeZoom: 18,
    maxZoom: 20
  }
};

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

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Premium Pulse Icon for Search Anchor
const redIcon = L.divIcon({
  className: 'search-anchor-wrapper',
  html: `
    <div class="search-anchor-pulse is-primary">
      <div class="search-anchor-dot is-primary"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Dynamic cursor logic for radius boundary detection
function RadiusCursorHandler({ searchAnchor, radius }) {
  const map = useMapEvents({
    mousemove(e) {
      if (!searchAnchor || !radius) {
        map.getContainer().classList.remove('cursor-inside');
        map.getContainer().classList.add('cursor-outside');
        return;
      }
      const distance = e.latlng.distanceTo(L.latLng(searchAnchor));
      const isInside = distance <= radius * 1000;
      const container = map.getContainer();

      if (isInside) {
        container.classList.add('cursor-inside');
        container.classList.remove('cursor-outside');
      } else {
        container.classList.add('cursor-outside');
        container.classList.remove('cursor-inside');
      }
    },
    mouseout() {
      map.getContainer().classList.remove('cursor-inside', 'cursor-outside');
    }
  });
  return null;
}

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
      }, 400);
    },
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });

  return null;
}

// Price Pin Icon Generator
const createPriceIcon = (price, bhkType, isActive = false) => {
  let formattedPrice = 'N/A';
  if (price !== undefined && price !== null && price > 0) {
    if (price >= 100000) {
      formattedPrice = `₹${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      formattedPrice = `₹${(price / 1000).toFixed(0)}k`;
    } else {
      formattedPrice = `₹${price}`;
    }
  }

  // Shorten BHK for pin (e.g., "2 BHK" -> "2B")
  const shortBhk = bhkType ? bhkType.replace(/\s*BHK/i, 'B') : '';

  return L.divIcon({
    className: 'custom-price-pin',
    html: `
      <div class="price-pin-wrapper ${isActive ? 'is-active' : ''}">
        ${shortBhk ? `<span class="pin-bhk-tag">${shortBhk}</span>` : ''}
        <span class="price-text">${formattedPrice}</span>
        <div class="price-pin-tail"></div>
      </div>
    `,
    iconSize: [64, 38], // Increased width slightly for BHK tag
    iconAnchor: [32, 38],
  });
};

// Custom Price Marker Component
const PriceMarker = React.memo(({ property, isActive, onClick }) => {
  return (
    <Marker
      position={[property.location.coordinates[1], property.location.coordinates[0]]}
      icon={createPriceIcon(property.price, property.bhkType, isActive)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={isActive ? 1000 : 0}
    />
  );
}, (prev, next) => prev.property._id === next.property._id && prev.isActive === next.isActive);

export default function MapView() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewStyle, setViewStyle] = useState('streets');
  const [isGridView, setIsGridView] = useState(false);
  const { properties, filters, loading, setFilter, setFilters } = usePropertyStore();
  const { user } = useAuthStore();
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [searchAnchor, setSearchAnchor] = useState(null);

  // Hook to track map bounds for search bias
  const MapBoundsTracker = () => {
    const map = useMap();
    useEffect(() => {
      const updateBounds = () => {
        const b = map.getBounds();
        setCurrentBounds(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`);
      };
      map.on('moveend', updateBounds);
      updateBounds(); // Initial set
      return () => map.off('moveend', updateBounds);
    }, [map]);
    return null;
  };

  const handleLocationSelect = useCallback((coords, name) => {
    if (mapRef.current && Array.isArray(coords)) {
      mapRef.current.flyTo(coords, 14, { duration: 1.5 });
    }
  }, []);

  const handleSidebarScroll = (e) => {
    // Legacy height reactive logic removed for fixed 100vh layout
  };

  const handleMapClick = useCallback((coords) => {
    setSelectedProperty(null);
    setHighlightedId(null);
    setIsNavigating(false);
    setRouteData(null);
    setSearchAnchor(coords);
    setFilters({ lat: coords[0], lng: coords[1] });
  }, [setFilters]);

  const handleShowRoute = useCallback(async (property) => {
    if (!mapRef.current) return;

    // Guard: if property has no coordinates, fall back to Google Maps directions
    const coords = property?.location?.coordinates;
    if (!Array.isArray(coords) || coords[0] == null || coords[1] == null) {
      const destination = property.city || property.title || 'property';
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
        '_blank'
      );
      return;
    }

    const center = mapRef.current.getCenter();
    const start = [center.lng, center.lat];
    const end = [coords[0], coords[1]]; // GeoJSON: [lng, lat]

    try {
      // Correct OSRM public endpoint: route/v1 (not base/v1)
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteData({
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
          propertyTitle: property.title,
          distance: route.distance,
          duration: route.duration,
          steps: route.legs?.[0]?.steps || []
        });
        setIsNavigating(true);
      } else {
        // OSRM returned no route — fall back to Google Maps
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`,
          '_blank'
        );
      }
    } catch (err) {
      console.error('Routing error:', err);
      // Network failure — fall back to Google Maps
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`,
        '_blank'
      );
    }
  }, []);

  const handleSearchArea = () => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    setFilters({
      bounds: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
      lat: null,
      lng: null
    });
  };

  const handleRadiusSearch = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setFilters({
      lat: center.lat,
      lng: center.lng,
      bounds: null,
      radius: filters.radius || 5
    });
    setSearchAnchor([center.lat, center.lng]);
  };

  // 1. Discover all properties by default on mount
  useEffect(() => {
    // Small delay to ensure map is ready
    const timer = setTimeout(() => {
      handleSearchArea();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (filters.lat && filters.lng) {
      setSearchAnchor([filters.lat, filters.lng]);
    } else {
      setSearchAnchor(null);
    }
  }, [filters.lat, filters.lng]);

  const handleLocateMe = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation not supported by this browser.');
        alert(err.message);
        reject(err);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const userCoords = [lat, lng];

          // 1. Move the map
          if (mapRef.current) {
            mapRef.current.flyTo(userCoords, 15, { duration: 1.5 });
          }

          // 2. Update Discovery Context (Filters + Anchor)
          setSearchAnchor(userCoords);
          setFilters({ lat, lng, bounds: null }); // Clear bounds to prioritize radius search

          // 3. Re-run route from user location to current property destination (if navigating)
          if (routeData?.coordinates?.length) {
            const dest = routeData.coordinates[routeData.coordinates.length - 1];
            const startStr = `${lng},${lat}`;
            const endStr = `${dest[1]},${dest[0]}`; // convert back from [lat,lng] to [lng,lat] for OSRM
            fetch(`https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson&steps=true`)
              .then(r => r.json())
              .then(data => {
                if (data.routes?.[0]) {
                  const route = data.routes[0];
                  setRouteData(prev => ({
                    ...prev,
                    coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
                    distance: route.distance,
                    duration: route.duration,
                    steps: route.legs?.[0]?.steps || []
                  }));
                }
              })
              .catch(console.error);
          }
          resolve(userCoords);
        },
        (err) => {
          let msg = 'Unable to retrieve your location.';
          if (err.code === 1) msg = 'Location access denied. Please enable permissions in your browser.';
          else if (err.code === 3) msg = 'Location request timed out. Please try again.';
          alert(msg);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, [routeData, setFilters]);

  const handleSearchRoute = useCallback(async (startCoords, endCoords) => {
    // startCoords or endCoords may be null (only one end is being updated)
    const currentDest = routeData?.coordinates?.[routeData.coordinates.length - 1];
    const currentStart = routeData?.coordinates?.[0];

    // [lat, lng] from Nominatim → convert to OSRM [lng, lat]
    const start = startCoords
      ? [startCoords[1], startCoords[0]]
      : currentStart ? [currentStart[1], currentStart[0]] : null;
    const end = endCoords
      ? [endCoords[1], endCoords[0]]
      : currentDest ? [currentDest[1], currentDest[0]] : null;

    if (!start || !end) return;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteData(prev => ({
          ...prev,
          coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
          distance: route.distance,
          duration: route.duration,
          steps: route.legs?.[0]?.steps || []
        }));
        // Fly map to fit the new route
        if (mapRef.current && route.geometry.coordinates.length > 0) {
          const latlngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
          mapRef.current.fitBounds(latlngs, { padding: [40, 40], animate: true });
        }
      }
    } catch (err) {
      console.error('Search route error:', err);
    }
  }, [routeData]);

  const circleOptions = useMemo(() => ({
    color: '#2563eb',      // Aggressive Primary Blue
    weight: 3,             // Thicker line for visibility
    opacity: 0.8,          // High visibility stroke
    fillColor: '#2563eb',
    fillOpacity: 0.12,     // Visible but transparent fill
    stroke: true           // Explicitly enable stroke
  }), []);

  return (
    <div className={`map-dashboard-layout animate-fade-in ${isGridView ? 'is-grid-active' : ''}`}>
      <aside className={`sidebar-discovery-pane ${isGridView ? 'full-grid-view' : ''}`}>
        <div className="sidebar-header-glow flex-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary-color rounded-full" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Discovery Engine</h2>
          </div>
          <button
            onClick={() => setIsGridView(!isGridView)}
            className={`btn btn-secondary !p-2 rounded-xl ${isGridView ? 'is-active' : ''}`}
            title={isGridView ? "Switch to Sidebar" : "Switch to Grid View"}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="sidebar-content-scroll custom-scrollbar" onScroll={handleSidebarScroll} ref={sidebarRef}>
          {isNavigating ? (
            <NavigationPanel
              routeData={routeData}
              onClear={() => { setIsNavigating(false); setRouteData(null); }}
              propertyTitle={routeData.propertyTitle}
              selectedProperty={selectedProperty}
              onLocate={handleLocateMe}
              onSearchRoute={handleSearchRoute}
            />
          ) : (
            <PropertyListPane
              selectedProperty={selectedProperty}
              setSelectedProperty={setSelectedProperty}
              highlightedId={highlightedId}
              setHighlightedId={setHighlightedId}
              onShowRoute={handleShowRoute}
              onSearchArea={handleSearchArea}
            />
          )}
        </div>
      </aside>

      <main className="map-main-viewport">
        <MapContainer
          center={[12.2958, 76.6394]}
          zoom={12}
          className="luxury-leaflet-map"
          ref={mapRef}
          zoomControl={false}
          minZoom={3}
          maxZoom={20}
          zoomAnimation={true}
          fadeAnimation={true}
          markerZoomAnimation={true}
          updateWhenIdle={true}
        >
          <TileLayer
            attribution={TILE_PROVIDERS[viewStyle].attribution}
            url={TILE_PROVIDERS[viewStyle].url}
            maxNativeZoom={TILE_PROVIDERS[viewStyle].maxNativeZoom}
            maxZoom={TILE_PROVIDERS[viewStyle].maxZoom}
          />
          <MapBoundsTracker />
          <MapEventsHandler onMapClick={handleMapClick} />
          <RadiusCursorHandler searchAnchor={searchAnchor} radius={filters.radius} />

          {searchAnchor && !selectedProperty && (
            <Marker position={searchAnchor} icon={redIcon}>
              <Popup className="premium-discovery-popup">
                <div className="flex-col gap-3 min-w-[200px]">
                  <p className="label-base !mb-0 text-slate-400">Target Area</p>
                  <button
                    onClick={() => setFilters({ lat: null, lng: null })}
                    className="btn btn-ghost !border-slate-200 !text-xs w-full"
                  >
                    Clear Selection
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {(filters.radius && searchAnchor) && (
            <>
              <Circle
                center={searchAnchor}
                radius={filters.radius * 1000}
                pathOptions={circleOptions}
              />
              <AutoFitCircle lat={searchAnchor[0]} lng={searchAnchor[1]} radius={filters.radius} />
            </>
          )}

          {routeData && <Polyline positions={routeData.coordinates} color="var(--primary-color)" weight={5} opacity={0.8} />}

          {useMemo(() => properties.map(property => (
            <PriceMarker
              key={property._id}
              property={property}
              isActive={highlightedId === property._id || selectedProperty?._id === property._id}
              onClick={() => {
                setHighlightedId(property._id);
                setSelectedProperty(property);
                // On mobile, the entire page scrolls naturally, so we rely on the card's scrollIntoView below
                const card = document.getElementById(`property-card-${property._id}`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          )), [properties, highlightedId, selectedProperty])}
        </MapContainer>

        {/* Floating Controls */}
        <div className="map-overlay-center-top">
          {/* <button onClick={handleSearchArea} className="search-area-btn shadow-premium">
            <Search size={14} />
            <span>Discover All Properties</span>
          </button> */}
          <MapSearchBar onSearch={handleLocationSelect} currentBounds={currentBounds} />
          <button
            onClick={() => setIsFilterOpen(true)}
            className="search-filter-quick-btn shadow-premium"
            title="Open Filters"
          >
            <Filter size={20} />
          </button>
        </div>

        <div className="map-overlay-zoom-controls">
          <div className="zoom-controls-stack shadow-premium">
            <button
              onClick={() => setViewStyle(prev => prev === 'streets' ? 'satellite' : 'streets')}
              className="zoom-btn"
              title="Toggle Base Map"
            >
              <Layers size={18} />
            </button>
            <div className="zoom-divider" />
            <button onClick={handleLocateMe} className="zoom-btn" title="Locate Me">
              <LocateFixed size={18} />
            </button>
            <div className="zoom-divider" />
            <button onClick={handleRadiusSearch} className="zoom-btn" title="Radius Search (Center)">
              <Target size={18} />
            </button>
            <div className="zoom-divider" />
            {(filters.lat || filters.lng) && (
              <>
                <button
                  onClick={() => {
                    setFilters({ lat: null, lng: null, bounds: null });
                    setSearchAnchor(null);
                    // Re-trigger global discovery
                    handleSearchArea();
                  }}
                  className="zoom-btn text-error-color"
                  title="Clear Radius Search"
                >
                  <RotateCcw size={18} />
                </button>
                <div className="zoom-divider" />
              </>
            )}
            <button onClick={() => mapRef.current?.zoomIn()} className="zoom-btn">＋</button>
            <div className="zoom-divider" />
            <button onClick={() => mapRef.current?.zoomOut()} className="zoom-btn">－</button>
            <div className="zoom-divider" />
          </div>
        </div>
      </main>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {selectedProperty && (
        <PropertyDetailsOverlay
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onShowRoute={(p) => {
            setSelectedProperty(null);
            handleShowRoute(p);
          }}
        />
      )}
    </div>
  );
}
