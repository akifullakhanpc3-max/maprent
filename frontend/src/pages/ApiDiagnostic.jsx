import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, ShieldAlert, Cpu, Activity, Map as MapIcon, Globe, Lock, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?format=json&q=Bengaluru&limit=1';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/77.5946,12.9716;77.6413,12.9352?overview=false';

const StatusBadge = ({ type, text }) => {
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
      isSuccess ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
      'bg-red-500/10 text-red-500 border border-red-500/20'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {text}
    </div>
  );
};

export default function ApiDiagnostic() {
  const [tileStatus, setTileStatus] = useState('pending');
  const [searchStatus, setSearchStatus] = useState('pending');
  const [routeStatus, setRouteStatus] = useState('pending');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Check Search (Nominatim)
    fetch(NOMINATIM_URL)
      .then(r => r.ok ? setSearchStatus('success') : setSearchStatus('error'))
      .catch(() => setSearchStatus('error'));

    // Check Routing (OSRM)
    fetch(OSRM_URL)
      .then(r => r.ok ? setRouteStatus('success') : setRouteStatus('error'))
      .catch(() => setRouteStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-color rounded-lg text-white">
              <Cpu size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Open Maps Diagnostic</h1>
          </div>
          <p className="text-slate-500 text-lg">
            Verifying Leaflet engine and Open Data ecosystem connectivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Status</span>
                </div>
                {(tileStatus === 'success' && searchStatus === 'success' && routeStatus === 'success') ? (
                  <StatusBadge type="success" text="Systems OK" />
                ) : (
                  <StatusBadge type="error" text="System Check" />
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${tileStatus === 'success' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {tileStatus === 'success' ? <ShieldCheck className="text-emerald-500" /> : <Globe className="text-slate-300" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Tile Layer (CartoDB)</h3>
                    <p className="text-sm text-slate-500">Checking map tile reachability...</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${searchStatus === 'success' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {searchStatus === 'success' ? <Search className="text-emerald-500" /> : <Search className="text-slate-300" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Search Service (Nominatim)</h3>
                    <p className="text-sm text-slate-500">Geocoding and address lookup.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 font-mono">Service Availability</h3>
              <div className="space-y-4">
                {[
                  { name: "Leaflet JS Engine", status: true },
                  { name: "OSRM Routing API", status: routeStatus === 'success' },
                  { name: "Nominatim Geocoder", status: searchStatus === 'success' },
                  { name: "Carto Tile CDN", status: tileStatus === 'success' }
                ].map((service, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{service.name}</span>
                    <div className={`w-2 h-2 rounded-full ${service.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
             <div className="p-6 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <MapIcon size={18} className="text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Visual Validation</span>
                </div>
             </div>
             
             <div className="flex-1 relative">
                <MapContainer
                  center={[12.9716, 77.5946]}
                  zoom={12}
                  className="w-full h-full"
                  whenReady={() => setTileStatus('success')}
                >
                  <TileLayer url={TILE_URL} />
                </MapContainer>
             </div>
             
             <div className="p-6 bg-slate-50/50">
               <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-mono">
                  Diagnostics v3.0 // Leaflet Integration // Open Data Stack
               </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
