import { X, SlidersHorizontal, MapPin, Wifi, Car, Wind, Utensils, Tv, RotateCcw } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import '../styles/components/FilterPanel.css';

export default function FilterPanel({ isOpen, onClose }) {
  const { filters, setFilters, setFilter } = usePropertyStore();

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
           >
             <RotateCcw size={14} />
             Reset
           </button>
           <button 
             onClick={onClose}
             className="btn btn-primary discovery-apply-btn"
           >
             Apply Filters
           </button>
        </div>
      </div>
    </div>
  );
}
