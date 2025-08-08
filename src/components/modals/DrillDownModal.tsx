import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, TrendingUp, Clock, Tag, Lightbulb, Radio, X, Database, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicAnalysisDisplay from "@/components/DynamicAnalysisDisplay";
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
    
    let textContent = `${type === 'chart' ? 'Chart' : 'Metric'}: ${title}
Type: ${type === 'chart' ? data?.chartType || 'N/A' : 'metrics'}
Data Point: ${dataLabel}
Value: ${dataValue}
Generated: ${new Date().toLocaleString()}

`;

    // Enhanced structured content based on analysisReport
    if (analysis.analysisReport) {
      textContent += `PROFESSIONAL ANALYSIS REPORT
${'='.repeat(50)}

`;

      if (analysis.analysisReport.overview) {
        textContent += `OVERVIEW
${'-'.repeat(20)}
${analysis.analysisReport.overview.content}
${analysis.analysisReport.overview.highlight !== undefined ? `\nKey Metric: ${analysis.analysisReport.overview.highlight}` : ''}

`;
      }

      if (analysis.analysisReport.insights?.items?.length > 0) {
        textContent += `KEY INSIGHTS
${'-'.repeat(20)}
${analysis.analysisReport.insights.items.map((insight: any, index: number) => 
  `${index + 1}. [${insight.importance?.toUpperCase() || 'STANDARD'}] ${insight.text}`
).join('\n')}

`;
      }

      if (analysis.analysisReport.breakdown?.sections?.length > 0) {
        textContent += `DETAILED BREAKDOWN
${'-'.repeat(20)}
${analysis.analysisReport.breakdown.sections.map((section: any) => 
  `${section.name}:\n${section.items?.map((item: string) => `  • ${item}`).join('\n') || '  No items'}`
).join('\n\n')}

`;
      }

      if (analysis.analysisReport.recommendations?.items?.length > 0) {
        textContent += `STRATEGIC RECOMMENDATIONS
${'-'.repeat(20)}
${analysis.analysisReport.recommendations.items.map((rec: any, index: number) => 
  `${index + 1}. [${rec.priority?.toUpperCase() || 'STANDARD'} PRIORITY] ${rec.text}${rec.category ? ` (Category: ${rec.category})` : ''}`
).join('\n')}

`;
      }

      if (analysis.analysisReport.evidence?.extracts?.length > 0) {
        textContent += `SUPPORTING EVIDENCE
${'-'.repeat(20)}
${analysis.analysisReport.evidence.extracts.map((extract: any, index: number) => 
  `${index + 1}. "${extract.quote}"
   Source: ${extract.source} | Show: ${extract.show}
   Presenter: ${extract.presenter} | Time: ${extract.timestamp}
   ${extract.context ? `Context: ${extract.context}` : ''}`
).join('\n\n')}

`;
      }
    } else {
      // Fallback to original format
      textContent += `Analysis Summary:
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
    }

    if (analysis.metadata) {
      textContent += `

ANALYSIS METADATA
${'-'.repeat(20)}
Format: ${analysis.metadata.displayFormat}
Total Sections: ${analysis.metadata.totalSections}
Generated At: ${new Date(analysis.metadata.generatedAt).toLocaleString()}
Data Points: ${Object.values(analysis.metadata.itemCounts || {}).reduce((a: any, b: any) => a + b, 0)}`;
    }

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
                  {/* Executive Summary */}
                  {analysis.summary && (
                    <Card className="bg-[#2d3748] border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-[#e0e6ed] text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#60a5fa]" />
                          Executive Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#cbd5e0] leading-relaxed">{analysis.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Professional Analysis Report */}
                  {analysis.analysisReport && (
                    <div className="space-y-6">
                      {/* Overview Section */}
                      {analysis.analysisReport.overview && (
                        <Card className="bg-[#2d3748] border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-[#e0e6ed] text-lg">
                              {analysis.analysisReport.overview.title || "📊 Analysis Overview"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-[#cbd5e0] leading-relaxed">
                              {analysis.analysisReport.overview.content}
                            </p>
                            {analysis.analysisReport.overview.highlight !== undefined && (
                              <div className="bg-[#1f2a38] p-4 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#a0aec0] text-sm font-medium">Key Metric Value</span>
                                  <span className="text-2xl font-bold text-[#60a5fa]">
                                    {analysis.analysisReport.overview.highlight}
                                    {analysis.analysisReport.overview.metricType?.includes('sentiment') ? '%' : ''}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Key Insights Section */}
                      {analysis.analysisReport.insights && analysis.analysisReport.insights.items?.length > 0 && (
                        <Card className="bg-[#2d3748] border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-[#e0e6ed] text-lg">
                              {analysis.analysisReport.insights.title || "🎯 Key Insights"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {analysis.analysisReport.insights.items.map((insight: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-[#1f2a38] rounded-lg border border-gray-600">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    insight.importance === 'high' ? 'bg-red-400' :
                                    insight.importance === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                  }`} />
                                  <div className="flex-1">
                                    <p className="text-[#cbd5e0] text-sm leading-relaxed">{insight.text}</p>
                                    <Badge 
                                      variant="outline" 
                                      className={`mt-2 text-xs ${
                                        insight.importance === 'high' ? 'border-red-400 text-red-400' :
                                        insight.importance === 'medium' ? 'border-yellow-400 text-yellow-400' : 'border-green-400 text-green-400'
                                      }`}
                                    >
                                      {insight.importance?.toUpperCase()} PRIORITY
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Detailed Breakdown Section */}
                      {analysis.analysisReport.breakdown && analysis.analysisReport.breakdown.sections?.length > 0 && (
                        <Card className="bg-[#2d3748] border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-[#e0e6ed] text-lg">
                              {analysis.analysisReport.breakdown.title || "🔍 Detailed Breakdown"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {analysis.analysisReport.breakdown.sections.map((section: any, index: number) => (
                                <div key={index} className="bg-[#1f2a38] p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">{section.icon}</span>
                                    <h4 className="font-semibold text-[#e0e6ed] text-sm">{section.name}</h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {section.items?.map((item: string, itemIndex: number) => (
                                      <li key={itemIndex} className="text-[#a0aec0] text-xs flex items-start gap-2">
                                        <span className="w-1 h-1 bg-[#60a5fa] rounded-full mt-2 flex-shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Strategic Recommendations */}
                      {analysis.analysisReport.recommendations && analysis.analysisReport.recommendations.items?.length > 0 && (
                        <Card className="bg-[#2d3748] border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-[#e0e6ed] text-lg">
                              {analysis.analysisReport.recommendations.title || "💡 Strategic Recommendations"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {analysis.analysisReport.recommendations.items.map((rec: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-[#1f2a38] rounded-lg border border-gray-600">
                                  <div className="flex items-center justify-center w-6 h-6 bg-[#60a5fa] text-white rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[#cbd5e0] text-sm leading-relaxed mb-2">{rec.text}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          rec.priority === 'high' ? 'border-red-400 text-red-400' :
                                          rec.priority === 'medium' ? 'border-yellow-400 text-yellow-400' : 'border-green-400 text-green-400'
                                        }`}
                                      >
                                        {rec.priority?.toUpperCase()} PRIORITY
                                      </Badge>
                                      {rec.category && (
                                        <Badge variant="outline" className="text-xs border-[#60a5fa] text-[#60a5fa]">
                                          {rec.category}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Supporting Evidence */}
                      {analysis.analysisReport.evidence && analysis.analysisReport.evidence.extracts?.length > 0 && (
                        <Card className="bg-[#2d3748] border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-[#e0e6ed] text-lg">
                              {analysis.analysisReport.evidence.title || "📝 Supporting Evidence"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {analysis.analysisReport.evidence.extracts.map((extract: any, index: number) => (
                                <div key={index} className="bg-[#1f2a38] p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-start gap-3">
                                    <Radio className="w-4 h-4 text-[#60a5fa] mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                      <blockquote className="text-[#cbd5e0] text-sm italic leading-relaxed mb-3 border-l-2 border-[#60a5fa] pl-3">
                                        "{extract.quote}"
                                      </blockquote>
                                      <div className="grid grid-cols-2 gap-4 text-xs text-[#a0aec0]">
                                        <div>
                                          <span className="font-medium">Source:</span> {extract.source}
                                        </div>
                                        <div>
                                          <span className="font-medium">Show:</span> {extract.show}
                                        </div>
                                        <div>
                                          <span className="font-medium">Presenter:</span> {extract.presenter}
                                        </div>
                                        <div>
                                          <span className="font-medium">Timestamp:</span> {extract.timestamp}
                                        </div>
                                      </div>
                                      {extract.context && (
                                        <div className="mt-2 text-xs text-[#a0aec0]">
                                          <span className="font-medium">Context:</span> {extract.context}
                                        </div>
                                      )}
                                      {extract.heatmapData && (
                                        <div className="mt-3 p-3 bg-[#2d3748] rounded border border-gray-600">
                                          <h5 className="text-xs font-medium text-[#e0e6ed] mb-2">Heatmap Data</h5>
                                          <div className="grid grid-cols-2 gap-2 text-xs text-[#a0aec0]">
                                            <div><span className="font-medium">Intensity:</span> {extract.heatmapData.intensity}</div>
                                            <div><span className="font-medium">Coordinates:</span> {extract.heatmapData.coordinates}</div>
                                            <div><span className="font-medium">X Category:</span> {extract.heatmapData.xCategory}</div>
                                            <div><span className="font-medium">Y Category:</span> {extract.heatmapData.yCategory}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Fallback to Dynamic Display for backward compatibility */}
                  {!analysis.analysisReport && (
                    <DynamicAnalysisDisplay 
                      data={analysis} 
                      title={title || "Analysis Results"} 
                      description="Automatically formatted analysis from backend data." 
                    />
                  )}

                  {/* Data Evidence Sources - Always show for debugging */}
                  {analysis && hasAnalyzed && (
                    <Card className="bg-[#2d3748] border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-[#e0e6ed] text-lg flex items-center gap-2">
                          <Database className="w-5 h-5 text-[#60a5fa]" />
                          Data Evidence Sources
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(() => {
                            // Debug: log the analysis structure
                            console.log('Analysis object for Data Evidence:', analysis);
                            console.log('Analysis Report Evidence:', analysis.analysisReport?.evidence);
                            console.log('Radio Extracts:', analysis.radioExtracts);

                            // Extract unique radio stations and dates from evidence
                            const extracts = analysis.analysisReport?.evidence?.extracts || analysis.radioExtracts || [];
                            console.log('Extracted data for stations:', extracts);
                            
                            const stations = new Map();
                            
                            extracts.forEach((extract: any) => {
                              const station = extract.source || extract.station || 'Unknown Station';
                              const timestamp = extract.timestamp || extract.date;
                              
                              console.log('Processing extract:', { station, timestamp, extract });
                              
                              if (!stations.has(station)) {
                                stations.set(station, new Set());
                              }
                              
                              if (timestamp) {
                                // Extract date from timestamp
                                let date = timestamp;
                                if (typeof timestamp === 'string') {
                                  // Handle different timestamp formats
                                  if (timestamp.includes('T')) {
                                    date = timestamp.split('T')[0]; // ISO format
                                  } else if (timestamp.includes(' ')) {
                                    date = timestamp.split(' ')[0]; // Space separated
                                  } else if (timestamp.includes('-') && timestamp.length >= 10) {
                                    date = timestamp.substring(0, 10); // Take first 10 chars for YYYY-MM-DD
                                  }
                                }
                                
                                console.log('Processed date:', date);
                                
                                if (date && date.match(/\d{4}-\d{2}-\d{2}/)) {
                                  stations.get(station).add(date);
                                }
                              }
                            });

                            console.log('Final stations map:', stations);

                            // If no stations found, show placeholder
                            if (stations.size === 0) {
                              return (
                                <div className="text-center py-4">
                                  <div className="text-[#a0aec0] text-sm">
                                    No radio station data available for this analysis
                                  </div>
                                </div>
                              );
                            }

                            return Array.from(stations.entries()).map(([station, dates], index) => {
                              const dateArray = Array.from(dates as Set<string>);
                              return (
                                <div key={index} className="flex items-center gap-3 p-3 bg-[#1f2a38] rounded-lg border border-gray-600">
                                  <Radio className="w-4 h-4 text-[#60a5fa] flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-[#cbd5e0] text-sm font-medium">
                                      {station} (radio station)
                                    </div>
                                    {dateArray.length > 0 && (
                                      <div className="text-[#a0aec0] text-xs mt-1">
                                        Transcripts dated: {dateArray.sort().join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs border-[#60a5fa] text-[#60a5fa]">
                                    {extracts.filter((e: any) => (e.source || e.station) === station).length} extracts
                                  </Badge>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    </Card>
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
