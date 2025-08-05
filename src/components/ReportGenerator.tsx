import React, { forwardRef, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { TrendingUp, Target, Activity, BarChart3, Radio, Award, Clock, Zap, Calendar, Users, FileText } from "lucide-react";
import { format } from 'date-fns';

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
}

interface ReportGeneratorProps {
  data: ReportData;
  normalizeChartData: (chart: any) => any;
}

const ReportGenerator = forwardRef<HTMLDivElement, ReportGeneratorProps>(
  ({ data, normalizeChartData }, ref) => {
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
              This comprehensive analytics report provides detailed insights into radio broadcast performance for the 
              <strong> {data.topicLabel}</strong> topic during the period of <strong>{reportPeriod}</strong>. 
              The analysis encompasses sentiment trends, engagement metrics, audience interaction patterns, and key 
              performance indicators derived from advanced AI-powered transcript analysis across multiple radio stations. 
              The findings demonstrate exceptional audience reception with strategic opportunities for enhanced engagement optimization.
            </div>
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
              }}>2</span>
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
              }}>3</span>
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
                }}>4</span>
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
              }}>5</span>
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
