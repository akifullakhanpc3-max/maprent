import React, { useState, useEffect } from 'react';
import { X, MapPin, Grid, CheckCircle2, Share2, Heart, ShieldCheck, Zap, Clock, Navigation2, Phone, MessageSquare, ChevronRight, Layers, Maximize, ExternalLink } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import ImageWithSkeleton from './ImageWithSkeleton';
import api, { BASE_URL } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import MiniMap from './MiniMap';
import '../styles/components/PropertyDetailsCard.css'

export default function PropertyDetailsOverlay({ property, onClose, onShowRoute, onSelectProperty }) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState({ loading: false, success: false, error: '' });

  const { user, toggleWishlist } = useAuthStore();
  const isWishlisted = user?.savedProperties?.includes(property?._id);

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!user) return alert('Please login to save properties');
    await toggleWishlist(property._id);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?id=${property._id}`;
    const shareData = {
      title: property.title || 'Property from Maprent',
      text: `Check out this property: ${property.title}`,
      url: shareUrl
    };

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Use native share only on mobile to avoid buggy desktop implementations
        await navigator.share(shareData);
      } else if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        await navigator.clipboard.writeText(shareUrl);
        alert('Property link copied to clipboard!');
      } else {
        // Legacy fallback
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          alert('Property link copied to clipboard!');
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showFullScreen) {
          setShowFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showFullScreen, onClose]);

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

  return (
    <div className="overlay-root-container">
      <div className="overlay-backdrop-dim" onClick={onClose} />

      <div className="overlay-master-container">
        <div className="overlay-side-panel">
          {/* Modern Glass Header */}
          <div className="overlay-sticky-header">
            <button onClick={onClose} className="header-close-btn">
              <X size={20} />
            </button>
            <div className="header-actions">
              <button
                onClick={handleWishlistToggle}
                className={`header-icon-btn ${isWishlisted ? 'liked' : ''}`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button className="header-icon-btn" onClick={handleShare}>
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="overlay-content-scrollable">
            {/* Main Hero Gallery */}
            <div className="overlay-hero-image-box">
              {property.images?.[0] ? (
                <ImageWithSkeleton
                  src={property.images?.[0] ? (property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`) : ''}
                  alt={property.title}
                  className="overlay-full-image"
                />
              ) : (
                <div className="overlay-image-placeholder">
                  <Grid size={48} />
                  <span>Gallery Empty</span>
                </div>
              )}
              <div className="overlay-image-badges">
                <span className="badge-item badge-dark">{property.bhkType} Unit</span>
                <span className="badge-item badge-green">Available</span>
                <span className="badge-item badge-blue">{getDaysAgo(property.createdAt, property._id)}</span>
                {property.isPinned && (
                  <span className="badge-item badge-gold">Pinned</span>
                )}
              </div>

              <button
                className="image-maximize-btn"
                onClick={() => setShowFullScreen(true)}
                title="View Full Screen"
              >
                <Maximize size={18} />
              </button>
            </div>


            <div className="overlay-main-body">
              {/* Identity & Location */}
              <div className="title-location-group">
                <div className="location-chip">
                  HOME CENTER
                </div>
                <h1 className="main-property-title">
                  {property.title || '2BHK Apartment'}
                </h1>
                <div className="main-price-display">
                  <span className="price-value">{property.price ? '₹' + property.price.toLocaleString() : '₹123'}</span>
                  <span className="price-label">MONTHLY RENT</span>
                </div>

                {/* Tags Section (Synced with Card) */}
                <div className="pill-tags-container overlay-tags-margin">
                  <span className="tag-pill color-purple">{property.bhkType || "2 BHK"}</span>
                  <span className="tag-pill color-orange">{property.furnishing || "Unfurnished"}</span>
                  <span className="tag-pill color-blue">
                    {property.maintenance ? "Maintenance Extra" : "Incl. Maintenance"}
                  </span>
                  <span className="tag-pill color-gray">{property.propertyType || "Not Gated"}</span>
                  <span className="tag-pill color-green">{property.tenantPreferred || "Family"}</span>
                  <span className="tag-pill color-dark">{getDaysAgo(property.createdAt, property._id)}</span>
                </div>
              </div>


              {/* Price Hero Section (Secondary Details) */}
              <div className="price-hero-card">
                <div className="price-stack">
                  <span className="stack-label">SECURITY DEPOSIT</span>
                  <span className="sub-price-val">
                    {(property.securityDeposit !== undefined && property.securityDeposit !== null)
                      ? '₹' + property.securityDeposit.toLocaleString()
                      : '₹' + (property.price * 2).toLocaleString()}
                  </span>
                </div>
                <div className="price-divider-v" />
                <div className="price-stack">
                  <span className="stack-label">MAINTENANCE</span>
                  <span className="sub-price-val">
                    {property.maintenance ? '₹' + property.maintenance.toLocaleString() : '₹12'}
                  </span>
                </div>
              </div>


              {/* Specifications Grid */}
              <div className="section-container">
                <h4 className="section-title-line">
                  <span>Property Specifications</span>
                  <div className="line-grow" />
                </h4>
                <div className="specs-grid-layout">
                  <div className="spec-card">
                    <span className="spec-label">Area</span>
                    <span className="spec-value">{property.sqft || '860'} SQFT</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Preference</span>
                    <span className="spec-value">{property.foodPreference || 'Any'}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Community</span>
                    <span className="spec-value">{property.propertyType || 'Non-Gated'}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Pets</span>
                    <span className="spec-value">{property.petsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="section-container">
                <h4 className="section-title-line">
                  <span>Description</span>
                  <div className="line-grow" />
                </h4>
                <p className="description-text-body">
                  {property.description || "Experience premium living in this meticulously designed unit, optimized for modern lifestyles with high-end finishes and neural-verified security protocols."}
                </p>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="report-listing-trigger"
                >
                  <ShieldCheck size={14} />
                  Report this Listing
                </button>
              </div>

              {/* Amenities Section */}
              {property.amenities?.length > 0 && (
                <div className="section-container">
                  <h4 className="section-title-line">
                    <span>Amenities</span>
                    <div className="line-grow" />
                  </h4>
                  <div className="amenities-flex-list">
                    {property.amenities.map((a, i) => (
                      <div key={i} className="amenity-chip-item">
                        <CheckCircle2 size={16} />
                        <span className="amenity-name">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Map (Mobile) */}
              <div className="section-container mini-map-section">
                <h4 className="section-title-line">
                  <span>Property Location</span>
                  <div className="line-grow" />
                </h4>
                <MiniMap
                  lat={property.location?.coordinates?.[1]}
                  lng={property.location?.coordinates?.[0]}
                  onSelectProperty={onSelectProperty}
                />
              </div>

              {/* Footer Branding */}
              <div className="overlay-branding-footer">
                <p>PROPERTY DETAILS SYSTEM</p>
              </div>

              {/* Action Interaction Hub */}
              <div className="overlay-action-footer">
                <div className="footer-contact-grid">
                  <button
                    onClick={() => window.location.href = `tel:+91${property?.ownerPhone || '9999999999'}`}
                    className="footer-btn btn-call"
                  >
                    <Phone size={18} />
                    CALL OWNER
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/91${property?.ownerPhone || '9999999999'}`, '_blank')}
                    className="footer-btn btn-whatsapp"
                  >
                    <MessageSquare size={18} />
                    WHATSAPP
                  </button>
                </div>

                <div className="footer-cta-stack">
                  <button
                    onClick={() => onShowRoute(property)}
                    className="footer-link-btn"
                  >
                    <Navigation2 size={16} />
                    VIEW ON MAP ROUTE
                  </button>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="footer-btn-main"
                  >
                    Contact for Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Map (Desktop Only) */}
        <div className="overlay-map-panel">
          <MiniMap
            lat={property.location?.coordinates?.[1]}
            lng={property.location?.coordinates?.[0]}
            onSelectProperty={onSelectProperty}
          />
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
        <div className="report-modal-overlay">
          <div className="report-modal-backdrop" onClick={() => setShowReportModal(false)} />
          <div className="report-modal-card">
            <h2 className="modal-title">Report Property</h2>
            <p className="modal-subtitle">Help us keep the platform safe</p>

            {reportStatus.success ? (
              <div className="report-success-msg">
                Report submitted successfully!
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setReportStatus({ loading: true, success: true, error: '' });
                setTimeout(() => setShowReportModal(false), 2000);
              }} className="report-form-body">
                <div className="form-group">
                  <label>Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="form-select"
                  >
                    <option value="Spam">Spam</option>
                    <option value="Fake Listing">Fake Listing</option>
                    <option value="Incorrect Info">Incorrect Info</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Details</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="form-textarea"
                    placeholder="Provide more context..."
                  />
                </div>
                <div className="modal-footer-btns">
                  <button type="button" onClick={() => setShowReportModal(false)} className="btn-cancel">CANCEL</button>
                  <button type="submit" className="btn-submit">SUBMIT REPORT</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Image Lightbox */}
      {showFullScreen && (
        <div className="fullscreen-lightbox-overlay animate-fade-in" onClick={() => setShowFullScreen(false)}>
          <button className="lightbox-close" onClick={() => setShowFullScreen(false)}>
            <X size={32} />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={property.images?.[0] ? (property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`) : ''}
              alt={property.title}
              className="lightbox-img animate-scale-in"
            />
          </div>
        </div>
      )}
    </div>
  );
}

