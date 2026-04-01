import { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import '../styles/components/ImageWithSkeleton.css';

export default function ImageWithSkeleton({ src, alt, className }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`premium-image-container ${className}`}>
      {loading && (
        <div className="skeleton-shimmer absolute inset-0">
           <div className="skeleton-loader-icon">
              <Loader2 size={16} className="animate-spin text-slate-300" />
           </div>
        </div>
      )}
      
      {error ? (
        <div className="error-fallback absolute inset-0">
            <div className="error-stack">
                <ImageOff size={24} className="text-slate-200" />
                <span className="error-tag">Media Offline</span>
            </div>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`image-core ${loading ? 'is-loading' : 'is-loaded'}`}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </div>
  );
}
