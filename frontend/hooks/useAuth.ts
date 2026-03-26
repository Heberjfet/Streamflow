'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, apiEndpoints } from '@/lib/api';
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
    try {
      const user = await api.get<User>(apiEndpoints.auth.me);
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/google`;
  };

  const logout = async () => {
    try {
      await api.post(apiEndpoints.auth.logout);
      setState({ user: null, isLoading: false, isAuthenticated: false });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    ...state,
    login,
    logout,
    checkAuth,
  };
}
