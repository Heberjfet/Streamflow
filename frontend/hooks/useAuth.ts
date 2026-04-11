'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}



export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await apiClient.get<User>('/v1/auth/me', token);
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('auth_token');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/google`;
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/v1/auth/login', { email, password }, '');
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        setState({ user: response.user, isLoading: false, isAuthenticated: true });
      }
    } catch (error) {
      throw error;
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/v1/auth/register', { name, email, password }, '');
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        setState({ user: response.user, isLoading: false, isAuthenticated: true });
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.post('/v1/auth/logout', {}, token || '');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    
    localStorage.removeItem('auth_token');
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  return {
    ...state,
    login,
    loginWithEmail,
    registerWithEmail,
    logout,
    checkAuth,
  };
}

