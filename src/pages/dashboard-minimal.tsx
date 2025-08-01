import { TrendingUp, Target, Activity, BarChart3, Filter, ChevronDown, Radio, Award, Clock, Zap, Settings, Info, FileText } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import ChartRenderer from "@/components/charts/ChartRenderer";
import DrillDownModal from "@/components/modals/DrillDownModal";
import DashboardStatus from "@/components/DashboardStatus";
import DateRangePicker, { getDefaultDateRange } from "@/components/DateRangePicker";
import ReportGenerator from "@/components/ReportGenerator";
import { exportToPDF } from "@/utils/pdfExport";
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

export default function DashboardMinimal() {
  const { state, loadDashboardData, loadWordCloudData } = useAppContext();
  const { isAdminEnabled } = useAppConfig();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
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

  const generateReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      
      // Prepare report data
      const reportData = {
        metrics: dashboardData.metrics || {},
        charts: dashboardData.charts || {},
        wordCloudData: state.wordCloudData,
        dateRange: selectedDateRange,
        selectedTopic,
        topicLabel: topicsData.find(t => t.value === selectedTopic)?.label || 'General'
      };

      // Create filename
      const filename = `radio-analytics-report-${selectedTopic}-${selectedDateRange.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Open report in new window for PDF generation
      const reportWindow = window.open('', '_blank', 'width=1200,height=800');
      if (!reportWindow) {
        throw new Error('Failed to open report window. Please allow popups for this site.');
      }

      // Generate report HTML
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Radio Analytics Report</title>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white; 
                color: black; 
                line-height: 1.6;
                padding: 40px;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #e5e5e5; 
                padding-bottom: 30px; 
                margin-bottom: 40px; 
              }
              .header h1 { 
                font-size: 2.5rem; 
                font-weight: bold; 
                color: #1f2937; 
                margin-bottom: 10px; 
              }
              .header h2 { 
                font-size: 1.5rem; 
                font-weight: 600; 
                color: #4b5563; 
                margin-bottom: 20px; 
              }
              .header-info { 
                display: flex; 
                justify-content: center; 
                gap: 30px; 
                font-size: 0.9rem; 
                color: #6b7280; 
              }
              .section { 
                margin-bottom: 40px; 
              }
              .section-title { 
                font-size: 1.5rem; 
                font-weight: bold; 
                color: #1f2937; 
                margin-bottom: 20px; 
                display: flex; 
                align-items: center; 
                gap: 10px; 
              }
              .metrics-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px; 
              }
              .metric-card { 
                background: #f9fafb; 
                border: 2px solid #e5e7eb; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
              }
              .metric-value { 
                font-size: 2rem; 
                font-weight: bold; 
                color: #1f2937; 
                margin-bottom: 5px; 
              }
              .metric-label { 
                font-size: 0.9rem; 
                color: #6b7280; 
              }
              .charts-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
                gap: 30px; 
              }
              .chart-container { 
                background: #f9fafb; 
                border: 2px solid #e5e7eb; 
                border-radius: 8px; 
                padding: 20px; 
              }
              .chart-title { 
                font-size: 1.1rem; 
                font-weight: 600; 
                margin-bottom: 15px; 
                color: #1f2937; 
              }
              .chart-data { 
                display: grid; 
                gap: 8px; 
              }
              .data-item { 
                display: flex; 
                justify-content: space-between; 
                padding: 8px 12px; 
                background: white; 
                border-radius: 4px; 
                border: 1px solid #e5e7eb; 
              }
              .word-cloud { 
                background: #f3f4f6; 
                border-radius: 8px; 
                padding: 30px; 
                text-align: center; 
                min-height: 200px; 
                display: flex; 
                flex-wrap: wrap; 
                justify-content: center; 
                align-items: center; 
                gap: 10px; 
              }
              .word-item { 
                display: inline-block; 
                padding: 5px 10px; 
                margin: 3px; 
                background: white; 
                border-radius: 4px; 
                border: 1px solid #d1d5db; 
              }
              .footer { 
                border-top: 2px solid #e5e5e5; 
                padding-top: 20px; 
                text-align: center; 
                color: #6b7280; 
                font-size: 0.9rem; 
                margin-top: 40px; 
              }
              @media print {
                body { padding: 20px; }
                .chart-container { break-inside: avoid; }
                .metric-card { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Radio Analytics Report</h1>
              <h2>${reportData.topicLabel} Analysis</h2>
              <div class="header-info">
                <span>📅 Report Period: ${reportData.dateRange.from.toLocaleDateString()} - ${reportData.dateRange.to.toLocaleDateString()}</span>
                <span>📄 Generated: ${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">🎯 Executive Summary</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db;">
                <p>This comprehensive analytics report provides insights into radio broadcast performance for the 
                <strong>${reportData.topicLabel}</strong> topic during the specified period. 
                The analysis covers sentiment trends, engagement metrics, audience interaction patterns, and key 
                performance indicators derived from AI-powered transcript analysis.</p>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">📊 Key Performance Indicators</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${reportData.metrics.overallPositiveSentiment?.value || 0}%</div>
                  <div class="metric-label">${reportData.metrics.overallPositiveSentiment?.label || 'Overall Positive Sentiment'}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${reportData.metrics.totalMentions?.value || 0}</div>
                  <div class="metric-label">${reportData.metrics.totalMentions?.label || 'Total On-Air Mentions'}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${reportData.metrics.highEngagementMoments?.value || 0}</div>
                  <div class="metric-label">${reportData.metrics.highEngagementMoments?.label || 'High Engagement Moments'}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${reportData.metrics.whatsappNumberMentions?.value || 0}</div>
                  <div class="metric-label">${reportData.metrics.whatsappNumberMentions?.label || 'WhatsApp Number Mentions'}</div>
                </div>
              </div>
            </div>

            ${Object.keys(reportData.charts).length > 0 ? `
            <div class="section">
              <h2 class="section-title">📈 Data Visualizations</h2>
              <div class="charts-grid">
                ${Object.entries(reportData.charts).map(([key, chart]) => {
                  const normalizedChart = normalizeChartData(chart);
                  if (!normalizedChart?.data || !Array.isArray(normalizedChart.data) || normalizedChart.data.length === 0) {
                    return '';
                  }
                  return `
                    <div class="chart-container">
                      <div class="chart-title">${normalizedChart.title}</div>
                      <div class="chart-data">
                        ${normalizedChart.data.map((item: any) => `
                          <div class="data-item">
                            <span>${item.name || item.label || 'Unknown'}</span>
                            <span><strong>${typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</strong></span>
                          </div>
                        `).join('')}
                      </div>
                      ${normalizedChart.insights ? `
                        <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 0.9rem;">
                          <strong>Analysis:</strong> ${normalizedChart.insights}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            ` : ''}

            ${reportData.wordCloudData?.wordData && reportData.wordCloudData.wordData.length > 0 ? `
            <div class="section">
              <h2 class="section-title">👥 Popular Topics Analysis</h2>
              <div class="chart-container">
                <div class="word-cloud">
                  ${reportData.wordCloudData.wordData.map((word: any) => `
                    <span class="word-item" style="font-size: ${Math.min(12 + (word.value * 2), 24)}px; font-weight: ${word.value > 10 ? 'bold' : 'normal'};">
                      ${word.text} (${word.value})
                    </span>
                  `).join('')}
                </div>
                <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 0.9rem;">
                  <strong>Analysis:</strong> ${reportData.wordCloudData.metadata?.analysisScope || 'Most frequently mentioned topics from radio transcript database, with word size indicating mention frequency.'}
                </div>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">🏆 Recommendations & Insights</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; color: #1f2937;">Key Insights</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>Positive sentiment at ${reportData.metrics.overallPositiveSentiment?.value || 0}% indicates strong audience reception</span>
                    </li>
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>Total mentions of ${reportData.metrics.totalMentions?.value || 0} show good topic visibility</span>
                    </li>
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>High engagement moments create opportunities for deeper audience connection</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; color: #1f2937;">Recommendations</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>Continue focusing on content that generates positive sentiment</span>
                    </li>
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>Optimize WhatsApp call-to-action placement during peak engagement</span>
                    </li>
                    <li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                      <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span>
                      <span>Monitor trending topics for future content planning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Radio Analytics Report • Generated by AI-Powered Analytics Platform</p>
              <p>© ${new Date().getFullYear()} Azi Analytics Platform. All rights reserved.</p>
            </div>

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

    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
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
              onClick={generateReport}
              disabled={isDashboardLoading || isGeneratingReport}
              title="Generate comprehensive PDF report with all dashboard data, charts, and insights"
              className={`flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                isDashboardLoading || isGeneratingReport ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              {isGeneratingReport ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              onClick={async () => {
                if (reportRef.current && !isGeneratingReport) {
                  setIsGeneratingReport(true);
                  try {
                    const filename = `radio-analytics-report-${selectedTopic}-${selectedDateRange.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
                    await exportToPDF(reportRef, {
                      filename,
                      format: 'a4',
                      orientation: 'portrait'
                    });
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert('Failed to generate PDF. Please try again.');
                  } finally {
                    setIsGeneratingReport(false);
                  }
                }
              }}
              disabled={isDashboardLoading || isGeneratingReport}
              title="Generate PDF report using component-based approach"
              className={`flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                isDashboardLoading || isGeneratingReport ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              {isGeneratingReport ? 'Creating PDF...' : 'PDF Export'}
            </button>
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

        {/* Hidden Report Container for PDF Generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '1200px' }}>
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