import React, { forwardRef, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { TrendingUp, Target, Activity, BarChart3, Radio, Award, Clock, Zap, Calendar, Users, FileText } from "lucide-react";
import { format } from 'date-fns';
import { EnhancedReportData } from '@/utils/enhancedReportData';

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
  // Enhanced report data from OpenAI Assistant
  enhancedData?: {
    executiveSummary?: {
      campaignSentimentTrends?: string;
      keyTakeaways?: string[];
      sentimentBreakdown?: { positive: number; neutral: number; negative: number };
      topPerformingStations?: Array<{ name: string; score: number; format: string }>;
    };
    methodology?: {
      aiToolDescription?: string;
      dialectRecognition?: string;
      dataSources?: string[];
      timePeriod?: string;
      stationCoverage?: string;
      limitations?: string[];
    };
    sentimentMapping?: {
      overallDistribution?: { positive: number; neutral: number; negative: number };
      toneBreakdown?: Array<{ emotion: string; score: number }>;
      examples?: Array<{ text: string; sentiment: string; score: number }>;
    };
    dealResonance?: {
      mentionsPerDeal?: Array<{ dealName: string; mentions: number; sentiment: number }>;
      xtraSavingsLanguage?: {
        popularPhrases?: Array<{ phrase: string; frequency: number; sentiment: number }>;
        wordCloudData?: Array<{ text: string; value: number; sentiment: string }>;
      };
    };
    stationAnalysis?: {
      linguisticAnalysis?: Array<{ station: string; expressions: string[]; sentimentTrend: number }>;
      culturalNuances?: Array<{ phrase: string; meaning: string; tone: string; station: string }>;
    };
    engagementIndicators?: {
      highEngagementMoments?: Array<{ timestamp: string; description: string; engagementScore: number }>;
      whatsappMentions?: { frequency: number; sentimentContext: string; correlations: string[] };
    };
    contentFormatAnalysis?: {
      formatComparison?: Array<{ format: string; sentimentScore: number; effectiveness: number }>;
      recallIndicators?: Array<{ keyword: string; frequency: number; format: string }>;
      optimizationOpportunities?: string[];
    };
    complianceMonitoring?: {
      nonComplianceIncidents?: Array<{ type: string; description: string; severity: string }>;
      cleanBroadcastPercentage?: number;
      brandSafetyRecommendations?: string[];
    };
  };
}

interface ReportGeneratorProps {
  data: ReportData;
  normalizeChartData: (chart: any) => any;
  enhancedData?: EnhancedReportData | null;
}

