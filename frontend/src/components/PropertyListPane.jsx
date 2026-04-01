import React, { useState, useRef, useEffect } from 'react';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, MapPin, Grid, CheckCircle2, Search, Share2, Heart, ShieldCheck, ChevronRight, Zap, Info, Clock, Navigation2, Navigation } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import ImageWithSkeleton from './ImageWithSkeleton';
import '../styles/components/PropertyListPane.css';

export default function PropertyListPane({ selectedProperty, setSelectedProperty, onShowRoute, onScroll }) {
  const { properties, filters, setFilter, loading } = usePropertyStore();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onScroll || window.innerWidth > 768) return;

    const handleScroll = (e) => {
      onScroll(e.target.scrollTop);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  if (selectedProperty) {
    return (
      <div className="property-list-pane animate-fade-in">
        <div className="pane-sticky-header">
          <button 
            onClick={() => setSelectedProperty(null)}
            className="pane-back-btn btn btn-ghost"
          >
            <ArrowLeft size={16} />
            <span>Listing Index</span>
          </button>
          
          <div className="pane-header-actions">
             <button className="btn btn-secondary !h-9 !w-9">
               <Share2 size={14} />
             </button>
             <button 
               onClick={() => setIsWishlisted(!isWishlisted)}
               className={`btn btn-secondary !h-9 !w-9 ${isWishlisted ? 'is-active' : ''}`}
             >
                <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
             </button>
          </div>
        </div>

        <div className="pane-scroll-content custom-scrollbar" ref={scrollRef}>
          <div className="property-hero-wrapper">
            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <ImageWithSkeleton 
                src={selectedProperty.images[0].startsWith('http') ? selectedProperty.images[0] : `http://localhost:5050${selectedProperty.images[0]}`} 
                alt={selectedProperty.title}
                className="hero-image-obj"
              />
            ) : (
              <div className="flex-center h-full bg-surface text-low"><Grid size={40} /></div>
            )}
            <div className="hero-floating-badges">
               <span className="premium-badge">{selectedProperty.bhkType} Unit</span>
               <div className="verification-badge">
                  <ShieldCheck size={12} />
                  <span>Verified</span>
               </div>
            </div>
          </div>
          
          <div className="property-main-info">
             <div className="info-header-row">
                <div className="flex-col gap-2 flex-1">
                   <h1 className="main-property-title">{selectedProperty.title}</h1>
                   <div className="card-location-meta">
                      <MapPin size={12} className="text-secondary" />
                      <span>{selectedProperty.city || 'Regional Center'}</span>
                   </div>
                </div>
                <div className="flex-col items-end">
                   <p className="main-price-val">₹{selectedProperty.rent.toLocaleString()}</p>
                   <span className="label-base !m-0 !text-[10px]">Monthly Lease</span>
                </div>
             </div>

             <div className="property-action-cards">
                <div className="action-stat-card">
                   <Zap size={18} className="text-warning" />
                   <div className="flex-col">
                      <span className="stat-label">Response</span>
                      <span className="stat-val">Instant</span>
                   </div>
                </div>
                <div className="action-stat-card">
                   <ShieldCheck size={18} className="text-primary" />
                   <div className="flex-col">
                      <span className="stat-label">Security</span>
                      <span className="stat-val">Verified</span>
                   </div>
                </div>
             </div>

             <div className="content-section">
                <h3 className="section-title">Property Narrative</h3>
                <p className="property-description">{selectedProperty.description}</p>
             </div>
             
              {selectedProperty.amenities?.length > 0 && (
                <div className="flex-col gap-4">
                  <h4 className="section-title">Amenities & Highlights</h4>
                  <div className="flex-col border border-subtle rounded-xl overflow-hidden">
                    {selectedProperty.amenities?.map((amenity, idx) => (
                      <div key={idx} className="flex gap-4 p-4 hover:bg-card border-b border-subtle last:border-0 transition-all">
                         <CheckCircle2 size={12} className="text-primary" />
                         <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </div>

        <div className="pane-footer-actions">
           <button 
             onClick={() => onShowRoute(selectedProperty)}
             className="btn btn-secondary flex-1"
           >
             <Navigation2 size={14} />
             <span>Get Directions</span>
           </button>
           <button 
             onClick={() => window.open(`/property/${selectedProperty._id}`, '_blank')}
             className="btn btn-primary flex-1"
           >
             <Clock size={14} />
             <span>Apply Now</span>
           </button>
        </div>

        {showBookingModal && (
          <BookingFormModal 
            isOpen={showBookingModal} 
            onClose={() => setShowBookingModal(false)} 
            propertyId={selectedProperty._id} 
            propertyTitle={selectedProperty.title}
          />
        )}
      </div>
    );
  }

  return (
    <div className="property-list-pane">
      <div className="pane-sticky-header flex-col !items-stretch !h-auto gap-4 py-4">
        <div className="flex-between">
          <div className="results-info">
             <h2 className="results-count">{properties.length} Listings</h2>
             <p className="results-context">Operational Area Discovery</p>
          </div>
          <div className="discovery-status-pill">
             <div className="status-dot" />
             <span>Integrity Live</span>
          </div>
        </div>

        {/* Compact Radius Filter */}
        <div className="radius-selector-section !p-0 !gap-2 flex-wrap">
          <div className="radius-bar-label min-w-fit flex items-center gap-1 text-[8px] font-bold text-low uppercase tracking-[0.1em]">
             <Navigation size={8} />
             <span>Radius</span>
          </div>
          <div className="tab-group-container wrap !gap-1 flex-1">
             {[0.5, 1, 2, 5, 10, 20, 50].map(val => (
               <button
                 key={val}
                 onClick={(e) => {
                   e.stopPropagation();
                   setFilter('radius', val);
                 }}
                 className={`tab-chip-item !h-6 !px-2 !text-[9px] ${filters.radius === val ? 'active' : ''}`}
               >
                 {val < 1 ? `${val * 1000}m` : `${val}km`}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="pane-scroll-content list-view custom-scrollbar" ref={scrollRef}>
        {loading ? (
           <div className="flex-center flex-col gap-6 py-24">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="label-base !text-primary">Syncing database...</p>
           </div>
        ) : properties.length === 0 ? (
          <div className="pane-empty-state">
             <div className="empty-icon-box">
                <Search size={32} />
             </div>
             <h3 className="empty-title">Bounds Exhausted</h3>
             <p className="empty-text">No listings match your current geospatial or attribute filters.</p>
          </div>
        ) : (
          <div className="property-cards-stack animate-slide-up">
            {properties?.map((property) => (
              <div 
                key={property._id}
                onClick={() => window.open(`/property/${property._id}`, '_blank')}
                className="premium-property-card card"
              >
                <div className="card-thumb-wrap">
                  {property.images && property.images.length > 0 ? (
                     <ImageWithSkeleton 
                       src={property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5050${property.images[0]}`} 
                       alt={property.title}
                       className="thumb-image" 
                     />
                  ) : (
                     <div className="flex-center h-full bg-surface text-low"><Grid size={24} /></div>
                  )}
                  <div className="thumb-category">
                     <span>{property.bhkType} Unit</span>
                  </div>
                </div>
                
                <div className="card-content-wrap">
                  <div className="flex-col gap-1">
                     <h3 className="card-main-title">{property.title}</h3>
                     <div className="card-location-meta">
                        <MapPin size={10} className="text-secondary" />
                        <span>{property.city || 'Regional Center'}</span>
                     </div>
                  </div>
                  <div className="card-footer-info">
                     <span className="card-rent-val">₹{property.rent.toLocaleString()}</span>
                     <div className="card-action-more">
                        <ChevronRight size={14} />
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
