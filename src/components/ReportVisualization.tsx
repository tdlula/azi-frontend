import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ChartRenderer from "@/components/charts/ChartRenderer";
import { BarChart3, TrendingUp, PieChart, LineChart, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectMultipleTableFormats } from "@/utils/tableDetection";
import DataTable from "@/components/ui/DataTable";

// Report-specific text formatter for white backgrounds
const formatReportText = (text: string): string => {
  if (!text) return '';
  
  let formattedText = text;
  
  // Handle URLs first (before other formatting)
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
  );
  
  // Handle email addresses
  formattedText = formattedText.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
  );

  // Handle markdown headers BEFORE converting newlines
  formattedText = formattedText.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold text-gray-800 mt-3 mb-2">$1</h6>');
  formattedText = formattedText.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold text-gray-800 mt-3 mb-2">$1</h5>');
  formattedText = formattedText.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h4>');
  formattedText = formattedText.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-3">$1</h3>');
  formattedText = formattedText.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  formattedText = formattedText.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

  // Handle line breaks AFTER header processing
  formattedText = formattedText.replace(/\n/g, '<br>');

  // Handle markdown - Bold text **text**
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-600">$1</strong>');
  
  // Handle markdown - Italic text *text*
  formattedText = formattedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-600">$1</em>');
  
  // Handle markdown - Code `code`
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-orange-600 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Handle strikethrough ~~text~~
  formattedText = formattedText.replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>');
  
  // Handle percentages
  formattedText = formattedText.replace(/(\d+(?:\.\d+)?%)/g, '<span class="font-semibold text-green-600">$1</span>');
  
  // Handle currency (R##.##)
  formattedText = formattedText.replace(/\bR(\d+(?:\.\d{2})?)\b/g, '<span class="font-semibold text-green-600">R$1</span>');
  
  return formattedText;
};

interface ChartData {
  type: string;
  title: string;
  data: any[];
  metadata?: any;
}

interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  summary?: string;
}

interface VisualizationData {
  charts?: ChartData[];
  tables?: TableData[];
  summary?: string;
  insights?: string[];
}

interface ReportVisualizationProps {
  content: string;
  title?: string;
}

// Main render function for report content using report-specific formatting for white backgrounds
const renderReportContent = (content: string): JSX.Element => {
  if (!content) {
    return <div className="text-gray-500 italic">No content to display</div>;
  }

  // Check for table data first using the chat system's table detection
  const tableData = detectMultipleTableFormats(content);
  if (tableData) {
    // Find table boundaries in the content
    const lines = content.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|') && line.split('|').length >= 3) {
        if (tableStartIndex === -1) {
          tableStartIndex = i;
        }
        tableEndIndex = i;
      }
    }
    const beforeTable = tableStartIndex > 0 ? lines.slice(0, tableStartIndex).join('\n').trim() : '';
    const afterTable = tableEndIndex < lines.length - 1 ? lines.slice(tableEndIndex + 1).join('\n').trim() : '';
    
    return (
      <div>
        {beforeTable && (
          <div className="prose prose-sm max-w-none mb-4 text-gray-800">
            <div 
              dangerouslySetInnerHTML={{ __html: formatReportText(beforeTable) }}
              className="leading-relaxed text-gray-800"
            />
          </div>
        )}
        <div className="my-4">
          <DataTable data={tableData} title={tableData.title} />
        </div>
        {afterTable && (
          <div className="prose prose-sm max-w-none mt-4 text-gray-800">
            <div 
              dangerouslySetInnerHTML={{ __html: formatReportText(afterTable) }}
              className="leading-relaxed text-gray-800"
            />
          </div>
        )}
      </div>
    );
  }

  // No table detected, render with enhanced formatting using report-specific formatter
  const formattedContent = formatReportText(content);
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <div 
        dangerouslySetInnerHTML={{ __html: formattedContent }}
        className="leading-relaxed text-gray-800"
      />
    </div>
  );
};