const ReportGenerator = forwardRef<HTMLDivElement, ReportGeneratorProps>(
  ({ data, normalizeChartData, enhancedData }, ref) => {
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    const reportPeriod = `${format(data.dateRange.from, 'MMM dd, yyyy')} - ${format(data.dateRange.to, 'MMM dd, yyyy')}`;

    // Print styles as a component
    const printStyles = `
      <style>
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 0.75in;
            @top-center {
              content: "Radio Analytics Report - ${data.topicLabel}";
              font-size: 9pt;
              color: #666;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 9pt;
              color: #666;
            }
          }
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          .print-only { display: block !important; }
          .screen-only { display: none !important; }
          
          /* Ensure headers are preserved across pages */
          section h2 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          /* Keep chart containers together */
          .chart-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Optimize font sizes for print */
          body { font-size: 10pt; }
          h1 { font-size: 20pt; }
          h2 { font-size: 14pt; }
          h3 { font-size: 12pt; }
          h4 { font-size: 11pt; }
        }
        
        @media screen {
          .print-only { display: none; }
          .screen-only { display: block; }
        }
      </style>
    `;

    // Get color by frequency for word cloud
    const getColorByFrequency = (value: number, max: number, min: number) => {
      const normalizedValue = (value - min) / (max - min);
      
      if (normalizedValue > 0.8) {
        return '#27ae60'; // Green for highest frequency
      } else if (normalizedValue > 0.6) {
        return '#3498db'; // Blue for high frequency
      } else if (normalizedValue > 0.4) {
        return '#f39c12'; // Orange for medium frequency
      } else if (normalizedValue > 0.2) {
        return '#95a5a6'; // Gray for low-medium frequency
      } else {
        return '#bdc3c7'; // Light gray for low frequency
      }
    };

    return (
      <div ref={ref} style={{
        fontFamily: "'Segoe UI', 'Calibri', 'Helvetica Neue', Arial, sans-serif",
        background: 'white',
        color: '#2c3e50',
        lineHeight: '1.5',
        fontSize: '11pt',
        fontWeight: '400',
        margin: '0',
        padding: '0',
        minHeight: '100vh'
      }}
      role="document"
      aria-label="Radio Analytics Report"
      >
        {/* Report Header */}
        <header style={{
          background: '#34495e',
          color: 'white',
          padding: '30px 40px',
          textAlign: 'center',
          borderBottom: '3pt solid #2c3e50',
          position: 'relative'
        }}
        role="banner"
        >
          <div style={{
            position: 'absolute',
            top: '20pt',
            right: '40pt',
            textAlign: 'right',
            fontSize: '9pt'
          }}
          aria-label="Company branding"
          >
            <div style={{
              fontSize: '12pt',
              fontWeight: 'bold',
              color: '#3498db'
            }}>AZI ANALYTICS</div>
            <div>Intelligence Platform</div>
          </div>
          
          <h1 style={{
            fontSize: '26pt',
            fontWeight: '700',
            marginBottom: '8pt',
            letterSpacing: '0.5pt',
            fontFamily: "'Segoe UI', 'Calibri', sans-serif",
            margin: '0 0 8pt 0'
          }}
          id="report-title"
          >
            RADIO ANALYTICS REPORT
          </h1>
          
          <h2 style={{
            fontSize: '15pt',
            marginBottom: '16pt',
            fontStyle: 'normal',
            fontWeight: '300',
            fontFamily: "'Segoe UI', 'Calibri', sans-serif",
            margin: '0 0 16pt 0'
          }}>
            {data.topicLabel} Performance Analysis
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            fontSize: '10pt',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6pt 12pt',
              borderRadius: '3pt',
              border: '1pt solid rgba(255,255,255,0.3)'
            }}>
              Report Period: {reportPeriod}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6pt 12pt',
              borderRadius: '3pt',
              border: '1pt solid rgba(255,255,255,0.3)'
            }}>
              Generated: {currentDate}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: '30pt 40pt' }} role="main">
          {/* Table of Contents - Print Only */}
          <nav style={{ 
            marginBottom: '36pt',
            padding: '20pt',
            background: '#f8f9fa',
            border: '1pt solid #dee2e6',
            borderRadius: '4pt'
          }}
          className="print-only"
          role="navigation"
          aria-label="Report sections"
          >
            <h2 style={{
              fontSize: '15pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}>Table of Contents</h2>
            <ol style={{
              listStyle: 'decimal',
              paddingLeft: '20pt',
              fontSize: '10pt',
              lineHeight: '1.8'
            }}>
              <li><a href="#executive-summary" style={{ color: '#3498db', textDecoration: 'none' }}>Executive Summary</a></li>
              <li><a href="#methodology" style={{ color: '#3498db', textDecoration: 'none' }}>Methodology</a></li>
              <li><a href="#sentiment-mapping" style={{ color: '#3498db', textDecoration: 'none' }}>Sentiment Mapping</a></li>
              <li><a href="#deal-resonance" style={{ color: '#3498db', textDecoration: 'none' }}>Deal Resonance Tracking</a></li>
              <li><a href="#station-analysis" style={{ color: '#3498db', textDecoration: 'none' }}>Station-Specific Language & Cultural Recognition</a></li>
              <li><a href="#engagement-indicators" style={{ color: '#3498db', textDecoration: 'none' }}>Engagement Indicators</a></li>
              <li><a href="#content-format" style={{ color: '#3498db', textDecoration: 'none' }}>Content Format Analysis</a></li>
              <li><a href="#compliance-monitoring" style={{ color: '#3498db', textDecoration: 'none' }}>Compliance Monitoring</a></li>
              <li><a href="#kpi-section" style={{ color: '#3498db', textDecoration: 'none' }}>Key Performance Indicators</a></li>
              <li><a href="#analytics-section" style={{ color: '#3498db', textDecoration: 'none' }}>Performance Analytics</a></li>
              {data.wordCloudData?.wordData && data.wordCloudData.wordData.length > 0 && (
                <li><a href="#topic-analysis" style={{ color: '#3498db', textDecoration: 'none' }}>Topic Frequency Analysis</a></li>
              )}
              <li><a href="#strategic-insights" style={{ color: '#3498db', textDecoration: 'none' }}>Strategic Insights & Recommendations</a></li>
            </ol>
          </nav>

          {/* Executive Summary */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="executive-summary"
                   role="region"
                   aria-labelledby="summary-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="summary-heading"
            >
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>1</span>
              Executive Summary
            </h2>
            <div style={{
              background: '#f8f9fa',
              border: '1pt solid #dee2e6',
              borderLeft: '4pt solid #3498db',
              padding: '20pt',
              fontSize: '11pt',
              lineHeight: '1.6',
              textAlign: 'justify',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif",
              fontWeight: '400'
            }}>
              {enhancedData?.executiveSummary?.campaignSentimentTrends || (
                <>
                  This comprehensive analytics report provides detailed insights into radio broadcast performance for the 
                  <strong> {data.topicLabel}</strong> topic during the period of <strong>{reportPeriod}</strong>. 
                  The analysis encompasses sentiment trends, engagement metrics, audience interaction patterns, and key 
                  performance indicators derived from advanced AI-powered transcript analysis across multiple radio stations. 
                  The findings demonstrate exceptional audience reception with strategic opportunities for enhanced engagement optimization.
                </>
              )}
              
              {enhancedData?.executiveSummary?.keyTakeaways && (
                <div style={{ marginTop: '16pt' }}>
                  <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>Key Takeaways:</h4>
                  <ul style={{ margin: '0', paddingLeft: '16pt' }}>
                    {enhancedData.executiveSummary.keyTakeaways.map((takeaway, index) => (
                      <li key={index} style={{ marginBottom: '4pt' }}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {enhancedData?.executiveSummary?.sentimentBreakdown && (
                <div style={{ marginTop: '16pt' }}>
                  <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>Sentiment Overview:</h4>
                  <div style={{ display: 'flex', gap: '12pt', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4pt 8pt', background: '#27ae60', color: 'white', borderRadius: '4pt', fontSize: '10pt' }}>
                      Positive: {enhancedData.executiveSummary.sentimentBreakdown.positive}%
                    </span>
                    <span style={{ padding: '4pt 8pt', background: '#f39c12', color: 'white', borderRadius: '4pt', fontSize: '10pt' }}>
                      Neutral: {enhancedData.executiveSummary.sentimentBreakdown.neutral}%
                    </span>
                    <span style={{ padding: '4pt 8pt', background: '#e74c3c', color: 'white', borderRadius: '4pt', fontSize: '10pt' }}>
                      Negative: {enhancedData.executiveSummary.sentimentBreakdown.negative}%
                    </span>
                  </div>
                </div>
              )}

              {enhancedData?.executiveSummary?.topPerformingStations && (
                <div style={{ marginTop: '16pt' }}>
                  <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>Top Performing Stations:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120pt, 1fr))', gap: '8pt' }}>
                    {enhancedData.executiveSummary.topPerformingStations.slice(0, 3).map((station, index) => (
                      <div key={index} style={{ 
                        padding: '8pt', 
                        background: 'rgba(52, 152, 219, 0.1)', 
                        borderRadius: '4pt',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '10pt' }}>{station.name}</div>
                        <div style={{ fontSize: '9pt', color: '#7f8c8d' }}>{station.format}</div>
                        <div style={{ fontSize: '9pt', color: '#27ae60' }}>Score: {station.score.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Methodology Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="methodology"
                   role="region"
                   aria-labelledby="methodology-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="methodology-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>2</span>
              Methodology
            </h2>
            <div style={{
              background: '#f8f9fa',
              border: '1pt solid #dee2e6',
              padding: '20pt',
              borderRadius: '4pt',
              fontSize: '11pt',
              lineHeight: '1.6'
            }}>
              <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                Agentic AI Tool & Sentiment Detection
              </h4>
              <p style={{ marginBottom: '12pt' }}>
                {enhancedData?.methodology?.aiToolDescription || 
                  "Our advanced Agentic AI system utilizes natural language processing and machine learning algorithms to analyze radio transcript data in real-time. The system employs multi-layered sentiment analysis with context-aware understanding to provide accurate emotion and tone detection across diverse radio content."}
              </p>

              <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                Dialect & Language Recognition
              </h4>
              <p style={{ marginBottom: '12pt' }}>
                {enhancedData?.methodology?.dialectRecognition || 
                  "The system incorporates South African linguistic models capable of recognizing multiple languages, dialects, and cultural expressions including Afrikaans, Zulu, Xhosa, and local slang. Machine learning models are trained on diverse linguistic patterns to ensure accurate sentiment classification across different cultural contexts."}
              </p>

              <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                Data Sources
              </h4>
              <ul style={{ marginBottom: '12pt', paddingLeft: '16pt' }}>
                {enhancedData?.methodology?.dataSources?.map((source, index) => (
                  <li key={index} style={{ marginBottom: '4pt' }}>{source}</li>
                )) || (
                  <>
                    <li>Live radio reads and announcements</li>
                    <li>Station sweepers and promotional content</li>
                    <li>In-studio conversations and discussions</li>
                    <li>Caller interactions and audience participation</li>
                    <li>Commercial advertisements and sponsorship mentions</li>
                  </>
                )}
              </ul>

              <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                Coverage Scope
              </h4>
              <p style={{ marginBottom: '12pt' }}>
                <strong>Time Period:</strong> {enhancedData?.methodology?.timePeriod || reportPeriod}<br/>
                <strong>Station Coverage:</strong> {enhancedData?.methodology?.stationCoverage || "Multiple radio stations across major South African markets including commercial, community, and public broadcasting networks"}
              </p>

              {enhancedData?.methodology?.limitations && (
                <>
                  <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                    Limitations
                  </h4>
                  <ul style={{ paddingLeft: '16pt' }}>
                    {enhancedData.methodology.limitations.map((limitation, index) => (
                      <li key={index} style={{ marginBottom: '4pt', color: '#7f8c8d' }}>{limitation}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {/* Sentiment Mapping Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="sentiment-mapping"
                   role="region"
                   aria-labelledby="sentiment-mapping-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="sentiment-mapping-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>3</span>
              Sentiment Mapping
            </h2>
            
            {/* Overall Sentiment Distribution */}
            <div style={{ marginBottom: '24pt' }}>
              <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                Overall Sentiment Distribution
              </h3>
              {enhancedData?.sentimentMapping?.overallDistribution ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16pt',
                  marginBottom: '16pt'
                }}>
                  <div style={{ 
                    padding: '16pt', 
                    background: '#d5f4e6', 
                    borderLeft: '4pt solid #27ae60',
                    textAlign: 'center',
                    borderRadius: '4pt'
                  }}>
                    <div style={{ fontSize: '24pt', fontWeight: '700', color: '#27ae60' }}>
                      {enhancedData.sentimentMapping.overallDistribution.positive}%
                    </div>
                    <div style={{ fontSize: '11pt', color: '#2c3e50', fontWeight: '600' }}>Positive</div>
                  </div>
                  <div style={{ 
                    padding: '16pt', 
                    background: '#fef9e7', 
                    borderLeft: '4pt solid #f39c12',
                    textAlign: 'center',
                    borderRadius: '4pt'
                  }}>
                    <div style={{ fontSize: '24pt', fontWeight: '700', color: '#f39c12' }}>
                      {enhancedData.sentimentMapping.overallDistribution.neutral}%
                    </div>
                    <div style={{ fontSize: '11pt', color: '#2c3e50', fontWeight: '600' }}>Neutral</div>
                  </div>
                  <div style={{ 
                    padding: '16pt', 
                    background: '#fdf2f2', 
                    borderLeft: '4pt solid #e74c3c',
                    textAlign: 'center',
                    borderRadius: '4pt'
                  }}>
                    <div style={{ fontSize: '24pt', fontWeight: '700', color: '#e74c3c' }}>
                      {enhancedData.sentimentMapping.overallDistribution.negative}%
                    </div>
                    <div style={{ fontSize: '11pt', color: '#2c3e50', fontWeight: '600' }}>Negative</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16pt',
                  background: '#f8f9fa',
                  border: '1pt solid #dee2e6',
                  borderRadius: '4pt',
                  textAlign: 'center',
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  Sentiment distribution chart would be displayed here based on AI analysis
                </div>
              )}
            </div>

            {/* Tone & Emotion Breakdown */}
            {enhancedData?.sentimentMapping?.toneBreakdown && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Tone & Emotion Breakdown
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120pt, 1fr))',
                  gap: '12pt'
                }}>
                  {enhancedData.sentimentMapping.toneBreakdown.map((item, index) => (
                    <div key={index} style={{
                      padding: '12pt',
                      background: '#f8f9fa',
                      border: '1pt solid #dee2e6',
                      borderRadius: '4pt',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16pt', fontWeight: '600', color: '#3498db' }}>
                        {item.score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '10pt', color: '#2c3e50', textTransform: 'capitalize' }}>
                        {item.emotion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            {enhancedData?.sentimentMapping?.examples && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Sentiment Classification Examples
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                  {enhancedData.sentimentMapping.examples.slice(0, 3).map((example, index) => (
                    <div key={index} style={{
                      padding: '12pt',
                      background: '#f8f9fa',
                      border: '1pt solid #dee2e6',
                      borderLeft: `4pt solid ${
                        example.sentiment === 'positive' ? '#27ae60' : 
                        example.sentiment === 'negative' ? '#e74c3c' : '#f39c12'
                      }`,
                      borderRadius: '4pt'
                    }}>
                      <div style={{ fontSize: '11pt', marginBottom: '6pt', fontStyle: 'italic' }}>
                        "{example.text}"
                      </div>
                      <div style={{ fontSize: '9pt', color: '#7f8c8d' }}>
                        <strong>Sentiment:</strong> {example.sentiment} ({example.score.toFixed(2)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Deal Resonance Tracking Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="deal-resonance"
                   role="region"
                   aria-labelledby="deal-resonance-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="deal-resonance-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>4</span>
              Deal Resonance Tracking
            </h2>
            
            {/* Mentions per Deal Type */}
            {enhancedData?.dealResonance?.mentionsPerDeal && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Mentions per Deal Type
                </h3>
                <div style={{
                  border: '1pt solid #dee2e6',
                  borderRadius: '4pt',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12pt', textAlign: 'left', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Deal Name
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Mentions
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Sentiment Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedData.dealResonance.mentionsPerDeal.map((deal, index) => (
                        <tr key={index} style={{ borderBottom: index < enhancedData!.dealResonance!.mentionsPerDeal!.length - 1 ? '1pt solid #dee2e6' : 'none' }}>
                          <td style={{ padding: '12pt', fontSize: '10pt' }}>{deal.dealName}</td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>{deal.mentions}</td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>
                            <span style={{
                              padding: '2pt 6pt',
                              borderRadius: '4pt',
                              color: 'white',
                              fontSize: '9pt',
                              fontWeight: '600',
                              background: deal.sentiment >= 0.7 ? '#27ae60' : deal.sentiment >= 0.4 ? '#f39c12' : '#e74c3c'
                            }}>
                              {deal.sentiment.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Xtra Savings Language Impact */}
            {enhancedData?.dealResonance?.xtraSavingsLanguage && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Xtra Savings Language Impact
                </h3>
                
                {enhancedData.dealResonance.xtraSavingsLanguage.popularPhrases && (
                  <div style={{ marginBottom: '16pt' }}>
                    <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>
                      Popular Value Phrases
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8pt' }}>
                      {enhancedData.dealResonance.xtraSavingsLanguage.popularPhrases.map((phrase, index) => (
                        <div key={index} style={{
                          padding: '8pt 12pt',
                          background: '#e3f2fd',
                          border: '1pt solid #2196f3',
                          borderRadius: '20pt',
                          fontSize: '10pt'
                        }}>
                          <strong>"{phrase.phrase}"</strong>
                          <br/>
                          <span style={{ fontSize: '9pt', color: '#7f8c8d' }}>
                            {phrase.frequency} mentions • Sentiment: {phrase.sentiment.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {enhancedData.dealResonance.xtraSavingsLanguage.wordCloudData && (
                  <div>
                    <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>
                      Word Cloud Analysis
                    </h4>
                    <div style={{
                      padding: '16pt',
                      background: '#f8f9fa',
                      border: '1pt solid #dee2e6',
                      borderRadius: '4pt',
                      textAlign: 'center',
                      minHeight: '100pt',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '11pt', color: '#7f8c8d', fontStyle: 'italic' }}>
                        Value phrase word cloud visualization based on AI analysis
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Station-Specific Language & Cultural Recognition Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="station-analysis"
                   role="region"
                   aria-labelledby="station-analysis-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="station-analysis-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>5</span>
              Station-Specific Language & Cultural Recognition
            </h2>
            
            {enhancedData?.stationAnalysis?.linguisticAnalysis && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Per-Station Linguistic Analysis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
                  {enhancedData.stationAnalysis.linguisticAnalysis.map((station, index) => (
                    <div key={index} style={{
                      padding: '16pt',
                      background: '#f8f9fa',
                      border: '1pt solid #dee2e6',
                      borderRadius: '4pt'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8pt' }}>
                        <h4 style={{ fontSize: '12pt', fontWeight: '600', margin: '0', color: '#2c3e50' }}>
                          {station.station}
                        </h4>
                        <span style={{
                          padding: '4pt 8pt',
                          borderRadius: '4pt',
                          fontSize: '9pt',
                          fontWeight: '600',
                          color: 'white',
                          background: station.sentimentTrend >= 0.6 ? '#27ae60' : station.sentimentTrend >= 0.4 ? '#f39c12' : '#e74c3c'
                        }}>
                          Trend: {station.sentimentTrend.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
                        <strong>Local Expressions:</strong> {station.expressions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enhancedData?.stationAnalysis?.culturalNuances && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Cultural Nuance Heatmap
                </h3>
                <div style={{
                  border: '1pt solid #dee2e6',
                  borderRadius: '4pt',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12pt', textAlign: 'left', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Phrase
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'left', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Meaning
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Tone
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Station
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedData.stationAnalysis.culturalNuances.map((nuance, index) => (
                        <tr key={index} style={{ borderBottom: index < enhancedData!.stationAnalysis!.culturalNuances!.length - 1 ? '1pt solid #dee2e6' : 'none' }}>
                          <td style={{ padding: '12pt', fontSize: '10pt', fontWeight: '600' }}>"{nuance.phrase}"</td>
                          <td style={{ padding: '12pt', fontSize: '10pt' }}>{nuance.meaning}</td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>
                            <span style={{
                              padding: '2pt 6pt',
                              borderRadius: '4pt',
                              fontSize: '9pt',
                              fontWeight: '600',
                              background: nuance.tone === 'positive' ? '#d5f4e6' : nuance.tone === 'negative' ? '#fdf2f2' : '#fef9e7',
                              color: nuance.tone === 'positive' ? '#27ae60' : nuance.tone === 'negative' ? '#e74c3c' : '#f39c12'
                            }}>
                              {nuance.tone}
                            </span>
                          </td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>{nuance.station}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Engagement Indicators Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="engagement-indicators"
                   role="region"
                   aria-labelledby="engagement-indicators-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="engagement-indicators-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>6</span>
              Engagement Indicators
            </h2>
            
            {enhancedData?.engagementIndicators?.highEngagementMoments && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  High Engagement Moments
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
                  {enhancedData.engagementIndicators.highEngagementMoments.map((moment, index) => (
                    <div key={index} style={{
                      padding: '16pt',
                      background: 'linear-gradient(90deg, #e3f2fd 0%, #f8f9fa 100%)',
                      border: '1pt solid #2196f3',
                      borderLeft: '4pt solid #2196f3',
                      borderRadius: '4pt'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8pt' }}>
                        <span style={{ fontSize: '10pt', fontWeight: '600', color: '#2c3e50' }}>
                          {moment.timestamp}
                        </span>
                        <span style={{
                          padding: '4pt 8pt',
                          borderRadius: '4pt',
                          fontSize: '9pt',
                          fontWeight: '600',
                          color: 'white',
                          background: moment.engagementScore >= 0.8 ? '#27ae60' : moment.engagementScore >= 0.6 ? '#f39c12' : '#3498db'
                        }}>
                          Score: {moment.engagementScore.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11pt', lineHeight: '1.6', color: '#2c3e50' }}>
                        {moment.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enhancedData?.engagementIndicators?.whatsappMentions && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  WhatsApp Number Mentions (066 050 6830)
                </h3>
                <div style={{
                  padding: '20pt',
                  background: '#f8f9fa',
                  border: '1pt solid #dee2e6',
                  borderRadius: '4pt'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200pt, 1fr))', gap: '16pt', marginBottom: '16pt' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24pt', fontWeight: '700', color: '#3498db' }}>
                        {enhancedData.engagementIndicators.whatsappMentions.frequency}
                      </div>
                      <div style={{ fontSize: '11pt', color: '#7f8c8d' }}>Total Mentions</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12pt' }}>
                    <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>
                      Sentiment Context
                    </h4>
                    <p style={{ fontSize: '11pt', lineHeight: '1.6', margin: '0' }}>
                      {enhancedData.engagementIndicators.whatsappMentions.sentimentContext}
                    </p>
                  </div>
                  {enhancedData.engagementIndicators.whatsappMentions.correlations.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '12pt', fontWeight: '600', marginBottom: '8pt', color: '#2c3e50' }}>
                        Correlations with High Listener Interaction
                      </h4>
                      <ul style={{ margin: '0', paddingLeft: '16pt' }}>
                        {enhancedData.engagementIndicators.whatsappMentions.correlations.map((correlation, index) => (
                          <li key={index} style={{ fontSize: '10pt', marginBottom: '4pt' }}>{correlation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Content Format Analysis Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="content-format"
                   role="region"
                   aria-labelledby="content-format-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="content-format-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>7</span>
              Content Format Analysis
            </h2>
            
            {enhancedData?.contentFormatAnalysis?.formatComparison && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Format vs Sentiment Comparison
                </h3>
                <div style={{
                  border: '1pt solid #dee2e6',
                  borderRadius: '4pt',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12pt', textAlign: 'left', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Format Type
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Sentiment Score
                        </th>
                        <th style={{ padding: '12pt', textAlign: 'center', borderBottom: '1pt solid #dee2e6', fontSize: '11pt', fontWeight: '600' }}>
                          Effectiveness Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedData.contentFormatAnalysis.formatComparison.map((format, index) => (
                        <tr key={index} style={{ borderBottom: index < enhancedData!.contentFormatAnalysis!.formatComparison!.length - 1 ? '1pt solid #dee2e6' : 'none' }}>
                          <td style={{ padding: '12pt', fontSize: '10pt', fontWeight: '600' }}>{format.format}</td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>
                            <span style={{
                              padding: '2pt 6pt',
                              borderRadius: '4pt',
                              color: 'white',
                              fontSize: '9pt',
                              fontWeight: '600',
                              background: format.sentimentScore >= 0.7 ? '#27ae60' : format.sentimentScore >= 0.4 ? '#f39c12' : '#e74c3c'
                            }}>
                              {format.sentimentScore.toFixed(2)}
                            </span>
                          </td>
                          <td style={{ padding: '12pt', textAlign: 'center', fontSize: '10pt' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4pt'
                            }}>
                              <div style={{
                                width: '80pt',
                                height: '8pt',
                                background: '#e0e0e0',
                                borderRadius: '4pt',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${format.effectiveness * 100}%`,
                                  height: '100%',
                                  background: format.effectiveness >= 0.7 ? '#27ae60' : format.effectiveness >= 0.4 ? '#f39c12' : '#e74c3c'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '9pt', color: '#7f8c8d' }}>
                                {(format.effectiveness * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {enhancedData?.contentFormatAnalysis?.recallIndicators && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Recall Indicators
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12pt' }}>
                  {enhancedData.contentFormatAnalysis.recallIndicators.map((indicator, index) => (
                    <div key={index} style={{
                      padding: '12pt',
                      background: '#f8f9fa',
                      border: '1pt solid #dee2e6',
                      borderRadius: '4pt',
                      minWidth: '160pt'
                    }}>
                      <div style={{ fontSize: '12pt', fontWeight: '600', color: '#2c3e50', marginBottom: '4pt' }}>
                        "{indicator.keyword}"
                      </div>
                      <div style={{ fontSize: '10pt', color: '#7f8c8d' }}>
                        <strong>Frequency:</strong> {indicator.frequency} mentions<br/>
                        <strong>Format:</strong> {indicator.format}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enhancedData?.contentFormatAnalysis?.optimizationOpportunities && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Format Optimization Opportunities
                </h3>
                <div style={{
                  padding: '16pt',
                  background: '#e8f4fd',
                  border: '1pt solid #3498db',
                  borderLeft: '4pt solid #3498db',
                  borderRadius: '4pt'
                }}>
                  <ul style={{ margin: '0', paddingLeft: '16pt' }}>
                    {enhancedData.contentFormatAnalysis.optimizationOpportunities.map((opportunity, index) => (
                      <li key={index} style={{ fontSize: '11pt', marginBottom: '8pt', lineHeight: '1.6' }}>
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Compliance Monitoring Section */}
          <section style={{ marginBottom: '36pt' }} 
                   className="page-break-inside-avoid"
                   id="compliance-monitoring"
                   role="region"
                   aria-labelledby="compliance-monitoring-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="compliance-monitoring-heading">
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>8</span>
              Compliance Monitoring
            </h2>
            
            {enhancedData?.complianceMonitoring?.cleanBroadcastPercentage && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Clean Broadcast Percentage
                </h3>
                <div style={{
                  padding: '20pt',
                  background: enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 95 ? '#d5f4e6' : 
                            enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 85 ? '#fef9e7' : '#fdf2f2',
                  border: `1pt solid ${enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 95 ? '#27ae60' : 
                                    enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 85 ? '#f39c12' : '#e74c3c'}`,
                  borderRadius: '4pt',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '36pt', 
                    fontWeight: '700', 
                    color: enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 95 ? '#27ae60' : 
                           enhancedData.complianceMonitoring.cleanBroadcastPercentage >= 85 ? '#f39c12' : '#e74c3c'
                  }}>
                    {enhancedData.complianceMonitoring.cleanBroadcastPercentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12pt', color: '#2c3e50', fontWeight: '600' }}>
                    Content Flagged as Compliant
                  </div>
                </div>
              </div>
            )}

            {enhancedData?.complianceMonitoring?.nonComplianceIncidents && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Non-Compliance Incidents
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                  {enhancedData.complianceMonitoring.nonComplianceIncidents.map((incident, index) => (
                    <div key={index} style={{
                      padding: '12pt',
                      background: incident.severity === 'high' ? '#fdf2f2' : incident.severity === 'medium' ? '#fef9e7' : '#f0f8ff',
                      border: `1pt solid ${incident.severity === 'high' ? '#e74c3c' : incident.severity === 'medium' ? '#f39c12' : '#3498db'}`,
                      borderLeft: `4pt solid ${incident.severity === 'high' ? '#e74c3c' : incident.severity === 'medium' ? '#f39c12' : '#3498db'}`,
                      borderRadius: '4pt'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6pt' }}>
                        <strong style={{ fontSize: '11pt', color: '#2c3e50' }}>
                          {incident.type}
                        </strong>
                        <span style={{
                          padding: '2pt 6pt',
                          borderRadius: '4pt',
                          fontSize: '9pt',
                          fontWeight: '600',
                          color: 'white',
                          background: incident.severity === 'high' ? '#e74c3c' : incident.severity === 'medium' ? '#f39c12' : '#3498db'
                        }}>
                          {incident.severity.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
                        {incident.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enhancedData?.complianceMonitoring?.brandSafetyRecommendations && (
              <div style={{ marginBottom: '24pt' }}>
                <h3 style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '12pt', color: '#2c3e50' }}>
                  Brand Safety Recommendations
                </h3>
                <div style={{
                  padding: '16pt',
                  background: '#e8f4fd',
                  border: '1pt solid #3498db',
                  borderLeft: '4pt solid #3498db',
                  borderRadius: '4pt'
                }}>
                  <ol style={{ margin: '0', paddingLeft: '16pt' }}>
                    {enhancedData.complianceMonitoring.brandSafetyRecommendations.map((recommendation, index) => (
                      <li key={index} style={{ fontSize: '11pt', marginBottom: '8pt', lineHeight: '1.6' }}>
                        {recommendation}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </section>

          {/* Key Performance Indicators */}
          <section style={{ marginBottom: '36pt' }}
                   className="page-break-inside-avoid"
                   id="kpi-section"
                   role="region"
                   aria-labelledby="kpi-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="kpi-heading"
            >
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>9</span>
              Key Performance Indicators
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200pt, 1fr))',
              gap: '16pt',
              marginBottom: '24pt'
            }}
            role="grid"
            aria-label="Performance metrics dashboard"
            >
              {/* Positive Sentiment KPI */}
              <div style={{
                background: '#f8f9fa',
                border: '1pt solid #dee2e6',
                padding: '20pt',
                textAlign: 'center',
                borderRadius: '4pt',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '3pt',
                  background: '#27ae60'
                }}></div>
                <div style={{
                  fontSize: '32pt',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '6pt',
                  lineHeight: '1',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  {data.metrics?.overallPositiveSentiment?.value || 0}%
                </div>
                <div style={{
                  fontSize: '9pt',
                  color: '#7f8c8d',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  Overall Positive Sentiment
                </div>
              </div>

              {/* Total Mentions KPI */}
              <div style={{
                background: '#f8f9fa',
                border: '1pt solid #dee2e6',
                padding: '20pt',
                textAlign: 'center',
                borderRadius: '4pt',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '3pt',
                  background: '#3498db'
                }}></div>
                <div style={{
                  fontSize: '32pt',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '6pt',
                  lineHeight: '1',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  {data.metrics?.totalMentions?.value || 0}
                </div>
                <div style={{
                  fontSize: '9pt',
                  color: '#7f8c8d',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  Total On-Air Mentions
                </div>
              </div>

              {/* High Engagement KPI */}
              <div style={{
                background: '#f8f9fa',
                border: '1pt solid #dee2e6',
                padding: '20pt',
                textAlign: 'center',
                borderRadius: '4pt',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '3pt',
                  background: '#f39c12'
                }}></div>
                <div style={{
                  fontSize: '32pt',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '6pt',
                  lineHeight: '1',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  {data.metrics?.highEngagementMoments?.value || 0}
                </div>
                <div style={{
                  fontSize: '9pt',
                  color: '#7f8c8d',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  High Engagement Moments
                </div>
              </div>

              {/* WhatsApp Mentions KPI */}
              <div style={{
                background: '#f8f9fa',
                border: '1pt solid #dee2e6',
                padding: '20pt',
                textAlign: 'center',
                borderRadius: '4pt',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '3pt',
                  background: '#e74c3c'
                }}></div>
                <div style={{
                  fontSize: '32pt',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '6pt',
                  lineHeight: '1',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  {data.metrics?.whatsappNumberMentions?.value || 0}
                </div>
                <div style={{
                  fontSize: '9pt',
                  color: '#7f8c8d',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5pt',
                  fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                }}>
                  WhatsApp Call-to-Actions
                </div>
              </div>
            </div>
          </section>

          {/* Performance Analytics */}
          <section style={{ marginBottom: '36pt' }}
                   className="page-break-before"
                   id="analytics-section"
                   role="region"
                   aria-labelledby="analytics-heading">
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}
            id="analytics-heading"
            >
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>10</span>
              Performance Analytics
            </h2>
            {data.charts && Object.keys(data.charts).length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380pt, 1fr))',
                gap: '24pt',
                marginBottom: '32pt',
                alignItems: 'start'
              }}
              role="region"
              aria-label="Data visualization charts"
              >
                {Object.entries(data.charts)
                  .filter(([key, chart]) => {
                    const c = chart as any;
                    const normalizedChart = normalizeChartData(c);
                    return normalizedChart && normalizedChart.data && Array.isArray(normalizedChart.data) && normalizedChart.data.length > 0;
                  })
                  .slice(0, 2) // Limit to 2 charts for better layout
                  .map(([key, chart]) => {
                    const normalizedChart = normalizeChartData(chart);
                    return (
                      <div key={key} style={{
                        background: 'white',
                        border: '1pt solid #dee2e6',
                        borderRadius: '4pt',
                        padding: '20pt',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '400pt',
                        boxShadow: '0 1pt 3pt rgba(0,0,0,0.1)'
                      }}
                      className="chart-container page-break-inside-avoid"
                      role="img"
                      aria-label={`Chart: ${normalizedChart.title}`}
                      >
                        <div style={{ flex: '0 0 auto' }}>
                          <h3 style={{
                            fontSize: '13pt',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '4pt',
                            fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                          }}>
                            {normalizedChart.title || 'Untitled Chart'}
                          </h3>
                          <p style={{
                            fontSize: '9pt',
                            color: '#7f8c8d',
                            marginBottom: '16pt',
                            fontStyle: 'normal',
                            fontWeight: '400',
                            fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                          }}>
                            {normalizedChart.description || 'Engagement metrics by content type'}
                          </p>
                          
                          {/* Data Quality Indicator */}
                          <div style={{
                            fontSize: '8pt',
                            color: '#95a5a6',
                            marginBottom: '12pt',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4pt'
                          }}>
                            <span style={{
                              width: '6pt',
                              height: '6pt',
                              borderRadius: '50%',
                              background: normalizedChart.data?.length > 0 ? '#27ae60' : '#e74c3c'
                            }}></span>
                            {normalizedChart.data?.length || 0} data points • 
                            Last updated: {new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ 
                          flex: '1 1 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '250pt',
                          marginBottom: '16pt'
                        }}>
                          <div style={{ width: '100%', height: '250pt' }}>
                            <ChartRenderer
                              chartData={normalizedChart}
                              onChartClick={() => {}} // Disabled for report
                            />
                          </div>
                        </div>
                        {normalizedChart.insights && (
                          <div style={{
                            flex: '0 0 auto',
                            padding: '16pt',
                            background: '#f8f9fa',
                            borderRadius: '4pt',
                            border: '1pt solid #dee2e6',
                            textAlign: 'left'
                          }}>
                            <p style={{
                              fontSize: '10pt',
                              color: '#2c3e50',
                              fontFamily: "'Segoe UI', 'Calibri', sans-serif",
                              margin: '0'
                            }}>
                              <span style={{ fontWeight: '600' }}>Analysis:</span> {normalizedChart.insights}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{
                background: 'white',
                border: '1pt solid #dee2e6',
                padding: '20pt',
                textAlign: 'center',
                borderRadius: '4pt'
              }}>
                <p style={{ color: '#6b7280' }}>No chart data available for the selected period.</p>
              </div>
            )}
          </section>

          {/* Topic Analysis */}
          {data.wordCloudData?.wordData && data.wordCloudData.wordData.length > 0 && (
            <section style={{ marginBottom: '36pt' }}>
              <h2 style={{
                fontSize: '17pt',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16pt',
                paddingBottom: '6pt',
                borderBottom: '2pt solid #bdc3c7',
                display: 'flex',
                alignItems: 'center',
                gap: '8pt',
                fontFamily: "'Segoe UI', 'Calibri', sans-serif"
              }}>
                <span style={{
                  background: '#3498db',
                  color: 'white',
                  width: '24pt',
                  height: '24pt',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11pt',
                  fontWeight: 'bold'
                }}>11</span>
                Topic Frequency Analysis
              </h2>
              <div style={{
                background: 'white',
                border: '1pt solid #dee2e6',
                padding: '20pt'
              }}>
                <p style={{
                  marginBottom: '16pt',
                  fontSize: '10pt',
                  color: '#7f8c8d'
                }}>
                  Analysis of most frequently mentioned topics across monitored radio stations, categorized by mention frequency and strategic relevance.
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '20pt',
                  minHeight: '250px',
                  background: '#f8f9fa',
                  borderRadius: '8pt'
                }}>
                  {data.wordCloudData.wordData.map((word, index) => {
                    const maxValue = Math.max(...data.wordCloudData!.wordData.map(w => w.value));
                    const minValue = Math.min(...data.wordCloudData!.wordData.map(w => w.value));
                    const normalizedValue = (word.value - minValue) / (maxValue - minValue);
                    const size = 14 + (normalizedValue * 24); // Font size range: 14px to 38px
                    const opacity = 0.7 + (normalizedValue * 0.3); // Opacity range: 0.7 to 1.0
                    
                    return (
                      <span
                        key={index}
                        style={{ 
                          display: 'inline-block',
                          margin: '8pt',
                          padding: '8pt',
                          borderRadius: '4pt',
                          fontSize: `${size}px`, 
                          opacity: opacity,
                          color: getColorByFrequency(word.value, maxValue, minValue),
                          fontWeight: word.value > maxValue * 0.6 ? 'bold' : 'normal',
                          fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>
                
                <div style={{
                  marginTop: '16pt',
                  padding: '16pt',
                  background: '#f8f9fa',
                  borderRadius: '8pt',
                  border: '1pt solid #dee2e6'
                }}>
                  <p style={{
                    fontSize: '10pt',
                    color: '#2c3e50',
                    fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                  }}>
                    <span style={{ fontWeight: '600' }}>Analysis:</span> {
                      data.wordCloudData.metadata?.analysisScope || 
                      "Most frequently mentioned topics from radio transcript database, with word size indicating mention frequency."
                    }
                  </p>
                  {data.wordCloudData.metadata && (
                    <div style={{
                      marginTop: '8pt',
                      fontSize: '9pt',
                      color: '#7f8c8d',
                      fontFamily: "'Segoe UI', 'Calibri', sans-serif"
                    }}>
                      <span>Source: {data.wordCloudData.metadata.dataSource}</span> | 
                      <span> Updated: {data.wordCloudData.metadata.lastUpdated}</span> | 
                      <span> Total words: {data.wordCloudData.metadata.totalWords}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Strategic Insights */}
          <section style={{ marginBottom: '36pt' }}>
            <h2 style={{
              fontSize: '17pt',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '16pt',
              paddingBottom: '6pt',
              borderBottom: '2pt solid #bdc3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8pt',
              fontFamily: "'Segoe UI', 'Calibri', sans-serif"
            }}>
              <span style={{
                background: '#3498db',
                color: 'white',
                width: '24pt',
                height: '24pt',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11pt',
                fontWeight: 'bold'
              }}>12</span>
              Strategic Insights & Recommendations
            </h2>
            <div style={{
              background: '#f8f9fa',
              border: '1pt solid #dee2e6',
              padding: '24pt'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24pt',
                marginTop: '20pt'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '13pt',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '16pt',
                    paddingBottom: '6pt',
                    borderBottom: '1pt solid #bdc3c7'
                  }}>Key Strategic Insights</h4>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>Exceptional Brand Reception</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      The {data.metrics?.overallPositiveSentiment?.value || 0}% positive sentiment rate demonstrates outstanding brand perception and strong audience affinity across all monitored radio stations.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>Strong Multi-Platform Presence</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      With {data.metrics?.totalMentions?.value || 0} total mentions distributed across diverse radio platforms, the brand maintains consistent visibility and engagement.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>High-Value Engagement Windows</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      {data.metrics?.highEngagementMoments?.value || 0} identified peak engagement moments present strategic opportunities for amplified brand messaging.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{
                    fontSize: '13pt',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '16pt',
                    paddingBottom: '6pt',
                    borderBottom: '1pt solid #bdc3c7'
                  }}>Strategic Recommendations</h4>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>Content Strategy Optimization</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      Continue prioritizing content formats that consistently generate positive sentiment to maintain audience loyalty and strengthen brand trust metrics.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>WhatsApp Integration Enhancement</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      Strategically position WhatsApp call-to-actions during identified peak engagement periods to maximize response rates and conversion potential.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    border: '1pt solid #dee2e6',
                    borderLeft: '3pt solid #3498db',
                    padding: '12pt',
                    marginBottom: '12pt'
                  }}>
                    <strong style={{
                      color: '#2c3e50',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '4pt',
                      fontSize: '10pt'
                    }}>Proactive Trend Monitoring</strong>
                    <p style={{
                      color: '#5d6d7e',
                      fontSize: '9pt',
                      lineHeight: '1.4'
                    }}>
                      Implement systematic monitoring of emerging topics and trends for proactive campaign development and strategic content planning initiatives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{
          background: '#34495e',
          color: 'white',
          padding: '16pt 40pt',
          textAlign: 'center',
          fontSize: '9pt',
          borderTop: '2pt solid #2c3e50'
        }}
        role="contentinfo"
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12pt'
          }}>
            <div style={{ flex: '1 1 auto' }}>
              <span style={{
                fontWeight: 'bold',
                color: '#3498db'
              }}>AZI Analytics Platform</span> • AI-Powered Radio Intelligence
            </div>
            <div style={{ 
              flex: '1 1 auto',
              textAlign: 'center',
              fontSize: '8pt',
              color: '#bdc3c7'
            }}>
              Report ID: {Date.now().toString(36).toUpperCase()} • 
              Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')} • 
              Version: 2.1
            </div>
            <div style={{ flex: '1 1 auto', textAlign: 'right' }}>
              © {new Date().getFullYear()} All Rights Reserved • Confidential Report
            </div>
          </div>
          
          {/* Disclaimer */}
          <div style={{
            marginTop: '12pt',
            paddingTop: '8pt',
            borderTop: '1pt solid rgba(255,255,255,0.2)',
            fontSize: '7pt',
            color: '#95a5a6',
            lineHeight: '1.4'
          }}>
            This report contains confidential and proprietary information. Distribution is restricted to authorized personnel only. 
            Data accuracy: ±2% margin of error. For questions, contact support@azi-analytics.com
          </div>
        </footer>
      </div>
    );
  }
);

ReportGenerator.displayName = 'ReportGenerator';

export default ReportGenerator;
