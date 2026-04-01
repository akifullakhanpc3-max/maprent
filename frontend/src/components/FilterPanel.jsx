import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, MapPin, Wifi, Car, Wind, Utensils, Tv, RotateCcw } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import '../styles/components/FilterPanel.css';

export default function FilterPanel({ isOpen, onClose }) {
  const { filters, setFilters, setFilter } = usePropertyStore();
  const [initialFilters, setInitialFilters] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setInitialFilters({ ...filters });
    }
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
  ];

  const handleAmenityToggle = (id) => {
    const current = filters.amenities || [];
    const updated = current.includes(id) 
      ? current.filter(a => a !== id) 
      : [...current, id];
    setFilter('amenities', updated);
  };

  const resetFilters = () => {
    setFilters({ 
      maxRent: 200000, 
      bhkType: 'All', 
      city: 'All', 
      radius: 5, 
      amenities: [] 
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

          {/* Location Focus */}
          <section className="discovery-section">
            <div className="discovery-section-header">
               <label className="label-base">City Selection</label>
            </div>
            <div className="discovery-input-wrapper">
              <select 
                value={filters.city}
                onChange={(e) => setFilter('city', e.target.value)}
                className="input-base"
              >
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </section>

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
                      onClick={() => {
                        setFilter('lat', null);
                        setFilter('lng', null);
                      }}
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

          {/* Price Performance Range */}
          <section className="discovery-section">
            <div className="discovery-section-header">
               <label className="label-base">Budget Ceiling</label>
               <span className="discovery-val-pill">₹{(filters.maxRent / 1000).toFixed(0)}k</span>
            </div>
            <input 
              type="range" min="10000" max="200000" step="5000"
              value={filters.maxRent}
              onChange={(e) => setFilter('maxRent', Number(e.target.value))}
              className="discovery-slider"
            />
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
                   className={`tab-chip-item ${filters.bhkType === type ? 'active' : ''}`}
                 >
                   {type}
                 </button>
               ))}
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
                className="btn btn-primary flex-2 discovery-apply-btn !h-12"
              >
                Apply
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
