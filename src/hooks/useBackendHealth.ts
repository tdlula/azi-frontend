import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface BackendHealthStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
  responseTime: number | null;
}

export interface BackendHealthData {
  status: string;
  timestamp: string;
}

const HEALTH_CHECK_URL = '/api/health';
const HEALTH_CHECK_INTERVAL = 600000; // 10 minutes
const MAX_RETRIES = 3;

export function useBackendHealth() {
  const [healthStatus, setHealthStatus] = useState<BackendHealthStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastChecked: null,
    retryCount: 0,
    responseTime: null
  });

  const checkHealth = useCallback(async (): Promise<BackendHealthData> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(HEALTH_CHECK_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      setHealthStatus(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
        retryCount: 0,
        responseTime
      }));

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setHealthStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1,
        responseTime
      }));

      throw error;
    }
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['backend-health'],
    queryFn: checkHealth,
    refetchInterval: HEALTH_CHECK_INTERVAL,
    retry: MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 70010),
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  // Manual retry function
  const retryConnection = useCallback(() => {
    setHealthStatus(prev => ({ ...prev, isLoading: true, error: null }));
    refetch();
  }, [refetch]);

  // Reset retry count when connection is restored
  useEffect(() => {
    if (healthStatus.isConnected && healthStatus.retryCount > 0) {
      setHealthStatus(prev => ({ ...prev, retryCount: 0 }));
    }
  }, [healthStatus.isConnected, healthStatus.retryCount]);

  return {
    ...healthStatus,
    data,
    refetch: retryConnection,
    isMaxRetriesReached: healthStatus.retryCount >= MAX_RETRIES
  };
}