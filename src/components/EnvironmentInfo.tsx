/**
 * Example Component showing how to use the Environment Helper
 * This is a demonstration component - remove if not needed
 */

import React from 'react';
import { ENV, getEnvironmentConfig, logEnvironmentConfig } from '@/lib/env';

export const EnvironmentInfo: React.FC = () => {
  // Use the environment helper functions
  const config = getEnvironmentConfig();

  // Example of using environment constants
  const handleLogConfig = () => {
    logEnvironmentConfig();
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Environment Configuration</h3>
      
      {/* Using environment constants */}
      <div className="space-y-2 text-sm">
        <p><strong>Environment:</strong> {ENV.CURRENT}</p>
        <p><strong>Mode:</strong> {ENV.IS_DEV ? 'Development' : 'Production'}</p>
        <p><strong>API Base URL:</strong> {ENV.API_BASE_URL}</p>
        <p><strong>Backend URL:</strong> {ENV.BACKEND_URL}</p>
        <p><strong>Backend Server:</strong> {ENV.BACKEND_SERVER}</p>
        <p><strong>Backend Port:</strong> {ENV.BACKEND_PORT}</p>
        <p><strong>Frontend Port:</strong> {ENV.FRONTEND_PORT}</p>
        <p><strong>Debug API:</strong> {ENV.DEBUG_API ? 'Enabled' : 'Disabled'}</p>
      </div>

      {/* Development-only features */}
      {ENV.IS_DEV && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Development Tools:</p>
          <button 
            onClick={handleLogConfig}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Log Config to Console
          </button>
        </div>
      )}

      {/* Using the getEnvironmentConfig function */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-semibold mb-2">Full Configuration:</p>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default EnvironmentInfo;
