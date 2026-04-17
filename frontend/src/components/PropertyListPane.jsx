import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, MapPin, Grid, CheckCircle2, Search, Share2, Heart, ShieldCheck, ChevronRight, Zap, Info, Clock, Navigation2, Navigation, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api/axios';
import BookingFormModal from './BookingFormModal';
import ImageWithSkeleton from './ImageWithSkeleton';
import DiscoverCities from './DiscoverCities';
import '../styles/components/PropertyListPane.css';

export default function PropertyListPane({ selectedProperty, setSelectedProperty, highlightedId, setHighlightedId, onShowRoute, onSearchArea }) {
  const navigate = useNavigate();
  const { properties, filters, setFilter, setFilters, loading } = usePropertyStore();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: properties.length,
      bhk1: properties.filter(p => p.bhkType === '1BHK').length,
      bhk2: properties.filter(p => p.bhkType === '2BHK').length,
      bhk3: properties.filter(p => p.bhkType === '3BHK').length
    };
  }, [properties]);


  if (selectedProperty) {
    return (
      <div className="property-list-pane animate-fade-in detail-view">
        <div className="pane-sticky-header">
          <button
            onClick={() => setSelectedProperty(null)}
            className="pane-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Explorer</span>
          </button>

          <div className="pane-header-actions">
            <button className="filter-pill !h-8 !w-8 !p-0 flex-center">
              <Share2 size={12} />
            </button>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`filter-pill !h-8 !w-8 !p-0 flex-center ${isWishlisted ? 'is-active' : ''}`}
            >
              <Heart size={12} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="sidebar-content-scroll custom-scrollbar">
          <div className="property-hero-wrapper rounded-xl mb-6">
            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <ImageWithSkeleton
                src={selectedProperty.images[0].startsWith('http') ? selectedProperty.images[0] : `${BASE_URL}${selectedProperty.images[0]}`}
                alt={selectedProperty.title}
                className="hero-image-obj"
              />
            ) : (
              <div className="flex-center h-full bg-sidebar-active text-sidebar-muted"><Grid size={40} /></div>
            )}
          </div>

          <div className="property-main-info !p-0">
            <h1 className="main-property-title text-white">{selectedProperty.title}</h1>
            <p className="main-price-display">₹{selectedProperty.rent.toLocaleString()}<span className="text-sm font-normal text-sidebar-muted ml-2">/ month</span></p>

            <div className="sidebar-filter-section">
              <h4 className="filter-label">Quick Details</h4>
              <div className="flex flex-wrap gap-3">
                <div className="mini-tag !text-[10px] !py-1 !px-3">{selectedProperty.bhkType} Unit</div>
                <div className="mini-tag !text-[10px] !py-1 !px-3 font-bold !text-primary-color">Verified Listing</div>
                {selectedProperty.floor !== undefined && (
                  <div className="mini-tag !text-[10px] !py-1 !px-3 !bg-slate-100 !text-slate-600">
                    {selectedProperty.floor === 0 ? 'Ground Floor' : `Floor ${selectedProperty.floor}`}
                    {selectedProperty.totalFloors > 1 && ` of ${selectedProperty.totalFloors}`}
                  </div>
                )}
              </div>
            </div>

            <div className="sidebar-filter-section mt-8">
              <h4 className="filter-label">Property Narrative</h4>
              <p className="text-sm leading-relaxed text-sidebar-muted">{selectedProperty.description}</p>
            </div>

            <div className="sidebar-filter-section mt-8">
              <h4 className="filter-label">Amenities</h4>
              <div className="card-tags-host">
                {selectedProperty.amenities?.map((amenity, idx) => (
                  <div key={idx} className="mini-tag">{amenity}</div>
                ))}
              </div>
            </div>

            {selectedProperty.allowedFor && selectedProperty.allowedFor.length > 0 && (
              <div className="sidebar-filter-section mt-8 mb-12">
                <h4 className="filter-label">Suitable For</h4>
                <div className="flex gap-2">
                  {selectedProperty.allowedFor.map((type, idx) => (
                    <div key={idx} className="mini-tag !bg-accent-blue/10 !text-accent-blue !border-accent-blue/20">
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer-actions">
          <button
            onClick={() => onShowRoute(selectedProperty)}
            className="btn btn-secondary !bg-sidebar-active !text-white !border-transparent w-full"
          >
            <Navigation2 size={14} className="mr-2" />
            Get Safe Directions
          </button>
          <button
            onClick={() => window.open(`/property/${selectedProperty._id}`, '_blank')}
            className="btn btn-cta w-full"
          >
            Proceed with Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-list-pane">
      <div className="sidebar-content-scroll custom-scrollbar !pt-6">

        {/* Action Center - Global Search */}
        <div className="sidebar-action-center mb-8">
           <button 
             onClick={onSearchArea}
             className="btn btn-cta w-full !h-12 !rounded-xl shadow-premium animate-pulse-slow"
           >
             <Search size={16} className="mr-2" />
             Discover All Properties
           </button>
           <p className="text-[10px] text-center text-sidebar-muted mt-2 font-medium">
             Search within current map viewport
           </p>
        </div>

        {/* City Discovery Section */}
        <DiscoverCities onSelect={(coords) => onShowRoute({ location: { coordinates: coords } }, true)} />

        {/* Quick Discovery Filters - Permanently Visible */}
        <div className="sidebar-filter-section !mt-0 !mb-8 animate-fade-in">
          <div className="sidebar-filter-header">
            <div className="filter-header-indicator"></div>
            <h3 className="filter-header-title">Refine Search</h3>
          </div>

          {/* BHK Filter Section */}
          <div className="mb-6">
            <h4 className="filter-label !mb-3">BHK Configuration</h4>
            <div className="filter-pills-row">
              {['All', '1BHK', '2BHK', '3BHK'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter('bhkType', type)}
                  className={`filter-pill ${filters.bhkType === type ? 'is-active' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Section */}
          <div>
            <h4 className="filter-label !mb-3">Search Proximity</h4>
            <div className="filter-pills-row">
              {[0.5, 1, 2, 5, 10, 20, 50].map(val => (
                <button
                  key={val}
                  onClick={() => setFilter('radius', val)}
                  className={`filter-pill ${filters.radius === val ? 'is-active' : ''}`}
                >
                  {val < 1 ? `${val * 1000}m` : `${val}km`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="sidebar-stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-name">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.bhk1}</span>
            <span className="stat-name">1BHK</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.bhk2}</span>
            <span className="stat-name">2BHK</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.bhk3}</span>
            <span className="stat-name">3BHK</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-center flex-col gap-6 py-24">
            <div className="w-10 h-10 border-2 border-primary-color border-t-transparent rounded-full animate-spin"></div>
            <p className="label-base !text-primary-color">Broadcasting Filters...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex-center flex-col gap-4 py-20 text-center">
            <Search size={40} className="text-sidebar-active mb-2" />
            <h3 className="text-lg font-bold text-white">No Properties Found</h3>
            <p className="text-sm text-sidebar-muted">Try expanding your radius or changing BHK intent.</p>
          </div>
        ) : (
          <div className="property-cards-grid animate-slide-up">
            {properties.map((property) => (
              <div
                key={property._id}
                id={`property-card-${property._id}`}
                onClick={() => {
                  setHighlightedId(property._id);
                  setSelectedProperty(property);
                }}
                className={`premium-sidebar-card ${highlightedId === property._id ? 'is-highlighted' : ''}`}
              >
                <div className="card-image-host">
                  {property.images?.[0] ? (
                    <img src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`} alt={property.title} />
                  ) : (
                    <div className="flex-center h-full bg-sidebar-active"><Grid size={20} className="text-sidebar-muted" /></div>
                  )}
                </div>

                <div className="card-info-host">
                  <div className="card-header-row">
                    <h3 className="card-title-host">{property.title}</h3>
                    <div className="card-price-host">
                      ₹{property.rent.toLocaleString()}
                    </div>
                  </div>

                  <div className="card-meta-host">
                    <MapPin size={10} className="text-accent-blue" />
                    <span className="truncate">{property.city || 'Regional Area'}</span>
                    {property.floor !== undefined && (
                      <span className="ml-2 pl-2 border-l border-slate-700 text-slate-400">
                        {property.floor === 0 ? 'Ground' : `${property.floor}F`}
                        {property.totalFloors > 1 && `/${property.totalFloors}`}
                      </span>
                    )}
                  </div>

                  {property.amenities && property.amenities.length > 0 && (
                    <div className="card-tags-host">
                      {property.amenities.slice(0, 3).map((tag, i) => (
                        <div key={i} className="mini-tag">{tag}</div>
                      ))}
                    </div>
                  )}

                  <div className="card-quick-actions">
                    <button className="quick-action-btn btn-call" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:+910000000000`; }}>
                      <Phone size={10} />
                      Call Agent
                    </button>
                    <button className="quick-action-btn btn-whatsapp" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/910000000000`, '_blank'); }}>
                      <MessageSquare size={10} />
                      WhatsApp
                    </button>
                  </div>

                  <button
                    className="btn btn-secondary !h-9 !text-[10px] w-full mt-2 !bg-sidebar-active !text-white !border-transparent hover:!bg-sidebar-muted/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/property/${property._id}`);
                    }}
                  >
                    <ExternalLink size={10} className="mr-2" />
                    View Full System Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
