"use client";

import dynamic from "next/dynamic";

const PropertyDetailsClient = dynamic(() => import("./PropertyDetailsClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading Premium Asset Context...</p>
    </div>
  ),
});

export default PropertyDetailsClient;
