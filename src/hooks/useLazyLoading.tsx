import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface LazyLoadingManagerProps {
  selectedTopic: string;
  selectedDateRange: { from: Date; to: Date; label: string };
  onMetricsLoaded?: () => void;
  onChartsLoaded?: () => void;
  onWordCloudLoaded?: () => void;
}

export interface LazyLoadingState {
  isLoadingMetrics: boolean;
  isLoadingCharts: boolean;
  isLoadingWordCloud: boolean;
  metricsLoaded: boolean;
  chartsLoaded: boolean;
  wordCloudLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
  isComplete: boolean;
}

export const useLazyLoading = ({ 
  selectedTopic, 
  selectedDateRange, 
  onMetricsLoaded, 
  onChartsLoaded, 
  onWordCloudLoaded 
}: LazyLoadingManagerProps) => {
  const { state, loadDashboardData, loadWordCloudData } = useAppContext();
  
  const [loadingState, setLoadingState] = useState<LazyLoadingState>({
    isLoadingMetrics: false,
    isLoadingCharts: false,
    isLoadingWordCloud: false,
    metricsLoaded: false,
    chartsLoaded: false,
    wordCloudLoaded: false,
    hasError: false,
    isComplete: false
  });

  const [hasStarted, setHasStarted] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Reset loading state when topic or date range changes
  useEffect(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoadingMetrics: false,
      isLoadingCharts: false,
      isLoadingWordCloud: false,
      metricsLoaded: false,
      chartsLoaded: false,
      wordCloudLoaded: false,
      hasError: false,
      errorMessage: undefined,
      isComplete: false
    }));
    setHasStarted(false);
  }, [selectedTopic, selectedDateRange]);

  // Update completion status
  useEffect(() => {
    const allLoaded = loadingState.metricsLoaded && loadingState.chartsLoaded && loadingState.wordCloudLoaded;
    const anyLoading = loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud;
    
    if (allLoaded && !anyLoading && !loadingState.isComplete) {
      setLoadingState(prev => ({ ...prev, isComplete: true }));
    }
  }, [loadingState.metricsLoaded, loadingState.chartsLoaded, loadingState.wordCloudLoaded, loadingState.isLoadingMetrics, loadingState.isLoadingCharts, loadingState.isLoadingWordCloud, loadingState.isComplete]);

  const loadMetrics = async () => {
    if (loadingState.metricsLoaded || loadingState.isLoadingMetrics) return;

    try {
      setLoadingState(prev => ({ ...prev, isLoadingMetrics: true, hasError: false }));
      
      console.log('📊 Loading metrics data...');
      await loadDashboardData(true); // Force refresh
      
      setLoadingState(prev => ({
        ...prev,
        isLoadingMetrics: false,
        metricsLoaded: true
      }));

      onMetricsLoaded?.();
      console.log('✅ Metrics loaded successfully');

    } catch (error) {
      console.error('❌ Error loading metrics:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoadingMetrics: false,
        hasError: true,
        errorMessage: 'Failed to load metrics data'
      }));
    }
  };

  const loadCharts = async () => {
    if (!loadingState.metricsLoaded || loadingState.chartsLoaded || loadingState.isLoadingCharts) return;

    // Wait a bit before loading charts
    const timeout = setTimeout(async () => {
      try {
        setLoadingState(prev => ({ ...prev, isLoadingCharts: true }));
        
        console.log('📈 Loading charts data...');
        // Charts are loaded with metrics data, so we just need to mark as loaded
        
        setLoadingState(prev => ({
          ...prev,
          isLoadingCharts: false,
          chartsLoaded: true
        }));

        onChartsLoaded?.();
        console.log('✅ Charts loaded successfully');

      } catch (error) {
        console.error('❌ Error loading charts:', error);
        setLoadingState(prev => ({
          ...prev,
          isLoadingCharts: false,
          hasError: true,
          errorMessage: 'Failed to load charts data'
        }));
      }
    }, 800);

    timeoutRefs.current.push(timeout);
  };

  const loadWordCloud = async () => {
    if (!loadingState.chartsLoaded || loadingState.wordCloudLoaded || loadingState.isLoadingWordCloud) return;

    // Wait a bit before loading word cloud
    const timeout = setTimeout(async () => {
      try {
        setLoadingState(prev => ({ ...prev, isLoadingWordCloud: true }));
        
        console.log('☁️ Loading word cloud data...');
        await loadWordCloudData(true); // Force refresh
        
        setLoadingState(prev => ({
          ...prev,
          isLoadingWordCloud: false,
          wordCloudLoaded: true
        }));

        onWordCloudLoaded?.();
        console.log('✅ Word cloud loaded successfully');

      } catch (error) {
        console.error('❌ Error loading word cloud:', error);
        setLoadingState(prev => ({
          ...prev,
          isLoadingWordCloud: false,
          hasError: true,
          errorMessage: 'Failed to load word cloud data'
        }));
      }
    }, 1200);

    timeoutRefs.current.push(timeout);
  };

  // Load metrics when started
  useEffect(() => {
    if (hasStarted && !loadingState.metricsLoaded && !loadingState.isLoadingMetrics) {
      loadMetrics();
    }
  }, [hasStarted, loadingState.metricsLoaded, loadingState.isLoadingMetrics]);

  // Load charts after metrics
  useEffect(() => {
    if (loadingState.metricsLoaded && !loadingState.chartsLoaded && !loadingState.isLoadingCharts) {
      loadCharts();
    }
  }, [loadingState.metricsLoaded, loadingState.chartsLoaded, loadingState.isLoadingCharts]);

  // Load word cloud after charts
  useEffect(() => {
    if (loadingState.chartsLoaded && !loadingState.wordCloudLoaded && !loadingState.isLoadingWordCloud) {
      loadWordCloud();
    }
  }, [loadingState.chartsLoaded, loadingState.wordCloudLoaded, loadingState.isLoadingWordCloud]);

  const startLazyLoading = () => {
    console.log('🚀 Starting lazy loading sequence...');
    setHasStarted(true);
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing all data...');
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    // Reset state
    setLoadingState({
      isLoadingMetrics: false,
      isLoadingCharts: false,
      isLoadingWordCloud: false,
      metricsLoaded: false,
      chartsLoaded: false,
      wordCloudLoaded: false,
      hasError: false,
      isComplete: false
    });
    
    setHasStarted(false);
    
    // Start loading again
    setTimeout(() => {
      setHasStarted(true);
    }, 100);
  };

  return {
    loadingState,
    startLazyLoading,
    forceRefresh,
    hasStarted
  };
};

export default useLazyLoading;
