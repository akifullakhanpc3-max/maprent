/* MapLoadingSkeleton.jsx — mirrors the real map-dashboard layout */

const Shimmer = ({ className = '', style = {} }) => (
  <div className="skeleton-shimmer" style={style}>
    <div className={`skeleton-block ${className}`} />
  </div>
);

/* One skeleton property card */
const SkeletonCard = () => (
  <div className="skeleton-property-card">
    {/* Image placeholder */}
    <div className="skeleton-card-image">
      <Shimmer className="skeleton-full" />
    </div>
    {/* Content */}
    <div className="skeleton-card-body">
      <Shimmer style={{ height: 14, width: '65%', borderRadius: 6 }} />
      <Shimmer style={{ height: 11, width: '45%', borderRadius: 6, marginTop: 6 }} />
      <div className="skeleton-card-row">
        <Shimmer style={{ height: 10, width: '30%', borderRadius: 6 }} />
        <Shimmer style={{ height: 10, width: '30%', borderRadius: 6 }} />
        <Shimmer style={{ height: 10, width: '22%', borderRadius: 6 }} />
      </div>
    </div>
  </div>
);

export default function MapLoadingSkeleton() {
  return (
    <div className="skeleton-map-layout">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="skeleton-sidebar">

        {/* Sidebar header: search bar + filter chips */}
        <div className="skeleton-sidebar-header">
          <Shimmer style={{ height: 42, borderRadius: 10, width: '100%' }} />
          <div className="skeleton-chip-row">
            {[72, 88, 60, 80].map((w, i) => (
              <Shimmer key={i} style={{ height: 32, width: w, borderRadius: 20, flexShrink: 0 }} />
            ))}
          </div>
          {/* Results count */}
          <Shimmer style={{ height: 10, width: '40%', borderRadius: 6 }} />
        </div>

        {/* Property card list */}
        <div className="skeleton-card-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </aside>

      {/* ── RIGHT MAP AREA ── */}
      <div className="skeleton-map-pane">
        {/* Map search bar floating at top */}
        <div className="skeleton-map-topbar">
          <Shimmer style={{ height: 44, width: '55%', borderRadius: 24 }} />
          <Shimmer style={{ height: 44, width: 44, borderRadius: 10 }} />
        </div>

        {/* Map tile grid shimmer */}
        <div className="skeleton-map-tiles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="skeleton-map-tile" style={{ animationDelay: `${(i % 5) * 120}ms` }} />
          ))}
        </div>

        {/* Zoom controls placeholder (bottom-right) */}
        <div className="skeleton-zoom-controls">
          <Shimmer style={{ height: 44, width: 44, borderRadius: 8 }} />
          <Shimmer style={{ height: 44, width: 44, borderRadius: 8, marginTop: 4 }} />
        </div>
      </div>

    </div>
  );
}
