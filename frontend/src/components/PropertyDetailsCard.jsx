"use client";

import React from 'react';
import { Share2, Heart, X, Maximize, Clock, Phone, ExternalLink } from 'lucide-react';
import { BASE_URL } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { formatBHK, formatDaysAgo, formatArea, toSentenceCase } from '../utils/formatters';
// import '../styles/components/PropertyDetailsCard.css';

const PropertyDetailsCard = ({ property, onClose, onShowRoute }) => {
  const { user, toggleWishlist } = useAuthStore();
  const isWishlisted = user?.savedProperties?.includes(property?._id);

  if (!property) return null;

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!user) return alert('Please login to save properties');
    await toggleWishlist(property._id);
  };

  const getDaysAgo = (date) => {
    return formatDaysAgo(date);
  };

  const phoneNum = property.phone || '910000000000';

  return (
    <div className="property-details-card">
      <div className="card-header-stack">
        <div className="card-title-row">
          <h3 className="card-property-title">{formatBHK(property.title) || property.title}</h3>
          <div className="header-actions-group">
            <button
              className={`action-pill-btn ${isWishlisted ? 'liked' : ''}`}
              onClick={handleWishlistToggle}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button className="action-pill-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="card-price-integrated">
          <span className="integrated-rent-label">Monthly Rent</span>
          <div className="integrated-price-value">
            ₹{property.price?.toLocaleString() || '11,959'}
          </div>
        </div>
      </div>

      <div className="property-image-hero">
        {property.images?.[0] ? (
          <img
            src={property.images?.[0] ? (property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`) : ''}
            alt={property.title}
            className="hero-img-element"
          />
        ) : (
          <div className="img-placeholder-node">
            <Maximize size={40} strokeWidth={1.5} />
            <span>No Image Available</span>
          </div>
        )}
      </div>

      <div className="detail-breakdown-section">
        <div className="breakdown-item-row">
          <span className="row-label">Rent</span>
          <span className="row-value">₹{property.price?.toLocaleString() || '11,959'}</span>
        </div>
        <div className="breakdown-item-row">
          <span className="row-label">Security Deposit</span>
          <span className="row-value">₹{property.securityDeposit?.toLocaleString() || '50,000'}</span>
        </div>
        <div className="breakdown-item-row">
          <span className="row-label">Maintenance</span>
          <span className="row-value">
            {property.maintenance ? `₹${property.maintenance.toLocaleString()}` : '₹2,000'}
          </span>
        </div>
      </div>

      <div className="pill-tags-container">
        <span className="tag-pill color-purple">{formatBHK(property.bhkType) || "2 BHK"}</span>
        <span className="tag-pill color-orange">{toSentenceCase(property.furnishing || "Unfurnished")}</span>
        <span className="tag-pill color-blue">
          {property.maintenance ? "Maintenance Extra" : "Incl. Maintenance"}
        </span>
        <span className="tag-pill color-gray">{toSentenceCase(property.propertyType || "Non-Gated")}</span>
        <span className="tag-pill color-green">{toSentenceCase(property.tenantPreferred || "Open to All")}</span>
        <span className="tag-pill color-dark">{getDaysAgo(property.createdAt)}</span>
      </div>

      <div className="property-footer-meta">
        <div className="meta-spec-item">
          <Maximize size={16} />
          <span>{property.sqft ? formatArea(property.sqft) + ' sq.ft' : '860 sq.ft'}</span>
        </div>
        <div className="meta-spec-item">
          <Phone size={16} />
          <span>{property.phone || 'Contact Owner'}</span>
        </div>
      </div>

      <div className="card-cta-group">
        <button
          className="cta-btn primary-cta"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `tel:+91${phoneNum}`;
          }}
        >
          <Phone size={18} />
          Contact Owner
        </button>
        <button
          className="cta-btn secondary-cta"
          onClick={(e) => {
            e.stopPropagation();
            onShowRoute(property);
          }}
        >
          <ExternalLink size={18} />
          View Details
        </button>
      </div>
    </div>
  );
};

export default PropertyDetailsCard;
