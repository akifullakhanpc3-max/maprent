import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapPin, Search, Navigation, Filter, X, ChevronRight, Navigation2, Map as MapIcon, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import MapSearchBar from '../components/MapSearchBar';
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

// Custom Premium Pulse Icon for Search Anchor
const redIcon = L.divIcon({
  className: 'search-anchor-wrapper',
  html: `
    <div class="search-anchor-pulse">
      <div class="search-anchor-dot"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
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
      }, 400);
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

// Price Pin Icon Generator
const createPriceIcon = (price, isActive = false) => {
  const formattedPrice = price >= 100000 ? `₹${(price / 100000).toFixed(1)}L` : `₹${(price / 1000).toFixed(0)}k`;
  return L.divIcon({
    className: 'custom-price-pin',
    html: `
      <div class="price-pin-wrapper ${isActive ? 'is-active' : ''}">
        <span class="price-text">${formattedPrice}</span>
        <div class="price-pin-tail"></div>
      </div>
    `,
    iconSize: [50, 38],
    iconAnchor: [25, 38],
  });
};

// Custom Price Marker Component
const PriceMarker = React.memo(({ property, isActive, onClick }) => {
  return (
    <Marker
      position={[property.location.coordinates[1], property.location.coordinates[0]]}
      icon={createPriceIcon(property.rent, isActive)}
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
  const { properties, filters, loading, setFilter, setFilters } = usePropertyStore();
  const { user } = useAuthStore();
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);
  const [searchAnchor, setSearchAnchor] = useState(null);
  const [mobileMapHeight, setMobileMapHeight] = useState(80); // percentage

  const handleLocationSelect = useCallback((coords) => {
    if (mapRef.current && Array.isArray(coords)) {
      mapRef.current.flyTo(coords, 14);
      if (window.innerWidth <= 768) setMobileMapHeight(80); // Restore on search
    }
  }, []);

  const handleSidebarScroll = (e) => {
    if (window.innerWidth > 768) return;
    const st = e.target.scrollTop;
    // Aggressive collapse: 80vh down to 0vh over 500px scroll
    const progress = Math.min(st / 500, 1);
    const newHeight = 80 * (1 - progress);
    if (Math.abs(newHeight - mobileMapHeight) > 1) {
       setMobileMapHeight(newHeight);
    }
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
    const center = mapRef.current.getCenter();
    const start = [center.lng, center.lat];
    const end = [property.location.coordinates[0], property.location.coordinates[1]];

    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`);
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
      }
    } catch (err) { console.error('Routing error:', err); }
  }, []);

  const handleSearchArea = () => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    // Clear proximity search coordinates to allow bounds-based discovery
    setFilters({
      bounds: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
      lat: null,
      lng: null
    });
  };

  useEffect(() => {
    if (filters.lat && filters.lng) {
      setSearchAnchor([filters.lat, filters.lng]);
    } else {
      setSearchAnchor(null);
    }
  }, [filters.lat, filters.lng]);

  const circleOptions = useMemo(() => ({
    color: 'var(--primary-color)',
    fillColor: 'var(--primary-color)',
    fillOpacity: 0.05,
    weight: 2,
    dashArray: '8, 8'
  }), []);

  return (
    <div className="map-dashboard-layout animate-fade-in">
      <aside className="sidebar-discovery-pane">
        <div className="sidebar-header-glow">
          <div className="flex-row items-center gap-3 mb-6">
            <div className="brand-icon-box !w-8 !h-8 !bg-accent-blue/10">
              <MapIcon size={18} className="text-accent-blue" />
            </div>
            <h1 className="brand-name luxury-title text-white">MAP<span className="text-accent-blue">RENT</span></h1>
          </div>
          <div className="sidebar-search-wrap">
            <MapSearchBar onSearch={handleLocationSelect} />
          </div>
        </div>

        <div className="sidebar-content-scroll custom-scrollbar" onScroll={handleSidebarScroll} ref={sidebarRef}>
          {isNavigating ? (
            <NavigationPanel
              routeData={routeData}
              onClear={() => { setIsNavigating(false); setRouteData(null); }}
              propertyTitle={routeData.propertyTitle}
              selectedProperty={selectedProperty}
              isRouting={false}
            />
          ) : (
            <PropertyListPane
              selectedProperty={selectedProperty}
              setSelectedProperty={setSelectedProperty}
              highlightedId={highlightedId}
              setHighlightedId={setHighlightedId}
              onShowRoute={handleShowRoute}
            />
          )}
        </div>

        <div className="sidebar-footer-actions">
          {!user && (
            <button className="btn btn-secondary !bg-sidebar-active !text-white !border-transparent w-full">Sign In to Platform</button>
          )}
        </div>
      </aside>

      <main
        className="map-main-viewport"
        style={{ '--mobile-map-h': `${mobileMapHeight}vh` }}
      >
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          className="luxury-leaflet-map"
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
              <Popup className="premium-discovery-popup">
                <div className="flex-col gap-3 min-w-[200px]">
                  <p className="label-base !mb-0 text-slate-400">Selected Location</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFilters({ lat: null, lng: null });
                        mapRef.current?.closePopup();
                      }}
                      className="btn btn-ghost !border-slate-200 !text-xs w-full"
                    >
                      Clear Selection
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

          {routeData && <Polyline positions={routeData.coordinates} color="var(--primary-color)" weight={4} opacity={0.8} />}

          {useMemo(() => properties.map(property => (
            <PriceMarker
              key={property._id}
              property={property}
              isActive={highlightedId === property._id || selectedProperty?._id === property._id}
              onClick={() => {
                setHighlightedId(property._id);
                // On mobile, scroll to top if not already there, to collapse the map
                if (window.innerWidth <= 768) {
                  sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }
                const card = document.getElementById(`property-card-${property._id}`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          )), [properties, highlightedId, selectedProperty])}
        </MapContainer>

        {/* Floating SaaS Controls */}
        <div className="map-overlay-center-top">
          <button onClick={handleSearchArea} className="search-area-btn shadow-premium">
            <Search size={14} />
            <span>Search This Area</span>
          </button>
        </div>

        <div className="map-overlay-bottom-right flex-col gap-3">
          <div className="zoom-controls-stack shadow-premium">
            <button onClick={() => mapRef.current?.zoomIn()} className="zoom-btn">+</button>
            <div className="zoom-divider" />
            <button onClick={() => mapRef.current?.zoomOut()} className="zoom-btn">−</button>
          </div>
          <button onClick={() => setIsFilterOpen(true)} className="map-floating-action-btn shadow-premium">
            <Filter size={20} />
          </button>
        </div>

      </main>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
}
