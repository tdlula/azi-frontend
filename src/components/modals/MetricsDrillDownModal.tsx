import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Tag, 
  Clock, 
  Radio, 
  TrendingUp, 
  Loader2, 
  X,
  Download
} from "lucide-react";
import ExportDropdown from "@/components/ui/export-dropdown";

interface MetricsDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: string;
  metricTitle: string;
  metricValue: string;
}

interface MetricsAnalysis {
  summary?: string;
  breakdown?: {
    components?: any[];
    timeSegments?: any[];
    relatedTopics?: any[];
    keyInsights?: any[];
  };
  recommendations?: any[];
  radioExtracts?: any[];
}

export default function MetricsDrillDownModal({
  isOpen,
  onClose,
  metricType,
  metricTitle,
  metricValue
}: MetricsDrillDownModalProps) {
  const [analysis, setAnalysis] = useState<MetricsAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && metricType && metricTitle) {
      setAnalysis(null);
      setIsLoading(false);
      setHasAnalyzed(false);
      setError(null);
      // Auto-analyze when modal opens
      handleAnalyze();
    }
  }, [isOpen, metricType, metricTitle, metricValue]);

  const handleAnalyze = async () => {
    if (!metricType || !metricTitle) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/metrics-drill-down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metricType,
          metricTitle,
          metricValue
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
      setHasAnalyzed(true);
    } catch (err) {
      console.error('Error analyzing metric:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze metric');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'txt' | 'pdf' | 'json' | 'png') => {
    if (!analysis || !hasAnalyzed) {
      alert("Please wait for the analysis to complete before exporting");
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
    const textContent = `${metricTitle} Analysis Report
${'='.repeat(metricTitle.length + 17)}

Metric: ${metricTitle}
Type: ${metricType}
Value: ${metricValue}
Generated: ${new Date().toLocaleString()}

Analysis Summary:
${analysis?.summary || 'No summary available'}

Key Insights:
${analysis?.breakdown?.keyInsights?.map((insight: any, index: number) => 
  `${index + 1}. ${typeof insight === 'string' ? insight : insight.text || 'N/A'}`
).join('\n') || 'No insights available'}

Contributing Components:
${analysis?.breakdown?.components?.map((comp: any, index: number) => 
  `${index + 1}. ${typeof comp === 'string' ? comp : comp.name || comp.text || 'N/A'}`
).join('\n') || 'No components available'}

Recommendations:
${analysis?.recommendations?.map((rec: any, index: number) => 
  `${index + 1}. ${typeof rec === 'string' ? rec : rec.title || rec.description || 'N/A'}`
).join('\n') || 'No recommendations available'}

Radio Transcript Extracts:
${analysis?.radioExtracts?.map((extract: any, index: number) => 
  `${index + 1}. ${extract.quote || extract.text || 'N/A'}${extract.station ? ` - ${extract.station}` : ''}${extract.timestamp ? ` (${extract.timestamp})` : ''}`
).join('\n') || 'No extracts available'}`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Metric_Analysis_${metricTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = async () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      metricAnalysis: {
        metricTitle,
        metricType,
        metricValue,
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
    link.download = `Metric_Analysis_${metricTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const exportData = {
      chartTitle: `${metricTitle} Analysis`,
      chartType: 'metrics',
      dataPoint: {
        label: metricTitle,
        value: metricValue
      },
      analysis: {
        summary: analysis?.summary || '',
        breakdown: analysis?.breakdown || {},
        recommendations: analysis?.recommendations || []
      },
      timestamp: new Date().toISOString(),
      reportTitle: `${metricTitle} Analysis Report`
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
    link.download = `Metric_Analysis_${metricTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsImage = async () => {
    const modal = document.querySelector('[data-testid="metrics-modal"]');
    if (!modal) return;

    // Dynamic import to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(modal as HTMLElement, {
      backgroundColor: 'white',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `Metric_Analysis_${metricTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="metrics-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">
                {metricTitle} Analysis
              </DialogTitle>
              <DialogDescription className="mt-1">
                Detailed breakdown of {metricType} metric: {metricValue}
              </DialogDescription>
            </div>
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
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-lg">Analyzing metric data...</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                AI is processing radio transcript data to provide insights
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleAnalyze} className="mt-4">
                Retry Analysis
              </Button>
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
                        <li key={index} className="text-sm">
                          • {typeof insight === 'string' ? insight : (insight.text || JSON.stringify(insight))}
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
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((recommendation: any, index: number) => (
                        <li key={index} className="text-sm">
                          • {typeof recommendation === 'string' ? recommendation : (recommendation.description || recommendation.title || JSON.stringify(recommendation))}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}