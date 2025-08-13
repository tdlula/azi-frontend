import axios, { type AxiosInstance } from 'axios';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';
import { getApiBaseUrl } from '@/lib/env';

const API_BASE_URL = getApiBaseUrl();

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies
    });

    // Add request interceptor to include token
    this.api.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        // Check if token is likely expired before making request
        if (this.isTokenLikelyExpired()) {
          console.warn('🔑 Token appears to be expired, clearing it');
          this.clearToken();
          // Don't include the expired token in the request
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only logout on specific auth-related errors, not all 401s
          const errorMessage = error.response?.data?.message || '';
          const isAuthError = errorMessage.includes('Invalid or expired token') || 
                            errorMessage.includes('Authentication failed') ||
                            errorMessage.includes('No authentication token provided') ||
                            errorMessage.includes('User not found or inactive');
          
          if (isAuthError) {
            console.log('🔑 Auth token invalid, logging out');
            this.clearToken();
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          } else {
            console.warn('⚠️ Received 401 but not an auth error:', errorMessage);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Check if token is likely expired (client-side check)
  isTokenLikelyExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT payload (without verification since we don't have the secret)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Consider token expired if it expires within the next 5 minutes
      return currentTime >= (expirationTime - 5 * 60 * 1000);
    } catch (error) {
      console.warn('Failed to decode token, considering it expired:', error);
      return true;
    }
  }

  // API methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/login', credentials);
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<{ success: boolean; message: string; user: User }> {
    try {
      const response = await this.api.post('/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<{ success: boolean; user: User }>('/me');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      console.log('🔄 Making verify request to:', `${API_BASE_URL}/api/auth/verify`);
      const response = await this.api.get<{ success: boolean; user: User }>('/verify');
      console.log('✅ Verify response:', response.data);
      return { valid: response.data.success, user: response.data.user };
    } catch (error: any) {
      console.error('❌ Verify token failed:', error.response?.status, error.response?.data || error.message);
      
      // If it's a network error or server error (not auth), don't immediately invalidate
      if (!error.response) {
        console.warn('🌐 Network error during token verification, assuming valid for now');
        return { valid: true }; // Assume valid on network errors
      }
      
      // Only treat as invalid for actual auth errors (401 with auth message)
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || '';
        const isAuthError = errorMessage.includes('Invalid or expired token') || 
                          errorMessage.includes('Authentication failed') ||
                          errorMessage.includes('User not found or inactive');
        
        if (isAuthError) {
          return { valid: false };
        } else {
          console.warn('⚠️ 401 but not an auth error, assuming valid');
          return { valid: true };
        }
      }
      
      // For other errors (500, etc), assume valid
      return { valid: true };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenLikelyExpired();
  }
}

export const authService = new AuthService();
