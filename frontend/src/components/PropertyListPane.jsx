"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePropertyStore } from '../store/usePropertyStore';
import { Grid, Search, ChevronRight, Clock, Navigation, RotateCcw, Maximize } from 'lucide-react';
import { BASE_URL } from '../api/axios';
import DiscoverCities from './DiscoverCities';
import { formatBHK, formatDaysAgo, toSentenceCase } from '../utils/formatters';

export default function PropertyListPane({ selectedProperty, setSelectedProperty, highlightedId, setHighlightedId, onShowRoute, onSearchArea, onSearchRadius, onResetFilters }) {
  const { properties, filters, setFilter, setFilters, loading } = usePropertyStore();
  const router = useRouter();

  const getDaysAgo = (date) => {
    return formatDaysAgo(date);
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


  // Active states for search buttons
  const isRadiusActive = !!(filters.lat && filters.lng);
  const isAreaActive = !isRadiusActive && !!filters.bounds;

  if (loading && properties.length === 0) {
    return (
      <div className="property-list-pane flex-center py-24">
        <div className="w-10 h-10 border-2 border-primary-color border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="property-list-pane">
      <div className="sidebar-content-scroll custom-scrollbar !pt-3">

        {/* Action Center - Global Search */}
        <div className="sidebar-action-center mb-5">
          <div className="discovery-actions-row glass-elevated">
            <button
              onClick={onSearchArea}
              className={`action-btn search-full-btn ${isAreaActive ? 'is-active' : ''}`}
              data-tooltip="Find properties within the current map view (Default)"
              title="Browse by Area"
            >
              {isAreaActive && <div className="btn-shimmer"></div>}
              <Grid size={15} strokeWidth={2.2} style={{ position: 'relative', zIndex: 2 }} />
              <span style={{ position: 'relative', zIndex: 2 }}>Browse by Area</span>
            </button>
            
            <button
              onClick={onSearchRadius}
              className={`action-btn search-radius-btn ${isRadiusActive ? 'is-active' : ''}`}
              data-tooltip="Search properties within a selected radius from center"
              title="Search Nearby"
            >
              {isRadiusActive && <div className="btn-shimmer"></div>}
              <Navigation size={15} strokeWidth={2.2} style={{ position: 'relative', zIndex: 2 }} />
              <span style={{ position: 'relative', zIndex: 2 }}>Search Nearby</span>
            </button>

            <button
              onClick={onResetFilters}
              className="action-btn reset-action-btn"
              data-tooltip="Clear all filters and reset the map view"
              title="Clear Filters"
            >
              <RotateCcw size={15} strokeWidth={2.2} />
              <span>Clear Filters</span>
            </button>
          </div>
          <p className="discovery-help-text">
            Select a search mode to update results in real-time
          </p>
        </div>

        {/* City Discovery Section */}
        <DiscoverCities onSelect={(coords) => onShowRoute({ location: { coordinates: coords } }, true)} />

        {/* Proximity Search - Active State Only */}
        {filters.lat && filters.lng && (
          <div className="sidebar-proximity-refine animate-fade-in">
            <div className="filter-section-header !mb-3">
              <h3 className="section-title">Search Proximity</h3>
              <div className="section-divider"></div>
            </div>
            <div className="pills-grid !mt-0 !mb-6">
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


        {/* Stats Insights - Dashboard Style */}
        <div className="sidebar-stats-header">
          <h3 className="section-title">Live Availability</h3>
          <div className="live-indicator">LIVE</div>
        </div>

        <div className="premium-stats-bar">
          <div className="stat-item main">
            <span className="stat-val">{stats.total}</span>
            <span className="stat-label">Total Listed</span>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-item">
            <span className="stat-val">{stats.bhk1}</span>
            <span className="stat-label">1 BHK</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{stats.bhk2}</span>
            <span className="stat-label">2 BHK</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{stats.bhk3}</span>
            <span className="stat-label">3 BHK</span>
          </div>
        </div>

        {loading && properties.length === 0 ? (
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
              We couldn't find any matching listings in this area. Try expanding your search radius.
            </p>
            <button
              onClick={() => setFilters({ radius: 1 })}
              className="btn-reset-filters"
            >
              Reset Filters
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
                </div>

                <div className="card-content-host">
                  <div className="price-header-row">
                    <span className="list-price-val">₹{property.price?.toLocaleString() || 'N/A'}</span>
                    <span className="rent-freq">/month</span>
                  </div>

                  <h3 className="list-property-title">{formatBHK(property.title) || property.title}</h3>

                  <div className="list-info-row">
                    <div className="info-pill">
                      <Maximize size={14} />
                      <span>{property.sqft || '860'} sq.ft</span>
                    </div>
                    <div className="info-pill">
                      <Clock size={14} />
                      <span>{getDaysAgo(property.createdAt)}</span>
                    </div>
                  </div>

                  <div className="list-tags-row">
                    <span className="list-tag color-purple">{toSentenceCase(property.furnishing || 'Unfurnished')}</span>
                    <span className="list-tag color-orange">{toSentenceCase(property.propertyType || 'Non-Gated')}</span>
                    <span className="list-tag color-gray">{toSentenceCase(property.tenantPreferred || 'Open to All')}</span>
                  </div>

                  <button
                    className="view-details-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/property/${property._id}`);
                    }}
                  >
                    Open Full Page
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
