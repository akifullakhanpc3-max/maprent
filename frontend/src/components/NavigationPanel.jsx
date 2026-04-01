import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Navigation, MapPin, Clock, RotateCcw, ChevronRight, Search, X, Loader2, LocateFixed, AlertCircle, Navigation2, Grid } from 'lucide-react';

export default function NavigationPanel({ routeData, onClear, propertyTitle, onSearchRoute, selectedProperty, onLocate, isRouting }) {
  const [startQuery, setStartQuery] = useState('My Location');
  const [endQuery, setEndQuery] = useState(propertyTitle || '');
  const [searchResults, setSearchResults] = useState({ start: [], end: [] });
  const [activeSearch, setActiveSearch] = useState(null); // 'start' or 'end'
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (propertyTitle) setEndQuery(propertyTitle);
  }, [propertyTitle]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      await onLocate();
      setStartQuery('Your Current Location');
    } catch (err) {
      console.error('Locate error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const { distance, duration, steps } = routeData || {};

  const searchLocations = useCallback(async (query, type) => {
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(prev => ({ ...prev, [type]: data }));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSearch && (activeSearch === 'start' ? startQuery : endQuery).length >= 3) {
        searchLocations(activeSearch === 'start' ? startQuery : endQuery, activeSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [startQuery, endQuery, activeSearch, searchLocations]);

  const handleSelectLocation = (loc, type) => {
    const coords = [parseFloat(loc.lat), parseFloat(loc.lon)];
    setSearchResults(prev => ({ ...prev, [type]: [] }));
    setActiveSearch(null);
    
    if (type === 'start') {
        setStartQuery(loc.display_name);
        onSearchRoute(coords, null); 
    } else {
        setEndQuery(loc.display_name);
        onSearchRoute(null, coords);
    }
  };

  const formatDistance = (meters) => {
    if (!meters) return '0m';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 mins';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <div className="property-list-pane animate-fade-in">
      <div className="pane-sticky-header flex-col !items-start !h-auto gap-6 py-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button onClick={onClear} className="btn btn-ghost !p-0 !h-9 !w-9">
              <ArrowLeft size={16} />
            </button>
            <h2 className="results-count !text-lg">Route Analysis</h2>
          </div>
          <button onClick={onClear} className="btn btn-ghost !p-0 !h-9 !w-9" title="Reset Route">
            <RotateCcw size={14} className="text-low" />
          </button>
        </div>

        <div className="nav-location-nodes">
          <div className="connecting-wire" />
          
          <div 
            className="relative" 
            style={{ zIndex: activeSearch === 'start' ? 110 : 10 }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-center z-10 w-4 h-4">
              <div className={`node-indicator origin ${isLocating ? 'animate-pulse' : ''}`} />
            </div>
            <input
              type="text"
              value={startQuery}
              onChange={(e) => { setStartQuery(e.target.value); setActiveSearch('start'); }}
              placeholder="Origin node..."
              className="input-base !pl-11 !pr-10 !text-xs !bg-card !border-slate-100 hover:!border-primary/20 focus:!border-primary/40 transition-all font-bold"
            />
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-primary disabled:opacity-50"
            >
              {isLocating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={14} />}
            </button>

            {activeSearch === 'start' && searchResults.start.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-subtle rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar"
                style={{ zIndex: 100 }}
              >
                {searchResults.start.map((loc, i) => (
                  <button key={i} onClick={() => handleSelectLocation(loc, 'start')} className="suggestion-node-item is-origin">
                    <div className="suggestion-node-icon"><Search size={12} /></div>
                    <div className="suggestion-node-text">
                      <span className="suggest-main">{loc.display_name.split(',')[0]}</span>
                      <span className="suggest-sub">{loc.display_name.split(',').slice(1, 4).join(',')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div 
            className="relative"
            style={{ zIndex: activeSearch === 'end' ? 110 : 5 }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex-center z-10 w-4 h-4">
               <div className="node-indicator destination" />
            </div>
            <input
              type="text"
              value={endQuery}
              onChange={(e) => { setEndQuery(e.target.value); setActiveSearch('end'); }}
              placeholder="Destination unit..."
              className="input-base !pl-11 !text-xs !bg-card !border-slate-100 hover:!border-error/20 focus:!border-error/40 transition-all font-bold"
            />
            {activeSearch === 'end' && searchResults.end.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-subtle rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar"
                style={{ zIndex: 100 }}
              >
                {searchResults.end.map((loc, i) => (
                  <button key={i} onClick={() => handleSelectLocation(loc, 'end')} className="suggestion-node-item is-destination">
                    <div className="suggestion-node-icon"><MapPin size={12} /></div>
                    <div className="suggestion-node-text">
                       <span className="suggest-main">{loc.display_name.split(',')[0]}</span>
                       <span className="suggest-sub">{loc.display_name.split(',').slice(1, 4).join(',')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pane-scroll-content custom-scrollbar p-6 !pt-0">
        {routeData ? (
          <div className="animate-slide-up flex-col gap-8 py-6">
            <div className="action-stat-card !flex-col !items-stretch !p-6 !bg-card !border-subtle relative overflow-hidden group">
               <div className="flex-col gap-2 relative z-10">
                  <span className="section-title !p-0">Estimated ETA</span>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Clock size={20} className="text-primary" />
                        <span className="text-3xl font-black">{formatDuration(duration)}</span>
                     </div>
                     <span className="badge !bg-surface !border-subtle">{formatDistance(distance)}</span>
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                      const start = routeData.coordinates[0];
                      const end = routeData.coordinates[routeData.coordinates.length - 1];
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&travelmode=driving`;
                      window.open(url, '_blank');
                  }}
                  className="btn btn-primary flex-1 !h-12 !text-xs !font-black uppercase tracking-widest"
                >
                  <Navigation2 size={16} className="mr-2" />
                  Launch Navigation
                </button>
                <button 
                  onClick={() => {
                      const end = routeData.coordinates[routeData.coordinates.length - 1];
                      window.open(`https://www.google.com/maps/@?api=1&map_action=map&center=${end[0]},${end[1]}&zoom=18&basemap=satellite`, '_blank');
                  }}
                  className="btn btn-secondary !h-12 !w-12 !p-0"
                  title="Satellite View"
                >
                  <Grid size={16} />
                </button>
               </div>
            </div>

            <div className="flex-col gap-4">
              <h4 className="section-title">Procedural Instructions</h4>
              <div className="flex-col border border-subtle rounded-xl overflow-hidden">
                {steps?.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-4 hover:bg-card border-b border-subtle last:border-0 transition-all">
                    <div className="w-6 h-6 rounded-md bg-surface border border-subtle flex-center shrink-0">
                       <span className="text-[10px] font-bold text-low">{idx + 1}</span>
                    </div>
                    <div className="flex-col gap-1.5 flex-1">
                       <p className="text-xs font-semibold text-main leading-relaxed">{step.maneuver.instruction}</p>
                       <span className="text-[10px] text-muted font-mono">{formatDistance(step.distance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-stat-card !bg-primary !bg-opacity-5 !border-primary !border-opacity-20 !p-6 flex gap-4">
               <div className="w-10 h-10 rounded-lg bg-primary flex-center shrink-0">
                  <MapPin size={18} className="text-white" />
               </div>
               <div className="flex-col justify-center">
                  <span className="text-xs font-bold text-main">Destination reached</span>
                  <p className="text-[10px] text-muted mt-0.5">{propertyTitle}</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="pane-empty-state">
             <div className="empty-icon-box">
                <Navigation size={32} />
             </div>
             <h3 className="empty-title">Trajectory Idle</h3>
             <p className="empty-text">Initialize route calculation by specifying an origin coordinate.</p>
          </div>
        )}
      </div>

      <div className="pane-footer-actions !justify-center !py-4 border-t-0">
         <span className="text-[9px] font-bold text-low uppercase tracking-[0.2em]">Engineered x OSRM Core API</span>
      </div>
    </div>
  );
}
