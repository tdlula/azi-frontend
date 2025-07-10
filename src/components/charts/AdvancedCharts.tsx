import Chart from "react-apexcharts";
import type { ChartData } from "@shared/schema";
import { getChartColors } from "@/lib/chartConfig";

interface AdvancedChartsProps {
  chartData: ChartData;
}

export default function AdvancedCharts({ chartData }: AdvancedChartsProps) {
  const { type, title, data, xKey, yKey } = chartData;
  const colors = getChartColors();

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-1">Please provide data to generate a chart</p>
        </div>
      </div>
    );
  }

  const getValue = (item: any, key: string | undefined, fallback: any = 0) => {
    if (!item || typeof item !== 'object') return fallback;
    return item[key || ''] ?? item.value ?? fallback;
  };

  const getName = (item: any, fallback: string = 'Unknown') => {
    if (!item || typeof item !== 'object') return fallback;
    return item.name ?? item.label ?? item.category ?? fallback;
  };

  const baseConfig = {
    chart: {
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    theme: {
      mode: 'light' as const
    },
    colors: colors.palette,
    tooltip: {
      theme: 'light' as const
    },
    legend: {
      show: true
    }
  };

  const processedData = data.map((item: any, index: number) => ({
    name: getName(item, `Item ${index + 1}`),
    value: Number(getValue(item, yKey || 'value', 0)) || 0
  }));

  switch (type) {
    case "treemap":
      const treemapOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'treemap' as const
        },
        title: {
          text: title || 'Treemap Chart'
        }
      };

      const treemapSeries = [{
        data: processedData.map(item => ({
          x: item.name,
          y: item.value
        }))
      }];

      return <Chart options={treemapOptions} series={treemapSeries} type="treemap" height={300} />;

    case "funnel":
      // ApexCharts doesn't have native funnel, use bar chart with custom styling
      const funnelOptions = {
        ...baseConfig,
        chart: {
          ...baseConfig.chart,
          type: 'bar' as const
        },
        plotOptions: {
          bar: {
            horizontal: true,
            distributed: true
          }
        },
        xaxis: {
          categories: processedData.map(item => item.name)
        },
        title: {
          text: title || 'Funnel Chart'
        }
      };

      const funnelSeries = [{
        name: 'Values',
        data: processedData.map(item => item.value)
      }];

      return <Chart options={funnelOptions} series={funnelSeries} type="bar" height={300} />;

    default:
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">Advanced chart type: {type}</p>
            <p className="text-sm mt-1">Using ApexCharts renderer</p>
          </div>
        </div>
      );
  }
}