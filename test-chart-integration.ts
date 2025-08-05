// Test file for verifying chartPrompts.json integration
import { ChartDataSchema, DashboardSchema } from './src/schemas/dashboardSchema';

// Test new complex line chart format
const testLineChart = {
  chart_type: "line",
  type: "line",
  title: "Hourly Sentiment Trends: Shoprite",
  data: {
    labels: ["09:00", "10:00", "11:00", "12:00"],
    datasets: [
      {
        label: "Positive Sentiment %",
        data: [65.2, 72.1, 68.5, 70.3],
        color: "#4CAF50"
      },
      {
        label: "3-hour Moving Average",
        data: [65.2, 68.7, 68.6, 69.0],
        color: "#2196F3"
      }
    ]
  },
  metadata: {
    topic: "Shoprite",
    analysis_period: {
      start_datetime: "2025-08-01T09:00:00Z",
      end_datetime: "2025-08-01T12:00:00Z"
    },
    smoothing_method: "3-hour moving average",
    total_mentions_analyzed: 156
  }
};

// Test new complex radar chart format
const testRadarChart = {
  chart_type: "radar",
  type: "radar",
  title: "Station Performance Comparison: Shoprite",
  data: {
    labels: ["Engagement", "Reach", "Sentiment", "Response Volume", "Retention"],
    datasets: [
      {
        label: "Station A",
        data: [85.5, 72.3, 90.1, 68.7, 78.9],
        color: "#3b82f6"
      },
      {
        label: "Station B", 
        data: [78.2, 85.6, 82.4, 75.3, 80.1],
        color: "#ef4444"
      }
    ]
  },
  metadata: {
    topic: "Shoprite",
    analysis_period: {
      start_datetime: "2025-08-01T00:00:00Z",
      end_datetime: "2025-08-05T23:59:59Z"
    },
    score_scale: "0–100",
    metrics_included: ["Engagement", "Reach", "Sentiment", "Response Volume", "Retention"],
    total_stations_analyzed: 2
  }
};

// Test simple donut chart format (legacy compatibility)
const testDonutChart = {
  type: "donut",
  chart_type: "donut",
  title: "Sentiment Analysis: Shoprite",
  data: [
    { label: "Positive", value: 65.2, color: "#4CAF50" },
    { label: "Neutral", value: 24.8, color: "#FF9800" },
    { label: "Negative", value: 10.0, color: "#F44336" }
  ],
  metadata: {
    topic: "Shoprite",
    analysis_period: {
      start_date: "2025-08-01",
      end_date: "2025-08-05"
    },
    source_count: {
      call_ins: 45,
      whatsapp_feedback: 23,
      presenter_segments: 12
    },
    total_entries_analyzed: 80
  }
};

// Validation tests
try {
  console.log('Testing Line Chart Schema...');
  const lineResult = ChartDataSchema.parse(testLineChart);
  console.log('✅ Line Chart validation passed');

  console.log('Testing Radar Chart Schema...');
  const radarResult = ChartDataSchema.parse(testRadarChart);
  console.log('✅ Radar Chart validation passed');

  console.log('Testing Donut Chart Schema...');
  const donutResult = ChartDataSchema.parse(testDonutChart);
  console.log('✅ Donut Chart validation passed');

  console.log('All chart format tests passed! 🎉');
} catch (error) {
  console.error('❌ Schema validation failed:', error);
}

export { testLineChart, testRadarChart, testDonutChart };
