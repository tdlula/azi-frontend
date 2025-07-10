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

  const exportAnalysis = async () => {
    if (!analysis) return;
    
    try {
      const exportData = {
        metricTitle,
        metricType,
        metricValue,
        analysis,
        timestamp: new Date().toISOString(),
        reportTitle: `${metricTitle} Analysis Report`
      };

      // For now, just download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Metric_Analysis_${metricTitle}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Button
                variant="outline"
                size="sm"
                onClick={exportAnalysis}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
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