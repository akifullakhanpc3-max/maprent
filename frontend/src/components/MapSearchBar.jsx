import { useState, useRef, useEffect } from 'react';
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
  const { setFilters } = usePropertyStore();
  const searchRef = useRef(null);

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
      const data = await response.json();

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
      if (results.length === 0 && assistantResult.suggestions.length > 0) {
        results = assistantResult.suggestions.map((s, idx) => ({
           id: `fallback-${idx}`,
           name: s.name,
           address: s.city ? `${s.name}, ${s.city}` : 'Click to discover this city',
           type: s.type,
           coords: null, // User will need to search this specifically
           source: 'assistant'
        }));
      }

      setSuggestions(results);
      if (assistantResult.isCorrection && assistantResult.bestMatch) {
        setCorrection(assistantResult.bestMatch.name);
      }

    } catch (err) {
      console.error('Scalable Search Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) fetchSmartSuggestions(query);
    }, 300); // 300ms Debounce
    return () => clearTimeout(timer);
  }, [query]);

  const selectSuggestion = (s) => {
    if (s.source === 'assistant') {
      setQuery(s.name);
      return; 
    }
    
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

      {showPortal && (
        <div className="suggestions-portal animate-fade-in animate-slide-up">
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
              <button key={s.id} onClick={() => selectSuggestion(s)} className="suggestion-btn-item">
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
        </div>
      )}
    </div>
  );
}
