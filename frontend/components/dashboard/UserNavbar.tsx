'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StreamFlowLogo } from './StreamFlowLogo';
import { useAuth } from '@/hooks/useAuth';

export function UserNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <StreamFlowLogo />

          {/* Navegación central */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors duration-200 ${
                mounted && pathname === '/dashboard'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/dashboard/browse"
              className={`text-sm font-medium transition-colors duration-200 ${
                mounted && pathname === '/dashboard/browse'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Explorar
            </Link>
            <Link
              href="/dashboard/favorites"
              className={`text-sm font-medium transition-colors duration-200 ${
                mounted && pathname === '/dashboard/favorites'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Favoritos
            </Link>
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center gap-4">
            {/* Búsqueda rápida */}
            <button className="p-2 rounded-lg hover:bg-surface/50 transition-colors">
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notificaciones */}
            <button className="p-2 rounded-lg hover:bg-surface/50 transition-colors relative">
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </button>

            {/* Avatar y dropdown */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              {user && (
                <>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-text-primary">{user.name || 'Usuario'}</p>
                    <p className="text-xs text-text-secondary">{user.role === 'admin' ? 'Admin' : 'Usuario'}</p>
                  </div>
                  <div className="relative group">
                    <img
                      src={user.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'user')}`}
                      alt={user.name || 'User'}
                      className="w-9 h-9 rounded-full border-2 border-primary/50 group-hover:border-primary transition-colors cursor-pointer"
                    />
                    {/* Dropdown (básico, sin funcionalidad) */}
                    <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="glass-surface rounded-xl shadow-lg border border-white/10 py-2">
                        <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-colors">
                          Mi Perfil
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-colors">
                          Configuración
                        </button>
                        <hr className="my-2 border-border" />
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-surface/50 transition-colors"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
