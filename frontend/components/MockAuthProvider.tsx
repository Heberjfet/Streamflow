'use client';

import { useEffect } from 'react';
import { initializeMockAuth } from '@/lib/mockData';

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializa el mock de autenticación solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      initializeMockAuth();
    }
  }, []);

  return <>{children}</>;
}
