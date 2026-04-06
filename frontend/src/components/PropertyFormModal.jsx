import { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { X, Upload, MapPin, Search, Check, Info, ShieldCheck } from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';
import MapSearchBar from './MapSearchBar';
import '../styles/components/BookingFormModal.css'; // Reusing modal core styles

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Premium Pulse Pin for Location Selection
const locationIcon = L.divIcon({
  className: 'search-anchor-wrapper',
  html: `
    <div class="search-anchor-pulse">
      <div class="search-anchor-dot"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size multiple times to catch modal animation frames
    map.invalidateSize();
    const timers = [100, 300, 800].map(ms => setTimeout(() => map.invalidateSize(), ms));
    return () => timers.forEach(t => clearTimeout(t));
  }, [map]);
  return null;
}

function LocationMarker({ position, setPosition, onLocationFound }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      setPosition(coords);
      if (onLocationFound) onLocationFound(coords);
      map.flyTo(coords, map.getZoom()); // Subtle feedback
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={locationIcon} draggable={true} eventHandlers={{
      dragend: (e) => {
        const coords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        setPosition(coords);
        if (onLocationFound) onLocationFound(coords);
      }
    }} />
  );
}

export default function PropertyFormModal({ isOpen, onClose, refresh, existingProperty, initialCoords }) {
  const cities = ['Bangalore', 'Delhi', 'Mumbai', 'Chennai', 'Hyderabad', 'Pune'];
  const amenityOptions = ['WiFi', 'Parking', 'AC', 'Kitchen', 'TV', 'Laundry', 'Gym'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rent: '',
    bhkType: '1BHK',
    city: 'Bangalore',
    amenities: [],
    phone: '',
    whatsapp: '',
    isActive: true
  });
  
  const [position, setPosition] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  const handleLocationSelect = (coords, name) => {
    setPosition(coords);
    if (mapRef.current) {
      mapRef.current.flyTo(coords, 14);
    }
  };

  const reverseGeocode = async (coords) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`);
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
      if (city) {
        setFormData(prev => ({ ...prev, city }));
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  useEffect(() => {
    if (existingProperty) {
      setFormData({
        title: existingProperty.title,
        description: existingProperty.description,
        rent: existingProperty.rent,
        bhkType: existingProperty.bhkType,
        city: existingProperty.city || 'Bangalore',
        amenities: existingProperty.amenities || [],
        phone: existingProperty.phone,
        whatsapp: existingProperty.whatsapp,
        isActive: existingProperty.isActive
      });
      setPosition([existingProperty.location.coordinates[1], existingProperty.location.coordinates[0]]);
    } else if (initialCoords) {
      setPosition(initialCoords);
      reverseGeocode(initialCoords);
    } else {
      setPosition(null); // No pin by default for new properties
    }
  }, [existingProperty, initialCoords]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    const current = formData.amenities;
    const updated = current.includes(amenity) 
      ? current.filter(a => a !== amenity) 
      : [...current, amenity];
    setFormData(prev => ({ ...prev, amenities: updated }));
  };

  const handleFileChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return setError('Please select a location on the map.');
    setLoading(true);

    try {
      if (existingProperty) {
        await api.put(`/properties/${existingProperty._id}`, {
          ...formData,
          lat: position[0],
          lng: position[1]
        });
      } else {
        const payload = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'amenities') {
            payload.append(key, JSON.stringify(formData[key]));
          } else {
            payload.append(key, formData[key]);
          }
        });
        payload.append('lat', position[0]);
        payload.append('lng', position[1]);
        images.forEach(img => payload.append('images', img));

        await api.post('/properties', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      refresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred during listing.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="glass-backdrop" onClick={onClose} />
      <div className="modal-overlay-container">
        <div className="modal-content-standard z-[2001]" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-stack">
             <h2 className="modal-title">{existingProperty ? 'Edit Property Listing' : 'Create New Listing'}</h2>
             <p className="modal-subtitle-pill">Property Specification Console</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body custom-scrollbar">
          <form onSubmit={handleSubmit} className="modal-form-stack">
            {error && (
              <div className="modal-status-box error animate-fade-in">
                 <Info size={14} /> {error}
              </div>
            )}

            {/* Map-First Location Section (FULL WIDTH) */}
            <div className="flex-col gap-2 p-1 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-2">
               <div className="flex-between px-4 py-3">
                 <div className="flex-col">
                    <label className="label-base !m-0">Property Location Context</label>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Search or Pin exactly where the property is located</p>
                 </div>
                 <div className="flex-col items-end">
                    <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">{formData.city || 'Select City on Map'}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Auto-detected from Map</span>
                 </div>
               </div>
               
               <div className="flex-col gap-3">
                  <div className="px-4 pb-2">
                    <MapSearchBar onSearch={(coords, name) => {
                      handleLocationSelect(coords, name);
                      if (name) {
                        const cityName = name.split(',')[0].trim();
                        setFormData(prev => ({ ...prev, city: cityName }));
                      }
                    }} />
                  </div>

                  <div className="relative border-t border-slate-100" style={{ height: '320px' }}>
                     <MapContainer 
                       center={position || [28.6139, 77.2090]} 
                       zoom={position ? 15 : 5} 
                       className="w-full h-full z-0"
                       ref={mapRef}
                     >
                        <MapFixer />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker position={position} setPosition={setPosition} onLocationFound={reverseGeocode} />
                     </MapContainer>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="flex-col gap-5">
                <div className="flex-col gap-2">
                   <label className="label-base">Property Headline</label>
                   <input 
                     name="title" required 
                     value={formData.title} onChange={handleChange} 
                     className="input-base" 
                     placeholder="e.g. Modern 2BHK with Balcony" 
                   />
                </div>

                <div className="flex-row gap-4">
                  <div className="flex-1 flex-col gap-2">
                     <label className="label-base">Monthly Rent (₹)</label>
                     <input 
                       type="number" name="rent" required 
                       value={formData.rent} onChange={handleChange} 
                       className="input-base" 
                       placeholder="25000" 
                     />
                  </div>
                </div>

                <div className="flex-col gap-2">
                   <label className="label-base">Detailed Description</label>
                   <textarea 
                     name="description" required rows="4" 
                     value={formData.description} onChange={handleChange} 
                     className="input-base resize-none !h-auto !py-3" 
                     placeholder="Describe the space, neighborhood, and terms..." 
                   />
                </div>

                <div className="flex-col gap-3">
                   <label className="label-base">Amenities & Features</label>
                   <div className="grid grid-cols-3 gap-2">
                      {amenityOptions.map(option => {
                        const active = formData.amenities.includes(option);
                        return (
                          <button 
                            key={option} type="button" 
                            onClick={() => handleAmenityToggle(option)}
                            className={`btn !h-9 !text-[10px] !px-3 ${active ? 'btn-primary' : 'btn-secondary'}`}
                          >
                            {option}
                             {active && <Check size={12} className="ml-1" />}
                          </button>
                        );
                      })}
                   </div>
                </div>

                <div className="flex-row gap-4">
                   <div className="flex-1 flex-col gap-2">
                      <label className="label-base">Phone Line</label>
                      <input name="phone" required value={formData.phone} onChange={handleChange} className="input-base" placeholder="+91..." />
                   </div>
                   <div className="flex-1 flex-col gap-2">
                      <label className="label-base">WhatsApp</label>
                      <input name="whatsapp" required value={formData.whatsapp} onChange={handleChange} className="input-base" placeholder="+91..." />
                   </div>
                </div>
              </div>

              {/* Right Column: Media */}
              <div className="flex-col gap-5">
                 <div className="flex-col gap-2">
                    <label className="label-base">Media Assets</label>
                    {!existingProperty ? (
                      <div className="flex-center flex-col gap-2 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                        <Upload size={24} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {images.length > 0 ? `${images.length} Files Selected` : 'Drop Property Photos'}
                        </span>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                         <ShieldCheck size={20} className="text-success-color" />
                         <span className="text-xs font-bold text-slate-500">Live content images are managed separately.</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="modal-footer !flex-row !justify-end !mt-8 pt-6 border-t border-slate-100">
               <button type="button" onClick={onClose} className="btn btn-ghost px-6">Cancel</button>
               <button 
                 type="submit" disabled={loading}
                 className="btn btn-primary px-10"
               >
                 {loading ? <LoadingSpinner size="small" /> : existingProperty ? 'Commit Changes' : 'Broadcast Listing'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
