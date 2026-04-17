import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyStore } from '../store/usePropertyStore';
import { BASE_URL } from '../api/axios';
import { 
  ArrowLeft, MapPin, Grid, CheckCircle2, Share2, Heart, 
  ShieldCheck, Zap, Info, Clock, Navigation2 
} from 'lucide-react';
import BookingFormModal from '../components/BookingFormModal';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import Navbar from '../components/Navbar';
import '../styles/pages/PropertyDetails.css'; // Refined details styling

const getFloorSuffix = (floor) => {
  if (floor >= 11 && floor <= 13) return 'th';
  switch (floor % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchPropertyById, loading } = usePropertyStore();
  
  const [property, setProperty] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      const data = await fetchPropertyById(id);
      if (data) {
        setProperty(data);
      } else {
        setError("Technical entity not resolved in this node.");
      }
    };
    loadDetails();
    window.scrollTo(0, 0);
  }, [id, fetchPropertyById]);

  const handleGetDirections = () => {
    if (property?.location?.coordinates) {
       const [lng, lat] = property.location.coordinates;
       window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  if (loading && !property) {
    return (
      <div className="min-h-screen bg-surface flex-center flex-col gap-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-low font-bold uppercase tracking-widest text-[10px]">Syncing Listing Node...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-surface flex-center flex-col gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex-center mb-4 border border-rose-100 shadow-sm">
           <Info size={32} />
        </div>
        <h2 className="text-xl font-black text-main tracking-tighter">Listing Not Found</h2>
        <p className="text-muted text-sm max-w-xs">{error || "The property you're looking for might have been unlisted or moved."}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-6 !px-10">Back to Discovery</button>
      </div>
    );
  }

  return (
    <div className="details-page-root">
      <Navbar />
      
      <div className="details-container">
        <div className="flex-col gap-8 animate-fade-in">
          
          {/* Top Navigation & Actions */}
          <div className="flex-between items-center sm:px-4">
             <button 
               onClick={() => window.close()} 
               className="btn btn-ghost !pl-0 text-low hover:text-main"
             >
               <ArrowLeft size={16} />
               <span className="font-bold text-xs uppercase tracking-widest ml-2">Close Details</span>
             </button>
             
             <div className="flex items-center gap-3">
                <button className="btn btn-secondary !h-10 !w-10 rounded-xl" title="Share Listing">
                   <Share2 size={16} />
                </button>
                <button 
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`btn btn-secondary !h-10 !w-10 rounded-xl ${isWishlisted ? 'is-active' : ''}`}
                  title={isWishlisted ? "Favorited" : "Add to Favorites"}
                >
                   <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            
            {/* Visual Column */}
            <div className="lg:col-span-7 flex-col gap-10">
               <div className="property-hero-preview">
                  {property.images && property.images.length > 0 ? (
                    <ImageWithSkeleton 
                      src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`} 
                      alt={property.title}
                      className="hero-img-obj"
                    />
                  ) : (
                    <div className="flex-center h-full bg-slate-100 text-slate-300"><Grid size={64} /></div>
                  )}
                  <div className="floating-meta-badges">
                     <span className="premium-badge !px-4 !py-2 !text-[9px] uppercase tracking-widest">{property.bhkType} Unit</span>
                     <div className="verification-badge !px-4 !py-2 !text-[9px] bg-slate-900/40 text-white backdrop-blur uppercase tracking-widest">
                        <ShieldCheck size={12} />
                        <span>Occupra Verified</span>
                     </div>
                  </div>
               </div>

               {/* Narratives Section */}
               <div className="console-card !p-8 md:!p-12 flex-col gap-6">
                  <h3 className="text-lg font-black text-main tracking-tighter border-b border-slate-100 pb-5 uppercase">Architectural Narrative</h3>
                  <p className="text-slate-600 leading-relaxed text-base font-medium">
                     {property.description || "No description provided for this listing."}
                  </p>
               </div>

               {property.amenities?.length > 0 && (
                <div className="flex-col gap-8">
                  <div className="flex items-center gap-3">
                     <h4 className="text-lg font-black text-main tracking-tighter uppercase">Listing Ecosystem</h4>
                     <div className="h-[2px] bg-slate-100 grow" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {property.amenities?.map((amenity, idx) => (
                      <div key={idx} className="flex-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400/30 transition-all group shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="w-8 min-w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex-center group-hover:scale-110 transition-transform">
                               <CheckCircle2 size={12} />
                            </div>
                            <span className="font-bold text-[11px] uppercase tracking-wide text-slate-600 truncate">{amenity}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
               )}
            </div>

            {/* Tactical Column */}
            <div className="lg:col-span-5 flex-col gap-8">
               <div className="tactical-sidebar-node">
                  
                  <div className="console-card !p-8 md:!p-10 flex-col gap-8 shadow-2xl border-none">
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
                           <MapPin size={12} />
                           {property.city || 'Regional Center'}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[0.9]">{property.title}</h1>
                     </div>

                     <div className="flex-between items-center py-6 border-y border-slate-50">
                        <div className="flex-col gap-1">
                           <span className="uppercase !text-[9px] font-black tracking-widest text-slate-400">Monthly Lease Node</span>
                           <p className="text-4xl font-black text-indigo-600 tracking-tighter leading-none">₹{property.rent.toLocaleString()}</p>
                        </div>
                        <div className="status-pill success !px-4 !py-2 uppercase font-black text-[10px] tracking-widest">Live Asset</div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="action-stat-card !flex-1 !bg-slate-50 !border-none !p-5 rounded-2xl">
                          <Zap size={18} className="text-amber-500" />
                          <div className="flex-col">
                             <span className="stat-label !text-[8px] uppercase tracking-widest font-black text-slate-400">Application</span>
                             <span className="stat-val !text-sm font-black text-slate-900">Instant</span>
                          </div>
                        </div>
                        <div className="action-stat-card !flex-1 !bg-slate-50 !border-none !p-5 rounded-2xl">
                          <ShieldCheck size={18} className="text-emerald-500" />
                          <div className="flex-col">
                             <span className="stat-label !text-[8px] uppercase tracking-widest font-black text-slate-400">Protocol</span>
                             <span className="stat-val !text-sm font-black text-slate-900">Verified</span>
                          </div>
                        </div>
                        {property.floor !== undefined && (
                          <div className="action-stat-card !flex-1 !bg-slate-50 !border-none !p-5 rounded-2xl col-span-2">
                            <Grid size={18} className="text-indigo-500" />
                            <div className="flex-col">
                               <span className="stat-label !text-[8px] uppercase tracking-widest font-black text-slate-400">Vertical Context</span>
                               <span className="stat-val !text-sm font-black text-slate-900">
                                 {property.floor === 0 ? 'Ground Floor' : `${property.floor}${getFloorSuffix(property.floor)} Floor`}
                                 {property.totalFloors > 1 && ` of ${property.totalFloors} Storeys`}
                               </span>
                            </div>
                          </div>
                        )}
                     </div>

                     <div className="flex-col gap-4 mt-2">
                        <button 
                          onClick={() => setShowBookingModal(true)}
                          className="btn btn-primary w-full !h-16 !text-sm !font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <Navigation2 size={18} className="mr-3" />
                          Commence Application
                        </button>

                        <button 
                          onClick={handleGetDirections}
                          className="btn-directions"
                        >
                           <MapPin size={14} className="text-indigo-400" />
                           Navigate to Asset Location
                        </button>

                        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">
                           Secure Discovery via Occupra Neural Grid
                        </p>
                     </div>
                  </div>

                  <div className="console-card !p-8 !bg-slate-900 border-none flex items-center gap-6 group hover:scale-[1.02] transition-all shadow-xl">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex-center text-white shrink-0 group-hover:rotate-12 transition-transform">
                        <Clock size={20} />
                     </div>
                     <div className="flex-col gap-1">
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest">Listing Horizon</h4>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Active since {new Date(property.createdAt).toLocaleDateString('en-GB')}.</p>
                     </div>
                  </div>

               </div>
            </div>

          </div>

        </div>
      </div>

      {showBookingModal && (
        <BookingFormModal 
          isOpen={showBookingModal} 
          onClose={() => setShowBookingModal(false)} 
          propertyId={property._id} 
          propertyTitle={property.title}
        />
      )}
    </div>
  );
}
