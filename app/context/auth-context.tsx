'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'doctor' | 'admin' | 'society';
  phone?: string;
  organization?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: 'doctor' | 'admin' | 'society';
    phone?: string;
    organization?: string;
  }) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        
        if (savedToken && savedUser) {
          try {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Failed to parse saved user:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      }
    } catch (error) {
      console.error('localStorage initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      // ===============================
// RECENT LOGIN (24 HOUR TRACKING)
// ===============================

if (typeof window !== 'undefined') {
  const existing = JSON.parse(
    localStorage.getItem('recent_logins') || '[]'
  );

  const now = Date.now();

  const loginEntry = {
    id: now,
    email: data.user.email,
    full_name: data.user.full_name,
    role: data.user.role,
    organization: data.user.organization || 'Medical Department',
    login_time: now,
  };

  // keep only last 24 hours logs
  const last24hrs = existing.filter(
    (u: any) => now - u.login_time < 24 * 60 * 60 * 1000
  );

  // remove duplicates (same email)
  const filtered = last24hrs.filter(
    (u: any) => u.email !== loginEntry.email
  );

  // add new login at top
  filtered.unshift(loginEntry);

  localStorage.setItem(
    'recent_logins',
    JSON.stringify(filtered)
  );
}
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      
      return data.user.role;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
    
  };

  const register = async (registerData: {
    email: string;
    password: string;
    full_name: string;
    role: 'doctor' | 'admin' | 'society';
    phone?: string;
    organization?: string;
  }): Promise<string> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(errorData.error || 'Registration failed');
      }

      const registeredUser = await response.json();
      console.log('[v0] User registered:', registeredUser);
      
      // Auto-login after registration and return role
      const role = await login(registerData.email, registerData.password);
      return role;
    } catch (error) {
      console.error('[v0] Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
