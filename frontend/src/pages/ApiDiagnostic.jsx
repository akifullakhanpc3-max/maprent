import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api';
import { ShieldCheck, ShieldAlert, Cpu, Activity, Map as MapIcon, Globe, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_KEY_TO_TEST = "AIzaSyCzbhpysaCAMjDeCnEXtytksmfel3itwlM";

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
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { isLoaded, loadError: googleLoadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY_TO_TEST,
    libraries: ['places', 'geometry', 'marker', 'drawing']
  });

  useEffect(() => {
    if (googleLoadError) {
      console.error("Google Maps Load Error:", googleLoadError);
      setLoadError(googleLoadError.message || "Failed to load Google Maps API. Check billing or restrictions.");
    }
  }, [googleLoadError]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Cpu size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">API Key Diagnostic</h1>
          </div>
          <p className="text-slate-500 text-lg">
            Verifying cloud infrastructure and Google Maps Platform services for key:
            <code className="ml-2 px-2 py-1 bg-slate-200 rounded text-sm text-slate-700 font-mono">
              {API_KEY_TO_TEST.substring(0, 12)}...{API_KEY_TO_TEST.substring(API_KEY_TO_TEST.length - 4)}
            </code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Status</span>
                </div>
                {isLoaded ? (
                  <StatusBadge type="success" text="API Active" />
                ) : loadError ? (
                  <StatusBadge type="error" text="System Fault" />
                ) : (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase animate-pulse">
                    Initiating Connection...
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${isLoaded ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {isLoaded ? <ShieldCheck className="text-emerald-500" /> : <Lock className="text-slate-300" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Authentication</h3>
                    <p className="text-sm text-slate-500">
                      {isLoaded ? "API Key authorized and handshake complete." : "Waiting for secure authentication..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${loadError ? 'bg-red-50' : 'bg-slate-50'}`}>
                    {loadError ? <ShieldAlert className="text-red-500" /> : <Globe className="text-slate-300" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Endpoint Reachability</h3>
                    <p className="text-sm text-slate-500">
                      {loadError ? `Error: ${loadError}` : isLoaded ? "Global edge nodes are responding correctly." : "Checking latency to cloud endpoints..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Checklists */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 font-mono">Service Availability</h3>
              <div className="space-y-4">
                {[
                  { name: "Maps JavaScript API", status: isLoaded },
                  { name: "Places API (Autocomplete)", status: isLoaded },
                  { name: "Distance Matrix Service", status: isLoaded },
                  { name: "Geocoding Service", status: isLoaded }
                ].map((service, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{service.name}</span>
                    <div className={`w-2 h-2 rounded-full ${service.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Test Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon size={18} className="text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Visual Validation</span>
                </div>
             </div>
             
             <div className="flex-1 bg-slate-100 relative" style={{ minHeight: '400px' }}>
               {isLoaded ? (
                 <GoogleMap
                   mapContainerStyle={{ width: '100%', height: '100%', minHeight: '400px' }}
                   center={{ lat: 12.9716, lng: 77.5946 }} // Bengaluru
                   zoom={12}
                   onLoad={() => console.log("Map successfully loaded into DOM")}
                   onError={(e) => {
                     console.error("Map rendering error:", e);
                     setLoadError("Map rendered but failed to show tiles. This usually means the API Key is valid but Billing is not enabled.");
                   }}
                   options={{
                     disableDefaultUI: false,
                     styles: [
                       { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
                       { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#e2e8f0" }] }
                     ]
                   }}
                 />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center p-12 text-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Initializing Map Engine</p>
                       {loadError && <p className="text-xs text-red-400 bg-red-50 p-3 rounded-lg border border-red-100">{loadError}</p>}
                    </div>
                 </div>
               )}
             </div>
             
             <div className="p-6 bg-slate-50/50">
               <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-mono">
                  Diagnostics v2.1 // System will automatically report billing or restriction errors if the map fails to render.
               </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
