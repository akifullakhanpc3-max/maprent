import React from 'react';
import { MapPin } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';
import '../styles/components/DiscoverCities.css';

const CITIES = [
  { name: 'Bangalore', coords: [12.9716, 77.5946] },
  { name: 'Delhi', coords: [28.6139, 77.2090] },
  { name: 'Mumbai', coords: [19.0760, 72.8777] },
  { name: 'Chennai', coords: [13.0827, 80.2707] },
  { name: 'Hyderabad', coords: [17.3850, 78.4867] },
  { name: 'Pune', coords: [18.5204, 73.8567] }
];

export default function DiscoverCities({ onSelect }) {
  const { filters, setFilter, setFilters } = usePropertyStore();

  const handleCityClick = (city) => {
    // 1. Update Map focus via parent callback
    if (onSelect) onSelect(city.coords);

    // 2. Update Store filters
    setFilters({
      city: city.name,
      lat: city.coords[0],
      lng: city.coords[1],
      radius: 10, // Default exploratory radius
      bounds: null // Clear bounds to prioritize radius search
    });
  };

  return (
    // <div className="discover-cities-container">
    //   {/* <div className="discovery-header-row mb-4">
    //     <div className="discovery-indicator" />
    //     <h3 className="discovery-title">Discover All Cities</h3>
    //   </div> */}

    //   {/* <div className="cities-scroll-viewport custom-scrollbar">
    //     <div className="cities-chip-row">
    //       <button 
    //         onClick={() => setFilter('city', 'All')}
    //         className={`city-explore-chip ${filters.city === 'All' ? 'is-active' : ''}`}
    //       >
    //         All Cities
    //       </button>

    //       {CITIES.map((city) => (
    //         <button
    //           key={city.name}
    //           onClick={() => handleCityClick(city)}
    //           className={`city-explore-chip ${filters.city === city.name ? 'is-active' : ''}`}
    //         >
    //           <MapPin size={10} className="mr-1.5" />
    //           {city.name}
    //         </button>
    //       ))}
    //     </div>
    //   </div> */}
    // </div>
    <></>
  );
}
