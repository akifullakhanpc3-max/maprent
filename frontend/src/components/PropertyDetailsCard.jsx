import React, { useState } from 'react';
import { Share2, Heart, X, Maximize, Clock, Phone, ExternalLink } from 'lucide-react';
import { BASE_URL } from '../api/axios';
import '../styles/components/PropertyDetailsCard.css';

const PropertyDetailsCard = ({ property, onClose, onShowRoute }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!property) return null;

  const getDaysAgo = (date, id) => {
    let created;
    if (date) {
      created = new Date(date);
    } else if (id && typeof id === 'string' && id.length === 24) {
      // Fallback: Extract timestamp from MongoDB ObjectId
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

  if (!property) return null;

  const phoneNum = property.phone || '910000000000';

  return (
    <div className="property-details-card">
      {/* 1. Title & Price Integrated Header */}
      <div className="card-header-stack">
        <div className="card-title-row">
          <h3 className="card-property-title">{property.title}</h3>
          <div className="header-actions-group">
            <button
              className={`action-pill-btn ${isWishlisted ? 'liked' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsWishlisted(!isWishlisted);
              }}
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


      {/* 2. Image Section */}
      <div className="property-image-hero">
        {property.images?.[0] ? (
          <img
            src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`}
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

      {/* 3. Price Breakdown Section */}
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

      {/* 4. Tags Section */}
      <div className="pill-tags-container">
        <span className="tag-pill color-purple">{property.bhkType || "2 BHK"}</span>
        <span className="tag-pill color-orange">{property.furnishing || "Unfurnished"}</span>
        <span className="tag-pill color-blue">
          {property.maintenance ? "Maintenance Extra" : "Incl. Maintenance"}
        </span>
        <span className="tag-pill color-gray">{property.propertyType || "Not Gated"}</span>
        <span className="tag-pill color-green">{property.tenantPreferred || "Family"}</span>
        <span className="tag-pill color-dark">{getDaysAgo(property.createdAt, property._id)}</span>
      </div>

      {/* 5. Property Info Section */}
      <div className="property-footer-meta">
        <div className="meta-spec-item">
          <Maximize size={16} />
          <span>{property.sqft || '860'} sq.ft</span>
        </div>
        <div className="meta-spec-item">
          <MapPin size={16} />
          <span>{property.city || 'Bangalore'}</span>
        </div>
      </div>


      {/* 6. Action Buttons */}
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

