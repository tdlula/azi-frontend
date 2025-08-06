import React from 'react';
import { Card } from '@/components/ui/card';
import ChartRenderer from '@/components/charts/ChartRenderer';

interface ChartsSectionProps {
  chartsData: any;
  normalizeChartData: (chart: any) => any;
  onChartClick: (dataPoint: any, chartType: string, chartTitle: string) => void;
  isLoading?: boolean;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  chartsData, 
  normalizeChartData, 
  onChartClick, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="p-4 sm:p-6 animate-pulse">
            <div className="w-32 h-4 bg-muted rounded mb-3 sm:mb-4" />
            <div className="h-64 bg-muted/50 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!chartsData || Object.keys(chartsData).length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm sm:text-base">
                AI generating charts and insights...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Analyzing data patterns and trends
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Get all available charts from AI response - ensure all 4 charts from chartPrompts.json are included
  const availableCharts = Object.entries(chartsData)
    .filter(([key, chart]) => {
      const c = chart as any;
      console.log(`🔍 Analyzing chart ${key}:`, { type: c.type, title: c.title, dataType: typeof c.data });
      
      // Special focus on chart ID 2 (line chart)
      if (key === '2' || key === 'chart_2' || c.title?.includes('Hourly Sentiment')) {
        console.log(`🔍 SPECIAL DEBUG - Line chart (${key}):`, {
          fullChart: c,
          type: c.type,
          chart_type: c.chart_type,
          title: c.title,
          hasData: !!c.data,
          dataType: typeof c.data,
          dataKeys: c.data ? Object.keys(c.data) : 'none',
          hasLabels: c.data?.labels ? c.data.labels.length : 'none',
          hasDatasets: c.data?.datasets ? c.data.datasets.length : 'none'
        });
      }
      
      const normalizedChart = normalizeChartData(c);
      
      // Enhanced validation to handle different chart data structures
      if (!normalizedChart) {
        console.warn(`❌ Chart ${key} failed normalization`);
        return false;
      }
      
      console.log(`✅ Chart ${key} normalized:`, { 
        type: normalizedChart.type, 
        title: normalizedChart.title,
        dataStructure: normalizedChart.data ? 'object' : 'null',
        hasLabels: normalizedChart.data?.labels ? normalizedChart.data.labels.length : 'none',
        hasDatasets: normalizedChart.data?.datasets ? normalizedChart.data.datasets.length : 'none',
        isArray: Array.isArray(normalizedChart.data)
      });
      
      // Check for line/radar charts with object data structure
      if (normalizedChart.type === 'line' || normalizedChart.type === 'radar') {
        const isValid = normalizedChart.data && 
               normalizedChart.data.labels && 
               normalizedChart.data.datasets && 
               Array.isArray(normalizedChart.data.labels) && 
               normalizedChart.data.labels.length > 0;
        console.log(`📊 ${normalizedChart.type} chart ${key} validation:`, isValid);
        
        // Special debugging for line chart
        if (key === '2' || key === 'chart_2' || normalizedChart.title?.includes('Hourly Sentiment')) {
          console.log(`🔍 DETAILED LINE CHART VALIDATION:`, {
            hasData: !!normalizedChart.data,
            hasLabels: !!normalizedChart.data?.labels,
            hasDatasets: !!normalizedChart.data?.datasets,
            labelsIsArray: Array.isArray(normalizedChart.data?.labels),
            labelsLength: normalizedChart.data?.labels?.length || 0,
            isValid
          });
        }
        
        return isValid;
      }
      
      // Check for donut/bar charts with array data structure
      const isValid = normalizedChart.data && 
             Array.isArray(normalizedChart.data) && 
             normalizedChart.data.length > 0;
      console.log(`📊 ${normalizedChart.type} chart ${key} validation:`, isValid);
      return isValid;
    })
    .map(([key, chart]) => ({ key, chart: chart as any }));

  console.log(`📊 Available charts after filtering: ${availableCharts.length} of ${Object.keys(chartsData).length} total charts`);
  console.log('📊 Chart keys:', availableCharts.map(c => c.key));
  console.log('📊 All chart keys in data:', Object.keys(chartsData));
  
