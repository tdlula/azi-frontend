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
      setHasAnalyzed(true);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {type === 'chart' ? <BarChart className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
              {subtitle && (
                <p className="text-sm text-gray-600 mb-2">{subtitle}</p>
              )}
              
              {/* Data Fields Display */}
              <div className="flex flex-wrap gap-2">
                {fields.length > 0 ? (
                  fields.map((field, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <span className="font-medium">{field.label}:</span>
                      <span>{field.value}</span>
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span className="font-medium">Value:</span>
                      <span>{data?.value || data?.metricValue || 'N/A'}</span>
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span className="font-medium">Category:</span>
                      <span>{data?.label || data?.category || data?.metricTitle || 'N/A'}</span>
                    </Badge>
                    {data?.chartType && (
                      <Badge variant="secondary" className="flex items-center gap-1">
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
                  onExportTXT={exportAsTXT}
                  onExportJSON={exportAsJSON}
                  isExporting={isExporting}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Analysis Button */}
              {!hasAnalyzed && (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI Radio Content Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Generate detailed insights about this {type} using our AI-powered analysis of radio broadcast data.
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
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

              {/* Analysis Results */}
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
