import { useState, useEffect } from "react";
import Chart from "react-apexcharts";

export default function TestChartDebug() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const testChartData = {
    chart: {
      type: 'bar' as const,
      background: 'transparent'
    },
    series: [{
      name: 'Test Values',
      data: [44, 55, 41, 67, 22, 43]
    }],
    xaxis: {
      categories: ['A', 'B', 'C', 'D', 'E', 'F']
    },
    title: {
      text: 'Debug Test Chart'
    },
    colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#1d4ed8']
  };

  console.log('TestChartDebug component rendering...', { error, loading });

  if (loading) {
    return (
      <div className="p-4 border rounded bg-yellow-50 dark:bg-yellow-900/20">
        <p>Loading test chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20">
        <p className="text-red-600">Chart Error: {error}</p>
      </div>
    );
  }

  try {
    return (
      <div className="p-4 border rounded bg-green-50 dark:bg-green-900/20">
        <h3 className="font-bold mb-2">Chart Debug Test</h3>
        <div style={{ width: '100%', height: '300px' }}>
          <Chart
            options={testChartData}
            series={testChartData.series}
            type="bar"
            height={300}
          />
        </div>
        <p className="text-sm text-green-600 mt-2">If you see a bar chart above, ApexCharts is working!</p>
      </div>
    );
  } catch (renderError) {
    console.error('Chart rendering error:', renderError);
    setError(renderError instanceof Error ? renderError.message : 'Unknown rendering error');
    return (
      <div className="p-4 border rounded bg-red-50 dark:bg-red-900/20">
        <p className="text-red-600">Chart failed to render: {String(renderError)}</p>
      </div>
    );
  }
}