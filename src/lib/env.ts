/**
 * Environment Helper Functions
 * Provides consistent access to environment variables across the application
 */

// Environment types
export type Environment = 'development' | 'production';

// Available environment variable keys (no prefix required)
export type EnvVarKey = 
  | 'BACKEND_PORT'
  | 'FRONTEND_PORT'
  | 'BACKEND_SERVER'
  | 'API_BASE_URL';

/**
 * Get the current environment
 */
export const getCurrentEnvironment = (): Environment => {
  return 'development'; // Environment mode is no longer used
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return true;
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return false;
};

/**
 * Get environment-specific variable value
 * @param key - The variable key (without environment prefix)
 * @returns The environment-specific value or undefined if not found
 */
export const getEnvVar = (key: EnvVarKey): string | undefined => {
  // No prefix, just use the key directly
  return import.meta.env[key] || import.meta.env[`VITE_${key}`];
};

/**
 * Get environment-specific variable value with fallback
 * @param key - The variable key (without environment prefix)
 * @param fallback - Fallback value if environment variable is not found
 * @returns The environment-specific value or fallback
 */
export const getEnvVarWithFallback = (key: EnvVarKey, fallback: string): string => {
  return getEnvVar(key) || fallback;
};

/**
 * Get the API base URL for the current environment
 */
export const getApiBaseUrl = (): string => {
  return getEnvVarWithFallback('API_BASE_URL', `http://129.151.191.161:${getBackendPort()}`);
};

/**
 * Get the backend server for the current environment
 */
export const getBackendServer = (): string => {
  return getEnvVarWithFallback('BACKEND_SERVER', '129.151.191.161');
};

/**
 * Get the backend port for the current environment
 */
export const getBackendPort = (): number => {
  const port = getEnvVar('BACKEND_PORT');
  if (!port) throw new Error('BACKEND_PORT is not set in .env');
  return parseInt(port, 10);
};

/**
 * Get the frontend port for the current environment
 */
export const getFrontendPort = (): number => {
  const port = getEnvVar('FRONTEND_PORT');
  if (!port) throw new Error('FRONTEND_PORT is not set in .env');
  return parseInt(port, 10);
};

/**
 * Build a complete backend URL
 */
export const getBackendUrl = (): string => {
  const server = getBackendServer();
  const port = getBackendPort();
  return `http://${server}:${port}`;
};

/**
 * Get debug API setting
 */
export const isDebugApiEnabled = (): boolean => {
  return import.meta.env.VITE_DEBUG_API === 'true';
};

/**
 * Get all environment configuration for debugging
 */
export const getEnvironmentConfig = () => {
  return {
    apiBaseUrl: getApiBaseUrl(),
    backendServer: getBackendServer(),
    backendPort: getBackendPort(),
    frontendPort: getFrontendPort(),
    backendUrl: getBackendUrl(),
    debugApi: isDebugApiEnabled(),
    viteMode: import.meta.env.MODE,
    viteDev: import.meta.env.DEV,
    viteProd: import.meta.env.PROD,
  };
};

/**
 * Log environment configuration (for development debugging)
 */
export const logEnvironmentConfig = () => {
  console.group('🌍 Environment Configuration');
  console.table(getEnvironmentConfig());
  console.groupEnd();
};

// Export environment constants for convenience
export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  BACKEND_URL: getBackendUrl(),
  BACKEND_SERVER: getBackendServer(),
  BACKEND_PORT: getBackendPort(),
  FRONTEND_PORT: getFrontendPort(),
  DEBUG_API: isDebugApiEnabled(),
} as const;
