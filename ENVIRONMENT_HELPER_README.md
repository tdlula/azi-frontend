# Environment Helper Documentation

This document explains how to use the environment helper functions in the Azi Frontend application.

## Overview

The environment helper (`src/lib/env.ts`) provides a consistent way to access environment variables across the application, automatically handling development and production configurations.

## Environment Variables Structure

The application uses environment-specific prefixes in the `.env` file:

```env
# Environment selector
VITE_ENV=development

# Development variables
VITE_DEV_BACKEND_PORT=7000
VITE_DEV_FRONTEND_PORT=3000
VITE_DEV_BACKEND_SERVER=129.151.191.161
VITE_DEV_API_BASE_URL=http://129.151.191.161:7000

# Production variables
VITE_PROD_BACKEND_PORT=7000
VITE_PROD_FRONTEND_PORT=3000
VITE_PROD_BACKEND_SERVER=129.151.191.161
VITE_PROD_API_BASE_URL=http://129.151.191.161:7000

# Server-side only (for vite.config.ts)
DEV_BACKEND_PORT=7000
DEV_FRONTEND_PORT=3000
PROD_BACKEND_PORT=7000
PROD_FRONTEND_PORT=3000

# Debug settings
VITE_DEBUG_API=true
```

## Usage Examples

### Basic Environment Detection

```typescript
import { getCurrentEnvironment, isDevelopment, isProduction } from '@/lib/env';

// Get current environment
const env = getCurrentEnvironment(); // 'development' | 'production'

// Check environment
if (isDevelopment()) {
  console.log('Running in development mode');
}

if (isProduction()) {
  console.log('Running in production mode');
}
```

### Getting Environment Variables

```typescript
import { getEnvVar, getEnvVarWithFallback } from '@/lib/env';

// Get specific environment variable
const backendPort = getEnvVar('BACKEND_PORT'); // Gets VITE_DEV_BACKEND_PORT or VITE_PROD_BACKEND_PORT

// Get with fallback
const apiUrl = getEnvVarWithFallback('API_BASE_URL', 'http://129.151.191.161:7000');
```

### Using Convenience Functions

```typescript
import { 
  getApiBaseUrl, 
  getBackendUrl, 
  getBackendServer, 
  getBackendPort,
  getFrontendPort,
  isDebugApiEnabled 
} from '@/lib/env';

// Get API configuration
const apiUrl = getApiBaseUrl(); // Automatically gets the right URL for current environment
const backendUrl = getBackendUrl(); // Complete backend URL
const server = getBackendServer(); // Just the server hostname
const port = getBackendPort(); // Just the port number

// Check debug settings
if (isDebugApiEnabled()) {
  console.log('API debugging is enabled');
}
```

### Using Environment Constants

```typescript
import { ENV } from '@/lib/env';

// All environment values are pre-calculated and available as constants
console.log('Environment:', ENV.CURRENT);
console.log('Is Dev:', ENV.IS_DEV);
console.log('API URL:', ENV.API_BASE_URL);
console.log('Backend URL:', ENV.BACKEND_URL);
```

### Debugging Environment Configuration

```typescript
import { getEnvironmentConfig, logEnvironmentConfig } from '@/lib/env';

// Get all environment configuration
const config = getEnvironmentConfig();
console.table(config);

// Log configuration to console (development only)
logEnvironmentConfig();
```

## API Service Integration

The environment helper is integrated with the API service:

```typescript
// In src/lib/api.ts
import { getApiBaseUrl, isDevelopment } from '@/lib/env';

// Automatically uses the correct API URL for the current environment
const apiUrl = getApiBaseUrl();
```

## Component Usage

```typescript
import React from 'react';
import { ENV, isDevelopment } from '@/lib/env';

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>Current Environment: {ENV.CURRENT}</h1>
      
      {/* Development-only features */}
      {ENV.IS_DEV && (
        <div>
          <button onClick={() => console.log('Debug info')}>
            Debug Tools
          </button>
        </div>
      )}
      
      {/* Production-only features */}
      {ENV.IS_PROD && (
        <div>
          <p>Production mode active</p>
        </div>
      )}
    </div>
  );
};
```

## Switching Environments

To switch between environments, simply change the `VITE_ENV` variable in your `.env` file:

```env
# For development
VITE_ENV=development

# For production
VITE_ENV=production
```

The helper functions will automatically use the appropriate environment-specific variables.

## Best Practices

1. **Use the helper functions** instead of accessing `import.meta.env` directly
2. **Use environment constants** (`ENV`) for frequently accessed values
3. **Use fallbacks** with `getEnvVarWithFallback()` for critical configuration
4. **Log configuration** in development using `logEnvironmentConfig()`
5. **Keep environment-specific logic** minimal and centralized

## Type Safety

The helper provides TypeScript types for environment variable keys:

```typescript
type EnvVarKey = 
  | 'BACKEND_PORT'
  | 'FRONTEND_PORT'
  | 'BACKEND_SERVER'
  | 'API_BASE_URL';
```

This ensures you can only access defined environment variables and get compile-time checking.
