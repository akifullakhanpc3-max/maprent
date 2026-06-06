"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { usePropertyStore } from '../store/usePropertyStore';

// Fix for default Leaflet marker icons
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Helper to fix Leaflet size issues in modals and animated containers
function MapResizer() {
  const map = useMap();
  const containerRef = useRef(null);

  useEffect(() => {
    const el = map.getContainer();
    containerRef.current = el;

    // Multiple invalidations to catch all animation phases
    const timers = [100, 300, 600, 1000].map(delay =>
      setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );

    // ResizeObserver for responsive containers
    let observer;
    if (typeof ResizeObserver !== 'undefined' && el) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(el);
    }

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function MiniMap({ lat, lng, zoom = 14, className = "", onSelectProperty }) {
  const { properties } = usePropertyStore();

  const memoizedMarkers = useMemo(() => {
    return properties.map(property => {
      const [pLng, pLat] = property.location.coordinates;
      // If it's the exact same location as the minimap center, we might skip it or highlight it
      const isCenter = Math.abs(pLat - lat) < 0.00001 && Math.abs(pLng - lng) < 0.00001;
      return (
        <Marker
          key={property._id}
          position={[pLat, pLng]}
          eventHandlers={onSelectProperty && !isCenter ? {
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectProperty(property);
            }
          } : undefined}
        />
      );
    });
  }, [properties, lat, lng, onSelectProperty]);

  if (!lat || !lng) return null;

  return (
    <div className={`mini-map-container ${className}`}>
      <MapContainer 
        key={`${lat}-${lng}`}
        center={[lat, lng]} 
        zoom={zoom} 
        zoomControl={true} 
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        className="h-full w-full rounded-2xl"
      >
        <TileLayer url={OSM_URL} attribution={ATTRIBUTION} />
        {/* Render all property tags */}
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            showCoverageOnHover={false}
        >
          {memoizedMarkers}
        </MarkerClusterGroup>
        <MapResizer />
      </MapContainer>
    </div>
  );
}
