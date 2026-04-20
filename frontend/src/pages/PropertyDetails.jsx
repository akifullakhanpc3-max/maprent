import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePropertyStore } from '../store/usePropertyStore';
import { BASE_URL } from '../api/axios';
import {
  ArrowLeft, MapPin, Grid, CheckCircle2, Share2, Heart,
  ShieldCheck, Zap, Info, Clock, Navigation2, Phone, MessageCircle,
  BarChart2, ChevronDown, ChevronUp, TrendingUp, Home, Calendar, IndianRupee
} from 'lucide-react';
import BookingFormModal from '../components/BookingFormModal';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import Navbar from '../components/Navbar';
import '../styles/pages/PropertyDetails.css';

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
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

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
    } else if (property?.city) {
      // fallback: navigate by city name
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(property.city)}`, '_blank');
    } else {
      alert('No location data available for this property.');
    }
  };

  const handleAnalyze = () => {
    if (showAnalyze) return setShowAnalyze(false);
    setAnalyzeLoading(true);
    // Simulate brief analysis computation
    setTimeout(() => {
      setAnalyzeLoading(false);
      setShowAnalyze(true);
    }, 800);
  };

  const handleShare = async () => {
    const shareData = {
      title: property?.title || 'Property from Maprent',
      text: `Check out this property: ${property?.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Property link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Compute map URL once — uses coordinates for precision, falls back to city+title search.
  // Never returns '#' so the link is always functional.
  const mapUrl = (() => {
    if (!property) return 'https://www.google.com/maps';
    const coords = property?.location?.coordinates;
    if (Array.isArray(coords) && coords[0] != null && coords[1] != null) {
      const [lng, lat] = coords; // GeoJSON: [longitude, latitude]
      return `https://www.google.com/maps?q=${lat},${lng}&z=16`;
    }
    const searchTerm = [property.city, property.title].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm || 'property')}`;
  })();

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
              <button className="btn btn-secondary !h-10 !w-10 rounded-xl" title="Share Listing" onClick={handleShare}>
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
                  <div className="flex flex-wrap gap-3 md:gap-4">
                    {property.amenities?.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400/30 transition-all group shadow-sm min-w-0">
                        <div className="w-8 min-w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex-center group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={12} />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wide text-slate-600 truncate">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.advancedFeatures?.length > 0 && (
                <div className="flex-col gap-8">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-indigo-600 tracking-tighter uppercase">Premium Attributes</h4>
                    <div className="h-[2px] bg-indigo-50 grow" />
                  </div>
                  <div className="flex flex-wrap gap-3 md:gap-4">
                    {property.advancedFeatures?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl hover:border-indigo-400 transition-all group shadow-sm min-w-0">
                        <div className="w-8 min-w-8 h-8  rounded-lg bg-white text-indigo-600 flex-center group-hover:rotate-12 transition-transform shadow-sm">
                          <Zap size={12} />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wide text-indigo-900">{feature}</span>
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
                      <p className="text-4xl font-black text-indigo-600 tracking-tighter leading-none">{property.price ? '₹' + property.price.toLocaleString() : 'Price N/A'}</p>
                    </div>
                    <div className="status-pill success !px-4 !py-2 uppercase font-black text-[10px] tracking-widest">Live Asset</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-50">
                    <div className="flex-col gap-1">
                      <span className="uppercase !text-[8px] font-black tracking-widest text-slate-400">Security Deposit</span>
                      <p className="text-sm font-black text-slate-700 tracking-tighter">
                        {(property.securityDeposit !== undefined && property.securityDeposit !== null) ? '₹' + property.securityDeposit.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex-col gap-1 border-l border-slate-100 pl-4">
                      <span className="uppercase !text-[8px] font-black tracking-widest text-slate-400">Maintenance</span>
                      <p className="text-sm font-black text-slate-700 tracking-tighter">
                        {property.maintenance ? '₹' + property.maintenance.toLocaleString() : 'Not Specified'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
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

                  {/* ── ACTION BUTTONS ── */}
                  <div className="pd-actions">

                    {/* PRIMARY CTA */}
                    <button onClick={() => setShowBookingModal(true)} className="pd-btn-primary">
                      <Navigation2 size={18} />
                      Start Application
                    </button>

                    {/* CONTACT ROW */}
                    <div className="pd-btn-row">
                      {property.whatsapp ? (
                        <a
                          href={`https://wa.me/91${property.whatsapp.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="pd-btn-whatsapp"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </a>
                      ) : (
                        <span className="pd-btn-disabled"><MessageCircle size={14} /> WhatsApp</span>
                      )}
                      {property.phone ? (
                        <a href={`tel:${property.phone}`} className="pd-btn-call">
                          <Phone size={16} />
                          Secure Call
                        </a>
                      ) : (
                        <span className="pd-btn-disabled"><Phone size={14} /> Secure Call</span>
                      )}
                    </div>

                    {/* ANALYZE BUTTON */}
                    <button
                      onClick={handleAnalyze}
                      className={`pd-btn-analyze ${showAnalyze ? 'active' : ''}`}
                      disabled={analyzeLoading}
                    >
                      {analyzeLoading ? (
                        <><div className="pd-spinner" /> Analyzing...</>
                      ) : (
                        <><BarChart2 size={15} />
                        Analyze Property
                        {showAnalyze ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}</>
                      )}
                    </button>

                    {/* ANALYSIS PANEL */}
                    {showAnalyze && (
                      <div className="pd-analyze-panel animate-fade-in">
                        <p className="pd-analyze-heading">Property Intelligence Report</p>
                        <div className="pd-analyze-grid">
                          <div className="pd-analyze-stat">
                            <IndianRupee size={14} className="text-indigo-500" />
                            <div>
                              <span className="pd-stat-label">Monthly Rent</span>
                              <span className="pd-stat-val">₹{property.price?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </div>
                          {property.securityDeposit != null && (
                            <div className="pd-analyze-stat">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              <div>
                                <span className="pd-stat-label">Security Deposit</span>
                                <span className="pd-stat-val">₹{property.securityDeposit.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          <div className="pd-analyze-stat">
                            <Home size={14} className="text-amber-500" />
                            <div>
                              <span className="pd-stat-label">Property Type</span>
                              <span className="pd-stat-val">{property.bhkType}</span>
                            </div>
                          </div>
                          <div className="pd-analyze-stat">
                            <TrendingUp size={14} className="text-rose-500" />
                            <div>
                              <span className="pd-stat-label">Annual Cost</span>
                              <span className="pd-stat-val">₹{property.price ? (property.price * 12).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="pd-analyze-stat">
                            <MapPin size={14} className="text-slate-500" />
                            <div>
                              <span className="pd-stat-label">Location</span>
                              <span className="pd-stat-val">{property.city || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="pd-analyze-stat">
                            <Calendar size={14} className="text-blue-500" />
                            <div>
                              <span className="pd-stat-label">Listed Since</span>
                              <span className="pd-stat-val">{new Date(property.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pd-analyze-map-link"
                        >
                          <MapPin size={12} /> View on Google Maps
                        </a>
                      </div>
                    )}

                    {/* NAVIGATE */}
                    <button onClick={handleGetDirections} className="pd-btn-navigate">
                      <MapPin size={13} />
                      Navigate to Location
                    </button>

                    <p className="pd-footer-note">Secure Discovery via Occupra Neural Grid</p>
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
