import { TrendingUp, Target, Activity, BarChart3, Filter, ChevronDown, Radio, Award, Clock, Zap, Settings, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import ChartRenderer from "@/components/charts/ChartRenderer";
import DrillDownModal from "@/components/modals/DrillDownModal";
import DashboardStatus from "@/components/DashboardStatus";
import DateRangePicker, { getDefaultDateRange } from "@/components/DateRangePicker";
import { useState, useEffect } from "react";
import { DashboardSchema } from "@/schemas/dashboardSchema";
import html2canvas from "html2canvas";
import { useAppContext } from "@/contexts/AppContext";
import topicsData from "@/data/topics.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { testFrontendBackendIntegration } from "@/utils/integrationTest";
import { useAppConfig } from "@/hooks/useAppConfig";

export default function DashboardMinimal() {
  const { state, loadDashboardData, loadWordCloudData } = useAppContext();
  const { isAdminEnabled } = useAppConfig();
  
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    data: null,
    title: "",
    subtitle: "",
    type: 'chart' as 'chart' | 'metrics',
    fields: [] as Array<{ label: string; value: string | number; key: string }>
  });

  // Filter state
  const [selectedTopic, setSelectedTopic] = useState("shoprite");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState(getDefaultDateRange());
  
  // Use only authentic dashboard data from OpenAI assistant
  // Validate and normalize data structure using Zod schema
  const rawData: any = state.dashboardData;
  let dashboardData: any;
  let schemaError = null;

  // Default fallback structure to prevent null reference errors
  const defaultData = {
    metrics: {
      overallPositiveSentiment: {
        value: 0,
        label: "Overall Positive Sentiment"
      },
      totalMentions: {
        value: 0,
        label: "Total On-Air Mentions"
      },
      highEngagementMoments: {
        value: 0,
        label: "High Engagement Moments"
      },
      whatsappNumberMentions: {
        value: 0,
        label: "WhatsApp Number Mentions"
      }
    },
    charts: {}
  };

  // Create fallback data from raw data or use defaults
  const createFallbackData = (sourceData: any = {}) => {
    const metrics = sourceData?.metrics || sourceData?.dashboard_metrics || sourceData?.dashboard?.metrics || {};
    return {
      metrics: {
        overallPositiveSentiment: metrics.overallPositiveSentiment || {
          value: 0,
          label: "Overall Positive Sentiment"
        },
        totalMentions: metrics.totalMentions || {
          value: 0,
          label: "Total On-Air Mentions"
        },
        highEngagementMoments: metrics.highEngagementMoments || {
          value: 0,
          label: "High Engagement Moments"
        },
        whatsappNumberMentions: metrics.whatsappNumberMentions || {
          value: 0,
          label: "WhatsApp Number Mentions"
        }
      },
      charts: sourceData?.charts || sourceData?.dashboard?.charts || {}
    };
  };

  try {
    const parsedData = DashboardSchema.parse(rawData);
    dashboardData = parsedData || createFallbackData(rawData);
    console.log('✅ Schema validation passed:', dashboardData);
  } catch (err: any) {
    schemaError = err;
    console.error('❌ Schema validation failed:', err);
    console.log('🔍 Raw data structure:', rawData);
    dashboardData = createFallbackData(rawData);
    console.log('🛠️ Using fallback data:', dashboardData);
  }

  const isDashboardLoading = state.isDashboardLoading;

  // Normalize chart data to handle both old and new value formats
  const normalizeChartData = (chart: any) => {
    if (!chart || !chart.data) {
      console.warn('🔧 Chart normalization: No chart or data found', chart);
      return chart;
    }
    
    try {
      const normalizedChart = { ...chart };
      
      console.log('🔧 Normalizing chart:', chart.title, 'Original data:', chart.data);
      
      // Handle case where chart.data is an object (new backend format)
      let dataArray = chart.data;
      if (!Array.isArray(chart.data)) {
        console.log('🔧 Chart data is not an array, converting:', chart.data);
        if (typeof chart.data === 'object' && chart.data !== null) {
          // If data is an object, convert it to array format
          dataArray = Object.entries(chart.data).map(([key, value]) => ({
            name: key,
            value: typeof value === 'number' ? value : (typeof value === 'object' && value !== null && typeof (value as any).value === 'number') ? (value as any).value : 0,
            label: key
          }));
        } else {
          console.warn('🔧 Chart data is not a valid format:', chart.data);
          dataArray = [];
        }
      }
      
      normalizedChart.data = dataArray.map((item: any, index: number) => {
        const normalizedItem = { ...item };
        
        // Handle value field - convert object to number if needed
        if (typeof item.value === 'object' && item.value !== null) {
          console.log(`🔧 Converting object value at index ${index}:`, item.value);
          normalizedItem.value = typeof item.value.value === 'number' ? item.value.value : 0;
          // Preserve label if it exists
          if (item.value.label) {
            normalizedItem.label = item.value.label;
          }
        } else if (typeof item.value !== 'number') {
          console.warn(`🔧 Non-numeric value at index ${index}:`, item.value, 'Converting to 0');
          normalizedItem.value = 0;
        }
        
        // Ensure name exists
        if (!normalizedItem.name && normalizedItem.label) {
          normalizedItem.name = normalizedItem.label;
        }
        if (!normalizedItem.name && !normalizedItem.label) {
          normalizedItem.name = `Item ${index + 1}`;
        }
        
        return normalizedItem;
      });
      
      // Handle wordData if it exists
      if (chart.wordData) {
        console.log('🔧 Normalizing wordData:', chart.wordData);
        normalizedChart.wordData = chart.wordData.map((word: any, index: number) => {
          const normalizedWord = { ...word };
          if (typeof word.value === 'object' && word.value !== null) {
            normalizedWord.value = typeof word.value.value === 'number' ? word.value.value : 0;
          } else if (typeof word.value !== 'number') {
            console.warn(`🔧 Non-numeric wordData value at index ${index}:`, word.value);
            normalizedWord.value = 0;
          }
          return normalizedWord;
        });
      }
      
      // Ensure required chart properties exist
      if (!normalizedChart.xKey) normalizedChart.xKey = 'name';
      if (!normalizedChart.yKey) normalizedChart.yKey = 'value';
      
      // Handle both 'type' and 'chart_type' fields for compatibility
      if (!normalizedChart.type && normalizedChart.chart_type) {
        normalizedChart.type = normalizedChart.chart_type;
      }
      if (!normalizedChart.type) normalizedChart.type = 'bar';
      
      // Ensure title exists - preserve existing title or generate one
      if (!normalizedChart.title) {
        const chartType = normalizedChart.type || 'chart';
        normalizedChart.title = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
      }
      
      console.log('🔧 Normalized chart data:', normalizedChart.data);
      return normalizedChart;
      
    } catch (error) {
      console.error('🔧 Error normalizing chart data:', error, 'Chart:', chart);
      // Return a safe fallback
      return {
        ...chart,
        data: [{ name: 'No Data', value: 0 }],
        xKey: 'name',
        yKey: 'value',
        type: chart?.type || chart?.chart_type || 'bar',
        title: chart?.title || `${(chart?.type || chart?.chart_type || 'chart').charAt(0).toUpperCase() + (chart?.type || chart?.chart_type || 'chart').slice(1)} Chart`
      };
    }
  };

  useEffect(() => {
    // Debug: Log current dashboard state
    console.log('📊 Dashboard component mounted/updated:', {
      hasData: !!state.dashboardData,
      chartCount: state.dashboardData?.charts ? Object.keys(state.dashboardData.charts).length : 0,
      chartKeys: state.dashboardData?.charts ? Object.keys(state.dashboardData.charts) : [],
      isLoading: state.isDashboardLoading,
      selectedTopic,
      dateRange: selectedDateRange
    });
    
    // Only load data if not already loaded
    if (!state.dashboardData || Object.keys(state.dashboardData).length === 0) {
      console.log('🔄 Loading dashboard data for first time...');
      loadDashboardData(false, selectedTopic, selectedDateRange);
    }

    // Load word cloud data separately
    if (!state.wordCloudData || !state.wordCloudData.wordData || state.wordCloudData.wordData.length === 0) {
      loadWordCloudData();
    }
  }, [state.dashboardData, selectedTopic, selectedDateRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-dropdown')) {
          setIsFilterOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Close dropdown when dashboard starts loading
  useEffect(() => {
    if (isDashboardLoading && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [isDashboardLoading, isFilterOpen]);

  // Setup integration test in browser console (development aid)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).testIntegration = testFrontendBackendIntegration;
      console.log('🔧 Integration test available: testIntegration()');
    }
  }, []);

  const downloadDashboard = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element);
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `dashboard_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading dashboard:', error);
      alert('Error downloading dashboard. Please try again.');
    }
  };

  const shareDashboard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Azi Dashboard Analytics',
          text: 'Check out these analytics insights!',
          url: window.location.href
        });
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Dashboard URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing dashboard:', error);
      alert('Error sharing dashboard. Please try again.');
    }
  };

  // Handle date range changes
  const handleDateRangeChange = async (newDateRange: { from: Date; to: Date; label: string }) => {
    console.log('📅 Date range changed:', newDateRange);
    setSelectedDateRange(newDateRange);
    // Force refresh with new date range
    await loadDashboardData(true, selectedTopic, newDateRange);
  };

  const loadMoreData = async () => {
    try {
      console.log('🔄 Force refreshing dashboard data...');
      await loadDashboardData(true, selectedTopic, selectedDateRange); // Force refresh to bypass all caches
      await loadWordCloudData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please try again.');
    }
  };

  // Drill-down analysis functions
  const analyzeChartDrillDown = async (data: any, type: string, title: string) => {
    const response = await fetch('/api/chart-drill-down', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataPoint: data,
        chartType: data.chartType || type,
        chartTitle: data.chartTitle || title,
        topic: selectedTopic // Always send the selected topic
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const analyzeMetricsDrillDown = async (data: any, type: string, title: string) => {
    const response = await fetch('/api/metrics-drill-down', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricType: data.metricType,
        metricTitle: data.metricTitle,
        metricValue: data.metricValue,
        topic: selectedTopic // Always send the selected topic
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Handle metric card click for drill-down analysis
  const handleMetricClick = (metricType: string, metricTitle: string, metricValue: string) => {
    console.log("Dashboard handleMetricClick called with:", { metricType, metricTitle, metricValue });
    
    setTimeout(() => {
      try {
        setDrillDownModal({
          isOpen: true,
          data: { metricType, metricTitle, metricValue },
          title: `${metricTitle} Analysis`,
          subtitle: "Detailed analysis of metrics data with radio transcript insights",
          type: 'metrics',
          fields: [
            { label: 'Metric Type', value: 'Analytics Metric', key: 'metricType' },
            { label: 'Value', value: metricValue, key: 'metricValue' },
            { label: 'Title', value: metricTitle, key: 'metricTitle' }
          ]
        });
      } catch (error) {
        console.error("Error in handleMetricClick:", error);
      }
    }, 50);
  };

  // Dynamic chart rendering function
  const renderDynamicCharts = () => {
    const chartsData = dashboardData.charts;
    if (!chartsData || Object.keys(chartsData).length === 0) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 bg-card border border-border rounded-lg">
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm sm:text-base">
                  {isDashboardLoading ? 
                    `AI generating ${selectedTopic !== 'general' ? selectedTopic + '-focused' : ''} dashboard insights...` : 
                    'Loading dashboard...'
                  }
                </p>
                {isDashboardLoading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTopic !== 'general' ? 
                      `Analyzing ${selectedTopic}-related data patterns and trends` :
                      'Analyzing data patterns and trends'
                    }
                  </p>
                )}
                {schemaError && (
                  <p className="text-xs text-destructive mt-2">Schema validation error: {schemaError.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Get all available charts from AI response
    const availableCharts = Object.entries(chartsData)
      .filter(([key, chart]) => {
        const c = chart as any;
        const normalizedChart = normalizeChartData(c);
        return normalizedChart && normalizedChart.data && Array.isArray(normalizedChart.data) && normalizedChart.data.length > 0;
      })
      .map(([key, chart]) => ({ key, chart: chart as import("@/schemas/dashboardSchema").ChartData }));

    if (availableCharts.length === 0) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 bg-card border border-border rounded-lg">
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm sm:text-base">Processing AI insights...</p>
                <p className="text-xs text-muted-foreground mt-1">Generating visualizations</p>
                {schemaError && (
                  <p className="text-xs text-destructive mt-2">Schema validation error: {schemaError.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Determine optimal grid layout based on number of charts
    const getGridLayout = (count: number) => {
      if (count === 1) return "grid-cols-1";
      if (count === 2) return "grid-cols-1 lg:grid-cols-2";
      if (count === 3) return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
      if (count === 4) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-2";
      if (count === 5) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
      if (count === 6) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
      if (count >= 7) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
    };

    const gridLayout = getGridLayout(availableCharts.length);

    return (
      <div className={`grid ${gridLayout} gap-4 sm:gap-6 mb-6 sm:mb-8`}>
        {availableCharts.map(({ key, chart }) => {
          try {
            const normalizedChart = normalizeChartData(chart);
            console.log(`🔧 Rendering chart ${key}:`, normalizedChart);
            
            return (
              <div key={key} className="p-4 sm:p-6 bg-card border border-border rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{normalizedChart.title}</h3>
                <div className="chart-container">
                  <ChartRenderer
                    chartData={normalizedChart}
                    onChartClick={(dataPoint, chartType, chartTitle) => {
                      setDrillDownModal({
                        isOpen: true,
                        data: { ...dataPoint, chartType, chartTitle },
                        title: `Chart Analysis: ${dataPoint?.label || dataPoint?.category || 'Data Point'}`,
                        subtitle: "Interactive chart drilling with detailed radio transcript analysis from OpenAI assistant",
                        type: 'chart',
                        fields: [
                          { label: 'Chart Type', value: chartType, key: 'chartType' },
                          { label: 'Value', value: dataPoint?.value || 'N/A', key: 'value' },
                          { label: 'Label', value: dataPoint?.label || dataPoint?.category || 'Unknown', key: 'label' }
                        ]
                      });
                    }}
                  />
                </div>
                {normalizedChart.insights && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <span className="font-medium">AI Insight:</span> {normalizedChart.insights}
                    </p>
                  </div>
                )}
              </div>
            );
          } catch (error) {
            console.error(`🔧 Error rendering chart ${key}:`, error, 'Chart data:', chart);
            return (
              <div key={key} className="p-4 sm:p-6 bg-card border border-border rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{chart?.title || 'Chart Error'}</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-sm">Error rendering chart</p>
                    <p className="text-xs text-destructive mt-1">Check console for details</p>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Word cloud color function
  const getColorByFrequency = (value: number, max: number, min: number) => {
    const normalizedValue = (value - min) / (max - min);
    
    // Use a predefined color palette for better contrast and readability
    const colorPalette = [
      '#60a5fa', // Light blue
      '#34d399', // Light green  
      '#fbbf24', // Light yellow
      '#f87171', // Light red
      '#a78bfa', // Light purple
      '#fb7185', // Light pink
      '#4ade80', // Bright green
      '#38bdf8', // Bright blue
      '#facc15', // Bright yellow
      '#f472b6'  // Bright pink
    ];
    
    // For very high frequency words, use brighter colors
    if (normalizedValue > 0.8) {
      return '#ffffff'; // White for highest frequency
    } else if (normalizedValue > 0.6) {
      return '#fbbf24'; // Gold for high frequency
    } else if (normalizedValue > 0.4) {
      return '#60a5fa'; // Light blue for medium-high frequency
    } else if (normalizedValue > 0.2) {
      return '#34d399'; // Light green for medium frequency
    } else {
      return '#9ca3af'; // Light gray for low frequency
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        {/* Loading Overlay - Fixed to entire screen */}
        {isDashboardLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">
                {selectedTopic !== 'general' ? 
                  `Updating ${topicsData.find(t => t.value === selectedTopic)?.label} charts for ${selectedDateRange.label}...` :
                  `Updating dashboard for ${selectedDateRange.label}...`
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedTopic !== 'general' ? 
                  `AI is analyzing ${selectedTopic}-related data patterns from ${selectedDateRange.label.toLowerCase()}` :
                  `AI is analyzing data patterns and trends from ${selectedDateRange.label.toLowerCase()}`
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Radio Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Real-time insights from radio transcript analysis powered by OpenAI
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Topic Filter Dropdown */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                disabled={isDashboardLoading}
                title="Filter dashboard content by specific topics like Shoprite (default), Telkom, ANC, or view all general content"
                className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent/50 transition-colors ${
                  isDashboardLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{topicsData.find(topic => topic.value === selectedTopic)?.label || "Shoprite"}</span>
                {isDashboardLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {isFilterOpen && !isDashboardLoading && (
                <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {topicsData.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(topic.value);
                          setIsFilterOpen(false);
                          // Load new dashboard data with the selected topic
                          console.log(`Filter changed to: ${topic.label}`);
                          loadDashboardData(true, topic.value, selectedDateRange); // Force refresh with new topic
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors group ${
                          selectedTopic === topic.value ? 'bg-accent text-accent-foreground' : ''
                        }`}
                        title={topic.description}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{topic.label}</span>
                          <span className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {topic.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Date Range Picker */}
            <DateRangePicker
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
              disabled={isDashboardLoading}
            />
            
            <button
              onClick={() => loadDashboardData(true, selectedTopic, selectedDateRange)}
              disabled={isDashboardLoading}
              title="Force refresh all dashboard data and charts by bypassing cache and requesting fresh AI-generated insights"
              className={`px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors ${
                isDashboardLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDashboardLoading ? 'Updating...' : 'Force Refresh'}
            </button>
            <div title="Access additional dashboard options including downloads, sharing, theme settings, and navigation">
              <HamburgerMenu 
                onDownload={downloadDashboard}
                onShare={shareDashboard}
                onLoadMore={loadMoreData}
              />
            </div>
          </div>
        </div>

        {/* Dashboard Status Component - Only show if admin features enabled */}
        {isAdminEnabled && (
          <div className="mb-6">
            <DashboardStatus 
              onForceRefresh={() => loadDashboardData(true, selectedTopic, selectedDateRange)}
              chartCount={Object.keys(dashboardData.charts || {}).length}
              isLoading={isDashboardLoading}
            />
          </div>
        )}

        {/* Radio Analytics Metrics - All 4 metrics in compact grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div 
            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm" 
            onClick={() => handleMetricClick("overall_positive_sentiment", dashboardData.metrics?.overallPositiveSentiment?.label || "Overall Positive Sentiment", (dashboardData.metrics?.overallPositiveSentiment?.value || 0).toString())}
            title="Click to drill down into overall positive sentiment analysis with detailed AI insights about sentiment trends and patterns"
          >
            <div className="flex flex-col items-center text-center space-y-1">
              <TrendingUp className="h-4 w-4 text-green-500 mb-1" />
              <p className="text-xs font-medium text-muted-foreground">{dashboardData.metrics?.overallPositiveSentiment?.label || "Overall Positive Sentiment"}</p>
              <p className="text-lg font-bold text-foreground">{dashboardData.metrics?.overallPositiveSentiment?.value || 0}%</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
          </div>

          <div 
            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm" 
            onClick={() => handleMetricClick("total_mentions", dashboardData.metrics?.totalMentions?.label || "Total On-Air Mentions", (dashboardData.metrics?.totalMentions?.value || 0).toString())}
            title="Click to analyze total on-air mentions with AI-powered insights into mention frequency and context patterns"
          >
            <div className="flex flex-col items-center text-center space-y-1">
              <Radio className="h-4 w-4 text-blue-500 mb-1" />
              <p className="text-xs font-medium text-muted-foreground">{dashboardData.metrics?.totalMentions?.label || "Total On-Air Mentions"}</p>
              <p className="text-lg font-bold text-foreground">{dashboardData.metrics?.totalMentions?.value || 0}</p>
              <p className="text-xs text-muted-foreground">Mentions</p>
            </div>
          </div>

          <div 
            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm" 
            onClick={() => handleMetricClick("high_engagement_moments", dashboardData.metrics?.highEngagementMoments?.label || "High Engagement Moments", (dashboardData.metrics?.highEngagementMoments?.value || 0).toString())}
            title="Click to explore high engagement moments with detailed analytics about audience participation and broadcast patterns"
          >
            <div className="flex flex-col items-center text-center space-y-1">
              <Zap className="h-4 w-4 text-yellow-500 mb-1" />
              <p className="text-xs font-medium text-muted-foreground">{dashboardData.metrics?.highEngagementMoments?.label || "High Engagement Moments"}</p>
              <p className="text-lg font-bold text-foreground">{dashboardData.metrics?.highEngagementMoments?.value || 0}</p>
              <p className="text-xs text-muted-foreground">Moments</p>
            </div>
          </div>

          <div 
            className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm" 
            onClick={() => handleMetricClick("whatsapp_number_mentions", dashboardData.metrics?.whatsappNumberMentions?.label || "WhatsApp Number Mentions", (dashboardData.metrics?.whatsappNumberMentions?.value || 0).toString())}
            title="Click to analyze WhatsApp number mentions with AI insights into call-to-action effectiveness and audience response patterns"
          >
            <div className="flex flex-col items-center text-center space-y-1">
              <Activity className="h-4 w-4 text-purple-500 mb-1" />
              <p className="text-xs font-medium text-muted-foreground">{dashboardData.metrics?.whatsappNumberMentions?.label || "WhatsApp Number Mentions"}</p>
              <p className="text-lg font-bold text-foreground">{dashboardData.metrics?.whatsappNumberMentions?.value || 0}</p>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Dynamic Charts Section */}
        {renderDynamicCharts()}

        {/* Word Cloud Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 bg-card border border-border rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Popular Topics</h3>
            <div className="min-h-[300px] flex flex-col justify-center">
              {state.wordCloudData?.wordData && state.wordCloudData.wordData.length > 0 ? (
                <div className="flex flex-wrap justify-center items-center p-4 min-h-[250px]">
                  {state.wordCloudData.wordData.map((word: any, index: number) => {
                    const maxValue = Math.max(...state.wordCloudData.wordData.map((w: any) => w.value));
                    const minValue = Math.min(...state.wordCloudData.wordData.map((w: any) => w.value));
                    const normalizedValue = (word.value - minValue) / (maxValue - minValue);
                    const size = 16 + (normalizedValue * 32); // Font size range: 16px to 48px
                    const opacity = 0.6 + (normalizedValue * 0.4); // Opacity range: 0.6 to 1.0
                    
                    return (
                      <span
                        key={index}
                        className="word-cloud-word cursor-pointer inline-block m-1 p-2 rounded-md hover:bg-muted/40 hover:scale-110 hover:shadow-lg relative transition-all duration-300"
                        title={`Click to analyze "${word.text}" topic - mentioned ${word.value} times. Get AI insights into context, sentiment, and related discussions.`}
                        style={{ 
                          fontSize: `${size}px`, 
                          opacity: opacity,
                          color: getColorByFrequency(word.value, maxValue, minValue),
                          fontWeight: word.value > maxValue * 0.6 ? 'bold' : 'normal',
                          animationDelay: `${index * 0.2}s`,
                          textShadow: `0 1px 2px rgba(0, 0, 0, 0.3), 0 0 4px rgba(0, 0, 0, 0.2)`,
                          filter: `brightness(${0.95 + (word.value / maxValue) * 0.15})`,
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          const dataPoint = {
                            label: word.text,
                            value: word.value,
                            category: word.category,
                            sentiment: word.sentiment,
                            seriesIndex: 0,
                            dataPointIndex: index
                          };
                          const chartData = {
                            label: word.text,
                            value: word.value,
                            category: word.category,
                            sentiment: word.sentiment,
                            chartType: 'wordcloud',
                            chartTitle: 'Popular Topics Word Cloud'
                          };
                          setDrillDownModal({
                            isOpen: true,
                            data: chartData,
                            title: `Chart Analysis: ${word.text}`,
                            subtitle: "Interactive chart drilling with detailed radio transcript analysis from OpenAI assistant",
                            type: 'chart',
                            fields: [
                              { label: 'Chart Type', value: 'wordcloud', key: 'chartType' },
                              { label: 'Value', value: word.value, key: 'value' },
                              { label: 'Label', value: word.text, key: 'label' }
                            ]
                          });
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
              ) : (
                // Fallback if no data
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">No word cloud data available</p>
                    <p className="text-xs mt-1">Click refresh to load fresh data</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium">AI Insight:</span> {
                  state.wordCloudData?.metadata?.analysisScope || 
                  "Most frequently mentioned topics from radio transcript database, with word size indicating mention frequency."
                }
              </p>
              {state.wordCloudData?.metadata && (
                <p className="text-xs text-muted-foreground mt-1">
                  Source: {state.wordCloudData.metadata.dataSource} | 
                  Updated: {state.wordCloudData.metadata.lastUpdated} | 
                  Total words: {state.wordCloudData.metadata.totalWords}
                </p>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Unified Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
        data={drillDownModal.data}
        title={drillDownModal.title}
        subtitle={drillDownModal.subtitle}
        type={drillDownModal.type}
        fields={drillDownModal.fields}
        onAnalyze={drillDownModal.type === 'chart' ? analyzeChartDrillDown : analyzeMetricsDrillDown}
      />
    </div>
  );
}