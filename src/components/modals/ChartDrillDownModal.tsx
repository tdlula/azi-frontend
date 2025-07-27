import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, TrendingUp, Clock, Tag, Lightbulb, Radio, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ExportDropdown from "@/components/ui/export-dropdown";

interface ChartDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataPoint: any;
  chartType: string;
  chartTitle: string;
  onAnalyze: (dataPoint: any, chartType: string, chartTitle: string) => Promise<any>;
}

export default function ChartDrillDownModal({ 
  isOpen, 
  onClose, 
  dataPoint, 
  chartType, 
  chartTitle, 
  onAnalyze 
}: ChartDrillDownModalProps) {
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
  if (!isOpen || !dataPoint) {
    return null;
  }

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      console.log("Starting chart analysis for:", dataPoint, chartType, chartTitle);
      const result = await onAnalyze(dataPoint, chartType, chartTitle);
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
      alert("Please analyze the data point first before exporting");
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
    const textContent = `Radio Content Analysis Report
========================

Radio Content Analysis: ${dataPoint?.label || dataPoint?.category || 'Unknown'}

Executive Summary
Topic: ${dataPoint?.label || dataPoint?.category || 'Unknown'}
Frequency: ${dataPoint?.value || 'N/A'} mentions
Data Source: Radio Transcript Database
Chart Type: ${chartType}
Generated: ${new Date().toLocaleString()}
Key Finding: ${analysis.summary || 'No key findings available from analysis.'}

1. Topic Definition & Context
${analysis.topicDefinition || analysis.summary || 'No topic definition or context available from analysis.'}

2. Key Contributing Factors
${analysis.breakdown?.keyInsights?.slice(0, 5).map((insight: any, index: number) => 
  `2.${index + 1} ${typeof insight === 'string' ? `Factor ${index + 1}` : insight.title || `Factor ${index + 1}`}
${typeof insight === 'string' ? insight : insight.description || insight.text || 'No factor description available.'}
${analysis.radioExtracts && analysis.radioExtracts[index] ? `Example: "${analysis.radioExtracts[index].quote || analysis.radioExtracts[index].text || 'No example quote available.'}"` : ''}
`
).join('\n') || 'No contributing factors data available from analysis.'}

3. Peak Discussion Periods
3.1 Prime Time Slots
${analysis.peakDiscussionPeriods?.primeTimeSlots?.map((slot: any) => 
  `${slot.station || 'Station'} | ${slot.timeSlot || 'Time'} | ${slot.contentFocus || 'Content'}`
).join('\n') || 'No prime time slot data available from analysis.'}

3.2 Optimal Broadcasting Windows
${analysis.peakDiscussionPeriods?.optimalWindows?.peakHours || 'No peak hours data available from analysis.'}
${analysis.peakDiscussionPeriods?.optimalWindows?.primeTime || 'No prime time data available from analysis.'}

4. Key Insights & Patterns
4.1 Content Patterns
${analysis.breakdown?.contentPatterns || 'No content patterns data available from analysis.'}

4.2 Engagement Metrics
${analysis.breakdown?.engagementMetrics?.map((metric: string) => `• ${metric}`).join('\n') || 'No engagement metrics data available from analysis.'}

4.3 Communication Patterns
${analysis.breakdown?.communicationPatterns || 'No communication patterns data available from analysis.'}

5. Supporting Evidence: Station Quotes
${analysis.radioExtracts && analysis.radioExtracts.length > 0 ? analysis.radioExtracts.slice(0, 4).map((extract: any, index: number) => 
  `${extract.station || `Station ${index + 1}`}
"${extract.quote || extract.text || 'Representative quote from radio transcript analysis'}"
${extract.presenter ? `Presenter: ${extract.presenter}` : ''}${extract.show ? ` | Show: ${extract.show}` : ''}${extract.timestamp ? ` | ${new Date(extract.timestamp).toLocaleString()}` : ''}
`
).join('\n') : 'No specific radio extracts available for this analysis. Station quotes will be provided when AI analysis identifies relevant radio transcript content.'}

6. Business Impact
6.1 Audience Growth
${analysis.businessImpact?.audienceGrowth?.map((item: string) => `• ${item}`).join('\n') || 'No audience growth data available from analysis.'}

6.2 Revenue Opportunities
${analysis.businessImpact?.revenueOpportunities?.map((item: string) => `• ${item}`).join('\n') || 'No revenue opportunities data available from analysis.'}

Data Sources
Stations Analyzed: ${analysis.dataSources?.stations?.join(', ') || 
  (analysis.radioExtracts && analysis.radioExtracts.length > 0 
    ? [...new Set(analysis.radioExtracts.map((extract: any) => extract.station).filter(Boolean))].join(', ')
    : 'No station data available from analysis.')}
Analysis Period: ${analysis.dataSources?.analysisPeriod || 'No analysis period data available from analysis.'}
Methodology: ${analysis.dataSources?.methodology || 'No methodology data available from analysis.'}

${analysis.dataSources?.sourceTranscripts && analysis.dataSources.sourceTranscripts.length > 0 ? 
`Source Transcripts:
${analysis.dataSources.sourceTranscripts.map((transcript: any, index: number) => 
  `${index + 1}. ${transcript.station} | ${transcript.show} | ${transcript.date} | ID: ${transcript.transcriptId}${transcript.presenter ? ` | Presenter: ${transcript.presenter}` : ''}`
).join('\n')}` : ''}`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Radio_Content_Analysis_${dataPoint?.label || 'DataPoint'}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = async () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      radioContentAnalysis: {
        chartTitle,
        chartType,
        dataPoint: {
          label: dataPoint?.label || dataPoint?.category || 'Unknown',
          value: dataPoint?.value || 'N/A'
        },
        analysis,
        metadata: {
          exportFormat: 'json',
          source: 'Azi Analytics Platform - Radio Content Analysis',
          userAgent: navigator.userAgent
        }
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Radio_Content_Analysis_${dataPoint?.label || 'DataPoint'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const exportData = {
      chartTitle,
      chartType,
      dataPoint: {
        label: dataPoint?.label || dataPoint?.category || 'Unknown',
        value: dataPoint?.value || 'N/A'
      },
      analysis,
      timestamp: new Date().toISOString(),
      reportTitle: `Radio Content Analysis: ${dataPoint?.label || dataPoint?.category || 'Data Point'}`
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
    link.download = `Radio_Content_Analysis_${dataPoint?.label || 'DataPoint'}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsImage = async () => {
    const modal = document.querySelector('.chart-drill-modal');
    if (!modal) return;

    // Dynamic import to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(modal as HTMLElement, {
      backgroundColor: 'white',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `Radio_Content_Analysis_${dataPoint?.label || 'DataPoint'}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

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
          <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-background border rounded-lg shadow-lg chart-drill-modal">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Radio className="w-5 h-5" />
                  Radio Content Analysis: {dataPoint?.label || dataPoint?.category || 'Data Point'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive radio transcript analysis with AI-powered insights and business impact assessment
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
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Executive Summary</CardTitle>
                  <CardDescription>Key information about the analyzed radio content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Topic</p>
                      <p className="font-semibold">{dataPoint?.label || dataPoint?.category || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-semibold">{dataPoint?.value || 'N/A'} mentions</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Source</p>
                      <p className="font-semibold">Radio Transcript Database</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chart Type</p>
                      <Badge variant="outline">{chartType}</Badge>
                    </div>
                  </div>
                  {analysis && analysis.summary && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Key Finding</p>
                      <p className="font-medium text-sm mt-1">{analysis.summary}</p>
                    </div>
                  )}
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
                  {/* 1. Topic Definition & Context */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        1. Topic Definition & Context
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {analysis.topicDefinition || analysis.summary || 'No topic definition or context available from analysis.'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 2. Key Contributing Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        2. Key Contributing Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.breakdown?.keyInsights && analysis.breakdown.keyInsights.slice(0, 5).map((insight: any, index: number) => (
                          <div key={index} className="border-l-4 border-primary/30 pl-4">
                            <h4 className="font-medium text-sm mb-2">2.{index + 1} {typeof insight === 'string' ? `Factor ${index + 1}` : insight.title || `Factor ${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {typeof insight === 'string' ? insight : insight.description || insight.text || 'No factor description available.'}
                            </p>
                            {analysis.radioExtracts && analysis.radioExtracts[index] && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                <p className="text-xs italic bg-muted/50 p-2 rounded">
                                  "{analysis.radioExtracts[index].quote || analysis.radioExtracts[index].text || 'No example quote available.'}"
                                </p>
                              </div>
                            )}
                          </div>
                        )) || (
                          <div className="text-sm text-muted-foreground">
                            <p>No contributing factors data available from analysis.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. Peak Discussion Periods */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        3. Peak Discussion Periods
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-3">3.1 Prime Time Slots</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse border border-border">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="border border-border p-2 text-left">Station</th>
                                  <th className="border border-border p-2 text-left">Time Slot</th>
                                  <th className="border border-border p-2 text-left">Content Focus</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analysis.peakDiscussionPeriods?.primeTimeSlots && analysis.peakDiscussionPeriods.primeTimeSlots.length > 0 ? (
                                  analysis.peakDiscussionPeriods.primeTimeSlots.map((slot: any, index: number) => (
                                    <tr key={index}>
                                      <td className="border border-border p-2">{slot.station}</td>
                                      <td className="border border-border p-2">{slot.timeSlot}</td>
                                      <td className="border border-border p-2">{slot.contentFocus}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="border border-border p-2 text-center" colSpan={3}>
                                      No prime time slots data available from analysis
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">3.2 Optimal Broadcasting Windows</h4>
                          <div className="space-y-2 text-sm">
                            {analysis.peakDiscussionPeriods?.optimalWindows ? (
                              <>
                                <p><span className="font-medium">Peak Hours:</span> {analysis.peakDiscussionPeriods.optimalWindows.peakHours}</p>
                                <p><span className="font-medium">Prime Time:</span> {analysis.peakDiscussionPeriods.optimalWindows.primeTime}</p>
                              </>
                            ) : (
                              <>
                                <p><span className="font-medium">Peak Hours:</span> No peak hours data available from analysis</p>
                                <p><span className="font-medium">Prime Time:</span> No prime time data available from analysis</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. Key Insights & Patterns */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        4. Key Insights & Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">4.1 Content Patterns</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.breakdown?.contentPatterns || 'No content patterns data available from analysis.'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">4.2 Engagement Metrics</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {analysis.breakdown?.engagementMetrics && analysis.breakdown.engagementMetrics.length > 0 ? (
                              analysis.breakdown.engagementMetrics.map((metric: string, index: number) => (
                                <li key={index}>• {metric}</li>
                              ))
                            ) : (
                              <>
                                <li>• No engagement metrics data available from analysis</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">4.3 Communication Patterns</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.breakdown?.communicationPatterns || 'No communication patterns data available from analysis.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 5. Supporting Evidence: Station Quotes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="w-5 h-5" />
                        5. Supporting Evidence: Station Quotes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.radioExtracts && analysis.radioExtracts.length > 0 ? (
                          analysis.radioExtracts.slice(0, 4).map((extract: any, index: number) => (
                            <div key={index} className="border-l-4 border-primary pl-4 py-2">
                              <h4 className="font-medium text-sm mb-2">{extract.station || `Station ${index + 1}`}</h4>
                              <div className="space-y-2">
                                <p className="text-sm italic bg-muted/30 p-3 rounded">
                                  "{extract.quote || extract.text || 'No quote available'}"
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {extract.presenter && (
                                    <span className="bg-muted/50 px-2 py-1 rounded">
                                      Presenter: {extract.presenter}
                                    </span>
                                  )}
                                  {extract.show && (
                                    <span className="bg-muted/50 px-2 py-1 rounded">
                                      Show: {extract.show}
                                    </span>
                                  )}
                                  {extract.timestamp && (
                                    <span className="bg-muted/50 px-2 py-1 rounded">
                                      {new Date(extract.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-8">
                            <p>No radio extracts available for this analysis.</p>
                            <p className="text-xs mt-2">Station quotes will appear here when AI analysis provides specific radio transcript content.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 6. Business Impact */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        6. Business Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">6.1 Audience Growth</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {analysis.businessImpact?.audienceGrowth && analysis.businessImpact.audienceGrowth.length > 0 ? (
                              analysis.businessImpact.audienceGrowth.map((item: string, index: number) => (
                                <li key={index}>• {item}</li>
                              ))
                            ) : (
                              <>
                                <li>• No audience growth data available from analysis</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">6.2 Revenue Opportunities</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {analysis.businessImpact?.revenueOpportunities && analysis.businessImpact.revenueOpportunities.length > 0 ? (
                              analysis.businessImpact.revenueOpportunities.map((item: string, index: number) => (
                                <li key={index}>• {item}</li>
                              ))
                            ) : (
                              <>
                                <li>• No revenue opportunities data available from analysis</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Sources */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data Sources</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium mb-1">Stations Analyzed:</p>
                          <p>
                            {analysis.dataSources?.stations?.join(', ') || 
                             (analysis.radioExtracts && analysis.radioExtracts.length > 0 
                               ? [...new Set(analysis.radioExtracts.map((extract: any) => extract.station).filter(Boolean))].join(', ')
                               : 'No station data available from analysis')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Analysis Period:</p>
                          <p>{analysis.dataSources?.analysisPeriod || 'No analysis period data available from analysis'}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Methodology:</p>
                          <p>{analysis.dataSources?.methodology || 'No methodology data available from analysis'}</p>
                        </div>
                      </div>
                      {analysis.dataSources?.sourceTranscripts && analysis.dataSources.sourceTranscripts.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium mb-2">Source Transcripts:</p>
                          <div className="space-y-2">
                            {analysis.dataSources.sourceTranscripts.map((transcript: any, index: number) => (
                              <div key={index} className="bg-muted/30 p-2 rounded text-xs">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <span className="font-medium">Station:</span> {transcript.station}
                                  </div>
                                  <div>
                                    <span className="font-medium">Show:</span> {transcript.show}
                                  </div>
                                  <div>
                                    <span className="font-medium">Date:</span> {transcript.date}
                                  </div>
                                  <div>
                                    <span className="font-medium">ID:</span> {transcript.transcriptId}
                                  </div>
                                  {transcript.presenter && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium">Presenter:</span> {transcript.presenter}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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