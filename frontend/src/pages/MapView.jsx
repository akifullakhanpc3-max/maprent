import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Filter, LocateFixed, Layers, Target, RotateCcw
} from 'lucide-react';
import {
  GoogleMap, useJsApiLoader, OverlayView, Polyline
} from '@react-google-maps/api';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import MapSearchBar from '../components/MapSearchBar';
import FilterPanel from '../components/FilterPanel';
import PropertyListPane from '../components/PropertyListPane';
import NavigationPanel from '../components/NavigationPanel';
import PropertyDetailsOverlay from '../components/PropertyDetailsOverlay';
import '../styles/pages/MapView.css';

// ─── Config ───────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'AIzaSyCzbhpysaCAMjDeCnEXtytksmfel3itwlM';
const LIBRARIES = ['places', 'geometry'];
const DEFAULT_CENTER = { lat: 12.2958, lng: 76.6394 }; // Mysore

// Clean, minimal map style — keeps roads visible without cluttering markers
const MAP_STYLES = [
  { featureType: 'all',       elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'water',     elementType: 'all',              stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'all',              stylers: [{ color: '#f8fafc' }] },
  { featureType: 'road',      elementType: 'geometry',         stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry',      stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.arterial', elementType: 'geometry',     stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'poi',       stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',   stylers: [{ visibility: 'off' }] },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

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
  const [mapType, setMapType]                   = useState('roadmap');
  const [currentBounds, setCurrentBounds]       = useState(null);

  // ── Radius / search anchor ──
  const [searchAnchor, setSearchAnchor] = useState(DEFAULT_CENTER);
  const [mapCenter] = useState(DEFAULT_CENTER);

  // ── Circle refs (native Google Maps objects) ──
  const glowCircleRef = useRef(null);
  const mainCircleRef = useRef(null);
  const draggableMarkerRef = useRef(null);
  const animFrameRef   = useRef(null);
  const idleTimer      = useRef(null);

  // ── Local slider (smooth drag without store spam) ──
  const [localRadius, setLocalRadius] = useState(filters.radius || 5);
  const sliderTimer = useRef(null);
  useEffect(() => { setLocalRadius(filters.radius || 5); }, [filters.radius]);

  // ─── Map Load ─────────────────────────────────────────────────────────────
  const onLoad = useCallback((m) => {
    setMap(m);
    // Start in radius mode at default city
    setFilters({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, bounds: null, radius: 5 });
  }, [setFilters]);

  const onUnmount = useCallback(() => setMap(null), []);

  // ─── Map options (memoised) ───────────────────────────────────────────────
  const mapOptions = useMemo(() => ({
    styles: MAP_STYLES,
    disableDefaultUI: true,
    mapTypeId: mapType,
    gestureHandling: 'greedy',
    maxZoom: 19,
    minZoom: 3,
  }), [mapType]);

  // ─── Polyline options ─────────────────────────────────────────────────────
  const polylineOptions = useMemo(() => ({
    strokeColor: '#2563eb',
    strokeOpacity: 0.85,
    strokeWeight: 6,
  }), []);

  // ─── Draw / update radius circles ─────────────────────────────────────────
  const drawCircles = useCallback(() => {
    if (!map || !window.google) return;

    const radiusM = (Number(filters.radius) || 5) * 1000;
    const center  = searchAnchor;

    // ── Glow (outer) ──
    const glowOpts = {
      map,
      center,
      radius: radiusM,
      strokeColor:   '#60a5fa',
      strokeOpacity: 0.5,
      strokeWeight:  10,
      fillOpacity:   0,
      clickable:     false,
      zIndex:        100,
    };

    // ── Main (inner) ──
    const mainOpts = {
      map,
      center,
      radius: radiusM,
      strokeColor:   '#1d4ed8',
      strokeOpacity: 1,
      strokeWeight:  3,
      fillColor:     '#3b82f6',
      fillOpacity:   0.18,
      clickable:     true,
      editable:      true,
      draggable:     true,
      zIndex:        101,
    };

    if (!glowCircleRef.current) {
      glowCircleRef.current = new window.google.maps.Circle(glowOpts);
      
      const newMain = new window.google.maps.Circle(mainOpts);
      mainCircleRef.current = newMain;

      // Update store when user drags to reposition
      newMain.addListener('dragend', () => {
        const pos = newMain.getCenter();
        setSearchAnchor({ lat: pos.lat(), lng: pos.lng() });
        setFilters({ lat: pos.lat(), lng: pos.lng(), bounds: null, radius: filters.radius || 5 });
      });

      // Update store and glow when user resizes the radius via the outline handle
      newMain.addListener('radius_changed', () => {
        const newRadiusM = newMain.getRadius();
        if (glowCircleRef.current) glowCircleRef.current.setRadius(newRadiusM);
        
        // Debounce store commit
        if (sliderTimer.current) clearTimeout(sliderTimer.current);
        sliderTimer.current = setTimeout(() => {
          setFilter('radius', newRadiusM / 1000);
        }, 300);
      });
      
    } else {
      glowCircleRef.current.setOptions(glowOpts);
      mainCircleRef.current.setOptions(mainOpts);
    }
  }, [map, searchAnchor, filters.radius]);

  // ─── Animated ripple on glow circle ──────────────────────────────────────
  const startRipple = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (!glowCircleRef.current) return;

    // Use current radius from main circle if dragging
    const baseRadius = mainCircleRef.current?.getRadius() || ((Number(filters.radius) || 5) * 1000);
    let start = performance.now();
    const CYCLE = 2800;

    const tick = (ts) => {
      if (!glowCircleRef.current || !mainCircleRef.current) return;
      let elapsed = ts - start;
      if (elapsed > CYCLE) { start = ts; elapsed = 0; }

      const progress = elapsed / CYCLE;
      const ease     = 1 - Math.pow(1 - progress, 3);
      
      const currentBase = mainCircleRef.current.getRadius();

      glowCircleRef.current.setRadius(currentBase + currentBase * 0.15 * ease);
      glowCircleRef.current.setOptions({
        strokeOpacity: 0.5 * (1 - progress),
        strokeWeight:  Math.max(1, 10 * (1 - progress)),
        // keep glow center synced with main center
        center: mainCircleRef.current.getCenter()
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [filters.radius]);

  // ─── Fit map to circle bounds ─────────────────────────────────────────────
  const fitToRadius = useCallback(() => {
    if (!map || !window.google || !searchAnchor || !filters.radius) return;
    const radiusM = (Number(filters.radius) || 5) * 1000;
    const circle  = new window.google.maps.Circle({ center: searchAnchor, radius: radiusM });
    map.fitBounds(circle.getBounds(), { top: 60, bottom: 60, left: 60, right: 60 });
  }, [map, searchAnchor, filters.radius]);

  // ─── Update circles whenever anchor / radius / map changes ───────────────
  useEffect(() => {
    if (!map || !window.google) return;

    if (searchAnchor && filters.radius && filters.lat && filters.lng) {
      drawCircles();
      startRipple();
    } else {
      // Remove circles
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (glowCircleRef.current) { glowCircleRef.current.setMap(null); glowCircleRef.current = null; }
      if (mainCircleRef.current) { mainCircleRef.current.setMap(null); mainCircleRef.current = null; }
    }

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [map, searchAnchor, filters.radius, filters.lat, filters.lng, drawCircles, startRipple]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (glowCircleRef.current) glowCircleRef.current.setMap(null);
    if (mainCircleRef.current) mainCircleRef.current.setMap(null);
    if (draggableMarkerRef.current) draggableMarkerRef.current.setMap(null);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (sliderTimer.current) clearTimeout(sliderTimer.current);
  }, []);

  // ─── Idle handler (debounced bounds update) ───────────────────────────────
  const handleMapIdle = useCallback(() => {
    if (!map) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const str = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;
      setCurrentBounds(str);
      if (!filters.lat || !filters.lng) setFilter('bounds', str);
    }, 500);
  }, [map, filters.lat, filters.lng, setFilter]);

  // ─── Deep link support ────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = params.get('id');
    if (id) {
      fetchPropertyById(id).then(prop => {
        if (prop?.location?.coordinates) {
          setSelectedProperty(prop);
          setHighlightedId(prop._id);
          const [lng, lat] = prop.location.coordinates;
          if (map) { map.panTo({ lat, lng }); map.setZoom(16); }
        }
      });
    }
  }, [search, fetchPropertyById, map]);

  // ─── Event handlers ───────────────────────────────────────────────────────
  const handleLocationSelect = useCallback((coords) => {
    if (!map || !Array.isArray(coords)) return;
    const [lat, lng] = coords;
    map.panTo({ lat, lng });
    map.setZoom(14);
    setSearchAnchor({ lat, lng });
    setFilters({ lat, lng, bounds: null, radius: filters.radius || 5 });
  }, [map, filters.radius, setFilters]);

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedProperty(null);
    setHighlightedId(null);
    setIsNavigating(false);
    setRouteData(null);
    const pos = { lat, lng };
    setSearchAnchor(pos);
    setFilters({ lat, lng, bounds: null, radius: filters.radius || 5 });
  }, [filters.radius, setFilters]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude };
      if (map) { map.panTo(pos); map.setZoom(15); }
      setSearchAnchor(pos);
      setFilters({ lat: pos.lat, lng: pos.lng, bounds: null });
    }, () => alert('Unable to retrieve location.'));
  }, [map, setFilters]);

  const handleRadiusSearch = useCallback(() => {
    if (!map) return;
    const c   = map.getCenter();
    const pos = { lat: c.lat(), lng: c.lng() };
    setFilters({ lat: pos.lat, lng: pos.lng, bounds: null, radius: filters.radius || 5 });
    setSearchAnchor(pos);
  }, [map, filters.radius, setFilters]);

  const handleSearchArea = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setFilters({ bounds: `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`, lat: null, lng: null });
  }, [map, setFilters]);

  const handleShowRoute = useCallback(async (property) => {
    if (!map) return;
    const coords = property?.location?.coordinates;
    if (!Array.isArray(coords) || coords[0] == null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(property.title)}`, '_blank');
      return;
    }
    const center = map.getCenter();
    const url    = `https://router.project-osrm.org/route/v1/driving/${center.lng()},${center.lat()};${coords[0]},${coords[1]}?overview=full&geometries=geojson&steps=true`;
    try {
      const data = await fetch(url).then(r => r.json());
      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRouteData({
          coordinates:   route.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] })),
          propertyTitle: property.title,
          distance:      route.distance,
          duration:      route.duration,
          steps:         route.legs?.[0]?.steps || [],
        });
        setIsNavigating(true);
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
      : currentStart ? [currentStart.lng, currentStart.lat] : null;
    const end = endCoords
      ? [endCoords[1], endCoords[0]]
      : currentDest ? [currentDest.lng, currentDest.lat] : null;
    if (!start || !end) return;
    try {
      const data = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`
      ).then(r => r.json());
      if (data.routes?.[0]) {
        const route = data.routes[0];
        const path  = route.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
        setRouteData(prev => ({ ...prev, coordinates: path, distance: route.distance, duration: route.duration, steps: route.legs?.[0]?.steps || [] }));
        if (map && path.length) {
          const b = new window.google.maps.LatLngBounds();
          path.forEach(p => b.extend(p));
          map.fitBounds(b);
        }
      }
    } catch (err) { console.error(err); }
  }, [map, routeData]);

  // ─── Slider handler ───────────────────────────────────────────────────────
  const handleSliderChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setLocalRadius(val);
    if (sliderTimer.current) clearTimeout(sliderTimer.current);
    sliderTimer.current = setTimeout(() => {
      setFilter('radius', val);
      // Fit after store updates
      setTimeout(fitToRadius, 50);
    }, 200);
  }, [setFilter, fitToRadius]);

  // ─── Price markers (OverlayView) ──────────────────────────────────────────
  const renderPriceMarker = (property) => {
    const isActive = highlightedId === property._id || selectedProperty?._id === property._id;
    const [lng, lat] = property.location.coordinates;
    const price = property.price;
    let formattedPrice = 'N/A';
    if (price > 0) {
      formattedPrice = price >= 100000 ? `₹${(price / 100000).toFixed(1)}L`
                     : price >= 1000   ? `₹${(price / 1000).toFixed(0)}k`
                     : `₹${price}`;
    }
    return (
      <OverlayView
        key={property._id}
        position={{ lat, lng }}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      >
        <div
          className={`price-pin-wrapper ${isActive ? 'is-active' : ''}`}
          style={{ cursor: 'pointer', transform: 'translate(-50%, -100%)' }}
          onClick={(e) => {
            e.stopPropagation();
            setHighlightedId(property._id);
            setSelectedProperty(property);
            const card = document.getElementById(`property-card-${property._id}`);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {property.bhkType && <span className="pin-bhk-tag">{property.bhkType.toUpperCase()}</span>}
          <span className="price-text">{formattedPrice}</span>
          <div className="price-pin-tail" />
        </div>
      </OverlayView>
    );
  };

  const memoizedMarkers = useMemo(
    () => properties.map(renderPriceMarker),
    [properties, highlightedId, selectedProperty?._id]
  );

  // ─── Loading state ────────────────────────────────────────────────────────
  if (!isLoaded) return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-color rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-tighter">Initializing Maps Engine</span>
      </div>
    </div>
  );

  // ─── Slider display ────────────────────────────────────────────────────────
  const fillPct = ((localRadius - 0.5) / (50 - 0.5)) * 100;
  const displayVal = localRadius < 1
    ? `${Math.round(localRadius * 1000)}m`
    : `${localRadius % 1 === 0 ? localRadius : localRadius.toFixed(1)}km`;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="map-dashboard-layout animate-fade-in">
      {/* ── Sidebar ── */}
      <aside className="sidebar-discovery-pane">
        <div className="sidebar-header-glow flex-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-primary-color rounded-full" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Discovery Engine</h2>
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
            />
          )}
        </div>
      </aside>

      {/* ── Map ── */}
      <main className="map-main-viewport">
        <GoogleMap
          mapContainerClassName="luxury-leaflet-map"
          center={mapCenter}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onIdle={handleMapIdle}
          onClick={handleMapClick}
          options={mapOptions}
        >
          {/* Route polyline */}
          {routeData && (
            <Polyline path={routeData.coordinates} options={polylineOptions} />
          )}

          {/* Price pins */}
          {memoizedMarkers}
        </GoogleMap>

        {/* ── Top search bar + filter button ── */}
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



        {/* ── Zoom / control strip ── */}
        <div className="map-overlay-zoom-controls">
          <div className="zoom-controls-stack shadow-premium">
            <button
              onClick={() => setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
              className="zoom-btn"
              title="Toggle map type"
            >
              <Layers size={14} />
              <span className="zoom-label">{mapType === 'roadmap' ? 'Sat' : 'Map'}</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={handleLocateMe} className="zoom-btn" title="Locate Me">
              <LocateFixed size={14} />
              <span className="zoom-label">Me</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={handleRadiusSearch} className="zoom-btn" title="Radius Search on Center">
              <Target size={14} />
              <span className="zoom-label">Radius</span>
            </button>
            <div className="zoom-divider" />
            {(filters.lat || filters.lng) && (
              <>
                <button
                  onClick={() => {
                    setFilters({ lat: null, lng: null, bounds: null });
                    setSearchAnchor(null);
                    setTimeout(handleSearchArea, 100);
                  }}
                  className="zoom-btn text-error-color"
                  title="Clear Radius"
                >
                  <RotateCcw size={14} />
                  <span className="zoom-label">Clear</span>
                </button>
                <div className="zoom-divider" />
              </>
            )}
            <button onClick={() => map?.setZoom((map.getZoom() || 12) + 1)} className="zoom-btn">
              <span className="text-sm">＋</span>
              <span className="zoom-label">In</span>
            </button>
            <div className="zoom-divider" />
            <button onClick={() => map?.setZoom((map.getZoom() || 12) - 1)} className="zoom-btn">
              <span className="text-sm">－</span>
              <span className="zoom-label">Out</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── Filter panel ── */}
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {/* ── Property details overlay ── */}
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
