import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePropertyStore } from '../store/usePropertyStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, MapPin, Grid, CheckCircle2, Search, Share2, Heart, ShieldCheck, ChevronRight, Zap, Info, Clock, Navigation2, Navigation, Phone, MessageSquare, ExternalLink, Maximize, Building2 } from 'lucide-react';
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
  
  const getDaysAgo = (date, id) => {
    let created;
    if (date) {
      created = new Date(date);
    } else if (id && typeof id === 'string' && id.length === 24) {
      const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
      created = new Date(timestamp);
    }
    if (!created || isNaN(created.getTime())) return 'Recently';
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Listed Today';
    return `Listed ${diffDays}d ago`;
  };

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: properties.length,
      bhk1: properties.filter(p => p.bhkType === '1BHK').length,
      bhk2: properties.filter(p => p.bhkType === '2BHK').length,
      bhk3: properties.filter(p => p.bhkType === '3BHK').length
    };
  }, [properties]);


  if (loading && properties.length === 0) {
    return (
      <div className="property-list-pane flex-center py-24">
        <div className="w-10 h-10 border-2 border-primary-color border-t-transparent rounded-full animate-spin"></div>
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

        {/* Quick Discovery Filters - Advanced Polished UI */}
        <div className="sidebar-filter-root animate-fade-in">
          <div className="filter-section-header">
            <h3 className="section-title">Refine Search</h3>
            <div className="section-divider"></div>
          </div>

          <div className="discovery-filters-stack">
            {/* BHK Filter */}
            <div className="filter-group">
              <label className="group-label">BHK Configuration</label>
              <div className="pills-grid">
                {['All', '1BHK', '2BHK', '3BHK'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter('bhkType', type)}
                    className={`discovery-pill ${filters.bhkType === type ? 'is-active' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius Filter - Only shown when proximity search is active */}
            {filters.lat && filters.lng && (
              <div className="filter-group animate-fade-in">
                <div className="flex-between">
                  <label className="group-label">Search Proximity</label>
                </div>
                <div className="pills-grid">
                  {[0.5, 1, 2, 5, 10, 20, 50].map(val => (
                    <button
                      key={val}
                      onClick={() => setFilter('radius', val)}
                      className={`discovery-pill ${filters.radius === val ? 'is-active' : ''}`}
                    >
                      {val < 1 ? `${val * 1000}m` : `${val}km`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Insights - Dashboard Style */}
        <div className="sidebar-stats-header">
          <h3 className="section-title">Market Insight</h3>
          <span className="live-indicator">LIVE</span>
        </div>
        
        <div className="stats-insight-grid">
          <div className="insight-card">
            <div className="insight-icon-box blue">
              <Building2 size={18} />
            </div>
            <div className="insight-content">
              <span className="insight-val">{stats.total}</span>
              <span className="insight-label">Total Listings</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon-box purple">
              <Grid size={18} />
            </div>
            <div className="insight-content">
              <span className="insight-val">{stats.bhk1}</span>
              <span className="insight-label">1BHK Assets</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon-box orange">
              <Grid size={18} />
            </div>
            <div className="insight-content">
              <span className="insight-val">{stats.bhk2}</span>
              <span className="insight-label">2BHK Assets</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon-box green">
              <Grid size={18} />
            </div>
            <div className="insight-content">
              <span className="insight-val">{stats.bhk3}</span>
              <span className="insight-label">3BHK Assets</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-center flex-col gap-6 py-24">
            <div className="w-10 h-10 border-2 border-primary-color border-t-transparent rounded-full animate-spin"></div>
            <p className="label-base !text-primary-color">Broadcasting Filters...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="sidebar-empty-state animate-slide-up">
            <div className="empty-visual">
              <Search size={48} className="text-slate-200" />
              <div className="visual-pulse"></div>
            </div>
            <h3 className="empty-title">No Properties Found</h3>
            <p className="empty-desc">
              We couldn't find any matching listings in this area. Try expanding your radius or changing BHK intent.
            </p>
            <button 
              onClick={() => setFilters({ bhkType: 'All', radius: 5 })}
              className="btn-reset-filters"
            >
              Reset All Filters
            </button>
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
                    <img src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`} alt={property.title} className="list-card-img" />
                  ) : (
                    <div className="flex-center h-full bg-slate-50"><Grid size={24} className="text-slate-300" /></div>
                  )}
                  <div className="card-badge-top">{property.bhkType}</div>
                </div>

                <div className="card-content-host">
                  <div className="price-header-row">
                    <span className="list-price-val">₹{property.price?.toLocaleString() || 'N/A'}</span>
                    <span className="rent-freq">/month</span>
                  </div>

                  <h3 className="list-property-title">{property.title}</h3>

                  <div className="list-info-row">
                    <div className="info-pill">
                      <Maximize size={14} />
                      <span>{property.sqft || '860'} sq.ft</span>
                    </div>
                    <div className="info-pill">
                      <Clock size={14} />
                      <span>{getDaysAgo(property.createdAt, property._id)}</span>
                    </div>
                  </div>

                  <div className="list-tags-row">
                    <span className="list-tag color-purple">{property.furnishing || 'Unfurnished'}</span>
                    <span className="list-tag color-orange">{property.propertyType || 'Non-Gated'}</span>
                    <span className="list-tag color-gray">{property.tenantPreferred || 'Any'}</span>
                  </div>

                  <button className="view-details-cta">
                    View Details
                    <ChevronRight size={16} />
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
