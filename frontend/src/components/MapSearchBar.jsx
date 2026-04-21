import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, X, ArrowRight, Loader2, Sparkles, Landmark, Zap } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import { findClosestIndianLocation, getCachedSearch, saveSearchToCache } from '../utils/indiaSearchAssistant';
import '../styles/components/MapSearchBar.css';

export default function MapSearchBar({ onSearch, currentBounds }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [correction, setCorrection] = useState(null);
  const { filters, setFilters } = usePropertyStore();
  const searchRef = useRef(null);
  const skipNextFetch = useRef(false);

  // --- 🧠 1. Smart Intent Extraction (NLP-Lite) ---
  const extractIntent = (input) => {
    const text = input.toLowerCase();
    const intent = { bhk: null, price: null, original: input };

    const bhkMatch = text.match(/(\d)\s?bhk/);
    if (bhkMatch) intent.bhk = `${bhkMatch[1]}BHK`;

    const kMatch = text.match(/under\s?(\d+)\s?k/);
    if (kMatch) intent.price = parseInt(kMatch[1]) * 1000;
    
    const lakhMatch = text.match(/under\s?(\d+)\s?lakh/);
    if (lakhMatch) intent.price = parseInt(lakhMatch[1]) * 100000;

    const numMatch = text.match(/under\s?(\d{4,7})/);
    if (numMatch) intent.price = parseInt(numMatch[1]);

    intent.locationQuery = text
      .replace(/(\d)\s?bhk/g, '')
      .replace(/under\s?\d+\s?(k|lakh)?/g, '')
      .replace(/(in|near|near to|at)\b/g, '')
      .trim();

    return intent;
  };

  // --- 🔍 2. Scalable AI Search Logic ---
  const fetchSmartSuggestions = async (searchTerm) => {
    if (searchTerm.length < 3) return;

    setIsLoading(true);
    setShowPortal(true);
    setCorrection(null);

    // a. Check Local Cache / Assistant first
    const assistantResult = findClosestIndianLocation(searchTerm);
    const intent = extractIntent(searchTerm);
    const apiQuery = assistantResult.bestMatch?.name || intent.locationQuery || searchTerm;

    try {
      // b. Fetch from Nominatim with India-Only & Viewbox Bias
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(apiQuery)}&limit=6&addressdetails=1&countrycodes=in`;
      if (currentBounds) url += `&viewbox=${currentBounds}&bounded=0`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Search API failed with status: ${response.status}`);
      
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Search API returned invalid data format');

      // c. Formatting and Ranking
      let results = data.map(item => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        address: item.display_name.split(',').slice(1).join(', '),
        type: item.type,
        coords: [parseFloat(item.lat), parseFloat(item.lon)],
        intent: (intent.bhk || intent.price) ? intent : null,
        source: 'api'
      }));

      // d. Fallback: If API yields zero, use Assistant's top suggestions
      if (results.length === 0 && assistantResult.suggestions && assistantResult.suggestions.length > 0) {
        results = assistantResult.suggestions.map((s, idx) => ({
           id: `fallback-${idx}`,
           name: s.name,
           address: s.city ? `${s.name}, ${s.city}` : 'Click to discover this city',
           type: s.type,
           coords: null, // User will need to search this specifically
           source: 'assistant'
        }));
      }

      // d. Hybridize: Prepend local results if they match query well, otherwise use API
      setSuggestions(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const apiIds = new Set(results.map(r => r.id));
        const filteredLocal = safePrev.filter(p => !apiIds.has(p.id));
        return [...results, ...filteredLocal].slice(0, 8);
      });

      if (assistantResult.isCorrection && assistantResult.bestMatch) {
        setCorrection(assistantResult.bestMatch.name);
      }

    } catch (err) {
      console.error('Scalable Search Error (Hardened):', err);
      // Fallback to local suggestions on error to keep UI stable
      if (assistantResult.suggestions) {
         setSuggestions(assistantResult.suggestions.map((s, idx) => ({
            id: `error-fallback-${idx}`,
            name: s.name,
            address: s.city ? `${s.name}, ${s.city}` : 'Major Indian City',
            type: s.type,
            coords: s.coords || null,
            source: 'local'
         })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setCorrection(null);
      setShowPortal(false);
      return;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    // --- 🚀 INSTANT LOCAL SEARCH (Sync) ---
    const localResult = findClosestIndianLocation(query);
    if (localResult.bestMatch || localResult.suggestions.length > 0) {
      setShowPortal(true);
      setCorrection(localResult.isCorrection ? localResult.bestMatch.name : null);
      
      const localFormatted = localResult.suggestions.map((s, idx) => ({
        id: `local-${idx}`,
        name: s.name,
        address: s.city ? `${s.name}, ${s.city}` : 'Major Indian City',
        type: s.type,
        coords: s.coords || null,
        source: 'local'
      }));
      setSuggestions(localFormatted);
    }

    // --- ⏳ DEBOUNCED API SEARCH (Async) ---
    const timer = setTimeout(() => {
      if (query) {
        fetchSmartSuggestions(query);
      }
    }, 500); // 500ms Debounce for API to reduce load
    return () => clearTimeout(timer);
  }, [query]);

  const selectSuggestion = (s) => {
    if (s.source === 'assistant') {
      setQuery(s.name);
      // Automatically trigger search for the city if coords exist or if it's a known city
      if (s.coords) {
        if (onSearch) onSearch(s.coords, s.name);
        setShowPortal(false);
      }
      return; 
    }
    
    
    skipNextFetch.current = true;
    setQuery(s.name);
    setShowPortal(false);
    
    if (s.intent) {
      const newFilters = {};
      if (s.intent.bhk) newFilters.bhkType = s.intent.bhk;
      if (s.intent.price) newFilters.maxPrice = s.intent.price;
      setFilters(newFilters);
    }

    if (onSearch) onSearch(s.coords, s.name);
  };

  const highlight = (text, match) => {
    if (!match) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === match.toLowerCase() 
        ? <span key={i} className="search-match-highlight">{part}</span> 
        : part
    );
  };

  return (
    <div className="premium-search-wrapper" ref={searchRef}>
      <div className={`search-box-container ${showPortal ? 'is-searching' : ''}`}>
        <div className="search-icon-prefix">
          {isLoading ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <Search size={18} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try 'Bangaluru', 'Noidaa', 'Gurgoan'..."
          className="search-input-field"
        />
        {query && (
          <button onClick={() => { setQuery(''); setCorrection(null); setShowPortal(false); }} className="search-clear-btn-premium">
            <X size={14} />
          </button>
        )}
      </div>

      {showPortal && createPortal(
        <div 
          className="suggestions-portal animate-fade-in animate-slide-up"
          style={window.innerWidth > 768 ? {
            position: 'fixed',
            top: `${searchRef.current?.getBoundingClientRect().bottom + 10}px`,
            left: `${searchRef.current?.getBoundingClientRect().left}px`,
            width: `${searchRef.current?.getBoundingClientRect().width}px`,
            zIndex: 9999
          } : {
            position: 'fixed',
            top: `${searchRef.current?.getBoundingClientRect().bottom + 8}px`,
            left: '12px',
            right: '12px',
            width: 'calc(100% - 24px)',
            zIndex: 9999,
            borderRadius: '12px'
          }}
        >
          {correction && (
             <div className="smart-correction-banner">
               <Zap size={14} className="text-amber-500 fill-amber-500" />
               <span>Showing results for <button onClick={() => setQuery(correction)} className="correction-link">{correction}</button></span>
             </div>
          )}

          <div className="suggestions-header-label">
            {isLoading ? 'Scanning Localities...' : 'Intelligent Indian Discovery'}
          </div>

          <div className="suggestions-scrollable custom-scrollbar">
            {suggestions.map((s) => (
              <button 
                key={s.id} 
                onPointerDown={(e) => { 
                  e.preventDefault(); 
                  selectSuggestion(s); 
                }} 
                className="suggestion-btn-item"
              >
                <div className="suggestion-location-icon">
                  {s.type === 'area' ? <Landmark size={16} /> : <MapPin size={16} />}
                </div>
                <div className="suggestion-info-stack">
                  <div className="suggestion-main-title">
                    {highlight(s.name, query)}
                    {s.intent && <span className="intent-pill-small">{s.intent.price ? `₹${(s.intent.price/1000).toFixed(0)}k` : s.intent.bhk}</span>}
                  </div>
                  <div className="suggestion-sub-addr">{s.address}</div>
                </div>
                <ArrowRight size={14} className="suggestion-go-icon" />
              </button>
            ))}
            {suggestions.length === 0 && !isLoading && (
              <div className="p-8 text-center text-slate-400 text-sm">No results found for this area.</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
