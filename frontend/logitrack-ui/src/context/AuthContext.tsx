import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LoginCredentials } from '../types/auth';
import { authService } from '../services/auth.service';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasRole: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('logitrack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('logitrack_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('logitrack_token');
      if (savedToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('logitrack_user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('logitrack_token');
          localStorage.removeItem('logitrack_refresh_token');
          localStorage.removeItem('logitrack_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data) {
        const { token: jwtToken, refreshToken, user: profile } = res.data;
        localStorage.setItem('logitrack_token', jwtToken);
        localStorage.setItem('logitrack_refresh_token', refreshToken);
        localStorage.setItem('logitrack_user', JSON.stringify(profile));

        setToken(jwtToken);
        setUser(profile);
        toastSuccess('Welcome back!', `Signed in as ${profile.fullName} (${profile.role})`);
        return true;
      } else {
        toastError('Login Failed', res.message || 'Invalid credentials');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to connect to server. Please try again.';
      toastError('Login Error', msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('logitrack_token');
    localStorage.removeItem('logitrack_refresh_token');
    localStorage.removeItem('logitrack_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const hasRole = useCallback((allowedRoles: string[]) => {
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true; // SuperAdmin has universal access
    return allowedRoles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
