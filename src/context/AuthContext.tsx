/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AuthContext — manages Sanctum token, user object, and auth actions.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../lib/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth_token')
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const storeToken = (t: string, u: AuthUser) => {
    localStorage.setItem('auth_token', t);
    setToken(t);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const { user: u, token: t } = await authApi.login(email, password);
      storeToken(t, u);
      return true;
    } catch (e: any) {
      setAuthError(e.message ?? 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const { user: u, token: t } = await authApi.register(name, email, password);
      storeToken(t, u);
      return true;
    } catch (e: any) {
      setAuthError(e.message ?? 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API error — clear local state regardless
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthLoading, authError, login, register, logout, clearAuthError }}
    >
      {children}
    </AuthContext.Provider>
  );
}
