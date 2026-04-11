'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/hooks/useAuth';
import { DashboardMain } from '@/components/dashboard/DashboardMain';

export default function DashboardPage() {
  // ## Descomentar cuando el backend esté listo
  // const router = useRouter();
  // const { isAuthenticated, isLoading } = useAuth();

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="animate-pulse text-primary text-lg">Cargando...</div>
  //     </div>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return null;
  // }

  return <DashboardMain />;
}
