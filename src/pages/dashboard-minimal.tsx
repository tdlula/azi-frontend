import { TrendingUp, Target, Activity, BarChart3, Filter, ChevronDown, Radio, Award, Clock, Zap, Settings, Info, FileText, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import ChartRenderer from "@/components/charts/ChartRenderer";
import DrillDownModal from "@/components/modals/DrillDownModal";
import DashboardStatus from "@/components/DashboardStatus";
import DateRangePicker, { getDefaultDateRange } from "@/components/DateRangePicker";
import ReportGenerator from "@/components/ReportGenerator";
import MetricsSection from "@/components/MetricsSection";
import ChartsSection from "@/components/ChartsSection";
import { isDevelopment } from "@/lib/env";
import WordCloudSection from "@/components/WordCloudSection";
import useLazyLoading from "@/hooks/useLazyLoading";
import { useState, useEffect, useRef } from "react";
import { DashboardSchema } from "@/schemas/dashboardSchema";
import html2canvas from "html2canvas";
import { useAppContext } from "@/contexts/AppContext";
import topicsData from "@/data/topics.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { testFrontendBackendIntegration } from "@/utils/integrationTest";
import { useAppConfig } from "@/hooks/useAppConfig";
import { CacheManager } from "@/utils/cacheUtils";
import { fetchEnhancedReportDataCached, EnhancedReportData } from "@/utils/enhancedReportData";

export default function DashboardMinimal() {
  const { state } = useAppContext();
  const { isAdminEnabled } = useAppConfig();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [enhancedReportData, setEnhancedReportData] = useState<EnhancedReportData | null>(null);
  const [isLoadingEnhancedData, setIsLoadingEnhancedData] = useState(false);
  
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    data: any;
    title: string;
    subtitle: string;
    type: 'chart' | 'metrics';
    fields: Array<{ label: string; value: string | number; key: string }>;
  }>({
    isOpen: false,
    data: null,
    title: "",
    subtitle: "",
    type: 'chart',
    fields: []
  });

  // Filter state
  const [selectedTopic, setSelectedTopic] = useState("shoprite");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Settings dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState(getDefaultDateRange());
  
  // Lazy loading state management
  const [showMetrics, setShowMetrics] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);
  
  // Initialize lazy loading
  const { loadingState, startLazyLoading, forceRefresh, hasStarted } = useLazyLoading({
    selectedTopic,
    selectedDateRange,
    onMetricsLoaded: () => setShowMetrics(true),
    onChartsLoaded: () => setShowCharts(true),
    onWordCloudLoaded: () => setShowWordCloud(true)
  });

  // Start lazy loading when component mounts
  useEffect(() => {
    if (!hasStarted) {
      startLazyLoading();
    }
  }, [startLazyLoading, hasStarted]);
  
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
    console.log('📊 Dashboard charts count:', dashboardData?.charts ? Object.keys(dashboardData.charts).length : 0);
    console.log('📊 Dashboard chart keys:', dashboardData?.charts ? Object.keys(dashboardData.charts) : []);
    
    // Special debugging for line chart (ID 2 or chart_2)
    if (dashboardData?.charts) {
      for (const [key, chart] of Object.entries(dashboardData.charts)) {
        if (key === '2' || key === 'chart_2' || (chart as any).title?.includes('Hourly Sentiment')) {
          console.log(`🔍 FOUND LINE CHART in dashboard data (${key}):`, chart);
        }
      }
    }
  } catch (err: any) {
    schemaError = err;
    console.error('❌ Schema validation failed:', err);
    console.log('🔍 Raw data structure:', rawData);
    dashboardData = createFallbackData(rawData);
    console.log('🛠️ Using fallback data:', dashboardData);
  }

  const isDashboardLoading = state.isDashboardLoading;

  // Enhanced chart data normalization to handle new chartPrompts.json format
  const normalizeChartData = (chart: any) => {
    if (!chart || (!chart.data && !chart.datasets)) {
      console.warn('🔧 Chart normalization: No chart or data found', chart);
      return chart;
    }
    
    try {
      const normalizedChart = { ...chart };
      
      console.log('🔧 Normalizing chart:', chart.title, 'Original data:', chart.data);
      
      // Determine chart type - handle both 'type' and 'chart_type' fields
      const chartType = chart.type || chart.chart_type || 'bar';
      normalizedChart.type = chartType;
      normalizedChart.chart_type = chartType;
      
      // Handle different data formats based on chart type
      if (chartType === 'line' || chartType === 'radar') {
        // These charts use the complex format: {labels: [], datasets: []}
        if (chart.data && chart.data.labels && chart.data.datasets) {
          // Data is already in the correct format
          console.log('🔧 Line/radar chart data already in correct format');
          normalizedChart.data = chart.data;
        } else if (Array.isArray(chart.data)) {
          // Convert array format to line/radar format
          console.log('🔧 Converting array data to line/radar format');
          normalizedChart.data = {
            labels: chart.data.map((item: any, index: number) => 
              item.label || item.name || `Point ${index + 1}`
            ),
            datasets: [{
              label: chart.title || `${chartType} Data`,
              data: chart.data.map((item: any) => {
                const value = typeof item.value === 'object' && item.value !== null 
                  ? item.value.value 
                  : item.value;
                return typeof value === 'number' ? value : 0;
              }),
              color: chart.data[0]?.color || '#3b82f6'
            }]
          };
        } else {
          // If no valid data structure, create empty structure
          console.warn('🔧 Line/radar chart has invalid data structure, creating empty dataset');
          normalizedChart.data = {
            labels: [],
            datasets: []
          };
        }
      } else {
        // Handle simple array format for donut, bar, pie charts
        let dataArray = chart.data;
        
        if (!Array.isArray(chart.data)) {
          console.log('🔧 Chart data is not an array, converting:', chart.data);
          if (typeof chart.data === 'object' && chart.data !== null) {
            // Convert object to array format
            if (chart.data.labels && chart.data.datasets) {
              // Convert complex format to simple array for bar/donut charts
              const firstDataset = chart.data.datasets[0];
              if (firstDataset && Array.isArray(firstDataset.data)) {
                dataArray = chart.data.labels.map((label: string, index: number) => ({
                  name: label,
                  label: label,
                  value: firstDataset.data[index] || 0,
                  color: firstDataset.color || '#3b82f6'
                }));
              }
            } else {
              // Convert generic object to array format
              dataArray = Object.entries(chart.data).map(([key, value]) => ({
                name: key,
                label: key,
                value: typeof value === 'number' ? value : 
                      (typeof value === 'object' && value !== null && typeof (value as any).value === 'number') 
                        ? (value as any).value : 0
              }));
            }
          } else {
            console.warn('🔧 Chart data is not a valid format:', chart.data);
            dataArray = [];
          }
        }
        
        // Normalize each data point in the array
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
          
          // Ensure name/label exists
          if (!normalizedItem.name && normalizedItem.label) {
            normalizedItem.name = normalizedItem.label;
          }
          if (!normalizedItem.label && normalizedItem.name) {
            normalizedItem.label = normalizedItem.name;
          }
          if (!normalizedItem.name && !normalizedItem.label) {
            normalizedItem.name = `Item ${index + 1}`;
            normalizedItem.label = `Item ${index + 1}`;
          }
          
          return normalizedItem;
        });
      }
      
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
      
      // Set chart keys based on chart type
      if (chartType === 'line' || chartType === 'radar') {
        // For complex charts, these keys are not used
        normalizedChart.xKey = null;
        normalizedChart.yKey = null;
      } else {
        // For simple charts, ensure keys exist
        if (!normalizedChart.xKey) normalizedChart.xKey = 'name';
        if (!normalizedChart.yKey) normalizedChart.yKey = 'value';
      }
      
      // Ensure title exists - preserve existing title or generate one
      if (!normalizedChart.title) {
        normalizedChart.title = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
      }
      
      // Preserve enhanced metadata from chartPrompts.json
      if (chart.metadata) {
        normalizedChart.metadata = {
          ...chart.metadata,
          // Ensure legacy compatibility
          dataSource: chart.metadata.dataSource || chart.metadata.topic || 'Radio Analytics',
          lastUpdated: chart.metadata.lastUpdated || new Date().toISOString(),
        };
      }
      
      // IMPORTANT: Preserve AI insights from backend
      if (chart.aiInsight) {
        normalizedChart.aiInsight = chart.aiInsight;
      }
      if (chart.sourceInfo) {
        normalizedChart.sourceInfo = chart.sourceInfo;
      }
      
      console.log('🔧 Normalized chart data:', normalizedChart);
      console.log('🔍 AI insights preserved:', {
        hasAiInsight: !!normalizedChart.aiInsight,
        hasSourceInfo: !!normalizedChart.sourceInfo,
        aiInsight: normalizedChart.aiInsight,
        sourceInfo: normalizedChart.sourceInfo
      });
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

  // Handle topic/date changes - reset lazy loading when these change
  const prevTopic = useRef(selectedTopic);
  const prevDateRange = useRef(selectedDateRange);
  
  useEffect(() => {
    const topicChanged = prevTopic.current !== selectedTopic;
    const dateChanged = prevDateRange.current !== selectedDateRange;
    
    if (topicChanged || dateChanged) {
      console.log('🔄 Topic or date range changed, resetting lazy loading...', {
        topicChanged,
        dateChanged,
        oldTopic: prevTopic.current,
        newTopic: selectedTopic
      });
      
      // Reset component visibility
      setShowMetrics(false);
      setShowCharts(false);
      setShowWordCloud(false);
      
      // Update refs
      prevTopic.current = selectedTopic;
      prevDateRange.current = selectedDateRange;
    }
  }, [selectedTopic, selectedDateRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-dropdown')) {
          setIsFilterOpen(false);
        }
      }
      if (isSettingsOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-dropdown')) {
          setIsSettingsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, isSettingsOpen]);

  // Close dropdown when loading starts
  useEffect(() => {
    if ((loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud) && isFilterOpen) {
      setIsFilterOpen(false);
    }
    if ((loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud) && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [loadingState.isLoadingMetrics, loadingState.isLoadingCharts, loadingState.isLoadingWordCloud, isFilterOpen, isSettingsOpen]);

  // Setup integration test in browser console (development aid)
  useEffect(() => {
    if (typeof window !== 'undefined' && isDevelopment()) {
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
    // Lazy loading will automatically handle the data refresh
  };

  const handleTopicChange = (newTopic: string) => {
    console.log(`🏷️ Topic changed to: ${newTopic}`);
    setSelectedTopic(newTopic);
    setIsFilterOpen(false);
    // Lazy loading will automatically handle the data refresh
  };

  const loadMoreData = async () => {
    try {
      console.log('🔄 Force refreshing all dashboard data...');
      await forceRefresh();
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please try again.');
    }
  };

  const clearCache = () => {
    try {
      console.log('🗑️ Clearing all dashboard cache...');
      CacheManager.clearAllCache();
      
      // Show cache stats after clearing
      const stats = CacheManager.getCacheStats();
      alert(`Cache cleared successfully!\n\nRemaining items: ${stats.count}\nTotal size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache. Please try again.');
    }
  };

  const generateReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      setIsLoadingEnhancedData(true);
      
      // Fetch enhanced report data from OpenAI assistant
      console.log('Fetching enhanced report data...');
      const enhancedData = await fetchEnhancedReportDataCached({
        topic: selectedTopic,
        dateRange: {
          from: selectedDateRange.from.toISOString(),
          to: selectedDateRange.to.toISOString()
        }
      });
      setEnhancedReportData(enhancedData);
      setIsLoadingEnhancedData(false);
      
      // Give React a moment to update the ReportGenerator component with new data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the same approach as PDF Export but open in new window for printing
      if (reportRef.current) {
        // Clone the report element to create a standalone version
        const reportElement = reportRef.current.cloneNode(true) as HTMLElement;
        
        // Create filename
        const filename = `radio-analytics-report-${selectedTopic}-${selectedDateRange.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
        
        // Open report in new window
        const reportWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!reportWindow) {
          throw new Error('Failed to open report window. Please allow popups for this site.');
        }

        // Generate report HTML using the ReportGenerator component styles
        const reportHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Radio Analytics Report</title>
              <meta charset="utf-8">
              <style>
                @page {
                  size: A4;
                  margin: 0.75in;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                body {
                  font-family: 'Segoe UI', 'Calibri', 'Helvetica Neue', Arial, sans-serif;
                  background: white;
                  color: #2c3e50;
                  line-height: 1.5;
                  font-size: 11pt;
                  font-weight: 400;
                }
                @media print {
                  body { padding: 20px; }
                  .section { page-break-inside: avoid; }
                  .chart-container { break-inside: avoid; }
                  .metric-card { break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              ${reportElement.outerHTML}
              <script>
                // Auto-print when page loads
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 1000);
                };
                
                // Close window after printing
                window.onafterprint = function() {
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                };
              </script>
            </body>
          </html>
        `;

        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
      }

    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
      setIsLoadingEnhancedData(false);
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
    console.log('🔍 analyzeMetricsDrillDown called with:', { data, type, title });
    
    // Special handling for Overall Positive Sentiment metric
    if (data.metricType === "overall_positive_sentiment") {
      console.log('✅ Using custom prompt for Overall Positive Sentiment');
      const customPrompt = `Analyze the "Overall Positive Sentiment" metric with value ${data.metricValue}% for Shoprite radio mentions using your radio transcript database.

Provide a comprehensive analysis in this structured format:

## Sentiment Analysis Overview
- Current sentiment score: ${data.metricValue}%
- Benchmark comparison (industry average, previous periods)
- Trend direction (improving/declining/stable)

## Data Breakdown
**Source Distribution:**
- Radio stations contributing to this sentiment
- Time periods analyzed (dates/hours)
- Total mention volume analyzed

**Sentiment Drivers:**
- Specific positive mentions (quotes from transcripts)
- Key themes driving positive sentiment
- Presenter tone and context analysis

## Shoprite-Specific Insights
**Brand Perception:**
- Product/service categories mentioned positively
- Promotional campaigns referenced
- Customer experience mentions

**Competitive Context:**
- How Shoprite sentiment compares to competitors
- Market positioning reflected in radio coverage

## Contextual Factors
- Seasonal/temporal influences on sentiment
- External events affecting brand perception
- Regional variations in sentiment

## Actionable Recommendations
- Areas for improvement based on data
- Opportunities to leverage positive sentiment
- Content strategy suggestions for radio partnerships

**Data Sources:** Specify exact radio stations, date ranges, and transcript volumes analyzed.
**Methodology:** Explain sentiment calculation method and confidence level.

Return analysis with specific transcript excerpts, quantified insights, and data-driven recommendations.`;

      const response = await fetch('/api/metrics-drill-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricType: data.metricType,
          metricTitle: data.metricTitle,
          metricValue: data.metricValue,
          topic: selectedTopic,
          customPrompt: customPrompt // Send the custom prompt for this specific metric
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }

    // Default behavior for other metrics
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

  return (
    <div className="bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                disabled={loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud}
                title="Filter dashboard content by specific topics like Shoprite (default), Telkom, ANC, or view all general content"
                className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent/50 transition-colors text-foreground ${
                  loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-foreground font-medium">{topicsData.find(topic => topic.value === selectedTopic)?.label || "Shoprite"}</span>
                {loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {isFilterOpen && !(loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud) && (
                <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {topicsData.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicChange(topic.value)}
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
            
            {/* Settings Dropdown */}
            <div className="relative settings-dropdown">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                disabled={loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud}
                title="Dashboard settings and actions"
                className={`flex items-center gap-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors ${
                  loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
                {loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-1"></div>
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </button>
              
              {isSettingsOpen && !(loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud) && (
                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        generateReport();
                        setIsSettingsOpen(false);
                      }}
                      disabled={isDashboardLoading || isGeneratingReport || isLoadingEnhancedData}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isLoadingEnhancedData ? 'Fetching AI Data...' : isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button
                      onClick={() => {
                        forceRefresh();
                        setIsSettingsOpen(false);
                      }}
                      disabled={loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      {loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud ? 'Updating...' : 'Force Refresh'}
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        clearCache();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 text-orange-600 hover:text-orange-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cache
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div title="Access additional dashboard options including downloads, sharing, theme settings, and navigation">
              <HamburgerMenu 
                onScreenshot={downloadDashboard}
                onShareUrl={shareDashboard}
                onExportData={loadMoreData}
              />
            </div>
          </div>
        </div>

        {/* Dashboard Status Component - Only show if admin features enabled */}
        {isAdminEnabled && (
          <div className="mb-6">
            <DashboardStatus 
              onForceRefresh={forceRefresh}
              chartCount={Object.keys(dashboardData.charts || {}).length}
              isLoading={loadingState.isLoadingMetrics || loadingState.isLoadingCharts || loadingState.isLoadingWordCloud}
            />
          </div>
        )}

        {/* Metrics Section - Always show with skeleton when loading */}
        <MetricsSection
          metrics={dashboardData.metrics}
          onMetricClick={handleMetricClick}
          isLoading={loadingState.isLoadingMetrics}
        />

        {/* Charts Section - Show when metrics start loading or are loaded */}
        {(showCharts || loadingState.isLoadingCharts) && (
          <ChartsSection
            chartsData={dashboardData.charts}
            normalizeChartData={normalizeChartData}
            onChartClick={(dataPoint, chartType, chartTitle) => {
              setDrillDownModal({
                isOpen: true,
                data: dataPoint,
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
            isLoading={loadingState.isLoadingCharts}
          />
        )}

        {/* Word Cloud Section - Show when charts start loading or are loaded */}
        {(showWordCloud || loadingState.isLoadingWordCloud) && (
          <WordCloudSection
            wordCloudData={state.wordCloudData}
            onWordClick={(dataPoint, chartType, chartTitle) => {
              setDrillDownModal({
                isOpen: true,
                data: dataPoint,
                title: `Chart Analysis: ${dataPoint.label}`,
                subtitle: "Interactive chart drilling with detailed radio transcript analysis from OpenAI assistant",
                type: 'chart',
                fields: [
                  { label: 'Chart Type', value: chartType, key: 'chartType' },
                  { label: 'Value', value: dataPoint.value, key: 'value' },
                  { label: 'Label', value: dataPoint.label, key: 'label' }
                ]
              });
            }}
            isLoading={loadingState.isLoadingWordCloud}
          />
        )}

        {/* Hidden Report Container for PDF Generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '1200px', zIndex: -1 }}>
          <ReportGenerator
            ref={reportRef}
            data={{
              metrics: dashboardData.metrics || {},
              charts: dashboardData.charts || {},
              wordCloudData: state.wordCloudData,
              dateRange: selectedDateRange,
              selectedTopic,
              topicLabel: topicsData.find(t => t.value === selectedTopic)?.label || 'General'
            }}
            enhancedData={enhancedReportData}
            normalizeChartData={normalizeChartData}
          />
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