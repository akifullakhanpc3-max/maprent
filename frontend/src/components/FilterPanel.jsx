import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, MapPin, Wifi, Car, Wind, Utensils, Tv, RotateCcw, User, Users, Heart, Dumbbell, WashingMachine } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import '../styles/components/FilterPanel.css';

export default function FilterPanel({ isOpen, onClose }) {
  const { filters, setFilters, setFilter } = usePropertyStore();
  const [initialFilters, setInitialFilters] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setInitialFilters({ ...filters });
      // Lock scroll when filter is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCancel = () => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
    onClose();
  };

  const cities = ['All', 'Bangalore', 'Delhi', 'Mumbai', 'Chennai', 'Hyderabad', 'Pune'];
  const amenityOptions = [
    { id: 'WiFi', icon: <Wifi size={14} /> },
    { id: 'Parking', icon: <Car size={14} /> },
    { id: 'AC', icon: <Wind size={14} /> },
    { id: 'Kitchen', icon: <Utensils size={14} /> },
    { id: 'TV', icon: <Tv size={14} /> },
    { id: 'Gym', icon: <Dumbbell size={14} /> },
    { id: 'Laundry', icon: <WashingMachine size={14} /> },
  ];

  const userTypes = [
    { id: 'Bachelors', icon: <User size={14} /> },
    { id: 'Family', icon: <Users size={14} /> },
    { id: 'Couples', icon: <Heart size={14} /> },
  ];

  const handleToggle = (key, id) => {
    const current = filters[key] || [];
    const updated = current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id];
    setFilter(key, updated);
  };

  const handleAmenityToggle = (id) => {
    const current = filters.amenities || [];
    const updated = current.includes(id)
      ? current.filter(a => a !== id)
      : [...current, id];
    setFilter('amenities', updated);
  };

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 200000,
      bhkType: 'All',
      city: 'All',
      radius: 5,
      amenities: [],
      allowedFor: []
    });
  };

  return (
    <div className={`discovery-filter-overlay ${isOpen ? 'active' : ''}`}>
      <div className="discovery-backdrop" onClick={onClose} />

      <div className="discovery-filter-pane animate-fade-in">
        {/* Header Section */}
        <div className="discovery-header">
          <div className="discovery-title-group">
            <div className="discovery-icon-box">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h2 className="discovery-title">Search Filters</h2>
              <p className="discovery-subtitle">Refine Results</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        {/* Content Section */}
        <div className="discovery-scroll-content custom-scrollbar">

          {/* Location Focus removed - moved to DiscoverCities component */}

          {/* Proximity Search Controls */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base flex items-center gap-2">
                <MapPin size={16} className="text-accent-blue" />
                Proximity Search
              </label>
              {filters.lat && filters.lng ? (
                <div className="flex items-center gap-2">
                  <span className="discovery-val-pill">{filters.radius}km</span>
                  <button
                    onClick={() => setFilters({ lat: null, lng: null })}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded">Inactive</span>
              )}
            </div>

            {filters.lat && filters.lng ? (
              <div className="flex flex-col gap-2">
                <input
                  type="range" min="1" max="25" step="1"
                  value={filters.radius}
                  onChange={(e) => setFilter('radius', Number(e.target.value))}
                  className="discovery-slider accent-blue"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed text-center">
                  Proximity search is currently inactive. <br />
                  Drop a pin on the map to search by distance.
                </p>
              </div>
            )}
          </section>

          {/* Price Range Controls */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Budget Range (₹)</label>
            </div>
            <div className="budget-range-host">
              <div className="budget-input-group">
                <span className="budget-currency">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilter('minPrice', Number(e.target.value))}
                  className="budget-input-field"
                />
              </div>
              <div className="budget-range-separator">-</div>
              <div className="budget-input-group">
                <span className="budget-currency">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice === 200000 ? '' : filters.maxPrice || ''}
                  onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : 200000)}
                  className="budget-input-field"
                />
              </div>
            </div>
            <div className="budget-quick-pills">
               {[20000, 50000, 100000].map(p => (
                 <button 
                  key={p} 
                  onClick={() => setFilter('maxPrice', p)}
                  className="mini-tag !cursor-pointer hover:!bg-slate-200"
                 >
                   Under {p/1000}k
                 </button>
               ))}
            </div>
          </section>


          {/* Configuration Selection */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Unit Configuration</label>
            </div>
            <div className="tab-group-container wrap">
               {['All', '1BHK', '2BHK', '3BHK', 'Studio', 'Villa'].map(type => (
                 <button
                   key={type}
                   onClick={() => setFilter('bhkType', type)}
                   className={`tab-chip-item ${filters.bhkType === type ? 'is-active' : ''}`}
                 >
                   {type}
                 </button>
               ))}
            </div>
          </section>

          {/* Floor Level Preference */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Floor Preference</label>
            </div>
            <div className="tab-group-container wrap">
               {[
                 { id: 'All', label: 'Any Floor' },
                 { id: 'ground', label: 'Ground' },
                 { id: '1-4', label: 'Low (1-4)' },
                 { id: '5-10', label: 'Mid (5-10)' },
                 { id: '11+', label: 'High (11+)' }
               ].map(option => (
                 <button
                   key={option.id}
                   onClick={() => setFilter('floorType', option.id)}
                   className={`tab-chip-item ${filters.floorType === option.id ? 'is-active' : ''}`}
                 >
                   {option.label}
                 </button>
               ))}
            </div>
          </section>

          {/* Premium Protocol Filters (Multi-select) */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Premium Amenities</label>
            </div>
            <div className="tab-group-container wrap">
              {['Furnished', 'Unfurnished'].map(feature => (
                <button
                  key={feature}
                  onClick={() => {
                    const current = filters.advancedFeatures || [];
                    const next = current.includes(feature) 
                      ? current.filter(f => f !== feature) 
                      : [...current, feature];
                    setFilter('advancedFeatures', next);
                  }}
                  className={`tab-chip-item ${(filters.advancedFeatures || []).includes(feature) ? 'is-active' : ''}`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </section>

          {/* User Type Filters (Occupra Core) */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Who is this for?</label>
              {filters.allowedFor?.length > 0 && (
                <button
                  onClick={() => setFilter('allowedFor', [])}
                  className="text-[10px] font-bold text-accent-blue uppercase tracking-tighter"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="tab-group-container wrap">
              {userTypes.map(type => {
                const isActive = filters.allowedFor?.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => handleToggle('allowedFor', type.id)}
                    className={`tab-chip-item ${isActive ? 'active' : ''} !px-6 gap-2 !h-12`}
                  >
                    {type.icon}
                    <span>{type.id}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Essential Amenities */}
          <section className="discovery-section">
            <div className="discovery-section-header">
              <label className="label-base">Amenities</label>
              <span className="discovery-section-tag">{filters.amenities?.length || 0}</span>
            </div>
            <div className="tab-group-container wrap">
              {amenityOptions.map(option => {
                const isActive = filters.amenities?.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleAmenityToggle(option.id)}
                    className={`tab-chip-item ${isActive ? 'active' : ''} !px-5 gap-2`}
                  >
                    {option.icon}
                    <span>{option.id}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Section */}
        <div className="discovery-footer">
          <button
            onClick={resetFilters}
            className="btn btn-secondary discovery-reset-btn"
            title="Restore Defaults"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <div className="flex-row gap-2 grow">
            <button
              onClick={handleCancel}
              className="btn btn-ghost flex-1 !h-12 !text-slate-500 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary bg-blue-600 flex-2 discovery-apply-btn !h-12" style={{ background: "#2563eb" }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
