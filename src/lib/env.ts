/**
 * Environment Helper Functions
 * Provides consistent access to environment variables across the application
 */

// Environment types
export type Environment = 'development' | 'production';

// Available environment variable keys (without VITE_DEV_ or VITE_PROD_ prefix)
export type EnvVarKey = 
  | 'BACKEND_PORT'
  | 'FRONTEND_PORT'
  | 'BACKEND_SERVER'
  | 'API_BASE_URL';

/**
 * Get the current environment
 */
export const getCurrentEnvironment = (): Environment => {
  const env = import.meta.env.VITE_ENV;
  return env === 'production' ? 'production' : 'development';
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return getCurrentEnvironment() === 'development';
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return getCurrentEnvironment() === 'production';
};

/**
 * Get environment-specific variable value
 * @param key - The variable key (without environment prefix)
 * @returns The environment-specific value or undefined if not found
 */
export const getEnvVar = (key: EnvVarKey): string | undefined => {
  const env = getCurrentEnvironment();
  const prefix = env === 'development' ? 'VITE_DEV_' : 'VITE_PROD_';
  const fullKey = `${prefix}${key}`;
  return import.meta.env[fullKey];
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
  return getEnvVarWithFallback('API_BASE_URL', 'http://localhost:5000');
};

/**
 * Get the backend server for the current environment
 */
export const getBackendServer = (): string => {
  return getEnvVarWithFallback('BACKEND_SERVER', 'localhost');
};

/**
 * Get the backend port for the current environment
 */
export const getBackendPort = (): number => {
  const port = getEnvVar('BACKEND_PORT');
  return port ? parseInt(port, 10) : 5000;
};

/**
 * Get the frontend port for the current environment
 */
export const getFrontendPort = (): number => {
  const port = getEnvVar('FRONTEND_PORT');
  return port ? parseInt(port, 10) : 3000;
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
  const env = getCurrentEnvironment();
  return {
    environment: env,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
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
  if (isDevelopment()) {
    console.group('🌍 Environment Configuration');
    console.table(getEnvironmentConfig());
    console.groupEnd();
  }
};

// Export environment constants for convenience
export const ENV = {
  CURRENT: getCurrentEnvironment(),
  IS_DEV: isDevelopment(),
  IS_PROD: isProduction(),
  API_BASE_URL: getApiBaseUrl(),
  BACKEND_URL: getBackendUrl(),
  BACKEND_SERVER: getBackendServer(),
  BACKEND_PORT: getBackendPort(),
  FRONTEND_PORT: getFrontendPort(),
  DEBUG_API: isDebugApiEnabled(),
} as const;