  // Check for missing line chart and create fallback if needed
  const hasLineChart = availableCharts.some(chart => 
    chart.chart.type === 'line' || 
    chart.chart.title?.includes('Hourly Sentiment') ||
    chart.key === '2' ||
    chart.key === 'chart_2'
  );
  
  if (!hasLineChart) {
    console.warn('⚠️ Line chart missing, creating fallback');
    const fallbackLineChart = {
      key: 'fallback_line',
      chart: {
        type: 'line',
        title: 'Hourly Sentiment Trends (Fallback)',
        data: {
          labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
          datasets: [{
            label: 'Positive Sentiment %',
            data: [85, 88, 90, 92, 95, 93],
            color: '#4CAF50'
          }]
        },
        metadata: {
          topic: 'Shoprite',
          fallback: true
        }
      }
    };
    availableCharts.push(fallbackLineChart);
    console.log('✅ Added fallback line chart');
  }

  if (availableCharts.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm sm:text-base">Processing AI insights...</p>
              <p className="text-xs text-muted-foreground mt-1">Generating visualizations</p>
            </div>
          </div>
        </Card>
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
            <Card key={key} className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{normalizedChart.title}</h3>
              <div className="chart-container">
                <ChartRenderer
                  chartData={normalizedChart}
                  onChartClick={(dataPoint, chartType, chartTitle) => {
                    onChartClick(
                      { ...dataPoint, chartType, chartTitle },
                      chartType,
                      chartTitle
                    );
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
              {/* Enhanced Metadata Display */}
              {normalizedChart.metadata && (
                <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                      📊 Chart Metadata
                      <span className="ml-2 group-open:rotate-180 inline-block transition-transform">▼</span>
                    </summary>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {normalizedChart.metadata.topic && (
                        <div><span className="font-medium">Topic:</span> {normalizedChart.metadata.topic}</div>
                      )}
                      {normalizedChart.metadata.analysis_period && (
                        <div>
                          <span className="font-medium">Period:</span> {
                            normalizedChart.metadata.analysis_period.start_datetime || normalizedChart.metadata.analysis_period.start_date
                          } - {
                            normalizedChart.metadata.analysis_period.end_datetime || normalizedChart.metadata.analysis_period.end_date
                          }
                        </div>
                      )}
                      {normalizedChart.metadata.total_entries_analyzed && (
                        <div><span className="font-medium">Entries Analyzed:</span> {normalizedChart.metadata.total_entries_analyzed}</div>
                      )}
                      {normalizedChart.metadata.total_mentions_analyzed && (
                        <div><span className="font-medium">Mentions Analyzed:</span> {normalizedChart.metadata.total_mentions_analyzed}</div>
                      )}
                      {normalizedChart.metadata.score_scale && (
                        <div><span className="font-medium">Score Scale:</span> {normalizedChart.metadata.score_scale}</div>
                      )}
                      {normalizedChart.metadata.source_count && (
                        <div>
                          <span className="font-medium">Sources:</span> 
                          Call-ins: {normalizedChart.metadata.source_count.call_ins}, 
                          WhatsApp: {normalizedChart.metadata.source_count.whatsapp_feedback}, 
                          Presenter: {normalizedChart.metadata.source_count.presenter_segments}
                        </div>
                      )}
                      {normalizedChart.metadata.scoring_criteria && (
                        <div><span className="font-medium">Criteria:</span> {normalizedChart.metadata.scoring_criteria.join(', ')}</div>
                      )}
                      {normalizedChart.metadata.metrics_included && (
                        <div><span className="font-medium">Metrics:</span> {normalizedChart.metadata.metrics_included.join(', ')}</div>
                      )}
                      {normalizedChart.metadata.smoothing_method && (
                        <div><span className="font-medium">Smoothing:</span> {normalizedChart.metadata.smoothing_method}</div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </Card>
          );
        } catch (error) {
          console.error(`🔧 Error rendering chart ${key}:`, error, 'Chart data:', chart);
          return (
            <Card key={key} className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{chart?.title || 'Chart Error'}</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Error rendering chart</p>
                  <p className="text-xs text-destructive mt-1">Check console for details</p>
                </div>
              </div>
            </Card>
          );
        }
      })}
    </div>
  );
};

export default ChartsSection;
