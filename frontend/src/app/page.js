"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import MapLoadingSkeleton from "@/components/MapLoadingSkeleton";

// Dynamically import the interactive MapView component to prevent Leaflet SSR errors
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="app-map-view-wrapper">
        <MapView />
      </div>
    </>
  );
}
