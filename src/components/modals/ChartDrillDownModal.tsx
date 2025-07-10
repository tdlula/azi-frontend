import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, TrendingUp, Clock, Tag, Lightbulb, Radio, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        },
        recommendations: []
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

  const exportToPDF = async () => {
    if (!analysis || !hasAnalyzed) {
      alert("Please analyze the data point first before exporting");
      return;
    }

    setIsExporting(true);
    try {
      // Create comprehensive data for PDF export
      const exportData = {
        chartTitle,
        chartType,
        dataPoint: {
          label: dataPoint?.label || dataPoint?.category || 'Unknown',
          value: dataPoint?.value || 'N/A'
        },
        analysis,
        timestamp: new Date().toISOString(),
        reportTitle: `Chart Analysis: ${dataPoint?.label || dataPoint?.category || 'Data Point'}`
      };

      // Send request to backend for PDF generation
      const response = await fetch('/api/export-chart-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Chart_Analysis_${dataPoint?.label || 'DataPoint'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
          <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-background border rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BarChart className="w-5 h-5" />
                  Chart Analysis: {dataPoint?.label || dataPoint?.category || 'Data Point'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Interactive chart drilling with detailed radio transcript analysis from OpenAI assistant
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export to PDF Button */}
                {analysis && hasAnalyzed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="gap-2"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </Button>
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
                  <CardDescription>Information about the selected chart element</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Chart Type</p>
                      <Badge variant="outline">{chartType}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="font-semibold">{dataPoint?.value || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Label</p>
                      <p className="font-semibold">{dataPoint?.label || dataPoint?.category || 'Unknown'}</p>
                    </div>
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

              {/* Analysis Results */}
              {analysis && hasAnalyzed && (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Analysis Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{analysis.summary || 'No summary available'}</p>
                    </CardContent>
                  </Card>

                  {/* Detailed Breakdown */}
                  {analysis.breakdown && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contributing Components */}
                      {analysis.breakdown.components && analysis.breakdown.components.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              Contributing Components
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {analysis.breakdown.components.map((component: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">
                                    {typeof component === 'string' ? component : (component.name || component.topic || JSON.stringify(component))}
                                  </span>
                                  {component.value && (
                                    <span className="text-muted-foreground ml-2">({component.value})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Time Segments */}
                      {analysis.breakdown.timeSegments && analysis.breakdown.timeSegments.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Time Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {analysis.breakdown.timeSegments.map((segment: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">
                                    {typeof segment === 'string' ? segment : (segment.period || segment.time || JSON.stringify(segment))}
                                  </span>
                                  {segment.value && (
                                    <span className="text-muted-foreground ml-2">({segment.value})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Radio Transcript Extracts */}
                  {analysis.radioExtracts && analysis.radioExtracts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Radio className="w-5 h-5" />
                          Radio Transcript Extracts
                        </CardTitle>
                        <CardDescription>Specific radio mentions with timestamps and station details</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.radioExtracts.map((extract: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-muted/30 rounded-r">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium">{extract.station || 'Radio Station'}</div>
                                <div className="text-xs text-muted-foreground">{extract.timestamp || 'Time not available'}</div>
                              </div>
                              <p className="text-sm italic mb-2">"{extract.quote || extract.text || 'Quote not available'}"</p>
                              {extract.presenter && (
                                <div className="text-xs text-muted-foreground">
                                  Presenter: {extract.presenter}
                                </div>
                              )}
                              {extract.show && (
                                <div className="text-xs text-muted-foreground">
                                  Show: {extract.show}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Related Topics */}
                  {analysis.breakdown?.relatedTopics && analysis.breakdown.relatedTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Related Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.breakdown.relatedTopics.map((topic: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {typeof topic === 'string' ? topic : (topic.topic || topic.name || JSON.stringify(topic))}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Insights */}
                  {analysis.breakdown?.keyInsights && analysis.breakdown.keyInsights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.breakdown.keyInsights.map((insight: any, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                              <span>{insight.text || insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.recommendations.map((rec: any, index: number) => (
                            <li key={index} className="text-sm">
                              <div className="font-medium mb-1">{rec.title || `Recommendation ${index + 1}`}</div>
                              <div className="text-muted-foreground">{rec.description || rec}</div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Re-analyze Button */}
              {hasAnalyzed && !isLoading && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => {
                    setHasAnalyzed(false);
                    setAnalysis(null);
                    handleAnalyze();
                  }}>
                    Re-analyze
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}