// Function to detect and extract data patterns from text
const detectDataPatterns = (text: string): VisualizationData => {
  const result: VisualizationData = {
    charts: [],
    tables: [],
    insights: []
  };

  // Enhanced percentage pattern detection (Station A: 65%, Station B: 25%, etc.)
  const percentagePattern = /([A-Za-z\s]+):\s*(\d+(?:\.\d+)?%)/g;
  const percentageMatches = Array.from(text.matchAll(percentagePattern));
  
  if (percentageMatches.length > 1) {
    const percentageData = percentageMatches.slice(0, 8).map(match => ({
      name: match[1].trim(),
      value: parseFloat(match[2].replace('%', ''))
    }));

    result.charts?.push({
      type: 'bar',
      title: 'Performance Comparison (%)',
      data: percentageData
    });
  }

  // Score pattern detection (Performance Score: 8.5/10, Quality Rating: 92%)
  const scorePattern = /([A-Za-z\s]+):\s*(\d+(?:\.\d+)?)(?:\/10|\/100)?/g;
  const scoreMatches = Array.from(text.matchAll(scorePattern));
  
  if (scoreMatches.length > 1) {
    const scoreData = scoreMatches.slice(0, 6).map(match => ({
      name: match[1].trim(),
      value: parseFloat(match[2])
    }));

    result.charts?.push({
      type: 'line',
      title: 'Score Metrics',
      data: scoreData
    });
  }

  // Time-based pattern detection (Morning: 45%, Afternoon: 67%, Evening: 82%)
  const timePattern = /(Morning|Afternoon|Evening|6AM|7AM|8AM|9AM|10AM|11AM|12PM|1PM|2PM|3PM|4PM|5PM|6PM):\s*(\d+(?:\.\d+)?%?)/gi;
  const timeMatches = Array.from(text.matchAll(timePattern));
  
  if (timeMatches.length > 2) {
    const timeData = timeMatches.map(match => ({
      name: match[1],
      value: parseFloat(match[2].replace('%', ''))
    }));

    result.charts?.push({
      type: 'line',
      title: 'Time-based Trends',
      data: timeData
    });
  }

  // Station comparison pattern (KAYA FM: 85%, Metro FM: 72%, etc.)
  const stationPattern = /([A-Z]{2,}[\s\w]*(?:FM|AM|Radio|Station)):\s*(\d+(?:\.\d+)?[%]?)/gi;
  const stationMatches = Array.from(text.matchAll(stationPattern));
  
  if (stationMatches.length > 1) {
    const stationData = stationMatches.map(match => ({
      name: match[1].trim(),
      value: parseFloat(match[2].replace('%', ''))
    }));

    result.charts?.push({
      type: 'pie',
      title: 'Station Distribution',
      data: stationData
    });
  }

  // Enhanced table detection for markdown tables
  const tableRegex = /\|([^|]+\|)+/g;
  const tableMatches = text.match(tableRegex);
  
  if (tableMatches && tableMatches.length > 1) {
    const lines = tableMatches.filter(line => !line.includes('---')); // Remove separator lines
    
    if (lines.length > 1) {
      const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
      const rows = lines.slice(1).map(line => 
        line.split('|').map(cell => cell.trim()).filter(cell => cell)
      ).filter(row => row.length > 0);

      if (headers.length > 0 && rows.length > 0) {
        result.tables?.push({
          title: 'Data Summary Table',
          headers,
          rows
        });
      }
    }
  }

  // Category breakdown pattern (Category A: 65%, Category B: 25%, Category C: 10%)
  const categoryPattern = /(Category|Type|Level)\s*([A-Z]):\s*(\d+(?:\.\d+)?%)/gi;
  const categoryMatches = Array.from(text.matchAll(categoryPattern));
  
  if (categoryMatches.length > 2) {
    const categoryData = categoryMatches.map(match => ({
      name: `${match[1]} ${match[2]}`,
      value: parseFloat(match[3].replace('%', ''))
    }));

    result.charts?.push({
      type: 'pie',
      title: 'Category Breakdown',
      data: categoryData
    });
  }

  // Key insights extraction
  const insightPatterns = [
    /key findings?[^.]*\.([^.]*\.){0,2}/gi,
    /important[^.]*\.([^.]*\.){0,1}/gi,
    /recommendations?[^.]*\.([^.]*\.){0,2}/gi,
    /conclusion[^.]*\.([^.]*\.){0,1}/gi
  ];

  insightPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      result.insights?.push(...matches.slice(0, 3));
    }
  });

  return result;
};

// Enhanced chart data processing
const processChartData = (data: any[]): any => {
  if (!data || data.length === 0) return { chartData: null, seriesData: [] };

  // Ensure data has proper structure for ChartRenderer
  const processedData = data.map(item => ({
    name: item.name || item.label || 'Unknown',
    value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0,
    y: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0
  }));

  // Create chart data compatible with ChartRenderer
  const chartData = {
    categories: processedData.map(item => item.name),
    series: [{
      name: 'Value',
      data: processedData.map(item => item.value)
    }]
  };

  return { chartData, seriesData: processedData };
};

