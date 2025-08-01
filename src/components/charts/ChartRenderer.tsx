import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import type { ChartData } from "@/schemas/dashboardSchema";
import { getChartColors, generateValueBasedColors, generateGradientColors } from "@/lib/chartConfig";
import { useTheme } from "@/components/ui/theme-provider";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logChartRender, logError, logUserAction } from "@/lib/sentry";

interface ChartRendererProps {
  chartData: ChartData;
  onChartClick?: (dataPoint: any, chartType: string, chartTitle: string) => void;
}

export default function ChartRenderer({ chartData, onChartClick }: ChartRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error when chartData changes
  useEffect(() => {
    setError(null);
    setRetryCount(0);
    
    // Log chart render attempt
    if (chartData) {
      const startTime = Date.now();
      logChartRender(chartData.type, chartData.data?.length || 0, startTime);
      logUserAction('chart_render', 'ChartRenderer', {
        chartType: chartData.type,
        dataPoints: chartData.data?.length || 0,
        title: chartData.title
      });
    }
  }, [chartData]);

  // Validate chart data
  const validateChartData = (data: ChartData): string | null => {
    if (!data) return "Chart data is missing";
    
    // Check for chart type - accept both 'type' and 'chart_type' fields
    const chartType = data.type || (data as any).chart_type;
    if (!chartType) return "Chart type is not specified";
    
    // Title is optional - we can generate one if missing
    // if (!data.title) return "Chart title is missing";
    
    // Handle both array and object data formats
    if (!data.data) return "Chart data is missing";
    
    // For array format
    if (Array.isArray(data.data)) {
      if (data.data.length === 0) return "Chart data is empty";
    } 
    // For object format (from new backend)
    else if (typeof data.data === 'object') {
      if (Object.keys(data.data).length === 0) return "Chart data is empty";
    } 
    else {
      return "Chart data format is invalid";
    }
    
    // Validate data structure based on chart type
    if (chartType === 'wordcloud') {
      if (!data.wordData || !Array.isArray(data.wordData)) {
        return "Word cloud data is missing or invalid";
      }
    }
    
    return null;
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    
    // Log retry attempt
    logUserAction('chart_retry', 'ChartRenderer', {
      chartType: chartData.type,
      retryCount: retryCount + 1,
      previousError: error
    });
  };

  // Handle chart rendering errors
  const handleChartError = (errorMessage: string) => {
    console.error("Chart rendering error:", errorMessage);
    setError(errorMessage);
    
    // Log chart error to Sentry
    logError(new Error(errorMessage), 'Chart Rendering', {
      chartType: chartData.type,
      chartTitle: chartData.title,
      dataPoints: chartData.data?.length || 0,
      retryCount
    });
  };

  // Validate chart data first
  const validationError = validateChartData(chartData);
  if (validationError) {
    // Log validation error
    logError(new Error(validationError), 'Chart Validation', {
      chartType: chartData?.type || 'unknown',
      hasData: !!chartData?.data,
      dataLength: chartData?.data?.length || 0
    });
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-lg font-medium">Chart Error</p>
          <p className="text-sm mt-1">{validationError}</p>
          <Button onClick={handleRetry} className="mt-4" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-lg font-medium">Chart Rendering Error</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={handleRetry} className="mt-4" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry ({retryCount})
          </Button>
        </div>
      </div>
    );
  }

  try {
    // Handle both specific chart format (chart_type) and generic format (type)
    const chartType = chartData.type || (chartData as any).chart_type;
    const chartTitle = chartData.title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
    const chartDataArray = chartData.data;
    const { xKey, yKey } = chartData;
    
    const { theme } = useTheme();
    const baseColors = getChartColors();
  
  // Determine if we're in dark mode
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Ensure data exists and is an array
  if (!chartDataArray || !Array.isArray(chartDataArray) || chartDataArray.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-1">Please provide data to generate a chart</p>
        </div>
      </div>
    );
  }

  // Function to safely get values from data
  const getValue = (item: any, key: string | undefined, fallback: any = 0) => {
    if (!item || typeof item !== 'object') return fallback;
    
    let value = item[key || ''] ?? item.value ?? fallback;
    
    // Handle nested object values (new format)
    if (typeof value === 'object' && value !== null && typeof value.value === 'number') {
      return value.value;
    }
    
    // Ensure we always return a number
    const numValue = Number(value);
    return isNaN(numValue) ? fallback : numValue;
  };

  const getName = (item: any, fallback: string = 'Unknown') => {
    if (!item || typeof item !== 'object') return fallback;
    return item.name ?? item.label ?? item.category ?? fallback;
  };
  
  // Helper function to safely extract numeric values for charts
  const safeNumericValue = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'object' && value !== null && typeof value.value === 'number') {
      return value.value;
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.warn('🔧 Invalid numeric value:', value, 'Using fallback:', fallback);
      return fallback;
    }
    return numValue;
  };
  
  // Extract values for dynamic coloring (after getValue function is defined)
  const values = chartDataArray.map(item => getValue(item, yKey, 0));
  const dynamicColors = generateValueBasedColors(values);
  const { colors: gradientColors, gradients } = generateGradientColors(values);

  // Base ApexCharts configuration with built-in zoom and click events
  const baseConfig = {
    chart: {
      background: 'transparent',
      events: {
        dataPointSelection: function(event: any, chartContext: any, config: any) {
          if (onChartClick) {
            const dataPoint = {
              seriesIndex: config.seriesIndex,
              dataPointIndex: config.dataPointIndex,
              value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
              label: config.w.globals.labels[config.dataPointIndex],
              category: config.w.config.xaxis.categories ? config.w.config.xaxis.categories[config.dataPointIndex] : null
            };
            onChartClick(dataPoint, chartType, chartTitle || 'Chart');
          }
        }
      },
      toolbar: {
        show: true,
        offsetX: 0,
        offsetY: 0,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        export: {
          csv: {
            filename: chartTitle || 'chart-data'
          },
          svg: {
            filename: chartTitle || 'chart'
          },
          png: {
            filename: chartTitle || 'chart'
          }
        }
      },
      zoom: {
        enabled: true,
        type: 'xy' as const,
        autoScaleYaxis: true
      },
      selection: {
        enabled: true
      }
    },
    theme: {
      mode: (isDark ? 'dark' : 'light') as 'dark' | 'light'
    },
    colors: dynamicColors,
    tooltip: {
      theme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      }
    },
    legend: {
      show: true
    },
    grid: {
      show: true
    }
  };

  // Prepare chart data with enhanced error checking
  const processedData = chartDataArray.map((item: any, index: number) => {
    const name = getName(item, `Item ${index + 1}`);
    const value = safeNumericValue(getValue(item, yKey || 'value', 0));
    
    console.log(`🔧 Processing chart data item ${index}:`, {
      original: item,
      name,
      value,
      type: typeof value
    });
    
    return {
      name,
      value,
      x: getValue(item, xKey || 'name', name),
      y: value
    };
  });

  switch (chartType) {
    case "bar":
      const barOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'bar' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'bar', chartTitle || 'Bar Chart');
              }
            }
          }
        },
        colors: dynamicColors, // Apply dynamic colors
        fill: {
          colors: dynamicColors, // Ensure fill colors match
          opacity: 0.9,
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.25,
            gradientToColors: gradientColors,
            inverseColors: false,
            opacityFrom: 0.9,
            opacityTo: 0.7,
            stops: [0, 100]
          }
        },
        plotOptions: {
          bar: {
            distributed: true, // This enables different colors for each bar
            borderRadius: 4,
            dataLabels: {
              position: 'top'
            }
          }
        },
        xaxis: {
          categories: processedData.map(item => item.name),
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 'bold'
            },
            maxHeight: 120,
            rotate: -45
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px'
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        legend: {
          show: false // Hide legend for distributed bars
        },
        grid: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
      };

      const barSeries = [{
        name: 'Values',
        data: processedData.map(item => {
          const value = Number(item.value);
          if (isNaN(value)) {
            console.warn('🔧 Invalid bar chart value:', item.value, 'Converting to 0');
            return 0;
          }
          return value;
        })
      }];

      try {
        return <Chart options={barOptions} series={barSeries} type="bar" height={520} />;
      } catch (chartError) {
        console.error('🔧 ApexCharts bar chart error:', chartError, 'Data:', barSeries);
        handleChartError(`Bar chart rendering failed: ${chartError}`);
        return null;
      }

    case "line":
      const lineOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'line' as const,
          events: {
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              console.log('Line chart dataPointSelection triggered:', config);
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                console.log('Line chart calling onChartClick with:', dataPoint);
                onChartClick(dataPoint, 'line', chartTitle || 'Line Chart');
              }
            },
            markerClick: function(event: any, chartContext: any, config: any) {
              console.log('Line chart markerClick triggered:', config);
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'line', chartTitle || 'Line Chart');
              }
            }
          }
        },
        xaxis: {
          categories: processedData.map(item => item.name),
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 'bold'
            },
            maxHeight: 120,
            rotate: -45
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px'
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        grid: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        colors: dynamicColors, // Apply dynamic colors
        stroke: {
          curve: 'smooth' as const,
          width: 3,
          colors: dynamicColors
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.3,
            gradientToColors: gradientColors,
            inverseColors: false,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 100]
          }
        },
        markers: {
          size: 8,
          strokeWidth: 3,
          strokeColors: '#fff',
          fillOpacity: 1,
          colors: dynamicColors,
          hover: {
            size: 12,
            sizeOffset: 3
          }
        },
        tooltip: {
          shared: false,
          intersect: true
        }
      };

      const lineSeries = [{
        name: 'Values',
        data: processedData.map(item => item.value)
      }];

      return <Chart options={lineOptions} series={lineSeries} type="line" height={520} />;

    case "donut":
      const donutOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'donut' as const,
          width: '100%',
          height: 450,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: 0,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.dataPointIndex],
                  label: config.w.config.labels[config.dataPointIndex],
                  category: config.w.config.labels[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'donut', chartTitle || 'Donut Chart');
              }
            }
          }
        },
        colors: dynamicColors, // Apply dynamic colors to each donut segment
        fill: {
          colors: dynamicColors,
          opacity: 0.9,
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'radial',
            shadeIntensity: 0.4,
            gradientToColors: gradientColors,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.8,
            stops: [0, 100]
          }
        },
        labels: processedData.map(item => item.name),
        title: {
          text: chartTitle,
          align: 'center' as const,
          margin: 15,
          offsetX: 0,
          offsetY: 0,
          floating: false,
          style: {
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#333333'
          }
        },
        legend: {
          position: 'bottom' as const,
          horizontalAlign: 'center' as const,
          floating: false,
          fontSize: '14px'
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return Math.round(val * 100) / 100 + "%";
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#ffffff' : '#333333',
                  offsetY: -10,
                },
                value: {
                  show: true,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: isDark ? '#ffffff' : '#333333',
                  offsetY: 5,
                  formatter: function (val: string) {
                    return Math.round(parseFloat(val) * 100) / 100 + "%";
                  }
                },
                total: {
                  show: true,
                  showAlways: false,
                  label: 'Total',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#ffffff' : '#333333',
                  formatter: function (w: any) {
                    return w.globals.seriesTotals.reduce((a: number, b: number) => {
                      return a + b;
                    }, 0) + "%";
                  }
                }
              }
            }
          }
        },
        responsive: [
          {
            breakpoint: 1280,
            options: {
              chart: { width: '100%', height: 320 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 900,
            options: {
              chart: { width: '100%', height: 260 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 600,
            options: {
              chart: { width: '100%', height: 200 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 480,
            options: {
              chart: { width: 320 },
              legend: { position: 'bottom' as const },
            },
          },
        ]
      };

      const donutData = processedData.map(item => item.value);

      return (
        <div style={{ width: '100%', maxWidth: 640, minHeight: 420, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chart options={donutOptions} series={donutData} type="donut" height={420} width={"100%"} />
        </div>
      );

    case "pie":
      const pieOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'pie' as const,
          width: '100%',
          height: 450,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: 0,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.dataPointIndex],
                  label: config.w.config.labels[config.dataPointIndex],
                  category: config.w.config.labels[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'pie', chartTitle || 'Pie Chart');
              }
            }
          }
        },
        colors: dynamicColors, // Apply dynamic colors to each pie segment
        fill: {
          colors: dynamicColors,
          opacity: 0.9,
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'radial',
            shadeIntensity: 0.4,
            gradientToColors: gradientColors,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.8,
            stops: [0, 100]
          }
        },
        labels: processedData.map(item => item.name),
        title: {
          text: chartTitle,
          align: 'center' as const,
          margin: 15,
          offsetX: 0,
          offsetY: 0,
          floating: false,
          style: {
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#333333'
          }
        },
        legend: {
          position: 'bottom' as const,
          horizontalAlign: 'center' as const,
          floating: false,
          fontSize: '14px'
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number) {
            return Math.round(val * 100) / 100 + "%";
          }
        },
        responsive: [
          {
            breakpoint: 1280,
            options: {
              chart: { width: '100%', height: 320 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 900,
            options: {
              chart: { width: '100%', height: 260 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 600,
            options: {
              chart: { width: '100%', height: 200 },
              legend: { position: 'bottom' as const },
            },
          },
          {
            breakpoint: 480,
            options: {
              chart: { width: 320 },
              legend: { position: 'bottom' as const },
            },
          },
        ]
      };

      const pieData = processedData.map(item => item.value);

      return (
        <div style={{ width: '100%', maxWidth: 640, minHeight: 420, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chart options={pieOptions} series={pieData} type="pie" height={420} width={"100%"} />
        </div>
      );

    case "area":
      const areaOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'area' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'area', chartTitle || 'Area Chart');
              }
            }
          }
        },
        xaxis: {
          categories: processedData.map(item => item.name),
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 'bold'
            },
            maxHeight: 120,
            rotate: -45
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px'
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        grid: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3
          }
        }
      };

      const areaSeries = [{
        name: 'Values',
        data: processedData.map(item => item.value)
      }];

      return <Chart options={areaOptions} series={areaSeries} type="area" height={520} />;

    case "scatter":
      const scatterOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'scatter' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: `Point ${config.dataPointIndex + 1}`,
                  category: config.w.config.series[config.seriesIndex].name || 'Data Points',
                  x: config.w.config.series[config.seriesIndex].data[config.dataPointIndex][0],
                  y: config.w.config.series[config.seriesIndex].data[config.dataPointIndex][1]
                };
                onChartClick(dataPoint, 'scatter', chartTitle || 'Scatter Plot');
              }
            }
          }
        },
        colors: dynamicColors, // Apply dynamic colors to scatter points
        markers: {
          size: 8,
          strokeWidth: 2,
          strokeColors: '#fff',
          fillOpacity: 0.9,
          colors: dynamicColors,
          hover: {
            size: 12,
            sizeOffset: 3
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        xaxis: {
          title: {
            text: xKey || 'X Values'
          },
          type: 'numeric' as const
        },
        yaxis: {
          title: {
            text: yKey || 'Y Values'
          }
        }
      };

      const scatterSeries = [{
        name: 'Data Points',
        data: processedData.map(item => [Number(item.x) || 0, item.y])
      }];

      return <Chart options={scatterOptions} series={scatterSeries} type="scatter" height={520} />;

    case "radar":
      const radarOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'radar' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'radar', chartTitle || 'Radar Chart');
              }
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        xaxis: {
          categories: processedData.map(item => item.name)
        }
      };

      const radarSeries = [{
        name: 'Values',
        data: processedData.map(item => item.value)
      }];

      return <Chart options={radarOptions} series={radarSeries} type="radar" height={520} />;

    case "heatmap":
      const heatmapOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'heatmap' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const selectedData = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: selectedData.y || selectedData.value || selectedData,
                  label: selectedData.x || selectedData.name || `${config.seriesIndex}-${config.dataPointIndex}`,
                  category: config.w.config.series[config.seriesIndex].name || 'Activity Level',
                  x: selectedData.x || selectedData.name,
                  y: selectedData.y || selectedData.value,
                  // Enhanced heatmap-specific data
                  intensity: selectedData.y || selectedData.value,
                  xCategory: selectedData.x || selectedData.name,
                  yCategory: config.w.config.series[config.seriesIndex].name,
                  coordinates: `${selectedData.x || selectedData.name} - ${config.w.config.series[config.seriesIndex].name}`,
                  // Add original data for context
                  originalItem: processedData.find(item => 
                    (item.name === (selectedData.x || selectedData.name)) || 
                    (item.x === selectedData.x && item.y === selectedData.y)
                  )
                };
                console.log('Heatmap drill-down data:', dataPoint);
                onChartClick(dataPoint, 'heatmap', chartTitle || 'Heatmap Analysis');
              }
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#fff'],
            fontSize: '12px',
            fontWeight: 'bold'
          },
          formatter: function(val: any, opts: any) {
            // Show the actual value in the heatmap cell
            return val || '';
          }
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 2,
            useFillColorAsStroke: true,
            colorScale: {
              ranges: [{
                from: 0,
                to: 25,
                color: '#00A100',
                name: 'Low',
              }, {
                from: 26,
                to: 50,
                color: '#128FD9',
                name: 'Medium',
              }, {
                from: 51,
                to: 75,
                color: '#FFB200',
                name: 'High',
              }, {
                from: 76,
                to: 100,
                color: '#FF0000',
                name: 'Very High',
              }]
            },
            distributed: false
          }
        },
        tooltip: {
          custom: function({series, seriesIndex, dataPointIndex, w}: any) {
            const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
            const seriesName = w.globals.seriesNames[seriesIndex];
            return `
              <div class="bg-background border rounded p-3 shadow-lg">
                <div class="font-semibold">${data.x || data.name}</div>
                <div class="text-sm text-muted-foreground">${seriesName}</div>
                <div class="font-medium">Value: ${data.y || data.value}</div>
                <div class="text-xs text-muted-foreground mt-1">Click for detailed analysis</div>
              </div>
            `;
          }
        }
      };

      // Enhanced heatmap data processing
      const heatmapSeries = (() => {
        // Check if data has proper heatmap structure (x, y, value)
        if (processedData.some(item => 'x' in item && 'y' in item && 'value' in item)) {
          // Proper heatmap data with x, y coordinates
          const categories = [...new Set(processedData.map(item => item.y))];
          return categories.map(category => ({
            name: String(category),
            data: processedData
              .filter(item => item.y === category)
              .map(item => ({
                x: String(item.x),
                y: Number(item.value)
              }))
          }));
        } else {
          // Single series heatmap (convert from bar/line data)
          return [{
            name: 'Intensity',
            data: processedData.map((item, index) => ({
              x: String(item.name || `Item ${index + 1}`),
              y: Math.floor(Number(item.value) || 0)
            }))
          }];
        }
      })();

      return <Chart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={420} />;

    case "treemap":
      const treemapOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'treemap' as const,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const selectedData = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: selectedData.y,
                  label: selectedData.x,
                  category: selectedData.x,
                  x: selectedData.x,
                  y: selectedData.y
                };
                onChartClick(dataPoint, 'treemap', chartTitle || 'Treemap Chart');
              }
            }
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px'
          },
          formatter: function(text: string, op: any) {
            return [text, op.value]
          },
          offsetY: -4
        },
        plotOptions: {
          treemap: {
            enableShades: true,
            shadeIntensity: 0.5,
            reverseNegativeShade: true,
            colorScale: {
              ranges: [{
                from: -6,
                to: 0,
                color: '#CD363A'
              }, {
                from: 0.001,
                to: 6,
                color: '#52B12C'
              }]
            }
          }
        }
      };

      const treemapSeries = [{
        data: processedData.map(item => ({
          x: item.name,
          y: item.value
        }))
      }];

      return <Chart options={treemapOptions} series={treemapSeries} type="treemap" height={420} />;

    case "funnel":
      const funnelOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'bar' as const, // ApexCharts doesn't have native funnel, use horizontal bar
          height: 350,
          events: {
            ...baseConfig.chart.events,
            dataPointSelection: function(event: any, chartContext: any, config: any) {
              if (onChartClick) {
                const dataPoint = {
                  seriesIndex: config.seriesIndex,
                  dataPointIndex: config.dataPointIndex,
                  value: config.w.config.series[config.seriesIndex].data[config.dataPointIndex],
                  label: config.w.config.xaxis.categories[config.dataPointIndex],
                  category: config.w.config.xaxis.categories[config.dataPointIndex]
                };
                onChartClick(dataPoint, 'funnel', chartTitle || 'Funnel Chart');
              }
            }
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: true,
            barHeight: '80%',
            isFunnel: true
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function(val: number, opt: any) {
            return opt.w.globals.labels[opt.dataPointIndex] + ': ' + val;
          },
          dropShadow: {
            enabled: true
          }
        },
        title: {
          text: chartTitle,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333'
          },
          margin: 10
        },
        xaxis: {
          categories: processedData.map(item => item.name)
        }
      };

      const funnelSeries = [{
        name: 'Funnel',
        data: processedData.map(item => item.value)
      }];

      return <Chart options={funnelOptions} series={funnelSeries} type="bar" height={420} />;

    case "wordcloud":
      // For word cloud, we'll display a simple representation since ApexCharts doesn't have native word cloud
      const wordCloudData = chartData.wordData || processedData.map((item, index) => ({
        text: String(item.name || `Item ${index + 1}`),
        value: Number(item.value) || 0,
        category: 'general'
      }));

      return (
        <div className="word-cloud-container h-[420px] p-6 border rounded-xl bg-muted/20">
          <h3 className="text-xl font-semibold text-center mb-6">{chartTitle || 'Word Cloud'}</h3>
          <div className="flex flex-wrap gap-3 justify-center items-center h-[340px] overflow-y-auto">
            {wordCloudData.map((word: any, index: number) => {
              const size = Math.max(16, Math.min(44, (word.value / Math.max(...wordCloudData.map((w: any) => w.value))) * 28 + 16));
              const opacity = Math.max(0.6, word.value / Math.max(...wordCloudData.map((w: any) => w.value)));
              return (
                <span
                  key={index}
                  className="cursor-pointer transition-all duration-200 hover:scale-110 inline-block m-1 p-2 rounded"
                  style={{ 
                    fontSize: `${size}px`, 
                    opacity: opacity,
                    color: dynamicColors[index % dynamicColors.length]
                  }}
                  onClick={() => {
                    if (onChartClick) {
                      const dataPoint = {
                        label: word.text,
                        value: word.value,
                        category: word.category,
                        seriesIndex: 0,
                        dataPointIndex: index
                      };
                      onChartClick(dataPoint, 'wordcloud', chartTitle || 'Word Cloud');
                    }
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">Chart type: {chartType}</p>
            <p className="text-sm mt-1">ApexCharts visualization</p>
            <p className="text-xs mt-2 text-muted-foreground">{chartTitle}</p>
          </div>
        </div>
      );
  }
  
  } catch (renderError) {
    handleChartError(renderError instanceof Error ? renderError.message : 'Unknown chart rendering error');
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-lg font-medium">Chart Rendering Failed</p>
          <p className="text-sm mt-1">Please try refreshing or contact support</p>
          <Button onClick={handleRetry} className="mt-4" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
}