"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Inject badge styles once
if (typeof document !== 'undefined' && !document.getElementById('bf-styles')) {
  const style = document.createElement('style');
  style.id = 'bf-styles';
  style.textContent = `
    .building-count-pill {
      background: #6366f1;
      color: #fff;
      font-family: system-ui;
      font-size: 11px;
      font-weight: 700;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(99,102,241,0.4);
      border: 2px solid #fff;
      cursor: default;
    }
    .leaflet-tooltip {
      font-family: system-ui !important;
    }
  `;
  document.head.appendChild(style);
}

function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function osmToGeoJSON(osmData) {
  const nodes = {};
  const features = [];

  osmData.elements.forEach(el => {
    if (el.type === 'node') {
      nodes[el.id] = [el.lon, el.lat];
    }
  });

  osmData.elements.forEach(el => {
    if (el.type === 'way' && el.tags?.building) {
      const coords = el.nodes.map(id => nodes[id]).filter(Boolean);
      if (coords.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
          properties: {
            id: `way/${el.id}`,
            name: el.tags.name || null,
            building: el.tags.building,
            address: [el.tags['addr:housenumber'], el.tags['addr:street']].filter(Boolean).join(' ') || null,
            levels: el.tags['building:levels'] || null,
          },
        });
      }
    }
  });

  return { type: 'FeatureCollection', features };
}

const STYLE_DEFAULT = {
  color: '#94a3b8',
  weight: 0.5,
  opacity: 0.6,
  fillColor: '#e2e8f0',
  fillOpacity: 0.35,
};

const STYLE_HOVER = {
  color: '#64748b',
  weight: 1.5,
  opacity: 0.9,
  fillColor: '#cbd5e1',
  fillOpacity: 0.5,
};

const STYLE_HAS_LISTINGS = {
  color: '#6366f1',
  weight: 1.2,
  opacity: 0.8,
  fillColor: '#6366f1',
  fillOpacity: 0.15,
};

export default function BuildingFootprints({ properties = [], onSelectBuilding }) {
  const map = useMap();
  const layerRef = useRef(null);
  const geoRef = useRef(null);
  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);
  const badgeMarkers = useRef([]);

  const fetchBuildings = useCallback(async (bounds) => {
    const key = `${bounds.getSouth().toFixed(3)},${bounds.getWest().toFixed(3)},${bounds.getNorth().toFixed(3)},${bounds.getEast().toFixed(3)}`;
    if (cacheRef.current.has(key)) return cacheRef.current.get(key);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const query = `[out:json][timeout:8];(way["building"](${key}););out body;>;out skel qt;`;
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal: controller.signal });
      const data = await res.json();
      cacheRef.current.set(key, data);
      if (cacheRef.current.size > 20) {
        const first = cacheRef.current.keys().next().value;
        cacheRef.current.delete(first);
      }
      return data;
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[BUILDINGS]', err);
      return null;
    }
  }, []);

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);

    const handleMoveEnd = async () => {
      const zoom = map.getZoom();
      if (zoom < 15) {
        layerRef.current.clearLayers();
        geoRef.current = null;
        badgeMarkers.current.forEach(m => m.remove());
        badgeMarkers.current = [];
        return;
      }

      const bounds = map.getBounds();
      const osmData = await fetchBuildings(bounds);
      if (!osmData?.elements?.length) return;

      const geoJson = osmToGeoJSON(osmData);
      if (!geoJson.features.length) return;

      // Build property association map
      const assoc = new Map();
      properties.forEach(prop => {
        if (!prop.location?.coordinates) return;
        const [lng, lat] = prop.location.coordinates;
        for (const f of geoJson.features) {
          if (pointInPolygon([lng, lat], f.geometry.coordinates[0])) {
            const id = f.properties.id;
            if (!assoc.has(id)) assoc.set(id, []);
            assoc.get(id).push(prop);
            break;
          }
        }
      });

      layerRef.current.clearLayers();
      badgeMarkers.current.forEach(m => m.remove());
      badgeMarkers.current = [];

      geoRef.current = L.geoJSON(geoJson, {
        style: (f) => {
          const count = assoc.get(f.properties.id)?.length || 0;
          return count > 0 ? STYLE_HAS_LISTINGS : STYLE_DEFAULT;
        },
        onEachFeature: (feature, layer) => {
          const count = assoc.get(feature.properties.id)?.length || 0;

          layer.bindTooltip(() => {
            const p = feature.properties;
            const lines = [];
            if (p.name) lines.push(`<strong>${p.name}</strong>`);
            if (p.address) lines.push(p.address);
            const meta = p.levels ? `${p.levels} floors` : 'Building';
            lines.push(meta);
            if (count > 0) lines.push(`<span style="color:#6366f1;font-weight:600">${count} listing${count !== 1 ? 's' : ''}</span>`);
            return `<div style="font-family:system-ui;font-size:12px;line-height:1.5">${lines.join('<br/>')}</div>`;
          }, { sticky: true, offset: [0, -10] });

          layer.on({
            mouseover: () => layer.setStyle(count > 0 ? STYLE_HAS_LISTINGS : STYLE_HOVER),
            mouseout: () => layer.setStyle(count > 0 ? STYLE_HAS_LISTINGS : STYLE_DEFAULT),
          });

          if (count > 0) {
            layer.on('click', () => {
              onSelectBuilding?.(assoc.get(feature.properties.id));
            });
            const center = layer.getBounds().getCenter();
            const badge = L.marker(center, {
              icon: L.divIcon({
                className: '',
                html: `<div class="building-count-pill">${count}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              }),
              interactive: false,
              zIndexOffset: 500,
            }).addTo(layerRef.current);
            badgeMarkers.current.push(badge);
          }
        },
      });

      geoRef.current.addTo(layerRef.current);
    };

    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(handleMoveEnd, 400); };

    map.on('moveend', debounced);
    // Delay initial load so map tiles settle first
    setTimeout(debounced, 2000);

    return () => {
      map.off('moveend', debounced);
      clearTimeout(timer);
      layerRef.current?.remove();
      badgeMarkers.current.forEach(m => m.remove());
    };
  }, [map, fetchBuildings, properties, onSelectBuilding]);

  return null;
}