export default function ReportVisualization({ content, title }: ReportVisualizationProps) {
  if (!content) {
    return (
      <div className="p-4 text-center text-gray-500">
        No content to display
      </div>
    );
  }

  // Use the same table detection as chat system
  const tableData = detectMultipleTableFormats(content);
  const visualizationData = detectDataPatterns(content);
  
  // Debug logging (remove in production)
  console.log('ReportVisualization - Content length:', content.length);
  console.log('ReportVisualization - Detected charts:', visualizationData.charts?.length || 0);
  console.log('ReportVisualization - Detected tables:', visualizationData.tables?.length || 0);
  console.log('ReportVisualization - Chat-style table:', tableData ? 'Yes' : 'No');

  // If we have table data, handle it like the chat system does
  if (tableData) {
    // Find table boundaries in the content
    const lines = content.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|') && line.split('|').length >= 3) {
        if (tableStartIndex === -1) {
          tableStartIndex = i;
        }
        tableEndIndex = i;
      }
    }
    
    const beforeTable = tableStartIndex > 0 ? lines.slice(0, tableStartIndex).join('\n').trim() : '';
    const afterTable = tableEndIndex < lines.length - 1 ? lines.slice(tableEndIndex + 1).join('\n').trim() : '';
    
    return (
      <div className="space-y-6">
        {/* Content before table */}
        {beforeTable && (
          <div className="prose prose-sm max-w-none">
            {renderReportContent(beforeTable)}
          </div>
        )}
        
        {/* Table using chat system's DataTable component */}
        <div className="my-6">
          <DataTable data={tableData} title={tableData.title || "Data Summary"} />
        </div>
        
        {/* Content after table */}
        {afterTable && (
          <div className="prose prose-sm max-w-none">
            {renderReportContent(afterTable)}
          </div>
        )}
        
        {/* Additional Charts if detected */}
        {visualizationData.charts && visualizationData.charts.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Additional Visualizations ({visualizationData.charts.length} charts)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visualizationData.charts.map((chart, index) => {
                const { chartData } = processChartData(chart.data);
                
                if (!chartData) return null;

                return (
                  <Card key={index} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {chart.type === 'pie' && <PieChart className="w-4 h-4 text-purple-500" />}
                        {chart.type === 'line' && <LineChart className="w-4 h-4 text-green-500" />}
                        {chart.type === 'bar' && <BarChart3 className="w-4 h-4 text-blue-500" />}
                        {chart.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ChartRenderer
                          chartData={{
                            ...chartData,
                            title: chart.title,
                            chartType: chart.type
                          }}
                          onChartClick={(dataPoint, chartType, title) => {
                            console.log('Chart clicked:', { dataPoint, chartType, title });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // No table detected - render with enhanced markdown formatting (like chat system)
  return (
    <div className="space-y-6">
      {/* Formatted Content */}
      <div className="prose prose-sm max-w-none">
        {renderReportContent(content)}
      </div>

      {/* Visualizations Section - Only show if we have charts or tables */}
      {(visualizationData.charts?.length || visualizationData.tables?.length) ? (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Data Visualizations ({visualizationData.charts?.length || 0} charts, {visualizationData.tables?.length || 0} tables)
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                <Download className="w-3 h-3 mr-1" />
                Export Charts
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Charts */}
          {visualizationData.charts && visualizationData.charts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {visualizationData.charts.map((chart, index) => {
                const { chartData } = processChartData(chart.data);
                
                if (!chartData) return null;

                return (
                  <Card key={index} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {chart.type === 'pie' && <PieChart className="w-4 h-4 text-purple-500" />}
                        {chart.type === 'line' && <LineChart className="w-4 h-4 text-green-500" />}
                        {chart.type === 'bar' && <BarChart3 className="w-4 h-4 text-blue-500" />}
                        {chart.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {chart.data.length} data points
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chart.type.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ChartRenderer
                          chartData={{
                            ...chartData,
                            title: chart.title,
                            chartType: chart.type
                          }}
                          onChartClick={(dataPoint, chartType, title) => {
                            console.log('Chart clicked:', { dataPoint, chartType, title });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Tables */}
          {visualizationData.tables && visualizationData.tables.length > 0 && (
            <div className="space-y-4">
              {visualizationData.tables.map((tableData, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      {tableData.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {tableData.rows.length} rows
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tableData.headers.length} columns
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {tableData.headers.map((header, headerIndex) => (
                              <TableHead key={headerIndex} className="font-semibold">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="text-sm">
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {tableData.summary && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <strong>Summary:</strong> {tableData.summary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Key Insights */}
          {visualizationData.insights && visualizationData.insights.length > 0 && (
            <Card className="border border-gray-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                  <TrendingUp className="w-4 h-4" />
                  Key Data Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {visualizationData.insights.slice(0, 5).map((insight, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {insight.replace(/key findings?:?/gi, '').trim()}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
