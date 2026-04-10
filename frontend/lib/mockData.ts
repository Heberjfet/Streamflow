// Mock de datos de usuario para desarrollo local
// Este archivo se puede eliminar cuando el backend esté completamente integrado

import type { User } from '@/types';

export const mockToken = 'mock-jwt-token-for-development';

// Función para crear un mock de usuario desde datos de registro
export function createMockUser(name: string, email: string): User {
  return {
    id: `mock-${Date.now()}`,
    google_id: '',
    email,
    name,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    role: 'viewer',
    created_at: new Date().toISOString(),
  };
}

// Función para guardar usuario en localStorage
export function saveMockUser(user: User, token: string = mockToken) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('mock_user', JSON.stringify(user));
    console.log('🔐 Usuario guardado:', user.name);
  }
}

// Función para obtener usuario de localStorage
export function getMockUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('mock_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error al parsear usuario:', e);
        return null;
      }
    }
  }
  return null;
}

// Función para limpiar mock de autenticación
export function clearMockAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_user');
    console.log('🔓 Sesión cerrada');
  }
}

// Función para verificar si estamos usando mock
export function isMockAuth() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    return token === mockToken;
  }
  return false;
}

// Función para inicializar mock auth (development only)
// Crea un usuario demo si no existe ninguno
export function initializeMockAuth() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const existingUser = getMockUser();
    if (!existingUser) {
      // Crear usuario demo para desarrollo
      const demoUser = createMockUser('Usuario Demo', 'demo@streamflow.local');
      saveMockUser(demoUser);
      console.log('🔓 Mock auth inicializado con usuario demo');
    }
  }
}
