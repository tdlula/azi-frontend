import React, { forwardRef, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { TrendingUp, Target, Activity, BarChart3, Radio, Award, Clock, Zap, Calendar, Users, FileText } from "lucide-react";
import { format } from 'date-fns';

interface ReportData {
  metrics: {
    overallPositiveSentiment?: { value: number; label: string };
    totalMentions?: { value: number; label: string };
    highEngagementMoments?: { value: number; label: string };
    whatsappNumberMentions?: { value: number; label: string };
  };
  charts: Record<string, any>;
  wordCloudData?: {
    wordData: Array<{ text: string; value: number; category?: string; sentiment?: string }>;
    metadata?: {
      analysisScope?: string;
      dataSource?: string;
      lastUpdated?: string;
      totalWords?: number;
    };
  };
  dateRange: { from: Date; to: Date; label: string };
  selectedTopic: string;
  topicLabel: string;
}

interface ReportGeneratorProps {
  data: ReportData;
  normalizeChartData: (chart: any) => any;
}

const ReportGenerator = forwardRef<HTMLDivElement, ReportGeneratorProps>(
  ({ data, normalizeChartData }, ref) => {
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    const reportPeriod = `${format(data.dateRange.from, 'MMM dd, yyyy')} - ${format(data.dateRange.to, 'MMM dd, yyyy')}`;

    // Get color by frequency for word cloud
    const getColorByFrequency = (value: number, max: number, min: number) => {
      const normalizedValue = (value - min) / (max - min);
      
      if (normalizedValue > 0.8) {
        return '#1f2937'; // Dark gray for highest frequency
      } else if (normalizedValue > 0.6) {
        return '#374151'; // Medium-dark gray
      } else if (normalizedValue > 0.4) {
        return '#4b5563'; // Medium gray
      } else if (normalizedValue > 0.2) {
        return '#6b7280'; // Light-medium gray
      } else {
        return '#9ca3af'; // Light gray for low frequency
      }
    };

    return (
      <div ref={ref} className="bg-white text-black min-h-screen">
        {/* Report Header */}
        <div className="border-b-2 border-gray-200 pb-8 mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Radio Analytics Report
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {data.topicLabel} Analysis
            </h2>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Report Period: {reportPeriod}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Generated: {currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Executive Summary
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <p className="text-gray-700 leading-relaxed">
              This comprehensive analytics report provides insights into radio broadcast performance for the 
              <strong> {data.topicLabel}</strong> topic during the period of <strong>{reportPeriod}</strong>. 
              The analysis covers sentiment trends, engagement metrics, audience interaction patterns, and key 
              performance indicators derived from AI-powered transcript analysis. The data presented below 
              offers actionable insights for strategic decision-making and content optimization.
            </p>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center border-2 shadow-sm bg-white">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {data.metrics?.overallPositiveSentiment?.label || "Overall Positive Sentiment"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.metrics?.overallPositiveSentiment?.value || 0}%
                  </p>
                  <Badge variant="secondary" className="mt-2">Positive Trend</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 text-center border-2 shadow-sm bg-white">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Radio className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {data.metrics?.totalMentions?.label || "Total On-Air Mentions"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.metrics?.totalMentions?.value || 0}
                  </p>
                  <Badge variant="secondary" className="mt-2">Total Count</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 text-center border-2 shadow-sm bg-white">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {data.metrics?.highEngagementMoments?.label || "High Engagement Moments"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.metrics?.highEngagementMoments?.value || 0}
                  </p>
                  <Badge variant="secondary" className="mt-2">Peak Activity</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 text-center border-2 shadow-sm bg-white">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {data.metrics?.whatsappNumberMentions?.label || "WhatsApp Number Mentions"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.metrics?.whatsappNumberMentions?.value || 0}
                  </p>
                  <Badge variant="secondary" className="mt-2">CTA Performance</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Data Visualizations
          </h2>
          
          {data.charts && Object.keys(data.charts).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(data.charts)
                .filter(([key, chart]) => {
                  const c = chart as any;
                  const normalizedChart = normalizeChartData(c);
                  return normalizedChart && normalizedChart.data && Array.isArray(normalizedChart.data) && normalizedChart.data.length > 0;
                })
                .map(([key, chart]) => {
                  const normalizedChart = normalizeChartData(chart);
                  return (
                    <Card key={key} className="p-6 border-2 shadow-sm bg-white">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{normalizedChart.title}</h3>
                      <div className="chart-container h-80">
                        <ChartRenderer
                          chartData={normalizedChart}
                          onChartClick={() => {}} // Disabled for report
                        />
                      </div>
                      {normalizedChart.insights && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">Analysis:</span> {normalizedChart.insights}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="p-8 text-center border-2 shadow-sm bg-white">
              <p className="text-gray-600">No chart data available for the selected period.</p>
            </Card>
          )}
        </div>

        {/* Word Cloud Section */}
        {data.wordCloudData?.wordData && data.wordCloudData.wordData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Popular Topics Analysis
            </h2>
            <Card className="p-6 border-2 shadow-sm bg-white">
              <div className="min-h-[300px] flex flex-col justify-center">
                <div className="flex flex-wrap justify-center items-center p-6 min-h-[250px] bg-gray-50 rounded-lg">
                  {data.wordCloudData.wordData.map((word, index) => {
                    const maxValue = Math.max(...data.wordCloudData!.wordData.map(w => w.value));
                    const minValue = Math.min(...data.wordCloudData!.wordData.map(w => w.value));
                    const normalizedValue = (word.value - minValue) / (maxValue - minValue);
                    const size = 14 + (normalizedValue * 24); // Font size range: 14px to 38px
                    const opacity = 0.7 + (normalizedValue * 0.3); // Opacity range: 0.7 to 1.0
                    
                    return (
                      <span
                        key={index}
                        className="inline-block m-2 p-2 rounded-md"
                        style={{ 
                          fontSize: `${size}px`, 
                          opacity: opacity,
                          color: getColorByFrequency(word.value, maxValue, minValue),
                          fontWeight: word.value > maxValue * 0.6 ? 'bold' : 'normal'
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Analysis:</span> {
                      data.wordCloudData.metadata?.analysisScope || 
                      "Most frequently mentioned topics from radio transcript database, with word size indicating mention frequency."
                    }
                  </p>
                  {data.wordCloudData.metadata && (
                    <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-4">
                      <span>Source: {data.wordCloudData.metadata.dataSource}</span>
                      <span>Updated: {data.wordCloudData.metadata.lastUpdated}</span>
                      <span>Total words: {data.wordCloudData.metadata.totalWords}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recommendations Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-600" />
            Recommendations & Insights
          </h2>
          <Card className="p-6 border-2 shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Positive sentiment at {data.metrics?.overallPositiveSentiment?.value || 0}% indicates strong audience reception</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Total mentions of {data.metrics?.totalMentions?.value || 0} show good topic visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>High engagement moments create opportunities for deeper audience connection</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Continue focusing on content that generates positive sentiment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Optimize WhatsApp call-to-action placement during peak engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Monitor trending topics for future content planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-600">
          <p>Radio Analytics Report • Generated by AI-Powered Analytics Platform</p>
          <p className="mt-1">© {new Date().getFullYear()} Azi Analytics Platform. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

ReportGenerator.displayName = 'ReportGenerator';

export default ReportGenerator;
