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

` : ''}Recommendations:
${analysis.recommendations?.map((rec: any, index: number) => 
  `${index + 1}. ${typeof rec === 'string' ? rec : rec.title || rec.description || 'N/A'}`
).join('\n') || 'No recommendations available'}

Radio Transcript Extracts:
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
                  {/* Analysis Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Analysis Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {analysis.summary || 'No summary available'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Contributing Components */}
                  {analysis.breakdown?.components && analysis.breakdown.components.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Contributing Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.breakdown.components.map((component: any, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-sm text-muted-foreground mt-1">•</span>
                              <span className="text-sm">
                                {typeof component === 'string' ? component : component.text || component.name || 'N/A'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Insights */}
                  {analysis.breakdown?.keyInsights && analysis.breakdown.keyInsights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.breakdown.keyInsights.map((insight: any, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-sm text-muted-foreground mt-1">•</span>
                              <span className="text-sm">
                                {typeof insight === 'string' ? insight : insight.text || 'N/A'}
                              </span>
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
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.recommendations.map((rec: any, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-sm text-muted-foreground mt-1">•</span>
                              <span className="text-sm">
                                {typeof rec === 'string' ? rec : rec.title || rec.description || 'N/A'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Radio Transcript Extracts */}
                  {analysis.radioExtracts && analysis.radioExtracts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Radio className="w-5 h-5" />
                          Radio Transcript Extracts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.radioExtracts.map((extract: any, index: number) => (
                            <div key={index} className="border-l-4 border-primary pl-4 py-2">
                              <p className="text-sm font-medium">
                                "{extract.quote || extract.text || 'N/A'}"
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {extract.station && (
                                  <Badge variant="secondary" className="text-xs">
                                    {extract.station}
                                  </Badge>
                                )}
                                {extract.timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    {extract.timestamp}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
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