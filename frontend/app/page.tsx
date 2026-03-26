'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/browse');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-radial-primary">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          StreamFlow
        </h1>
        <p className="text-text-secondary">Cargando...</p>
      </div>
    </div>
  );
}
