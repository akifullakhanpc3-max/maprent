import React, { useState, useEffect } from 'react';
import { X, MapPin, Grid, CheckCircle2, Share2, Heart, ShieldCheck, Zap, Clock, Navigation2, Phone, MessageSquare, ChevronRight, Layers, Maximize } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import ImageWithSkeleton from './ImageWithSkeleton';
import { BASE_URL } from '../api/axios';

export default function PropertyDetailsOverlay({ property, onClose, onShowRoute }) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!property) return null;

  const getFloorSuffix = (floor) => {
    if (floor === undefined || floor === null) return '';
    if (floor >= 11 && floor <= 13) return 'th';
    switch (floor % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const phoneNum = property.phone || '910000000000';
  const whatsappNum = property.whatsapp || phoneNum;

  return (
    <div className="discovery-overlay-root animate-fade-in">
      <div className="overlay-backdrop" onClick={onClose} />
      
      <div className="overlay-slide-panel master-card-panel animate-slide-left">
        {/* Glass Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 md:p-5 bg-white/95 backdrop-blur-xl border-b border-slate-100">
           <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
              <X size={20} />
           </button>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-10 h-10 flex-center rounded-full border transition-all ${isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button className="w-10 h-10 flex-center rounded-full border border-slate-100 bg-white text-slate-400 hover:border-slate-300 transition-all">
                <Share2 size={18} />
              </button>
           </div>
        </div>

        <div className="overlay-body-scroll custom-scrollbar relative">
           {/* Hero Gallery Piece */}
           <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden">
              {property.images?.[0] ? (
                 <ImageWithSkeleton 
                   src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`}
                   alt={property.title}
                   className="w-full h-full object-cover"
                 />
              ) : (
                 <div className="flex-center h-full bg-slate-50 text-slate-200"><Grid size={48} /></div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-slate-900/90 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md">
                    {property.bhkType} Unit
                 </div>
                 <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                    Live Now
                 </div>
              </div>
           </div>

           <div className="px-5 py-8 md:px-10 flex flex-col gap-8 md:gap-10">
              {/* Identity Block */}
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                    <MapPin size={12} strokeWidth={3} />
                    {property.city || 'Bangalore'} · {typeof property.location === 'string' ? property.location : (property.neighborhood || 'Prime Center')}
                 </div>
                 <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight lg:leading-[1.1]">
                    {property.title}
                 </h1>
              </div>

              {/* Hardened Price Hero */}
              <div className="master-price-hero">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Monthly Subscription</span>
                    <div className="flex items-baseline gap-2">
                       <span className="price-value-master tracking-tighter">{property.price ? '₹' + property.price.toLocaleString() : 'Price N/A'}</span>
                       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">/ Node</span>
                    </div>
                 </div>
                 <div className="hidden lg:block h-16 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Security Deposit</span>
                    <span className="text-xl md:text-2xl font-bold text-slate-200 tracking-tight">{property.price ? '₹' + (property.price * 2).toLocaleString() : 'N/A'}</span>
                 </div>
              </div>

              {/* Hardened Tactical Grid */}
              <div className="master-spec-grid">
                  <div className="master-spec-item">
                     <div className="spec-icon-host bg-indigo-50 text-indigo-600">
                        <Layers size={16} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Topology</span>
                        <span className="text-sm font-black text-slate-800 leading-none">{property.bhkType}</span>
                     </div>
                  </div>
                  <div className="master-spec-item">
                     <div className="spec-icon-host bg-amber-50 text-amber-600">
                        <Maximize size={16} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verticality</span>
                        <span className="text-sm font-black text-slate-800 leading-none">
                           {property.floor !== undefined ? (property.floor === 0 ? 'Ground Lvl' : `${property.floor}${getFloorSuffix(property.floor)} Floor`) : 'Contact'}
                        </span>
                     </div>
                  </div>
                  <div className="master-spec-item">
                     <div className="spec-icon-host bg-emerald-50 text-emerald-600">
                        <Clock size={16} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Activation</span>
                        <span className="text-sm font-black text-slate-800 leading-none">Immediate</span>
                     </div>
                  </div>
                  <div className="master-spec-item">
                     <div className="spec-icon-host bg-rose-50 text-rose-600">
                        <ShieldCheck size={16} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Integrity</span>
                        <span className="text-sm font-black text-slate-800 leading-none">Verified</span>
                     </div>
                  </div>
              </div>

              {/* Narrative Section */}
              <div className="flex flex-col gap-4">
                 <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-4">
                    Architectural narrative
                    <div className="h-px bg-slate-100 grow" />
                 </h4>
                 <p className="text-slate-600 leading-relaxed text-base md:text-lg font-medium">
                    {property.description || "Experience premium living in this meticulously designed unit, optimized for modern lifestyles with high-end finishes and neural-verified security protocols."}
                 </p>
              </div>

              {/* Ecosystem (Amenities) */}
              {property.amenities?.length > 0 && (
                 <div className="flex flex-col gap-5">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-4">
                       Ecosystem Nodes
                       <div className="h-px bg-slate-100 grow" />
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                       {property.amenities.map((a, i) => (
                          <div key={i} className="flex items-center gap-2.5 py-3 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 hover:bg-white transition-all group overflow-hidden">
                             <CheckCircle2 size={16} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                             <span className="font-black text-[10px] uppercase tracking-widest truncate max-w-[150px]">{a}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* Specialized Protocols (Features) */}
              {property.advancedFeatures?.length > 0 && (
                 <div className="flex flex-col gap-5">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-4">
                       Integrated Protocol
                       <div className="h-px bg-slate-100 grow" />
                    </h4>
                    <div className="flex flex-col gap-2">
                       {property.advancedFeatures.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:bg-white hover:border-indigo-100 hover:shadow-premium transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white flex-center text-indigo-500 shadow-sm">
                                   <Zap size={14} />
                                </div>
                                <span className="font-black text-xs text-slate-800 tracking-tighter uppercase">{f}</span>
                             </div>
                             <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-300 transition-all" />
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              <div className="py-12 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Occupra Cloud Architecture</p>
              </div>
           </div>
        </div>

        {/* Master Interaction Hub - Hardened Sticky Footer */}
        <div className="overlay-sticky-footer p-6 md:p-10 flex flex-col gap-6 md:gap-8">
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.location.href = `tel:+91${phoneNum}`}
                className="flex items-center justify-center gap-3 h-16 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all group"
              >
                <Phone size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                SECURE CALL
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/91${whatsappNum}`, '_blank')}
                className="flex items-center justify-center gap-3 h-16 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all group"
              >
                <MessageSquare size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                WHATSAPP
              </button>
           </div>

           <div className="flex flex-col gap-3">
              <button 
                onClick={() => onShowRoute(property)}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-all"
              >
                 <Navigation2 size={16} />
                 ANALYZE ROUTE MAP
              </button>
              <button 
                onClick={() => setShowBookingModal(true)}
                className="w-full h-20 md:h-24 rounded-3xl bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Commence Tenancy Transfer
              </button>
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
