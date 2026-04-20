import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Search, ArrowRight, Home, Loader2, Landmark, Clock, Navigation2 } from 'lucide-react';
import api, { BASE_URL } from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import PropertyDetailsOverlay from '../../components/PropertyDetailsOverlay';
import '../../styles/views/Dashboards.css';

export default function SavedHomes() {
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const { toggleWishlist } = useAuthStore();
  const navigate = useNavigate();

  const fetchSavedHomes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/wishlist');
      setSavedProperties(res.data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedHomes();
  }, []);

  const handleRemove = async (e, propertyId) => {
    e.stopPropagation();
    const success = await toggleWishlist(propertyId);
    if (success) {
      setSavedProperties(prev => prev.filter(p => p._id !== propertyId));
      if (selectedProperty?._id === propertyId) setSelectedProperty(null);
    }
  };

  const getDaysAgo = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const created = new Date(date);
    const diffDays = Math.floor(Math.abs(now - created) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Today' : `${diffDays}d ago`;
  };

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* Header Panel */}
      <header className="properties-header-premium">
        <div className="header-watermark">
           <Heart size={180} fill="currentColor" />
        </div>
        
        <div className="header-content-stack">
           <div className="flex-col gap-2">
             <div className="title-pill-row">
               <div className="header-icon-box-rose">
                  <Heart size={20} className="text-white" fill="currentColor" />
               </div>
               <h1 className="text-2xl font-black tracking-tighter">Your Saved Gallery</h1>
             </div>
             <p className="text-slate-400 text-sm font-medium">Manage your shortlisted assets and potential acquisitions</p>
           </div>

           <div className="header-stats-pill">
              <div className="flex-col">
                 <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{savedProperties.length}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Shortlisted</span>
              </div>
           </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex-center py-32 flex-col gap-4">
           <Loader2 className="animate-spin text-primary" size={40} />
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hydrating Wishlist...</p>
        </div>
      ) : savedProperties.length === 0 ? (
        <div className="console-card flex-center flex-col py-32 border-dashed bg-slate-50/50">
           <div className="w-20 h-20 bg-white rounded-full flex-center shadow-sm border border-slate-100 mb-6">
              <Search size={32} className="text-slate-200" />
           </div>
           <h3 className="text-xl font-black text-slate-800 mb-2">No Active Shortlists</h3>
           <p className="text-slate-500 text-sm mb-8 max-w-xs text-center">
             Your saved gallery is currently empty. Start exploring the map to find your next home.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="btn btn-primary !px-10"
           >
             Discover Map <ArrowRight size={16} className="ml-2" />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {savedProperties.map((property) => (
             <div 
               key={property._id} 
               key={property._id} 
               className="console-card !p-0 group hover:border-rose-200 transition-all cursor-pointer overflow-hidden"
               onClick={() => setSelectedProperty(property)}
             >
                {/* Image Section */}
                <div className="h-48 relative overflow-hidden">
                   <ImageWithSkeleton 
                     src={property.images?.[0]?.startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`}
                     alt={property.title}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                   
                   <button 
                     onClick={(e) => handleRemove(e, property._id)}
                     className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex-center text-rose-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
                   >
                     <Heart size={18} fill="currentColor" />
                   </button>

                   <div className="absolute bottom-4 left-4">
                      <div className="badge-item !bg-rose-500 !text-white !p-1 !px-3 font-bold text-[10px]">
                         ₹{property.price?.toLocaleString()}
                      </div>
                   </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-col gap-4">
                   <div className="flex-col gap-1">
                      <h3 className="text-base font-black text-slate-800 line-clamp-1 group-hover:text-rose-600 transition-colors uppercase tracking-tight">
                         {property.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500">
                         <MapPin size={12} className="text-slate-400" />
                         <span className="text-[11px] font-bold">{property.city}</span>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-2">
                       <span className="tag-pill color-purple !text-[9px] !py-0.5">{property.bhkType}</span>
                       <span className="tag-pill color-gray !text-[9px] !py-0.5">{property.propertyType}</span>
                       <span className="tag-pill color-blue !text-[9px] !py-0.5">{getDaysAgo(property.createdAt)}</span>
                   </div>

                   <div className="h-px bg-slate-100 my-1" />

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex-center">
                            <Navigation2 size={14} className="text-slate-400" />
                         </div>
                         <div className="flex-col">
                            <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tighter">Verified</span>
                            <span className="text-[8px] text-slate-500 uppercase font-black">Asset Registry</span>
                         </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Property Details Overlay */}
      {selectedProperty && (
        <PropertyDetailsOverlay 
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onShowRoute={() => {
            setSelectedProperty(null);
            navigate('/'); // Redirect to map for route visualization
          }}
        />
      )}
    </div>
  );
}
