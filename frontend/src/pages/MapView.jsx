import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Filter, LocateFixed, Layers, Target, RotateCcw
} from 'lucide-react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Polyline, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import MapSearchBar from '../components/MapSearchBar';
import FilterPanel from '../components/FilterPanel';
import PropertyListPane from '../components/PropertyListPane';
import BookingFormModal from '../components/BookingFormModal';
import PropertyDetailsOverlay from '../components/PropertyDetailsOverlay';
import MapCursor from '../components/MapCursor';
import '../styles/pages/MapView.css';

// ─── Config ───────────────────────────────────────────────────────────────────
const DEFAULT_CENTER = [12.2958, 76.6394]; // Mysore [lat, lng]
const VOYAGER_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



  
// ─── Map Controller (Isolated to prevent parent re-renders) ───────────────────
function MapController({ map, setMap, setCurrentBounds, filters, setFilter, setFilters }) {
  const mapInstance = useMap();
  const { filters: storeFilters } = usePropertyStore(); // Extra check if needed
  
  useEffect(() => {
    if (!map) {
      setMap(mapInstance);
      setFilters({ lat: null, lng: null, bounds: null, radius: 5 });
    }
  }, [mapInstance, map, setMap, setFilters]);

  useMapEvents({
    moveend: () => {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const str = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
      setCurrentBounds(str);
      if (!storeFilters.lat || !storeFilters.lng) setFilter('bounds', str);
    },
    click: (e) => {
      const { lat, lng } = e.latlng;
      setFilters({ lat, lng, bounds: null, radius: storeFilters.radius || 5 });
    }
  });

  return null;
}

