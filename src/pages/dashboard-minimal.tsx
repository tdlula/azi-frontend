import { TrendingUp, Users, Target, Activity, BarChart3, Filter, ChevronDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import ChartRenderer from "@/components/charts/ChartRenderer";
import DrillDownModal from "@/components/modals/DrillDownModal";
import { useState, useEffect } from "react";
import { DashboardSchema } from "@/schemas/dashboardSchema";
import html2canvas from "html2canvas";
import { useAppContext } from "@/contexts/AppContext";
import topicsData from "@/data/topics.json";

export default function DashboardMinimal() {
  const { state, loadDashboardData, loadWordCloudData } = useAppContext();
  
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    data: null,
    title: "",
    subtitle: "",
    type: 'chart' as 'chart' | 'metrics',
    fields: [] as Array<{ label: string; value: string | number; key: string }>
  });

  // Filter state
  const [selectedTopic, setSelectedTopic] = useState("general");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Use only authentic dashboard data from OpenAI assistant
  // Validate and normalize data structure using Zod schema
  const rawData: any = state.dashboardData;
  let dashboardData: any;
  let schemaError = null;

  // Default fallback structure to prevent null reference errors
  const defaultData = {
    metrics: {
      activeStations: 0,
      topTopic: "Loading...",
      topStation: "Loading...",
      topCampaign: 0,
      totalAudience: 0,
      highestSentimentCampaign: 0,
      topPerformingTimeSlot: "Loading..."
    },
    charts: {}
  };

  // Create fallback data from raw data or use defaults
  const createFallbackData = (sourceData: any = {}) => {
    const metrics = sourceData?.metrics || sourceData?.dashboard_metrics || sourceData?.dashboard?.metrics || {};
    return {
      metrics: {
        activeStations: metrics.activeStations || metrics.active_stations || 0,
        topTopic: metrics.topTopic || metrics.top_topic || "Loading...",
        topStation: metrics.topStation || metrics.top_station || "Loading...",
        topCampaign: metrics.topCampaign || metrics.top_campaign || 0,
        totalAudience: metrics.totalAudience || metrics.total_audience || 0,
        highestSentimentCampaign: metrics.highestSentimentCampaign || metrics.highest_sentiment_campaign || 0,
        topPerformingTimeSlot: metrics.topPerformingTimeSlot || metrics.top_performing_time_slot || "Loading..."
      },
      charts: sourceData?.charts || sourceData?.dashboard?.charts || {}
    };
  };

  try {
    const parsedData = DashboardSchema.parse(rawData);
    dashboardData = parsedData || createFallbackData(rawData);
  } catch (err: any) {
    schemaError = err;
    dashboardData = createFallbackData(rawData);
  }

  const isDashboardLoading = state.isDashboardLoading;

  useEffect(() => {
    // Debug: Log current dashboard state
    console.log('📊 Dashboard component mounted/updated:', {
      hasData: !!state.dashboardData,
      chartCount: state.dashboardData?.charts ? Object.keys(state.dashboardData.charts).length : 0,
      chartKeys: state.dashboardData?.charts ? Object.keys(state.dashboardData.charts) : [],
      isLoading: state.isDashboardLoading,
      selectedTopic
    });
    
    // Only load data if not already loaded
    if (!state.dashboardData || Object.keys(state.dashboardData).length === 0) {
      console.log('🔄 Loading dashboard data for first time...');
      loadDashboardData(false, selectedTopic);
    }

    // Load word cloud data separately
    if (!state.wordCloudData || !state.wordCloudData.wordData || state.wordCloudData.wordData.length === 0) {
      loadWordCloudData();
    }
  }, [state.dashboardData, selectedTopic]);

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

  const loadMoreData = async () => {
    try {
      console.log('🔄 Force refreshing dashboard data...');
      await loadDashboardData(true, selectedTopic); // Force refresh to bypass all caches
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
        topic: selectedTopic !== 'general' ? selectedTopic : undefined
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
        topic: selectedTopic !== 'general' ? selectedTopic : undefined
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
        return c && c.data && Array.isArray(c.data) && c.data.length > 0;
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
        {availableCharts.map(({ key, chart }) => (
          <div key={key} className="p-4 sm:p-6 bg-card border border-border rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{chart.title}</h3>
            <ChartRenderer
              chartData={chart}
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
            {chart.insights && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">AI Insight:</span> {chart.insights}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Word cloud color function
  const getColorByFrequency = (value: number, max: number, min: number) => {
    const normalizedValue = (value - min) / (max - min);
    const hue = 240 - (normalizedValue * 120); // Blue to red spectrum
    const saturation = 60 + (normalizedValue * 40); // Increase saturation for higher values
    const lightness = 40 + (normalizedValue * 30); // Increase lightness for higher values
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        {/* Loading Overlay */}
        {isDashboardLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">
                {selectedTopic !== 'general' ? 
                  `Updating charts for ${topicsData.find(t => t.value === selectedTopic)?.label}...` :
                  'Updating dashboard...'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedTopic !== 'general' ? 
                  `AI is analyzing ${selectedTopic}-related data patterns` :
                  'AI is analyzing data patterns and trends'
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
                className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent/50 transition-colors ${
                  isDashboardLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{topicsData.find(topic => topic.value === selectedTopic)?.label || "General"}</span>
                {isDashboardLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {isFilterOpen && !isDashboardLoading && (
                <div className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {topicsData.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(topic.value);
                          setIsFilterOpen(false);
                          // Load new dashboard data with the selected topic
                          console.log(`Filter changed to: ${topic.label}`);
                          loadDashboardData(true, topic.value); // Force refresh with new topic
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors ${
                          selectedTopic === topic.value ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => loadDashboardData(true, selectedTopic)}
              disabled={isDashboardLoading}
              className={`px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors ${
                isDashboardLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDashboardLoading ? 'Updating...' : 'Force Refresh'}
            </button>
            <HamburgerMenu 
              onDownload={downloadDashboard}
              onShare={shareDashboard}
              onLoadMore={loadMoreData}
            />
          </div>
        </div>

        {/* Radio Analytics Metrics - All 7 metrics in compact grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("active_stations", "Active Stations", dashboardData.metrics.activeStations.toString())}
          >
            <div className="flex flex-col items-center text-center">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Active Stations</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{dashboardData.metrics.activeStations}</p>
              <p className="text-xs text-muted-foreground">Monitored</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("total_audience", "Total Audience", dashboardData.metrics.totalAudience.toString())}
          >
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Audience</p>
              <p className="text-sm sm:text-lg font-bold text-foreground">{(dashboardData.metrics.totalAudience / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("top_topic", "Top Topic", dashboardData.metrics.topTopic)}
          >
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Top Topic</p>
              <p className="text-sm sm:text-base font-bold text-foreground truncate max-w-full">{dashboardData.metrics.topTopic}</p>
              <p className="text-xs text-muted-foreground">Discussed</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("top_station", "Top Station", dashboardData.metrics.topStation)}
          >
            <div className="flex flex-col items-center text-center">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Top Station</p>
              <p className="text-sm sm:text-base font-bold text-foreground truncate max-w-full">{dashboardData.metrics.topStation}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("top_campaign", "Top Campaign", dashboardData.metrics.topCampaign.toString())}
          >
            <div className="flex flex-col items-center text-center">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Top Campaign</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{dashboardData.metrics.topCampaign}</p>
              <p className="text-xs text-muted-foreground">Reach</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("highest_sentiment_campaign", "Best Sentiment", dashboardData.metrics.highestSentimentCampaign.toString())}
          >
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Best Sentiment</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{dashboardData.metrics.highestSentimentCampaign}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>

          <div 
            className="p-3 sm:p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200" 
            onClick={() => handleMetricClick("top_performing_time_slot", "Peak Time Slot", dashboardData.metrics.topPerformingTimeSlot)}
          >
            <div className="flex flex-col items-center text-center">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Peak Time</p>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-full">{dashboardData.metrics.topPerformingTimeSlot}</p>
              <p className="text-xs text-muted-foreground">Slot</p>
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
                        className="word-cloud-word cursor-pointer inline-block m-1 p-2 rounded-md hover:bg-muted/40 relative transition-all duration-300"
                        style={{ 
                          fontSize: `${size}px`, 
                          opacity: opacity,
                          color: getColorByFrequency(word.value, maxValue, minValue),
                          fontWeight: word.value > maxValue * 0.6 ? 'bold' : 'normal',
                          animationDelay: `${index * 0.2}s`,
                          textShadow: `0 0 ${Math.max(2, word.value / maxValue * 8)}px ${getColorByFrequency(word.value, maxValue, minValue)}40`,
                          filter: `brightness(${0.9 + (word.value / maxValue) * 0.3})`
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