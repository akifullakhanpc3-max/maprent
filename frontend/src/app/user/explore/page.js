"use client";

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <LoadingSpinner fullScreen text="Initializing spatial discovery matrix..." />
});

export default function TenantExplorePage() {
  return (
    <div style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
      <MapView />
    </div>
  );
}
