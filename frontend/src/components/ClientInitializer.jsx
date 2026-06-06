"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import StatusOverlay from './StatusOverlay';

export default function ClientInitializer({ children }) {
  const loadUser = useAuthStore(s => s.loadUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadUser();
    }
  }, [loadUser]);

  return (
    <>
      <StatusOverlay />
      {children}
    </>
  );
}
