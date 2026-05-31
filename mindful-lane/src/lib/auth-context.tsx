import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, ApiError } from './api';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  message?: string;
}

interface MeResponse {
  success: boolean;
  user: AuthUser;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if we have a stored token and re-hydrate user
  useEffect(() => {
    const token = localStorage.getItem('row_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get<MeResponse>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem('row_token'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('row_token', res.token);
    setUser(res.user);
    toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    localStorage.setItem('row_token', res.token);
    setUser(res.user);
    toast.success('Account created! Please check your email to verify.');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('row_token');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Re-export ApiError for use in pages
export { ApiError };
