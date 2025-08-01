import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, TrendingUp, Clock, Tag, Lightbulb, Radio, X, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ExportDropdown from "@/components/ui/export-dropdown";

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title: string;
  subtitle?: string;
  type: 'chart' | 'metrics';
  onAnalyze: (data: any, type: string, title: string) => Promise<any>;
  fields?: Array<{
    label: string;
    value: string | number;
    key: string;
  }>;
}

export default function DrillDownModal({ 
  isOpen, 
  onClose, 
  data, 
  title,
  subtitle,
  type,
  onAnalyze,
  fields = []
}: DrillDownModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null);
      setHasAnalyzed(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Safety check: Don't render if we don't have valid data
  if (!isOpen || !data) {
    return null;
  }

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      console.log(`Starting ${type} analysis for:`, data, title);
      const result = await onAnalyze(data, type, title);
      console.log("Analysis result:", result);
      setAnalysis(result);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Failed to analyze:", error);
      setAnalysis({
        summary: "Analysis failed. Please try again.",
        breakdown: {
          components: [],
          timeSegments: [],
          relatedTopics: [],
          keyInsights: []
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setAnalysis(null);
    setHasAnalyzed(false);
    setIsLoading(false);
    onClose();
  };

  const handleExport = async (format: 'txt' | 'pdf' | 'json' | 'png') => {
    if (!analysis || !hasAnalyzed) {
      alert("Please analyze the data first before exporting");
      return;
    }

    setIsExporting(true);
    try {
      switch (format) {
        case 'txt':
          await exportAsText();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'json':
          await exportAsJSON();
          break;
        case 'png':
          await exportAsImage();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsText = async () => {
    const dataLabel = data?.label || data?.category || data?.metricTitle || 'Unknown';
    const dataValue = data?.value || data?.metricValue || 'N/A';
    
    const textContent = `${type === 'chart' ? 'Chart' : 'Metrics'} Analysis Report
========================

${type === 'chart' ? 'Chart' : 'Metric'}: ${title}
Type: ${type === 'chart' ? data?.chartType || 'N/A' : 'metrics'}
Data Point: ${dataLabel}
Value: ${dataValue}
Generated: ${new Date().toLocaleString()}

Analysis Summary:
${analysis.summary || 'No summary available'}

Key Insights:
${analysis.breakdown?.keyInsights?.map((insight: any, index: number) => 
  `${index + 1}. ${typeof insight === 'string' ? insight : insight.text || 'N/A'}`
).join('\n') || 'No insights available'}

${analysis.breakdown?.components?.length > 0 ? `Contributing Components:
${analysis.breakdown.components.map((comp: any, index: number) => 
  `${index + 1}. ${typeof comp === 'string' ? comp : comp.text || comp.name || 'N/A'}`
).join('\n')}

` : ''}Radio Transcript Extracts:
${analysis.radioExtracts?.map((extract: any, index: number) => 
  `${index + 1}. ${extract.quote || extract.text || 'N/A'}${extract.station ? ` - ${extract.station}` : ''}${extract.timestamp ? ` (${extract.timestamp})` : ''}`
).join('\n') || 'No extracts available'}`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'chart' ? 'Chart' : 'Metrics'}_Analysis_${dataLabel}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = async () => {
    const dataLabel = data?.label || data?.category || data?.metricTitle || 'Unknown';
    const dataValue = data?.value || data?.metricValue || 'N/A';
    
    const jsonData = {
      exportDate: new Date().toISOString(),
      analysisType: type,
      [type === 'chart' ? 'chartAnalysis' : 'metricsAnalysis']: {
        title,
        type,
        dataPoint: {
          label: dataLabel,
          value: dataValue
        },
        analysis,
        metadata: {
          exportFormat: 'json',
          source: 'Azi Analytics Platform',
          userAgent: navigator.userAgent
        }
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'chart' ? 'Chart' : 'Metrics'}_Analysis_${dataLabel}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const dataLabel = data?.label || data?.category || data?.metricTitle || 'Unknown';
    const dataValue = data?.value || data?.metricValue || 'N/A';
    
    const exportData = {
      chartTitle: title,
      chartType: type === 'chart' ? data?.chartType || 'chart' : 'metrics',
      dataPoint: {
        label: dataLabel,
        value: dataValue
      },
      analysis,
      timestamp: new Date().toISOString(),
      reportTitle: `${type === 'chart' ? 'Chart' : 'Metrics'} Analysis: ${dataLabel}`
    };

    const response = await fetch('/api/export-chart-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) throw new Error('Failed to generate PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'chart' ? 'Chart' : 'Metrics'}_Analysis_${dataLabel}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsImage = async () => {
    const modal = document.querySelector('.drill-down-modal');
    if (!modal) return;

    // Dynamic import to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(modal as HTMLElement, {
      backgroundColor: 'white',
      scale: 2,
      useCORS: true,
    });

    const dataLabel = data?.label || data?.category || data?.metricTitle || 'Unknown';
    const link = document.createElement('a');
    link.download = `${type === 'chart' ? 'Chart' : 'Metrics'}_Analysis_${dataLabel}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate display fields based on type and provided fields
  const getDisplayFields = () => {
    if (fields.length > 0) {
      return fields;
    }

    if (type === 'chart') {
      const chartType = data?.chartType || '';
      const chartTitle = data?.chartTitle || title || '';
      
      // Check if this is a Geo Sentiment or Topic Intensity chart
      if (chartType.toLowerCase().includes('geo') || 
          chartTitle.toLowerCase().includes('geo') ||
          chartTitle.toLowerCase().includes('location') ||
          chartTitle.toLowerCase().includes('sentiment') ||
          chartTitle.toLowerCase().includes('topic intensity')) {
        
        // Format sentiment overview
        const sentimentValue = data?.sentiment || data?.value || 0;
        let sentimentOverview = null;
        if (typeof sentimentValue === 'string') {
          sentimentOverview = sentimentValue;
        } else if (typeof sentimentValue === 'number') {
          if (sentimentValue > 60) sentimentOverview = 'Positive';
          else if (sentimentValue < 40) sentimentOverview = 'Negative';
          else sentimentOverview = 'Neutral';
        }
        
        return [
          { label: 'Region/Label', value: data?.label || data?.category || data?.region, key: 'region' },
          { label: 'Topic Intensity Score', value: data?.value || data?.intensity, key: 'intensity' },
          { label: 'Sentiment Overview', value: sentimentOverview, key: 'sentiment' },
          { label: 'Time Frame', value: data?.timeFrame, key: 'timeFrame' },
          { label: 'Data Source', value: data?.dataSource, key: 'dataSource' }
        ];
      }
      
      // Default chart fields for other chart types
      return [
        { label: 'Chart Type', value: data?.chartType || 'N/A', key: 'chartType' },
        { label: 'Value', value: data?.value || 'N/A', key: 'value' },
        { label: 'Label', value: data?.label || data?.category || 'Unknown', key: 'label' }
      ];
    } else {
      return [
        { label: 'Metric Type', value: 'Analytics Metric', key: 'metricType' },
        { label: 'Value', value: data?.metricValue || 'N/A', key: 'metricValue' },
        { label: 'Title', value: data?.metricTitle || 'Unknown', key: 'metricTitle' }
      ];
    }
  };

  const displayFields = getDisplayFields();
  const Icon = type === 'chart' ? BarChart : Database;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetModal}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-background border rounded-lg shadow-lg drill-down-modal">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Icon className="w-5 h-5" />
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle || `Interactive ${type} drilling with detailed radio transcript analysis from OpenAI assistant`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Multi-format Export Dropdown */}
                {analysis && hasAnalyzed && (
                  <ExportDropdown
                    onExport={handleExport}
                    disabled={isExporting}
                    loading={isExporting}
                    className="gap-2"
                    variant="outline"
                    size="sm"
                    title={isExporting ? 'Exporting...' : 'Export'}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Data Point Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Point Details</CardTitle>
                  <CardDescription>Information about the selected {type} element</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {displayFields.map((field) => (
                      <div key={field.key}>
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        {field.key === 'chartType' || field.key === 'metricType' ? (
                          <Badge variant="outline">{field.value}</Badge>
                        ) : field.key === 'sentiment' ? (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                field.value.toString().toLowerCase() === 'positive' ? 'default' :
                                field.value.toString().toLowerCase() === 'negative' ? 'destructive' : 
                                'secondary'
                              }
                              className={
                                field.value.toString().toLowerCase() === 'positive' ? 'bg-green-500 text-white' :
                                field.value.toString().toLowerCase() === 'negative' ? 'bg-red-500 text-white' : 
                                'bg-gray-500 text-white'
                              }
                            >
                              {field.value}
                            </Badge>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  field.value.toString().toLowerCase() === 'positive' ? 'bg-green-500' :
                                  field.value.toString().toLowerCase() === 'negative' ? 'bg-red-500' : 
                                  'bg-gray-500'
                                }`}
                                style={{
                                  width: field.value.toString().toLowerCase() === 'positive' ? '75%' :
                                         field.value.toString().toLowerCase() === 'negative' ? '25%' : 
                                         '50%'
                                }}
                              />
                            </div>
                          </div>
                        ) : field.key === 'intensity' ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-lg">{field.value}</p>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, Number(field.value) || 0))}%`
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Intensity Level</p>
                          </div>
                        ) : (
                          <p className="font-semibold">{field.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Section */}
              {!hasAnalyzed && !isLoading && (
                <div className="text-center py-8">
                  <Button onClick={handleAnalyze} size="lg" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analyze Data Point
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to get detailed insights about this data point from AI
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Analyzing data point...</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI is processing radio transcript data to provide insights
                  </p>
                </div>
              )}

              {analysis && hasAnalyzed && (
                <div className="space-y-6">
                  {data?.metricType === "overall_positive_sentiment" ? (
                    // Shoprite Sentiment Analysis Report Format
                    <div className="space-y-6">
                      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-green-800">
                            🛒 Shoprite Radio Sentiment Analysis Report
                          </CardTitle>
                          <CardDescription className="text-base">
                            <div>Period Covered: {analysis.periodCovered || 'Date range not specified'}</div>
                            <div>Sentiment Score: 🟢 {data?.metricValue || analysis.sentimentScore || 'N/A'}% Positive</div>
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>📋 Raw Analysis Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border overflow-x-auto">
                            {typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Default analysis format for other metrics
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Radio Content Analysis Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border overflow-x-auto">
                            {typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                    <div className="space-y-6">
                      {/* Header */}
                      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-green-800">
                            🛒 Shoprite Radio Sentiment Analysis Report
                          </CardTitle>
                          <CardDescription className="text-base">
                            <div>Period Covered: {analysis.periodCovered || 'Date range not specified'}</div>
                            <div>Sentiment Score: 🟢 {data?.metricValue || analysis.sentimentScore || 'N/A'}% Positive</div>
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {/* Executive Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            🔍 Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div><span className="font-semibold">Overall Sentiment:</span> {analysis.overallSentiment || `${data?.metricValue || 'N/A'}% of Shoprite mentions across major South African radio stations were positive.`}</div>
                          <div><span className="font-semibold">Trend Direction:</span> {analysis.trendDirection || 'Sentiment trend data not available'}</div>
                          <div><span className="font-semibold">Benchmark:</span> {analysis.benchmark || 'No industry average or historical benchmark data available for direct comparison.'}</div>
                          <div><span className="font-semibold">Primary Drivers:</span> {analysis.primaryDrivers || 'Value-driven messaging, customer-centric tone, and promotional campaigns.'}</div>
                        </CardContent>
                      </Card>

                      {/* Data Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📊 Data Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">🗣️ Source Distribution</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border border-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Metric</th>
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Detail</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border border-gray-200 px-3 py-2">Stations Covered</td>
                                    <td className="border border-gray-200 px-3 py-2">{analysis.stationsCovered || 'Metro FM, Gagasi FM, Y FM, Radio 94.7'}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-200 px-3 py-2">Timeframe</td>
                                    <td className="border border-gray-200 px-3 py-2">{analysis.timeframe || 'Analysis period not specified'}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-200 px-3 py-2">Key Dates</td>
                                    <td className="border border-gray-200 px-3 py-2">{analysis.keyDates || 'Key dates not available'}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-200 px-3 py-2">Mention Volume</td>
                                    <td className="border border-gray-200 px-3 py-2">{analysis.mentionVolume || 'High (Exact count not specified)'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">💬 Top Sentiment Drivers</h4>
                            <div className="space-y-2">
                              {analysis.sentimentDrivers ? (
                                typeof analysis.sentimentDrivers === 'string' ? (
                                  <div className="whitespace-pre-line">{analysis.sentimentDrivers}</div>
                                ) : Array.isArray(analysis.sentimentDrivers) ? (
                                  analysis.sentimentDrivers.map((driver: any, idx: number) => (
                                    <div key={idx} className="ml-2">
                                      🎯 <span className="font-medium">{typeof driver === 'string' ? driver : driver.title || driver.name}</span>
                                      {typeof driver === 'object' && driver.description && (
                                        <div className="ml-4 text-sm text-gray-600">{driver.description}</div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div>{analysis.sentimentDrivers}</div>
                                )
                              ) : (
                                <div className="space-y-1">
                                  <div>🎯 <span className="font-medium">Promotions & Giveaways:</span> e.g. R1,000 vouchers, WhatsApp contests.</div>
                                  <div>💸 <span className="font-medium">Value Messaging:</span> Deals emphasized as budget-friendly and practical.</div>
                                  <div>🧍 <span className="font-medium">Presenter Tone:</span> Enthusiastic, trust-building, supportive of financial wellbeing.</div>
                                </div>
                              )}
                            </div>

                            {analysis.sampleQuotes && (
                              <div className="mt-4">
                                <h5 className="font-medium mb-2">📻 Sample Quotes:</h5>
                                <div className="space-y-2 ml-4">
                                  {Array.isArray(analysis.sampleQuotes) ? (
                                    analysis.sampleQuotes.map((quote: any, idx: number) => (
                                      <div key={idx} className="italic text-sm">
                                        "{typeof quote === 'string' ? quote : quote.text || quote.quote}" 
                                        {typeof quote === 'object' && quote.station && (
                                          <span className="font-medium"> – {quote.station}</span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="italic text-sm">"{analysis.sampleQuotes}"</div>
                                  )}
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Brand-Specific Insights */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🛍️ Brand-Specific Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-green-700">🌟 Positive Brand Perception</h4>
                              
                              {analysis.productCategories && (
                                <div className="mb-3">
                                  <span className="font-medium">Product Categories Mentioned:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.productCategories) ? 
                                      analysis.productCategories.join(', ') : 
                                      analysis.productCategories
                                    }
                                  </div>
                                </div>
                              )}

                              {analysis.specificProducts && (
                                <div className="mb-3">
                                  <span className="font-medium">Specific Product Highlights:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.specificProducts) ? (
                                      <ul className="list-disc list-inside">
                                        {analysis.specificProducts.map((product: string, idx: number) => (
                                          <li key={idx}>{product}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      analysis.specificProducts
                                    )}
                                  </div>
                                </div>
                              )}

                              {analysis.promotionalMentions && (
                                <div className="mb-3">
                                  <span className="font-medium">Promotional Mentions:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.promotionalMentions) ? (
                                      <ul className="list-disc list-inside">
                                        {analysis.promotionalMentions.map((mention: any, idx: number) => (
                                          <li key={idx}>
                                            "{typeof mention === 'string' ? mention : mention.text || mention.description}" 
                                            {typeof mention === 'object' && mention.station && (
                                              <span className="font-medium"> ({mention.station})</span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      analysis.promotionalMentions
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">👪 Customer Experience</h4>
                              <div className="ml-4 text-sm">
                                {analysis.customerExperience || (
                                  <div className="space-y-1">
                                    <div>Family-friendly positioning</div>
                                    <div>Strong appeal to budget-conscious shoppers and parents</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Competitive Context */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🥇 Competitive Context</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div>{analysis.competitiveContext || 'No direct competitor sentiment data available.'}</div>
                          <div className="mt-2"><span className="font-medium">Market positioning:</span> {analysis.marketPositioning || 'Value-driven, community-focused, practical.'}</div>
                        </CardContent>
                      </Card>

                      {/* Contextual Influences */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📅 Contextual Influences</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-medium">Temporal Factors:</span> {analysis.temporalFactors || 'Mid-year sales likely linked to seasonal patterns and economic timing.'}</div>
                            <div><span className="font-medium">Co-Branding Efforts:</span> {analysis.coBrandingEfforts || 'Partnerships and youth engagement activations.'}</div>
                            <div><span className="font-medium">Regional Campaigns:</span> {analysis.regionalCampaigns || 'Targeted ads across multiple provinces.'}</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Actionable Recommendations */}
                      <Card>
                        <CardHeader>
                          <CardTitle>✅ Actionable Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-orange-600">🔧 Areas for Improvement</h4>
                              <div className="ml-4 text-sm">
                                {analysis.areasForImprovement || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Broaden product variety in mentions beyond staples</li>
                                    <li>Include competitor monitoring for comparative sentiment analysis</li>
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 text-green-600">📈 Growth Opportunities</h4>
                              <div className="ml-4 text-sm">
                                {analysis.growthOpportunities || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Expand WhatsApp & weekend interactive campaigns</li>
                                    <li>Feature real customer testimonials to build emotional connection</li>
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 text-blue-600">📻 Radio Content Strategy</h4>
                              <div className="ml-4 text-sm">
                                {analysis.radioContentStrategy || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Deepen partnerships with youth-focused stations</li>
                                    <li>Emphasize economic relief messaging</li>
                                    <li>Tailor messaging by province/region for local resonance</li>
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Methodology */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📂 Methodology</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-medium">Technique:</span> {analysis.technique || 'NLP-driven sentiment analysis of radio transcripts'}</div>
                            <div><span className="font-medium">Sentiment Markers:</span> {analysis.sentimentMarkers || 'Words like "love," "protects my pocket," "best deals," "win"'}</div>
                            <div><span className="font-medium">Confidence:</span> {analysis.confidence || 'High – consistent positive tone across multiple stations'}</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Data Sources */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📎 Data Sources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {analysis.dataSources ? (
                              Array.isArray(analysis.dataSources) ? (
                                analysis.dataSources.map((source: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium">{typeof source === 'string' ? source : source.station || source.name}:</span> {typeof source === 'object' && source.date ? source.date : ''}
                                  </div>
                                ))
                              ) : (
                                <div>{analysis.dataSources}</div>
                              )
                            ) : (
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Metro FM:</span> Analysis period</div>
                                <div><span className="font-medium">Gagasi FM:</span> Analysis period</div>
                                <div><span className="font-medium">Y FM:</span> Analysis period</div>
                                <div><span className="font-medium">Radio 94.7:</span> Analysis period</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Transcript Excerpts */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🎙️ Select Positive Transcript Excerpts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysis.transcriptExcerpts ? (
                              Array.isArray(analysis.transcriptExcerpts) ? (
                                analysis.transcriptExcerpts.map((excerpt: any, idx: number) => (
                                  <div key={idx} className="border-l-4 border-green-400 pl-4">
                                    <div className="font-semibold text-sm text-green-700">
                                      {typeof excerpt === 'object' ? (excerpt.station || 'Unknown Station') + (excerpt.date ? ` (${excerpt.date})` : '') : 'Radio Station'}:
                                    </div>
                                    <div className="italic text-sm mt-1">
                                      "{typeof excerpt === 'string' ? excerpt : excerpt.text || excerpt.quote || 'Quote not available'}"
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="border-l-4 border-green-400 pl-4">
                                  <div className="italic text-sm">"{analysis.transcriptExcerpts}"</div>
                                </div>
                              )
                            ) : (
                              <div className="space-y-3">
                                <div className="border-l-4 border-green-400 pl-4">
                                  <div className="font-semibold text-sm text-green-700">Sample Radio Station:</div>
                                  <div className="italic text-sm mt-1">"Sample positive transcript excerpt not available"</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Default analysis format for other metrics */
                    <div className="space-y-6">
                      {/* Radio Content Analysis Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Radio Content Analysis: {analysis.topicName ? analysis.topicName : <span className="text-muted-foreground">No topic name available</span>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-semibold">Executive Summary:</span> {analysis.executiveSummary ? analysis.executiveSummary : (analysis.summary ? analysis.summary : <span className="text-muted-foreground">No summary available</span>)}</div>
                            <div><span className="font-semibold">Topic:</span> {analysis.topicName ? analysis.topicName : <span className="text-muted-foreground">No topic name available</span>}</div>
                            <div><span className="font-semibold">Frequency:</span> {typeof analysis.frequency !== 'undefined' && analysis.frequency !== null ? analysis.frequency + ' mentions' : <span className="text-muted-foreground">No frequency available</span>}</div>
                            <div><span className="font-semibold">Data Source:</span> {analysis.dataSource ? analysis.dataSource : <span className="text-muted-foreground">No data source available</span>}</div>
                            <div><span className="font-semibold">Key Finding:</span> {analysis.keyFinding ? analysis.keyFinding : <span className="text-muted-foreground">No key finding available</span>}</div>
                          </div>
                        </CardContent>
                      </Card>
                      </Card>

                      {/* Brand-Specific Insights */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🛍️ Brand-Specific Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-green-700">🌟 Positive Brand Perception</h4>
                              
                              {analysis.productCategories && (
                                <div className="mb-3">
                                  <span className="font-medium">Product Categories Mentioned:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.productCategories) ? 
                                      analysis.productCategories.join(', ') : 
                                      analysis.productCategories
                                    }
                                  </div>
                                </div>
                              )}

                              {analysis.specificProducts && (
                                <div className="mb-3">
                                  <span className="font-medium">Specific Product Highlights:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.specificProducts) ? (
                                      <ul className="list-disc list-inside">
                                        {analysis.specificProducts.map((product: string, idx: number) => (
                                          <li key={idx}>{product}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      analysis.specificProducts
                                    )}
                                  </div>
                                </div>
                              )}

                              {analysis.promotionalMentions && (
                                <div className="mb-3">
                                  <span className="font-medium">Promotional Mentions:</span>
                                  <div className="ml-4 text-sm mt-1">
                                    {Array.isArray(analysis.promotionalMentions) ? (
                                      <ul className="list-disc list-inside">
                                        {analysis.promotionalMentions.map((mention: any, idx: number) => (
                                          <li key={idx}>
                                            "{typeof mention === 'string' ? mention : mention.text || mention.description}" 
                                            {typeof mention === 'object' && mention.station && (
                                              <span className="font-medium"> ({mention.station})</span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      analysis.promotionalMentions
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">👪 Customer Experience</h4>
                              <div className="ml-4 text-sm">
                                {analysis.customerExperience || (
                                  <div className="space-y-1">
                                    <div>Family-friendly positioning</div>
                                    <div>Strong appeal to budget-conscious shoppers and parents</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Competitive Context */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🥇 Competitive Context</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div>{analysis.competitiveContext || 'No direct competitor sentiment data available.'}</div>
                          <div className="mt-2"><span className="font-medium">Market positioning:</span> {analysis.marketPositioning || 'Value-driven, community-focused, practical.'}</div>
                        </CardContent>
                      </Card>

                      {/* Contextual Influences */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📅 Contextual Influences</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-medium">Temporal Factors:</span> {analysis.temporalFactors || 'Mid-year sales likely linked to seasonal patterns and economic timing.'}</div>
                            <div><span className="font-medium">Co-Branding Efforts:</span> {analysis.coBrandingEfforts || 'Partnerships and youth engagement activations.'}</div>
                            <div><span className="font-medium">Regional Campaigns:</span> {analysis.regionalCampaigns || 'Targeted ads across multiple provinces.'}</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Actionable Recommendations */}
                      <Card>
                        <CardHeader>
                          <CardTitle>✅ Actionable Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-orange-600">🔧 Areas for Improvement</h4>
                              <div className="ml-4 text-sm">
                                {analysis.areasForImprovement || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Broaden product variety in mentions beyond staples</li>
                                    <li>Include competitor monitoring for comparative sentiment analysis</li>
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 text-green-600">📈 Growth Opportunities</h4>
                              <div className="ml-4 text-sm">
                                {analysis.growthOpportunities || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Expand WhatsApp & weekend interactive campaigns</li>
                                    <li>Feature real customer testimonials to build emotional connection</li>
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 text-blue-600">📻 Radio Content Strategy</h4>
                              <div className="ml-4 text-sm">
                                {analysis.radioContentStrategy || (
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Deepen partnerships with youth-focused stations</li>
                                    <li>Emphasize economic relief messaging</li>
                                    <li>Tailor messaging by province/region for local resonance</li>
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Methodology */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📂 Methodology</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-medium">Technique:</span> {analysis.technique || 'NLP-driven sentiment analysis of radio transcripts'}</div>
                            <div><span className="font-medium">Sentiment Markers:</span> {analysis.sentimentMarkers || 'Words like "love," "protects my pocket," "best deals," "win"'}</div>
                            <div><span className="font-medium">Confidence:</span> {analysis.confidence || 'High – consistent positive tone across multiple stations'}</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Data Sources */}
                      <Card>
                        <CardHeader>
                          <CardTitle>📎 Data Sources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {analysis.dataSources ? (
                              Array.isArray(analysis.dataSources) ? (
                                analysis.dataSources.map((source: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium">{typeof source === 'string' ? source : source.station || source.name}:</span> {typeof source === 'object' && source.date ? source.date : ''}
                                  </div>
                                ))
                              ) : (
                                <div>{analysis.dataSources}</div>
                              )
                            ) : (
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Metro FM:</span> Analysis period</div>
                                <div><span className="font-medium">Gagasi FM:</span> Analysis period</div>
                                <div><span className="font-medium">Y FM:</span> Analysis period</div>
                                <div><span className="font-medium">Radio 94.7:</span> Analysis period</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Transcript Excerpts */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🎙️ Select Positive Transcript Excerpts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysis.transcriptExcerpts ? (
                              Array.isArray(analysis.transcriptExcerpts) ? (
                                analysis.transcriptExcerpts.map((excerpt: any, idx: number) => (
                                  <div key={idx} className="border-l-4 border-green-400 pl-4">
                                    <div className="font-semibold text-sm text-green-700">
                                      {typeof excerpt === 'object' ? (excerpt.station || 'Unknown Station') + (excerpt.date ? ` (${excerpt.date})` : '') : 'Radio Station'}:
                                    </div>
                                    <div className="italic text-sm mt-1">
                                      "{typeof excerpt === 'string' ? excerpt : excerpt.text || excerpt.quote || 'Quote not available'}"
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="border-l-4 border-green-400 pl-4">
                                  <div className="italic text-sm">"{analysis.transcriptExcerpts}"</div>
                                </div>
                              )
                            ) : (
                              <div className="space-y-3">
                                <div className="border-l-4 border-green-400 pl-4">
                                  <div className="font-semibold text-sm text-green-700">Sample Radio Station:</div>
                                  <div className="italic text-sm mt-1">"Sample positive transcript excerpt not available"</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Default analysis format for other metrics */
                    <div className="space-y-6">
                      {/* Radio Content Analysis Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Radio Content Analysis: {analysis.topicName ? analysis.topicName : <span className="text-muted-foreground">No topic name available</span>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div><span className="font-semibold">Executive Summary:</span> {analysis.executiveSummary ? analysis.executiveSummary : (analysis.summary ? analysis.summary : <span className="text-muted-foreground">No summary available</span>)}</div>
                            <div><span className="font-semibold">Topic:</span> {analysis.topicName ? analysis.topicName : <span className="text-muted-foreground">No topic name available</span>}</div>
                            <div><span className="font-semibold">Frequency:</span> {typeof analysis.frequency !== 'undefined' && analysis.frequency !== null ? analysis.frequency + ' mentions' : <span className="text-muted-foreground">No frequency available</span>}</div>
                            <div><span className="font-semibold">Data Source:</span> {analysis.dataSource ? analysis.dataSource : <span className="text-muted-foreground">No data source available</span>}</div>
                            <div><span className="font-semibold">Key Finding:</span> {analysis.keyFinding ? analysis.keyFinding : <span className="text-muted-foreground">No key finding available</span>}</div>
                          </div>
                        </CardContent>
                      </Card>

                  {/* 1. Topic Definition & Context */}
                  <Card>
                    <CardHeader>
                      <CardTitle>1. Topic Definition & Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>{analysis.topicDefinition ? analysis.topicDefinition : <span className="text-muted-foreground">No topic definition available</span>}</div>
                    </CardContent>
                  </Card>

                  {/* 2. Key Contributing Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle>2. Key Contributing Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(analysis.contributingFactors) && analysis.contributingFactors.length > 0 ? (
                        <div className="space-y-4">
                          {analysis.contributingFactors.map((factor: any, idx: number) => (
                            <div key={idx}>
                              <div className="font-semibold">2.{idx + 1} {factor.name ? factor.name : <span className="text-muted-foreground">No factor name</span>}</div>
                              <div>{factor.description ? factor.description : <span className="text-muted-foreground">No description</span>}</div>
                              {Array.isArray(factor.examples) && factor.examples.length > 0 ? (
                                <div className="mt-1 ml-2">
                                  <span className="font-medium">Examples:</span>
                                  <ul className="list-disc ml-5">
                                    {factor.examples.map((ex: string, exIdx: number) => (
                                      <li key={exIdx} className="text-sm">"{ex}"</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground">No contributing factors available</span>}
                    </CardContent>
                  </Card>

                  {/* 3. Peak Discussion Periods */}
                  <Card>
                    <CardHeader>
                      <CardTitle>3. Peak Discussion Periods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 font-semibold">3.1 Prime Time Slots</div>
                      {Array.isArray(analysis.peakPeriods?.primeTimeSlots) && analysis.peakPeriods.primeTimeSlots.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs border">
                            <thead>
                              <tr className="bg-muted">
                                <th className="px-2 py-1 border">Station</th>
                                <th className="px-2 py-1 border">Time Slot</th>
                                <th className="px-2 py-1 border">Content Focus</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysis.peakPeriods.primeTimeSlots.map((slot: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="border px-2 py-1">{slot.station ? slot.station : <span className="text-muted-foreground">No station</span>}</td>
                                  <td className="border px-2 py-1">{slot.timeRange ? slot.timeRange : <span className="text-muted-foreground">No time range</span>}</td>
                                  <td className="border px-2 py-1">{slot.content ? slot.content : <span className="text-muted-foreground">No content</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <span className="text-muted-foreground">No prime time slots available</span>}
                      <div className="mt-4 font-semibold">3.2 Optimal Broadcasting Windows</div>
                      {Array.isArray(analysis.peakPeriods?.optimalWindows) && analysis.peakPeriods.optimalWindows.length > 0 ? (
                        <ul className="list-disc ml-5">
                          {analysis.peakPeriods.optimalWindows.map((win: any, idx: number) => (
                            <li key={idx}>
                              <span className="font-medium">{win.timePeriod ? win.timePeriod : <span className="text-muted-foreground">No time period</span>}:</span> {win.description ? win.description : <span className="text-muted-foreground">No description</span>}
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-muted-foreground">No optimal broadcasting windows available</span>}
                    </CardContent>
                  </Card>

                  {/* 4. Key Insights & Patterns */}
                  <Card>
                    <CardHeader>
                      <CardTitle>4. Key Insights & Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(analysis.keyInsightsAndPatterns) && analysis.keyInsightsAndPatterns.length > 0 ? (
                        <div className="space-y-4">
                          {analysis.keyInsightsAndPatterns.map((insight: any, idx: number) => (
                            <div key={idx}>
                              <div className="font-semibold">4.{idx + 1} {insight.category ? insight.category : <span className="text-muted-foreground">No category</span>}</div>
                              {insight.description ? <div>{insight.description}</div> : null}
                              {Array.isArray(insight.bullets) && insight.bullets.length > 0 ? (
                                <ul className="list-disc ml-5">
                                  {insight.bullets.map((b: string, bIdx: number) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground">No key insights or patterns available</span>}
                    </CardContent>
                  </Card>

                  {/* 5. Supporting Evidence: Station Quotes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>5. Supporting Evidence: Station Quotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(analysis.stationQuotes) && analysis.stationQuotes.length > 0 ? (
                        <div className="space-y-4">
                          {analysis.stationQuotes.map((station: any, idx: number) => (
                            <div key={idx}>
                              <div className="font-semibold">{station.stationName ? station.stationName : <span className="text-muted-foreground">No station name</span>}</div>
                              {Array.isArray(station.quotes) && station.quotes.length > 0 ? (
                                <div className="space-y-2 ml-2">
                                  {station.quotes.map((q: string, qIdx: number) => (
                                    <div key={qIdx} className="italic">"{q}"</div>
                                  ))}
                                </div>
                              ) : <span className="text-muted-foreground">No quotes available</span>}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground">No station quotes available</span>}
                    </CardContent>
                  </Card>

                  {/* 6. Business Impact */}
                  <Card>
                    <CardHeader>
                      <CardTitle>6. Business Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(analysis.businessImpact) && analysis.businessImpact.length > 0 ? (
                        <div className="space-y-4">
                          {analysis.businessImpact.map((impact: any, idx: number) => (
                            <div key={idx}>
                              <div className="font-semibold">6.{idx + 1} {impact.category ? impact.category : <span className="text-muted-foreground">No impact category</span>}</div>
                              {Array.isArray(impact.benefits) && impact.benefits.length > 0 ? (
                                <ul className="list-disc ml-5">
                                  {impact.benefits.map((b: string, bIdx: number) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              ) : <span className="text-muted-foreground">No benefits listed</span>}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground">No business impact available</span>}
                    </CardContent>
                  </Card>

                  {/* Data Sources */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div><span className="font-semibold">Stations Analyzed:</span> {Array.isArray(analysis.stationsAnalyzed) && analysis.stationsAnalyzed.length > 0 ? analysis.stationsAnalyzed.join(', ') : <span className="text-muted-foreground">No stations listed</span>}</div>
                      <div><span className="font-semibold">Analysis Period:</span> {analysis.analysisPeriod ? analysis.analysisPeriod : <span className="text-muted-foreground">No analysis period</span>}</div>
                      <div><span className="font-semibold">Methodology:</span> {analysis.methodology ? analysis.methodology : <span className="text-muted-foreground">No methodology</span>}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}