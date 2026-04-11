'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, loginWithEmail, registerWithEmail } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard'); // Redirige al dashboard del usuario
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = () => {
    login();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (isRegistering) {
        if (registerWithEmail) {
          await registerWithEmail(name, email, password);
        } else {
          setError('El registro con correo no está configurado');
        }
      } else {
        if (loginWithEmail) {
          await loginWithEmail(email, password);
        } else {
          setError('El inicio de sesión con correo no está configurado');
        }
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error
        ? err.message
        : (isRegistering ? 'Error al registrarse' : 'Error al iniciar sesión');
      const message = rawMessage === 'Invalid credentials'
        ? 'Correo o contraseña incorrectos'
        : rawMessage;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="glass-surface rounded-3xl p-8 md:p-12 max-w-md w-full mx-4 relative z-10 border border-white/5 shadow-2xl animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            StreamFlow
          </h1>
          <p className="text-text-secondary text-sm">
            {isRegistering ? 'Crea cuenta para continuar' : 'Tu plataforma de streaming, tu control'}
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-100 bg-red-900/40 border border-red-500/20 rounded-lg text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="animate-fade-in">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required={isRegistering}
                />
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 12C3.8 8.8 7.2 6 12 6C16.8 6 20.2 8.8 22 12C20.2 15.2 16.8 18 12 18C7.2 18 3.8 15.2 2 12Z"
                    fill="white"
                    stroke="black"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {showPassword ? (
                    <circle cx="12" cy="12" r="3" fill="white" stroke="black" strokeWidth="1.8" />
                  ) : (
                    <path
                      d="M5 19L19 5"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-white flex justify-center items-center py-3 shadow-lg mt-2"
            >
              {isSubmitting ? 'Procesando...' : (isRegistering ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>
          </form>

          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              {isRegistering ? '¿Ya tienes una cuenta? Iniciar sesión' : '¿Eres nuevo? Regístrate aquí'}
            </button>
          </div>

          <div className="relative pt-4">
            <div className="absolute inset-0 flex flex-col justify-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-text-secondary bg-surface/80 backdrop-blur-md rounded-full py-1 text-xs">
                O continuar con
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-white text-gray-900 hover:bg-gray-200 hover:scale-[1.02] shadow-[0_4px_14px_0_rgba(255,255,255,0.2)]"
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
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
