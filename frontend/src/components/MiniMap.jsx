import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Helper to fix Leaflet size issues in modals
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 800);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

const VOYAGER_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const createPriceIcon = (property, isActive) => {
  const price = property.price;
  let formattedPrice = 'N/A';
  if (price > 0) {
    formattedPrice = price >= 100000 ? `₹${(price / 100000).toFixed(1)}L`
                   : price >= 1000   ? `₹${(price / 1000).toFixed(0)}k`
                   : `₹${price}`;
  }

  const html = `
    <div class="price-pin-wrapper ${isActive ? 'is-active' : ''} mini-map-scale">
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

const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div class="price-pin-wrapper cluster-pin">
        <span class="pin-bhk-tag">${count}</span>
        <span class="price-text">PROPERTIES</span>
        <div class="price-pin-tail"></div>
      </div>
    `,
    className: 'custom-price-pin',
    iconSize: [120, 40],
    iconAnchor: [60, 40],
  });
};

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
          icon={createPriceIcon(property, isCenter)}
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
        <TileLayer url={VOYAGER_URL} attribution={ATTRIBUTION} />
        {/* Render all property tags */}
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            showCoverageOnHover={false}
            iconCreateFunction={createClusterCustomIcon}
        >
          {memoizedMarkers}
        </MarkerClusterGroup>
        <MapResizer />
      </MapContainer>
    </div>
  );
}
