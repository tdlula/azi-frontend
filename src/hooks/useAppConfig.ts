// Custom hook for application configuration
import { useState, useEffect } from 'react';

interface AppConfig {
  adminFeaturesEnabled: boolean;
  environment: string;
  version: string;
  chartPromptsEnabled: boolean;
  lastUpdated: string;
}

const defaultConfig: AppConfig = {
  adminFeaturesEnabled: false,
  environment: 'development',
  version: '2.0',
  chartPromptsEnabled: true,
  lastUpdated: new Date().toISOString()
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
          setError(null);
        } else {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }
      } catch (err) {
        console.error('Failed to load app configuration:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Keep default config if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const refetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
        setError(null);
      } else {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to reload app configuration:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    refetchConfig,
    // Convenience getters
    isAdminEnabled: config.adminFeaturesEnabled,
    isProduction: config.environment === 'production',
    isDevelopment: config.environment === 'development'
  };
}

export type { AppConfig };
