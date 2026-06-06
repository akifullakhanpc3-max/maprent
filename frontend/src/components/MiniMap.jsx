"use client";

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePropertyStore } from '../store/usePropertyStore';

if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const timers = [100, 300, 600, 1000].map(delay =>
      setTimeout(() => { map.invalidateSize(); }, delay)
    );
    let observer;
    if (typeof ResizeObserver !== 'undefined' && el) {
      observer = new ResizeObserver(() => { map.invalidateSize(); });
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

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function formatPrice(price) {
  if (!price || price <= 0) return 'N/A';
  return price >= 100000 ? `\u20B9${(price / 100000).toFixed(1)}L` : price >= 1000 ? `\u20B9${(price / 1000).toFixed(0)}k` : `\u20B9${price}`;
}

function createPricePin(property, isCenter) {
  const price = formatPrice(property.price);
  const bhk = property.bhkType?.toUpperCase();
  const html = `
    <div class="price-pin-wrapper ${isCenter ? 'is-active' : ''}" style="${isCenter ? 'transform:scale(1.2);z-index:1000' : ''}">
      ${bhk ? `<span class="pin-bhk-tag">${bhk}</span>` : ''}
      <span class="price-text">${price}</span>
      <div class="price-pin-tail"></div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-price-pin',
    html,
    iconSize: [120, 40],
    iconAnchor: [60, 40],
  });
}

function MarkersLayer({ centerLat, centerLng, centerProperty, nearbyProperties, onSelectProperty }) {
  const map = useMap();

  useEffect(() => {
    const markers = [];

    if (centerProperty && centerLat != null && centerLng != null) {
      const m = L.marker([centerLat, centerLng], {
        icon: createPricePin(centerProperty, true),
        zIndexOffset: 1000,
      }).addTo(map);
      markers.push(m);
    }

    for (const p of nearbyProperties) {
      if (!p.location?.coordinates || p.location.coordinates.length < 2) continue;
      const [pLng, pLat] = p.location.coordinates;
      const m = L.marker([pLat, pLng], {
        icon: createPricePin(p, false),
      }).addTo(map);
      if (onSelectProperty) {
        m.on('click', () => onSelectProperty(p));
      }
      markers.push(m);
    }

    return () => {
      markers.forEach(m => m.remove());
    };
  }, [map, centerLat, centerLng, centerProperty, nearbyProperties, onSelectProperty]);

  return null;
}

export default function MiniMap({ lat, lng, zoom = 14, className = "", currentProperty, onSelectProperty }) {
  const { properties } = usePropertyStore();

  const nearbyProperties = useMemo(() => {
    const centerId = currentProperty?._id;
    const all = centerId
      ? properties.filter(p => p._id !== centerId)
      : properties;
    return all.filter(p => {
      if (!p.location?.coordinates || p.location.coordinates.length < 2) return false;
      return true;
    }).slice(0, 50);
  }, [properties, currentProperty]);

  if (!lat || !lng) return null;

  return (
    <div className={`mini-map-container ${className}`}>
      <div style={{
        fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: '#64748b',
        padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
      }}>
        Nearby rentals ({nearbyProperties.length} of {properties.length})
      </div>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        className="h-full w-full rounded-2xl"
        style={{ height: 'calc(100% - 32px)' }}
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <MarkersLayer
          centerLat={lat}
          centerLng={lng}
          centerProperty={currentProperty}
          nearbyProperties={nearbyProperties}
          onSelectProperty={onSelectProperty}
        />
        <MapResizer />
      </MapContainer>
    </div>
  );
}
