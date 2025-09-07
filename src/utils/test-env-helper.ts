/**
 * Simple test utility to verify environment helper functionality
 * Run this in the browser console to test the environment helper
 */

import { 
  getCurrentEnvironment,
  isDevelopment,
  isProduction,
  getEnvVar,
  getApiBaseUrl,
  getBackendUrl,
  getEnvironmentConfig,
  ENV
} from '../lib/env';

export const testEnvironmentHelper = () => {
  console.group('🧪 Environment Helper Test');
  
  try {
    // Test basic environment detection
    console.log('✓ Current Environment:', getCurrentEnvironment());
    console.log('✓ Is Development:', isDevelopment());
    console.log('✓ Is Production:', isProduction());
    
    // Test environment variable access
    console.log('✓ Backend Port:', getEnvVar('BACKEND_PORT'));
    console.log('✓ API Base URL:', getApiBaseUrl());
    console.log('✓ Backend URL:', getBackendUrl());
    
    // Test environment constants
    console.log('✓ ENV Constants:', ENV);
    
    // Test configuration
    console.log('✓ Full Configuration:');
    console.table(getEnvironmentConfig());
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.groupEnd();
};

// Auto-run in development
//if (import.meta.env.DEV) {
  // Delay to ensure all modules are loaded
  //setTimeout(testEnvironmentHelper, 1000);
//}
