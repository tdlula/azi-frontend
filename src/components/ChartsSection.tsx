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
      <div className="space-y-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} className="overflow-hidden bg-gradient-to-br from-card/50 to-card border border-border/50 shadow-lg">
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="w-48 h-7 bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse" />
                  <div className="h-1 w-16 bg-primary/50 rounded-full animate-pulse" />
                </div>
                <div className="bg-gradient-to-br from-background/80 to-muted/30 rounded-xl p-6 border border-border/30">
                  <div className="h-80 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!chartsData || Object.keys(chartsData).length === 0) {
    return (
      <div className="space-y-8 mb-12">
        <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-card border border-border/50 shadow-lg">
          <div className="p-8">
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary/20 to-primary/40 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    AI generating charts and insights...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Analyzing data patterns and trends
                  </p>
                </div>
              </div>
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
      if (key === '2' || key === 'chart_2' || c.title?.toLowerCase().includes('hourly sentiment') || c.title?.toLowerCase().includes('sentiment trends')) {
        console.log(`🔍 SPECIAL DEBUG - Line chart candidate (${key}):`, {
          fullChart: c,
          type: c.type,
          chart_type: c.chart_type,
          title: c.title,
          hasData: !!c.data,
          dataType: typeof c.data,
          dataKeys: c.data ? Object.keys(c.data) : 'none',
          hasLabels: c.data?.labels ? c.data.labels.length : 'none',
          hasDatasets: c.data?.datasets ? c.data.datasets.length : 'none',
          datasets: c.data?.datasets,
          labels: c.data?.labels
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
               Array.isArray(normalizedChart.data.datasets) &&
               normalizedChart.data.labels.length > 0 &&
               normalizedChart.data.datasets.length > 0;
        console.log(`📊 ${normalizedChart.type} chart ${key} validation:`, isValid);
        
        // Special debugging for line chart
        if (key === '2' || key === 'chart_2' || normalizedChart.title?.includes('Hourly Sentiment')) {
          console.log(`🔍 DETAILED LINE CHART VALIDATION:`, {
            hasData: !!normalizedChart.data,
            hasLabels: !!normalizedChart.data?.labels,
            hasDatasets: !!normalizedChart.data?.datasets,
            labelsIsArray: Array.isArray(normalizedChart.data?.labels),
            datasetsIsArray: Array.isArray(normalizedChart.data?.datasets),
            labelsLength: normalizedChart.data?.labels?.length || 0,
            datasetsLength: normalizedChart.data?.datasets?.length || 0,
            datasets: normalizedChart.data?.datasets,
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
  console.log('📊 Chart types:', availableCharts.map(c => ({ key: c.key, type: c.chart.type, title: c.chart.title })));
  
  // Additional debug for line chart search
  const lineChartCandidates = Object.entries(chartsData).filter(([key, chart]) => {
    const c = chart as any;
    return key === '2' || key === 'chart_2' || 
           c.type === 'line' || c.chart_type === 'line' ||
           c.title?.toLowerCase().includes('hourly') ||
           c.title?.toLowerCase().includes('sentiment') ||
           c.title?.toLowerCase().includes('trend');
  });
  
  console.log('🔍 Line chart candidates found:', lineChartCandidates.length);
  lineChartCandidates.forEach(([key, chart]) => {
    console.log(`🔍 Candidate ${key}:`, {
      type: (chart as any).type,
      title: (chart as any).title,
      hasValidStructure: !!(chart as any).data?.labels && !!(chart as any).data?.datasets
    });
  });
  
  // Check if line chart exists in available charts
  const hasLineChart = availableCharts.some(chart => {
    const isLineChart = chart.chart.type === 'line' || 
                       chart.chart.chart_type === 'line' ||
                       chart.chart.title?.toLowerCase().includes('hourly sentiment') ||
                       chart.chart.title?.toLowerCase().includes('sentiment trends') ||
                       chart.chart.title?.toLowerCase().includes('time series') ||
                       chart.key === '2' ||
                       chart.key === 'chart_2';
    
    // Enhanced validation for line charts
    const hasValidData = chart.chart.data &&
                        chart.chart.data.labels &&
                        chart.chart.data.datasets &&
                        Array.isArray(chart.chart.data.labels) &&
                        Array.isArray(chart.chart.data.datasets) &&
                        chart.chart.data.labels.length > 0 &&
                        chart.chart.data.datasets.length > 0 &&
                        chart.chart.data.datasets.every((dataset: any) => 
                          dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
                        );
    
    if (isLineChart) {
      console.log(`🔍 Line chart detection for ${chart.key}:`, {
        isLineChart,
        hasValidData,
        chartType: chart.chart.type,
        title: chart.chart.title,
        dataStructure: chart.chart.data ? 'exists' : 'missing',
        hasLabels: chart.chart.data?.labels ? chart.chart.data.labels.length : 0,
        hasDatasets: chart.chart.data?.datasets ? chart.chart.data.datasets.length : 0,
        datasetDetails: chart.chart.data?.datasets?.map((ds: any, idx: number) => ({
          index: idx,
          hasData: !!ds.data,
          dataLength: ds.data?.length || 0,
          label: ds.label
        }))
      });
    }
    
    return isLineChart && hasValidData;
  });

  if (availableCharts.length === 0) {
    return (
      <div className="space-y-8 mb-12">
        <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-card border border-border/50 shadow-lg">
          <div className="p-8">
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500/20 to-indigo-500/40 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">Processing AI insights...</p>
                  <p className="text-sm text-muted-foreground">Generating visualizations</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Simple, clean grid layout
  const getGridLayout = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1 lg:grid-cols-2";
  };

  const gridLayout = getGridLayout(availableCharts.length);

  return (
    <div className="space-y-8 mb-12">
      <div className={`grid ${gridLayout} gap-8`}>
        {availableCharts.map(({ key, chart }) => {
          try {
            const normalizedChart = normalizeChartData(chart);
            console.log(`🔧 Rendering chart ${key}:`, normalizedChart);
            
            return (
              <Card key={key} className="group relative overflow-hidden bg-gradient-to-br from-card/50 to-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-8 space-y-6">
                  {/* Enhanced Title Section */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
                      {normalizedChart.title}
                    </h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  </div>
                  
                  {/* Chart Container with Professional Styling */}
                  <div className="relative">
                    <div className="bg-gradient-to-br from-background/80 to-muted/30 rounded-xl p-6 border border-border/30 shadow-inner">
                      <div className="h-80 w-full">
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
                    </div>
                  </div>
                  
                  {/* AI Insights with Better Styling */}
                  {normalizedChart.insights && (
                    <div className="relative">
                      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-5">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-bold">AI</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              💡 AI Insight
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                              {normalizedChart.insights}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Metadata Display */}
                  {normalizedChart.metadata && (
                    <div className="relative">
                      <div className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200/50 dark:border-slate-700/30 rounded-xl p-5">
                        <details className="group/details">
                          <summary className="cursor-pointer select-none">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-r from-slate-500 to-gray-500 rounded-md flex items-center justify-center">
                                  <span className="text-white text-xs">📊</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  Chart Metadata
                                </span>
                              </div>
                              <span className="text-slate-400 group-open/details:rotate-180 transition-transform duration-200">
                                ▼
                              </span>
                            </div>
                          </summary>
                          
                          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              {normalizedChart.metadata.topic && (
                                <div className="space-y-1">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Topic:</span>
                                  <p className="text-slate-800 dark:text-slate-200">{normalizedChart.metadata.topic}</p>
                                </div>
                              )}
                              {normalizedChart.metadata.analysis_period && (
                                <div className="space-y-1">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Period:</span>
                                  <p className="text-slate-800 dark:text-slate-200 text-xs">
                                    {normalizedChart.metadata.analysis_period.start_datetime || normalizedChart.metadata.analysis_period.start_date} - {normalizedChart.metadata.analysis_period.end_datetime || normalizedChart.metadata.analysis_period.end_date}
                                  </p>
                                </div>
                              )}
                              {normalizedChart.metadata.total_entries_analyzed && (
                                <div className="space-y-1">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Entries Analyzed:</span>
                                  <p className="text-slate-800 dark:text-slate-200 font-mono">{normalizedChart.metadata.total_entries_analyzed}</p>
                                </div>
                              )}
                              {normalizedChart.metadata.total_mentions_analyzed && (
                                <div className="space-y-1">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Mentions Analyzed:</span>
                                  <p className="text-slate-800 dark:text-slate-200 font-mono">{normalizedChart.metadata.total_mentions_analyzed}</p>
                                </div>
                              )}
                              {normalizedChart.metadata.score_scale && (
                                <div className="space-y-1 sm:col-span-2">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Score Scale:</span>
                                  <p className="text-slate-800 dark:text-slate-200">{normalizedChart.metadata.score_scale}</p>
                                </div>
                              )}
                              {normalizedChart.metadata.source_count && (
                                <div className="space-y-1 sm:col-span-2">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Sources:</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium">
                                      Call-ins: {normalizedChart.metadata.source_count.call_ins}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium">
                                      WhatsApp: {normalizedChart.metadata.source_count.whatsapp_feedback}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium">
                                      Presenter: {normalizedChart.metadata.source_count.presenter_segments}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {normalizedChart.metadata.scoring_criteria && (
                                <div className="space-y-1 sm:col-span-2">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Criteria:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {normalizedChart.metadata.scoring_criteria.map((criteria: string, idx: number) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs">
                                        {criteria}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {normalizedChart.metadata.metrics_included && (
                                <div className="space-y-1 sm:col-span-2">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Metrics:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {normalizedChart.metadata.metrics_included.map((metric: string, idx: number) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs">
                                        {metric}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {normalizedChart.metadata.smoothing_method && (
                                <div className="space-y-1">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">Smoothing:</span>
                                  <p className="text-slate-800 dark:text-slate-200">{normalizedChart.metadata.smoothing_method}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          } catch (error) {
            console.error(`🔧 Error rendering chart ${key}:`, error, 'Chart data:', chart);
            return (
              <Card key={key} className="p-8 bg-card border border-destructive/20 shadow-lg">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">{chart?.title || 'Chart Error'}</h3>
                    <div className="h-1 w-16 bg-destructive rounded-full" />
                  </div>
                  <div className="h-80 flex items-center justify-center text-muted-foreground bg-destructive/5 rounded-xl border border-destructive/20">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-destructive">Error rendering chart</p>
                        <p className="text-sm text-muted-foreground mt-1">Check console for details</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
};

export default ChartsSection;
