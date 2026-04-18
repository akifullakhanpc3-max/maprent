import React, { useState, useEffect } from 'react';
import { X, MapPin, Grid, CheckCircle2, Share2, Heart, ShieldCheck, Zap, Clock, Navigation2, Phone, MessageSquare, ChevronRight, Layers, Maximize } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import ImageWithSkeleton from './ImageWithSkeleton';
import api, { BASE_URL } from '../api/axios';

export default function PropertyDetailsOverlay({ property, onClose, onShowRoute }) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState({ loading: false, success: false, error: '' });
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportStatus({ loading: true, success: false, error: '' });
    try {
      await api.post(`/properties/${property._id}/report`, {
        reason: reportReason,
        details: reportDetails
      });
      setReportStatus({ loading: false, success: true, error: '' });
      setTimeout(() => setShowReportModal(false), 2000);
    } catch (err) {
      setReportStatus({ loading: false, success: false, error: 'Failed to submit report. Please try again.' });
    }
  };

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
        <div className="sticky top-0 w-full z-30 flex items-center justify-between px-4 py-3 md:p-5 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
           <button onClick={onClose} className="p-2 shrink-0 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
              <X size={20} />
           </button>
           <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-10 h-10 shrink-0 flex-center rounded-full border transition-all ${isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button className="w-10 h-10 shrink-0 flex-center rounded-full border border-slate-100 bg-white text-slate-400 hover:border-slate-300 transition-all">
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
                 {property.isPinned && (
                    <div className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                      Pinned · {property.pinnedAt ? new Date(property.pinnedAt).toLocaleDateString() : 'Featured'}
                    </div>
                  )}
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
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                      Monthly Subscription
                      {property.negotiable && <span className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded text-[8px]">Negotiable</span>}
                    </span>
                    <div className="flex items-baseline gap-2">
                       <span className="price-value-master tracking-tighter">{property.price ? '₹' + property.price.toLocaleString() : 'Price N/A'}</span>
                       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">/ Node</span>
                    </div>
                 </div>
                 <div className="hidden lg:block h-16 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Security Deposit</span>
                    <span className="text-xl md:text-2xl font-bold text-slate-200 tracking-tight">
                       {(property.securityDeposit !== undefined && property.securityDeposit !== null)
                          ? '₹' + property.securityDeposit.toLocaleString() 
                          : 'N/A'}
                    </span>
                 </div>
                 <div className="hidden lg:block h-16 w-px bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Maintenance</span>
                    <span className="text-xl md:text-2xl font-bold text-slate-200 tracking-tight">
                       {property.maintenance ? '₹' + property.maintenance.toLocaleString() : 'Not Specified'}
                    </span>
                 </div>
              </div>

              {/* Unit Specifications Grid */}
              <div className="flex flex-col gap-5">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-4">
                  Unit Specification
                  <div className="h-px bg-slate-100 grow" />
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Area</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{property.sqft || '1200'} SQFT</span>
                  </div>
                  <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Food Habit</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{property.foodPreference || 'Any'}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Community</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{property.propertyType || 'Non-Gated'}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Pet Policy</span>
                    <span className="text-xs font-black text-slate-800 uppercase">{property.petsAllowed ? 'Allowed' : 'Not Allowed'}</span>
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
                 <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-fit text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors flex items-center gap-2 mt-2"
                  >
                    <ShieldCheck size={14} />
                    Report this Listing
                  </button>
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

      {showReportModal && (
        <div className="fixed inset-0 z-[8000] flex-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-black text-slate-900 mb-2">Report Property</h2>
            <p className="text-xs font-medium text-slate-400 mb-6 uppercase tracking-widest">Help us keep Occupra safe</p>
            
            {reportStatus.success ? (
              <div className="p-6 bg-emerald-50 text-emerald-600 rounded-2xl text-center font-black text-sm">
                Report submitted successfully!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Reason for report</label>
                  <select 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800"
                  >
                    <option value="Spam">Spam</option>
                    <option value="Fake Listing">Fake Listing</option>
                    <option value="Incorrect Info">Incorrect Info</option>
                    <option value="Offensive Content">Offensive Content</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Additional Details</label>
                  <textarea 
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-800 min-h-[100px] resize-none"
                    placeholder="Tell us what's wrong..."
                  />
                </div>
                {reportStatus.error && <p className="text-xs font-bold text-rose-500">{reportStatus.error}</p>}
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 h-12 rounded-xl text-slate-400 font-bold text-xs">CANCEL</button>
                  <button 
                    type="submit" 
                    disabled={reportStatus.loading}
                    className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20"
                  >
                    {reportStatus.loading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
