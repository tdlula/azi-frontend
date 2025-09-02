// Chat utility functions

import { CHART_INDICATORS } from "@/constants/chatConstants";
import { detectMultipleTableFormats } from "@/utils/tableDetection";

// Generate unique IDs for messages to prevent React key warnings
let messageIdCounter = 0;
export const generateUniqueId = () => {
  return Date.now() + ++messageIdCounter;
};

// Function to detect and extract chart data from AI response text
export const detectChartFromResponse = (content: string) => {
  // Check if response contains chart instructions
  const hasChartContent = CHART_INDICATORS.some(indicator => 
    content.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (!hasChartContent) return null;
  
  // Try to extract chart type
  let chartType = 'line'; // default
  if (content.toLowerCase().includes('bar chart')) chartType = 'bar';
  else if (content.toLowerCase().includes('pie chart')) chartType = 'pie';
  else if (content.toLowerCase().includes('area chart')) chartType = 'area';
  else if (content.toLowerCase().includes('scatter')) chartType = 'scatter';
  
  // Try to extract chart title - multiple patterns
  let title = 'Data Visualization';
  
  // Pattern 1: Markdown heading
  const titleMatch1 = content.match(/(?:^|\n)#\s*(.+?)(?:\n|$)/m);
  if (titleMatch1) title = titleMatch1[1].trim();
  
  // Pattern 2: Chart Data: prefix
  const titleMatch2 = content.match(/(?:Line Chart Data:|Chart Data:|Bar Chart Data:|Pie Chart Data:)\s*(.+?)(?:\n|$)/i);
  if (titleMatch2) title = titleMatch2[1].trim();
  
  // Pattern 3: Title in visualization notes
  const titleMatch3 = content.match(/Title:\s*(.+?)(?:\n|$)/i);
  if (titleMatch3) title = titleMatch3[1].trim();
  
  // Try to detect table data that can be used for charting
  const tableData = detectMultipleTableFormats(content);
  
  if (tableData && tableData.headers.length >= 2) {
    // Convert table data to chart format
    const xAxisLabel = tableData.headers[0];
    const yAxisLabel = tableData.headers[1];
    
    // Handle numeric data conversion more robustly
    const chartData = {
      type: chartType,
      title: title,
      data: tableData.rows.map((row, index) => {
        // Try to parse the second column as a number (Y-axis value)
        let value = 0;
        if (row[1]) {
          // Handle various number formats (6.5, 8, 9, etc.)
          const numStr = row[1].toString().replace(/[^\d.-]/g, '');
          value = parseFloat(numStr) || 0;
        }
        
        return {
          name: row[0] || `Item ${index + 1}`,
          value: value,
          category: row[2] || '',
          description: row[3] || '',
          // Keep original data for reference
          originalRow: row
        };
      }),
      xAxis: xAxisLabel,
      yAxis: yAxisLabel,
      metadata: {
        source: 'ai_response_extraction',
        originalTable: tableData,
        detectedType: chartType,
        confidence: 0.8
      }
    };
    
    // Validate that we have meaningful chart data
    const hasValidData = chartData.data.length > 0 && 
                        chartData.data.some(item => item.value > 0);
    
    if (hasValidData) {
      console.log('[Chart Detection] Extracted chart data:', chartData);
      return chartData;
    }
  }
  
  return null;
};

// Normalize chart data using the same logic as dashboard
export const normalizeChartData = (chart: any) => {
  if (!chart || (!chart.data && !chart.datasets)) {
    console.warn('🔧 Chart normalization: No chart or data found', chart);
    return chart;
  }
  
  try {
    const normalizedChart = { ...chart };
    
    // Determine chart type - handle both 'type' and 'chart_type' fields
    const chartType = chart.type || chart.chart_type || 'bar';
    normalizedChart.type = chartType;
    normalizedChart.chart_type = chartType;
    
    // Ensure title exists
    if (!normalizedChart.title) {
      normalizedChart.title = 'Generated Chart';
    }
    
    console.log('🔧 Chart normalized with type:', chartType);
    return normalizedChart;
    
  } catch (error) {
    console.error('🔧 Error normalizing chart data:', error);
    // Return chart with default type as fallback
    return {
      ...chart,
      type: 'bar',
      chart_type: 'bar',
      title: chart.title || 'Generated Chart'
    };
  }
};

// Check if content contains chart keywords
export const hasChartKeywords = (input: string, keywords: string[]) => {
  return keywords.some(keyword => 
    input.toLowerCase().includes(keyword)
  );
};

// Check if content contains sentiment keywords
export const hasSentimentKeywords = (input: string, keywords: string[]) => {
  return keywords.some(keyword => 
    input.toLowerCase().includes(keyword)
  );
};

// Detect if request is for sentiment comparison
export const isSentimentComparison = (input: string) => {
  return input.toLowerCase().includes('compare') || 
         input.toLowerCase().includes('comparison') || 
         input.toLowerCase().includes('vs') ||
         input.toLowerCase().includes('versus');
};