// ─── Animated Radius Circle (Isolated performance) ───────────────────────────
const AnimatedRadiusCircle = React.memo(({ searchAnchor, radius, onReset, resetPosition, resetIcon }) => {
  const [rippleProgress, setRippleProgress] = useState(0);
  
  useEffect(() => {
    let start = performance.now();
    const CYCLE = 2800;
    let animFrame;

    const tick = (ts) => {
      let elapsed = ts - start;
      if (elapsed > CYCLE) { start = ts; elapsed = 0; }
      setRippleProgress(elapsed / CYCLE);
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <>
      <Circle
        center={searchAnchor}
        radius={(radius * 1000) * (1 + 0.15 * (1 - Math.pow(1 - rippleProgress, 3)))}
        pathOptions={{
          color: '#60a5fa',
          fillOpacity: 0,
          opacity: 0.6,
          weight: Math.max(1, 12 * (1 - rippleProgress)),
          interactive: false
        }}
      />
      <Circle
        center={searchAnchor}
        radius={radius * 1000}
        pathOptions={{
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 4,
          interactive: false
        }}
      />
      <Marker 
        position={resetPosition || searchAnchor} 
        icon={resetIcon} 
        eventHandlers={{ 
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onReset();
          } 
        }}
      />
    </>
  );
});

// ─── Utility: Price Markers Creation ──────────────────────────────────────────
const createPriceIcon = (property, isActive) => {
  const price = property.price;
  let formattedPrice = 'N/A';
  if (price > 0) {
    formattedPrice = price >= 100000 ? `₹${(price / 100000).toFixed(1)}L`
                   : price >= 1000   ? `₹${(price / 1000).toFixed(0)}k`
                   : `₹${price}`;
  }

  const html = `
    <div class="price-pin-wrapper ${isActive ? 'is-active' : ''}">
      ${property.bhkType ? `<span class="pin-bhk-tag">${property.bhkType.toUpperCase()}</span>` : ''}
      <span class="price-text">${formattedPrice}</span>
      <div class="price-pin-tail"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-price-pin',
    html: html,
    iconSize: [120, 40],
    iconAnchor: [60, 40]
  });
};


// ─── Main Component ────────────────────────────────────────────────────────────
export default function MapView() {
  const { properties, filters, loading, setFilter, setFilters, fetchPropertyById } = usePropertyStore();
  const { user } = useAuthStore();
  const { search } = useLocation();

  // ── Map instance ──
  const [map, setMap] = useState(null);

  // ── UI state ──
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [highlightedId, setHighlightedId]       = useState(null);
  const [routeData, setRouteData]               = useState(null);
  const [isNavigating, setIsNavigating]         = useState(false);
  const [isFilterOpen, setIsFilterOpen]         = useState(false);
  const [currentBounds, setCurrentBounds]       = useState(null);
  const [searchAnchor, setSearchAnchor]         = useState(null);
  
  // ── Local slider (smooth drag without store spam) ──
  const [localRadius, setLocalRadius] = useState(filters.radius || 5);
  const sliderTimer = useRef(null);
  
  useEffect(() => { 
    setLocalRadius(filters.radius || 5); 
    if (filters.lat && filters.lng) {
      setSearchAnchor([filters.lat, filters.lng]);
    }
  }, [filters.radius, filters.lat, filters.lng]);

  // ─── Fit map to circle bounds ─────────────────────────────────────────────
  const fitToRadius = useCallback(() => {
    if (!map || !searchAnchor || !filters.radius) return;
    const center = L.latLng(searchAnchor[0], searchAnchor[1]);
    const bounds = center.toBounds(filters.radius * 1000);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, searchAnchor, filters.radius]);

  // Auto-fit when radius or anchor changes
  useEffect(() => {
    if (filters.lat && filters.lng && filters.radius) {
      fitToRadius();
    }
  }, [filters.radius, searchAnchor, fitToRadius]);


  // ─── Event handlers ───────────────────────────────────────────────────────
  const handleLocationSelect = useCallback((coords) => {
    if (!map || !Array.isArray(coords)) return;
    const [lat, lng] = coords;
    map.panTo([lat, lng]);
    map.setZoom(14);
    
    setTimeout(() => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      setFilters({ 
        bounds: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`, 
        lat: null, lng: null, radius: null
      });
    }, 400);
  }, [map, setFilters]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = [coords.latitude, coords.longitude];
      if (map) { map.panTo(pos); map.setZoom(15); }
      setFilters({ lat: pos[0], lng: pos[1], bounds: null });
    }, () => alert('Unable to retrieve location.'));
  }, [map, setFilters]);

  const handleRadiusSearch = useCallback(() => {
    if (!map) return;
    const c = map.getCenter();
    setFilters({ lat: c.lat, lng: c.lng, bounds: null, radius: filters.radius || 5 });
  }, [map, filters.radius, setFilters]);

  const handleSearchArea = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setFilters({ bounds: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`, lat: null, lng: null });
  }, [map, setFilters]);

  const handleSearchRadius = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    setFilters({ lat: center.lat, lng: center.lng, bounds: null, radius: filters.radius || 5 });
  }, [map, filters.radius, setFilters]);

  const handleShowRoute = useCallback(async (property) => {
    if (!map) return;
    const coords = property?.location?.coordinates;
    if (!Array.isArray(coords) || coords[0] == null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(property.title)}`, '_blank');
      return;
    }
    const center = map.getCenter();
    const url = `https://router.project-osrm.org/route/v1/driving/${center.lng},${center.lat};${coords[0]},${coords[1]}?overview=full&geometries=geojson&steps=true`;
    try {
      const data = await fetch(url).then(r => r.json());
      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteData({
          coordinates:   route.geometry.coordinates.map(c => [c[1], c[0]]),
          propertyTitle: property.title,
          distance:      route.distance,
          duration:      route.duration,
          steps:         route.legs?.[0]?.steps || [],
        });
        setIsNavigating(true);
        const b = L.latLngBounds(route.geometry.coordinates.map(c => [c[1], c[0]]));
        map.fitBounds(b, { padding: [40, 40] });
      }
    } catch {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
    }
  }, [map]);

  const handleSearchRoute = useCallback(async (startCoords, endCoords) => {
    const currentDest  = routeData?.coordinates?.[routeData.coordinates.length - 1];
    const currentStart = routeData?.coordinates?.[0];
    const start = startCoords
      ? [startCoords[1], startCoords[0]]
      : currentStart ? [currentStart[1], currentStart[0]] : null;
    const end = endCoords
      ? [endCoords[1], endCoords[0]]
      : currentDest ? [currentDest[1], currentDest[0]] : null;
    if (!start || !end) return;
    try {
      const data = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`
      ).then(r => r.json());
      if (data.routes?.[0]) {
        const route = data.routes[0];
        const path  = route.geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteData(prev => ({ ...prev, coordinates: path, distance: route.distance, duration: route.duration, steps: route.legs?.[0]?.steps || [] }));
        if (map && path.length) {
          const b = L.latLngBounds(path);
          map.fitBounds(b, { padding: [40, 40] });
        }
      }
    } catch (err) { console.error(err); }
  }, [map, routeData]);

  const handleResetFilters = useCallback(() => {
    setFilters({ lat: null, lng: null, bounds: null, radius: 5 });
    setSearchAnchor(null);
    setTimeout(handleSearchArea, 100);
  }, [setFilters, handleSearchArea]);

  // Run Search By Area on initial load
  useEffect(() => {
    if (map) {
      handleSearchArea();
    }
  }, [map, handleSearchArea]);

  // ─── Icons ──────────────────────────────────────────────────────────────────
  const resetAnchorIcon = useMemo(() => L.divIcon({
    className: 'reset-anchor-marker',
    html: `
      <div class="reset-view-anchor-btn" title="Clear Radius Search">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  }), []);

  const resetPosition = useMemo(() => {
    if (!searchAnchor || !filters.radius || !L.latLng) return searchAnchor;
    try {
      const center = L.latLng(searchAnchor[0], searchAnchor[1]);
      const bounds = center.toBounds(filters.radius * 1.2 * 1000);
      return bounds.getNorthEast();
    } catch (e) { return searchAnchor; }
  }, [searchAnchor, filters.radius]);

  // ─── Render Helpers ─────────────────────────────────────────────────────────
  const memoizedMarkers = useMemo(
    () => properties.map(property => {
      const isActive = highlightedId === property._id || selectedProperty?._id === property._id;
      const [lng, lat] = property.location.coordinates;
      return (
        <Marker
          key={property._id}
          position={[lat, lng]}
          icon={createPriceIcon(property, isActive)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setHighlightedId(property._id);
              setSelectedProperty(property);
              const card = document.getElementById(`property-card-${property._id}`);
              if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      );
    }),
    [properties, highlightedId, selectedProperty?._id]
  );


  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="map-dashboard-layout animate-fade-in">
      {/* ── Sidebar ── */}
      <aside className="sidebar-discovery-pane">
        <div className="sidebar-header-glow flex-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary-color rounded-full" />
            <div className="flex flex-col">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Discovery Engine</h2>
              <p className="discovery-subtitle">Precision property search driven by real-time map data</p>
            </div>
          </div>
        </div>

        <div className="sidebar-content-scroll custom-scrollbar">
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
              onSearchRadius={handleSearchRadius}
              onResetFilters={handleResetFilters}
            />
          )}
        </div>
      </aside>

      {/* ── Map ── */}
      <main className="map-main-viewport">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          zoomControl={false}
          preferCanvas={true}
          className="luxury-leaflet-map"
        >
          <MapController 
            map={map} setMap={setMap} 
            setCurrentBounds={setCurrentBounds} 
            filters={filters} setFilter={setFilter} setFilters={setFilters} 
          />
          <TileLayer url={VOYAGER_URL} attribution={ATTRIBUTION} />

          {/* Radius circles (Isolated for performance) */}
          {searchAnchor && filters.radius && (
            <AnimatedRadiusCircle 
              searchAnchor={searchAnchor} 
              radius={filters.radius} 
              onReset={handleResetFilters}
              resetPosition={resetPosition}
              resetIcon={resetAnchorIcon}
            />
          )}

          {/* Route polyline */}
          {routeData && (
            <Polyline 
              positions={routeData.coordinates} 
              pathOptions={{ color: '#2563eb', opacity: 0.85, weight: 6 }} 
            />
          )}

          {/* Price markers */}
          {memoizedMarkers}
        </MapContainer>


        {/* ── Overlays ── */}
        <div className="map-overlay-center-top">
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
            <button onClick={handleLocateMe} className="zoom-btn" title="Locate Me">
              <LocateFixed size={14} /> <span className="zoom-label">Me</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={handleRadiusSearch} className="zoom-btn" title="Radius Search on Center">
              <Target size={14} /> <span className="zoom-label">Radius</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={() => map?.zoomIn()} className="zoom-btn">
              <span className="text-sm">＋</span> <span className="zoom-label">In</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={() => map?.zoomOut()} className="zoom-btn">
              <span className="text-sm">－</span> <span className="zoom-label">Out</span>
            </button>
          </div>
        </div>
      </main>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {selectedProperty && (
        <PropertyDetailsOverlay
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onShowRoute={(p) => { setSelectedProperty(null); handleShowRoute(p); }}
        />
      )}
    </div>
  );
}

