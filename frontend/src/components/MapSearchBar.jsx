import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, ArrowRight, Loader2, Navigation } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import '../styles/components/MapSearchBar.css';

export default function MapSearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const { filters, setFilter } = usePropertyStore();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowPortal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      setIsLoading(true);
      setShowPortal(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.map(item => ({
          id: item.place_id,
          name: item.display_name.split(',')[0],
          address: item.display_name.split(',').slice(1).join(', '),
          coords: [parseFloat(item.lat), parseFloat(item.lon)]
        })));
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowPortal(false);
    }
  };

  const selectSuggestion = (s) => {
    setQuery(s.name);
    setShowPortal(false);
    if (onSearch && s.coords) onSearch(s.coords, s.name);
  };

  return (
    <div className="premium-search-wrapper" ref={searchRef}>
      <div className={`search-box-container ${showPortal ? 'is-searching' : ''}`}>
        <div className="search-icon-prefix">
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 2 && setShowPortal(true)}
          placeholder="Search by city, area or landmark..."
          className="search-input-field"
        />

        <div className="search-actions-suffix">
          {query && (
            <button
              onClick={() => { setQuery(''); setShowPortal(false); }}
              className="search-clear-btn-premium"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {showPortal && suggestions.length > 0 && (
        <div className="suggestions-portal animate-fade-in animate-slide-up">
          <div className="suggestions-header-label">Top Results</div>
          <div className="suggestions-scrollable custom-scrollbar">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSuggestion(s)}
                className="suggestion-btn-item"
              >
                <div className="suggestion-location-icon">
                  <MapPin size={16} />
                </div>
                <div className="suggestion-info-stack">
                  <div className="suggestion-main-title">{s.name}</div>
                  <div className="suggestion-sub-addr">{s.address}</div>
                </div>
                <ArrowRight size={14} className="suggestion-go-icon" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
