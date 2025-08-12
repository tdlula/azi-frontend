import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up periodic token verification (every 30 minutes)
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(async () => {
      console.log('🔄 Periodic token verification...');
      
      // Check if token is expired client-side first
      if (authService.isTokenLikelyExpired()) {
        console.log('🔑 Token expired client-side, logging out');
        await logout();
        return;
      }

      try {
        const verification = await authService.verifyToken();
        if (!verification.valid) {
          console.log('🔑 Token verification failed, logging out');
          await logout();
        } else if (verification.user && !authState.user) {
          // Update user data if we didn't have it before
          setAuthState(prev => ({ ...prev, user: verification.user || null }));
        }
      } catch (error) {
        console.warn('⚠️ Periodic token verification failed, will retry next time:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  const initializeAuth = async () => {
    const token = authService.getToken();
    
    console.log('🔍 Initializing auth, token found:', !!token);
    
    if (!token) {
      console.log('❌ No token found, setting unauthenticated state');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      console.log('🔄 Verifying token with backend...');
      // Verify token and get user data
      const verification = await authService.verifyToken();
      
      console.log('✅ Token verification result:', verification);
      
      if (verification.valid && verification.user) {
        console.log('✅ Authentication successful, user:', verification.user.username);
        setAuthState({
          user: verification.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else if (verification.valid && !verification.user) {
        // Token is valid but no user data (network issue), keep authenticated
        console.log('⚠️ Token valid but no user data, keeping authenticated');
        setAuthState({
          user: null,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token is invalid
        console.log('❌ Token verification failed, clearing token');
        authService.clearToken();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      // Don't immediately logout on network errors
      console.log('⚠️ Network error during auth init, keeping token for now');
      setAuthState({
        user: null,
        token,
        isAuthenticated: true, // Keep authenticated on network errors
        isLoading: false,
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login({ username, password });
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshUser = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const user = await authService.getCurrentUser();
      setAuthState(prev => ({ ...prev, user }));
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      
      // Only logout on auth errors, not network errors
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || '';
        const isAuthError = errorMessage.includes('Invalid or expired token') || 
                          errorMessage.includes('Authentication failed');
        
        if (isAuthError) {
          console.log('🔑 Auth error during user refresh, logging out');
          await logout();
        }
      }
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
