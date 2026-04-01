import { SlidersHorizontal } from 'lucide-react';
import '../styles/components/FilterToggleButton.css';

export default function FilterToggleButton({ onClick, activeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`filter-toggle-btn ${activeCount > 0 ? 'is-active' : ''}`}
      aria-label="Toggle filters"
    >
      <div className="toggle-icon-wrap">
        <SlidersHorizontal size={14} />
      </div>
      
      <div className="toggle-label-stack">
        <span className="toggle-tag">Search</span>
        <span className="toggle-main">Filters</span>
      </div>

      {activeCount > 0 && (
         <div className="toggle-badge animate-fade-in animate-scale-in">
           {activeCount}
         </div>
      )}
    </button>
  );
}
