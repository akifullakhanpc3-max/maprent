import React from 'react';
import { ShieldCheck, Radar } from 'lucide-react';

export default function MapLoadingOverlay({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="glass-backdrop z-[3001] !bg-slate-950/20">
      <div className="modal-content-standard !max-w-md !p-12 !rounded-[3rem] text-center flex-col gap-8 animate-fade-in">
        <div className="flex-center relative">
          <div className="absolute inset-0 bg-primary-color rounded-full blur-2xl opacity-10 animate-pulse" />
          <div className="w-20 h-20 bg-primary-color rounded-2xl flex-center text-white shadow-lg rotate-3">
             <Radar className="w-10 h-10 animate-spin" />
          </div>
        </div>
        
        <div className="flex-col gap-2">
           <div className="flex-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary-color" />
              <span className="label-base !m-0 !text-[9px]">Geospatial Sync</span>
           </div>
           <h3 className="text-2xl font-black text-main uppercase tracking-tighter">Locating <span className="text-secondary-color">Spaces</span></h3>
           <p className="label-base !lowercase !text-muted">Occupra is finding your perfect home...</p>
        </div>

        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
           <div className="h-full bg-primary-color animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
