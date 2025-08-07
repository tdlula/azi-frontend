import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, TrendingUp, Clock, Tag, Lightbulb, Radio, X, Database, AlertCircle, FileText } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null);
      setHasAnalyzed(false);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Safety check: Don't render if we don't have valid data
  if (!isOpen || !data) {
    return null;
  }

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Starting ${type} analysis for:`, data, title);
      const result = await onAnalyze(data, type, title);
      console.log("Analysis result:", result);
      setAnalysis(result);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Failed to analyze:", error);
      setError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
      setAnalysis(null);
      setHasAnalyzed(false);
    }
    setIsLoading(false);
  };

  const exportAsTXT = async () => {
    const dataLabel = data?.label || data?.category || data?.metricTitle || 'Unknown';
    const dataValue = data?.value || data?.metricValue || 'N/A';
    
    const textContent = `${type === 'chart' ? 'Chart' : 'Metric'}: ${title}
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#2d3748] rounded-xl shadow-2xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden border border-gray-600" style={{ height: '90vh' }}>
        <div className="flex flex-col h-full" style={{ maxHeight: '100%' }}>
          {/* Header */}
          <div className="p-6 border-b border-gray-600 flex justify-between items-start bg-[#2d3748]">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {type === 'chart' ? <BarChart className="w-5 h-5 text-[#60a5fa]" /> : <TrendingUp className="w-5 h-5 text-[#60a5fa]" />}
                <h2 className="text-xl font-semibold text-[#e0e6ed]">{title}</h2>
              </div>
              {subtitle && (
                <p className="text-sm text-[#a0aec0] mb-2 font-medium">{subtitle}</p>
              )}
              
              {/* Data Fields Display */}
              <div className="flex flex-wrap gap-2">
                {fields.length > 0 ? (
                  fields.map((field, index) => (
                    <Badge key={index} className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium">
                      <span className="font-medium">{field.label}:</span>
                      <span>{field.value}</span>
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium">
                      <Database className="w-3 h-3" />
                      <span className="font-medium">Value:</span>
                      <span>{data?.value || data?.metricValue || 'N/A'}</span>
                    </Badge>
                    <Badge className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium">
                      <Tag className="w-3 h-3" />
                      <span className="font-medium">Category:</span>
                      <span>{data?.label || data?.category || data?.metricTitle || 'N/A'}</span>
                    </Badge>
                    {data?.chartType && (
                      <Badge className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium">
                        <BarChart className="w-3 h-3" />
                        <span className="font-medium">Type:</span>
                        <span>{data.chartType}</span>
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {hasAnalyzed && analysis && (
                <ExportDropdown
                  onExport={(format) => {
                    if (format === 'txt') exportAsTXT();
                    else if (format === 'json') exportAsJSON();
                  }}
                  disabled={isExporting}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#a0aec0] hover:text-[#e0e6ed] hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-scroll p-6 bg-[#1f2a38] drill-down-content" 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#6b7280 #374151',
              maxHeight: 'calc(90vh - 180px)', // Ensure container has max height
              minHeight: '400px' // Minimum height to ensure scrollbar appears
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                .drill-down-content {
                  overflow-y: scroll !important;
                  scrollbar-width: thin !important;
                  scrollbar-color: #6b7280 #374151 !important;
                }
                .drill-down-content::-webkit-scrollbar {
                  width: 14px !important;
                  display: block !important;
                  visibility: visible !important;
                }
                .drill-down-content::-webkit-scrollbar-track {
                  background: #374151 !important;
                  border-radius: 7px !important;
                  display: block !important;
                }
                .drill-down-content::-webkit-scrollbar-thumb {
                  background: #6b7280 !important;
                  border-radius: 7px !important;
                  border: 2px solid #374151 !important;
                  display: block !important;
                  min-height: 20px !important;
                }
                .drill-down-content::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af !important;
                }
                /* Ensure all child elements don't interfere with scrolling */
                .drill-down-content * {
                  box-sizing: border-box;
                }
                /* Force scrollbar to always be visible */
                .drill-down-content::-webkit-scrollbar-corner {
                  display: block !important;
                }
              `
            }} />
            <div className="space-y-6" style={{ minHeight: '800px' }}>{/* Increased minimum height to force scrollbar */}
              {/* Analysis Button */}
              {!hasAnalyzed && (
                <div className="text-center py-8 bg-[#2d3748] rounded-xl shadow-lg">
                  <Radio className="w-12 h-12 text-[#60a5fa] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-[#cbd5e0]">AI Radio Content Analysis</h3>
                  <p className="text-[#a0aec0] mb-4 max-w-md mx-auto">
                    Generate detailed insights about this {type} using our AI-powered analysis of radio broadcast data.
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    size="lg"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium px-6 py-3 rounded-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Radio Content...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Start Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold text-[#e0e6ed] mb-2">Analysis Failed</h3>
                  <p className="text-[#a0aec0] mb-4 max-w-md">
                    We encountered an issue while analyzing the content. Please try again or contact support if the problem persists.
                  </p>
                  <p className="text-sm text-red-400 font-mono bg-red-900/20 px-3 py-2 rounded border border-red-800">
                    {error}
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    size="sm"
                    className="mt-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Analysis Results */}
              {analysis && hasAnalyzed && (
                <div className="space-y-6">
                  {data?.metricType === "overall_positive_sentiment" ? (
                    // Shoprite Sentiment Analysis Report Format
                    <div className="space-y-6">
                      <Card className="bg-[#2d3748] border border-green-600 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-xl font-semibold text-[#e0e6ed]">
                            🛒 Shoprite Radio Sentiment Analysis Report
                          </CardTitle>
                          <CardDescription className="text-base text-[#a0aec0] font-medium">
                            <div>Period Covered: {analysis.periodCovered || 'Date range not specified'}</div>
                            <div>Sentiment Score: 🟢 {data?.metricValue || analysis.sentimentScore || 'N/A'}% Positive</div>
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-[#cbd5e0] font-semibold">📋 Raw Analysis Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-[#1f2a38] text-[#e0e6ed] p-4 rounded-lg border border-gray-600 overflow-auto custom-scrollbar max-h-[400px] font-mono">
                            {typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  ) : type === 'chart' && analysis?.summary ? (
                    // Professional Chart Analysis Format
                    <div className="space-y-6">
                      {(() => {
                        // Parse the JSON from the summary if it's in JSON format
                        let parsedSummary = null;
                        console.log('🔍 Analysis summary type:', typeof analysis.summary);
                        console.log('🔍 Analysis summary content:', analysis.summary);
                        
                        try {
                          // Try multiple parsing approaches
                          if (typeof analysis.summary === 'string') {
                            // Method 1: Check for JSON wrapped in markdown
                            if (analysis.summary.includes('```json') && analysis.summary.includes('```')) {
                              console.log('🔍 Found JSON in markdown format');
                              const jsonMatch = analysis.summary.match(/```json\n([\s\S]*?)\n```/);
                              if (jsonMatch) {
                                console.log('🔍 Extracted JSON:', jsonMatch[1]);
                                parsedSummary = JSON.parse(jsonMatch[1]);
                                console.log('✅ Successfully parsed JSON from markdown');
                              }
                            }
                            // Method 2: Try direct JSON parsing
                            else if (analysis.summary.trim().startsWith('{')) {
                              console.log('🔍 Attempting direct JSON parse');
                              parsedSummary = JSON.parse(analysis.summary);
                              console.log('✅ Successfully parsed direct JSON');
                            }
                          }
                          // Method 3: Check if summary is already an object
                          else if (typeof analysis.summary === 'object' && analysis.summary !== null) {
                            console.log('🔍 Summary is already an object');
                            parsedSummary = analysis.summary;
                          }
                        } catch (e) {
                          console.error('❌ JSON parsing failed:', e);
                          console.log('🔍 Raw summary for debugging:', analysis.summary);
                        }

                        console.log('🔍 Final parsed summary:', parsedSummary);
                        console.log('🔍 Has topicName:', !!parsedSummary?.topicName);
                        console.log('🔍 Has contributingFactors:', !!parsedSummary?.contributingFactors);

                        if (parsedSummary && (parsedSummary.topicName || parsedSummary.executiveSummary || parsedSummary.contributingFactors)) {
                          console.log('✅ Using professional format');
                          return (
                            <>
                              {/* Executive Summary */}
                              <Card className="bg-[#2d3748] border border-blue-600 shadow-lg">
                                <CardHeader>
                                  <CardTitle className="text-xl font-semibold text-[#e0e6ed] flex items-center gap-2">
                                    <Radio className="w-6 h-6 text-[#60a5fa]" />
                                    {parsedSummary.topicName || 'Chart Analysis Results'}
                                  </CardTitle>
                                  <CardDescription className="text-base text-[#a0aec0] font-medium">
                                    {parsedSummary.executiveSummary || 'Comprehensive analysis of radio broadcast data'}
                                  </CardDescription>
                                </CardHeader>
                              </Card>

                              {/* Key Findings */}
                              {parsedSummary.keyFinding && (
                                <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                      <Lightbulb className="w-5 h-5 text-[#fbbf24]" />
                                      Key Finding
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-[#e0e6ed] leading-relaxed">{parsedSummary.keyFinding}</p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Contributing Factors */}
                              {parsedSummary.contributingFactors && parsedSummary.contributingFactors.length > 0 && (
                                <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                      <TrendingUp className="w-5 h-5 text-[#10b981]" />
                                      Contributing Factors
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {parsedSummary.contributingFactors.map((factor: any, index: number) => (
                                      <div key={index} className="border-l-4 border-[#60a5fa] pl-4">
                                        <h4 className="font-semibold text-[#e0e6ed] mb-2">{factor.name}</h4>
                                        <p className="text-[#a0aec0] mb-3">{factor.description}</p>
                                        {factor.examples && factor.examples.length > 0 && (
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium text-[#cbd5e0]">Examples:</p>
                                            {factor.examples.map((example: string, exIndex: number) => (
                                              <blockquote key={exIndex} className="bg-[#1f2a38] text-[#e0e6ed] p-3 rounded border-l-2 border-[#60a5fa] text-sm italic">
                                                "{example}"
                                              </blockquote>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Station Quotes */}
                              {parsedSummary.stationQuotes && parsedSummary.stationQuotes.length > 0 && (
                                <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                      <Radio className="w-5 h-5 text-[#8b5cf6]" />
                                      Radio Station Quotes
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {parsedSummary.stationQuotes.map((station: any, index: number) => (
                                      <div key={index} className="space-y-3">
                                        <h4 className="font-semibold text-[#e0e6ed] flex items-center gap-2">
                                          <span className="w-2 h-2 bg-[#60a5fa] rounded-full"></span>
                                          {station.stationName}
                                        </h4>
                                        {station.quotes && station.quotes.map((quote: string, qIndex: number) => (
                                          <blockquote key={qIndex} className="bg-[#1f2a38] text-[#e0e6ed] p-3 rounded border-l-2 border-[#8b5cf6] text-sm">
                                            "{quote}"
                                          </blockquote>
                                        ))}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Key Insights & Patterns */}
                              {parsedSummary.keyInsightsAndPatterns && parsedSummary.keyInsightsAndPatterns.length > 0 && (
                                <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                      <BarChart className="w-5 h-5 text-[#f59e0b]" />
                                      Key Insights & Patterns
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {parsedSummary.keyInsightsAndPatterns.map((insight: any, index: number) => (
                                      <div key={index} className="border-l-4 border-[#f59e0b] pl-4">
                                        <h4 className="font-semibold text-[#e0e6ed] mb-2">{insight.category}</h4>
                                        <p className="text-[#a0aec0] mb-3">{insight.description}</p>
                                        {insight.bullets && insight.bullets.length > 0 && (
                                          <ul className="space-y-1">
                                            {insight.bullets.map((bullet: string, bIndex: number) => (
                                              <li key={bIndex} className="text-[#e0e6ed] text-sm flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></span>
                                                <span>{bullet}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Business Impact */}
                              {parsedSummary.businessImpact && parsedSummary.businessImpact.length > 0 && (
                                <Card className="bg-[#2d3748] border border-green-600 shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                      <TrendingUp className="w-5 h-5 text-[#10b981]" />
                                      Business Impact
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {parsedSummary.businessImpact.map((impact: any, index: number) => (
                                      <div key={index} className="border-l-4 border-[#10b981] pl-4">
                                        <h4 className="font-semibold text-[#e0e6ed] mb-2">{impact.category}</h4>
                                        {impact.benefits && impact.benefits.length > 0 && (
                                          <ul className="space-y-2">
                                            {impact.benefits.map((benefit: string, bIndex: number) => (
                                              <li key={bIndex} className="text-[#e0e6ed] text-sm flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full mt-2 flex-shrink-0"></span>
                                                <span>{benefit}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Analysis Metadata */}
                              <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                <CardHeader>
                                  <CardTitle className="text-[#cbd5e0] font-semibold flex items-center gap-2">
                                    <Database className="w-5 h-5 text-[#6b7280]" />
                                    Analysis Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {parsedSummary.analysisPeriod && (
                                      <div>
                                        <span className="font-medium text-[#cbd5e0]">Period:</span>
                                        <span className="text-[#e0e6ed] ml-2">{parsedSummary.analysisPeriod}</span>
                                      </div>
                                    )}
                                    {parsedSummary.frequency && (
                                      <div>
                                        <span className="font-medium text-[#cbd5e0]">Frequency:</span>
                                        <span className="text-[#e0e6ed] ml-2">{parsedSummary.frequency}</span>
                                      </div>
                                    )}
                                    {parsedSummary.stationsAnalyzed && parsedSummary.stationsAnalyzed.length > 0 && (
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-[#cbd5e0]">Stations Analyzed:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {parsedSummary.stationsAnalyzed.map((station: string, index: number) => (
                                            <Badge key={index} className="bg-[#374151] text-[#e0e6ed] text-xs">
                                              {station}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {parsedSummary.methodology && (
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-[#cbd5e0]">Methodology:</span>
                                        <p className="text-[#e0e6ed] mt-1">{parsedSummary.methodology}</p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </>
                          );
                        } else {
                          // Fallback to original display if parsing fails
                          console.log('❌ Using fallback format - parsing failed or no valid data structure');
                          console.log('🔍 Fallback analysis object:', analysis);
                          return (
                            <div className="space-y-6">
                              {/* Debug information */}
                              <Card className="bg-[#2d3748] border border-yellow-600 shadow-lg">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-[#cbd5e0] font-semibold">
                                    <AlertCircle className="w-5 h-5 text-[#fbbf24]" />
                                    Debug Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-sm space-y-2 text-[#e0e6ed]">
                                    <p><strong>Summary Type:</strong> {typeof analysis.summary}</p>
                                    <p><strong>Has Summary:</strong> {analysis.summary ? 'Yes' : 'No'}</p>
                                    <p><strong>Summary Length:</strong> {analysis.summary?.length || 0}</p>
                                    <p><strong>Contains JSON markers:</strong> {analysis.summary?.includes('```json') ? 'Yes' : 'No'}</p>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-[#cbd5e0] font-semibold">
                                    <Lightbulb className="w-5 h-5 text-[#60a5fa]" />
                                    Radio Content Analysis Results
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <pre className="whitespace-pre-wrap text-sm bg-[#1f2a38] text-[#e0e6ed] p-4 rounded-lg border border-gray-600 overflow-auto custom-scrollbar max-h-[400px] font-mono">
                                    {typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    // Default analysis format for other metrics
                    <div className="space-y-6">
                      <Card className="bg-[#2d3748] border border-gray-600 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#cbd5e0] font-semibold">
                            <Lightbulb className="w-5 h-5 text-[#60a5fa]" />
                            Radio Content Analysis Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-[#1f2a38] text-[#e0e6ed] p-4 rounded-lg border border-gray-600 overflow-auto custom-scrollbar max-h-[400px] font-mono">
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
