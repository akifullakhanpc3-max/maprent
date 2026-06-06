"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Loader2 } from 'lucide-react';

export default function ImageWithSkeleton({ src, alt, className }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fallback visual asset if source is empty or invalid
  const fallbackSrc = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";
  const imageSrc = !src || src.trim() === '' ? fallbackSrc : src;

  return (
    <div className={`premium-image-container relative overflow-hidden ${className}`}>
      {loading && (
        <div className="skeleton-shimmer absolute inset-0 z-10 bg-slate-100 flex items-center justify-center">
          <div className="skeleton-loader-icon">
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        </div>
      )}
      
      {error ? (
        <div className="error-fallback absolute inset-0 z-10 bg-slate-50 flex items-center justify-center border border-slate-100">
          <div className="error-stack flex flex-col items-center gap-1">
            <ImageOff size={20} className="text-slate-300" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Media Offline</span>
          </div>
        </div>
      ) : (
        <Image 
          src={imageSrc} 
          alt={alt || "Occupra Premium Property"} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`image-core duration-500 ease-in-out ${loading ? 'scale-105 blur-sm' : 'scale-100 blur-0'}`}
          style={{ objectFit: 'cover' }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </div>
  );
}
