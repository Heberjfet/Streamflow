'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/browse');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = () => {
    login();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-radial-primary">
        <div className="animate-pulse text-primary text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-radial-primary">
      <div className="glass-surface rounded-2xl p-8 md:p-12 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            StreamFlow
          </h1>
          <p className="text-text-secondary text-sm">
            Tu plataforma de streaming, tu control
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-200 bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Iniciar sesión con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-secondary">
                Accede para explorar antologías de video IA
              </span>
            </div>
          </div>

          <p className="text-center text-text-secondary text-xs">
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-text-secondary text-xs">
            <span>Plataforma estilo</span>
            <span className="text-primary font-medium">Love, Death & Robots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
