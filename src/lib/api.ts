// API Configuration for Development and Production
const API_CONFIG = {
  development: {
    baseURL: '', // Uses Vite proxy in development
  },
  production: {
    baseURL: import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://129.151.191.161:7000',
  }
};

// Determine environment
const isDevelopment = import.meta.env.DEV;
const environment = isDevelopment ? 'development' : 'production';

// Get base URL for API calls
export const getApiBaseUrl = (): string => {
  return API_CONFIG[environment].baseURL;
};

// Create API URL helper
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Enhanced fetch wrapper that automatically handles environment
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = createApiUrl(endpoint);
  
  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  // Log for debugging in development
  if (isDevelopment) {
    console.log(`API Call: ${options.method || 'GET'} ${url} - ${response.status}`);
  }

  return response;
};

// Specific cache clearing API calls
export const clearAllCache = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiCall('/api/cache/clear-all', { method: 'POST' });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, message: data.message || 'Cache cleared successfully' };
    } else {
      return { success: false, message: data.error || 'Failed to clear cache' };
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    return { success: false, message: 'Network error while clearing cache' };
  }
};

export const clearThreadCache = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiCall('/api/cache/clear', { method: 'POST' });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, message: data.message || 'Thread cache cleared successfully' };
    } else {
      return { success: false, message: data.error || 'Failed to clear thread cache' };
    }
  } catch (error) {
    console.error('Thread cache clear error:', error);
    return { success: false, message: 'Network error while clearing thread cache' };
  }
};

export const getCacheStatus = async (): Promise<any> => {
  try {
    const response = await apiCall('/api/cache/status');
    return await response.json();
  } catch (error) {
    console.error('Cache status error:', error);
    return { error: 'Failed to get cache status' };
  }
};

// Export environment info for debugging
export const getEnvironmentInfo = () => ({
  isDevelopment,
  environment,
  baseUrl: getApiBaseUrl(),
  mode: import.meta.env.MODE,
  viteEnv: import.meta.env
});
