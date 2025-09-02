import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  FileText, 
  Send, 
  Bot, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Copy, 
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Brain,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Users,
  ChartLine,
  Table as TableIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { createApiUrl } from "@/lib/api";
import ReportVisualization from "@/components/ReportVisualization";

interface ReportChunk {
  id: string;
  title: string;
  prompt: string;
  response?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  order: number;
  estimatedTokens?: number;
}

interface ReportTemplate {
  title: string;
  description: string;
  sections: {
    title: string;
    prompt: string;
    estimatedTokens: number;
  }[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    title: "Sentiment Analysis Report",
    description: "Professional client-ready sentiment analysis for radio campaigns",
    sections: [
      {
        title: "Executive Summary",
        prompt: "Create a concise executive summary of the campaign performance, highlighting overall sentiment trends, key findings, and most notable insights from the radio broadcast data. Keep it professional and business-focused.",
        estimatedTokens: 300
      },
      {
        title: "Sentiment Mapping",
        prompt: "Analyze and classify sentiment (positive, neutral, negative) by radio station and time of day. Present the results in a structured format with specific citations including station names and timestamps. Create a sentiment distribution chart showing percentages, and include a table with station-by-station breakdowns including specific sentiment scores and confidence levels.",
        estimatedTokens: 450
      },
      {
        title: "Deal Resonance Tracking", 
        prompt: "Identify which specific deals and promotions drove the strongest sentiment responses. Track mentions of savings cards, promotional phrases, and special offers. Provide specific examples with citations. Create a bar chart comparing deal performance and include a detailed table showing deal names, mention frequency, sentiment scores, and engagement metrics.",
        estimatedTokens: 400
      },
      {
        title: "Station-Specific Language Recognition",
        prompt: "Highlight local language styles and cultural nuances used by different radio stations. Include specific examples showing how language style affected audience sentiment and engagement.",
        estimatedTokens: 300
      },
      {
        title: "Engagement Indicators",
        prompt: "Identify high-engagement moments including listener interaction spikes, DJ energy peaks, and call-to-action responses. Include specific timestamps and station references. Create a line chart showing engagement over time and provide a table with peak engagement moments, timestamps, stations, and engagement scores.",
        estimatedTokens: 300
      },
      {
        title: "Content Format Analysis",
        prompt: "Compare effectiveness of different content formats (60-second reads, 30-second spots, sweepers, in-studio content) based on sentiment and recall metrics. Create comparison charts showing format performance and include detailed tables with format types, duration, sentiment scores, recall rates, and effectiveness rankings.",
        estimatedTokens: 350
      },
      {
        title: "Compliance Monitoring",
        prompt: "Review content for any mentions of competitors, inappropriate topics, or brand compliance issues. Provide compliance assurance or flag specific violations with citations.",
        estimatedTokens: 200
      },
      {
        title: "Strategic Recommendations",
        prompt: "Provide actionable, data-driven recommendations for optimizing future radio campaigns based on the sentiment analysis findings. Reference specific data points to support each recommendation.",
        estimatedTokens: 350
      }
    ]
  },
  {
    title: "Market Research Report",
    description: "Comprehensive market analysis with consumer insights and trends",
    sections: [
      {
        title: "Market Overview",
        prompt: "Provide a comprehensive market overview including market size, key players, and current trends based on available data. Include market share charts, competitive positioning graphs, and detailed tables with company profiles, market segments, and trend analysis.",
        estimatedTokens: 450
      },
      {
        title: "Consumer Behavior Analysis",
        prompt: "Analyze consumer behavior patterns, preferences, and purchasing decisions from the available data sources. Create behavioral trend charts, preference distribution graphs, and comprehensive tables showing consumer segments, behavior patterns, and purchasing drivers.",
        estimatedTokens: 400
      },
      {
        title: "Competitive Landscape",
        prompt: "Map the competitive landscape including major competitors, market positioning, and competitive advantages. Provide competitive comparison charts, positioning maps, and detailed competitor analysis tables with strengths, weaknesses, and market positions.",
        estimatedTokens: 350
      },
      {
        title: "Trend Analysis",
        prompt: "Identify emerging trends, growth opportunities, and potential market disruptions based on the data.",
        estimatedTokens: 300
      },
      {
        title: "Strategic Recommendations", 
        prompt: "Provide strategic recommendations for market entry, positioning, and growth based on the research findings.",
        estimatedTokens: 350
      }
    ]
  }
];

export default function AdvancedReportGeneratorPage() {
  const [, navigate] = useLocation();
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [chunks, setChunks] = useState<ReportChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [generatedReport, setGeneratedReport] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-scroll to current processing chunk
  const chunkRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (currentChunkIndex >= 0 && chunkRefs.current[currentChunkIndex]) {
      chunkRefs.current[currentChunkIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentChunkIndex]);

  const calculateEstimatedTime = () => {
    const totalTokens = chunks.reduce((sum, chunk) => sum + (chunk.estimatedTokens || 200), 0);
    return Math.ceil(totalTokens / 100); // Rough estimate: 100 tokens per second
  };

  const analyzeComplexPrompt = async (prompt: string) => {
    try {
      const response = await fetch(createApiUrl("/api/chat-response"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please analyze this complex prompt and break it down into 6-8 logical, sequential sections that can be processed independently. Each section should be capable of generating charts, tables, and visualizations where appropriate. For each section, provide:

1. A clear title (2-4 words)
2. A focused sub-prompt that addresses that specific aspect and includes requests for relevant charts, tables, or data visualizations
3. Estimated complexity (tokens needed: 200-500)

When creating sub-prompts, specifically request:
- Charts for numerical data, comparisons, trends, and distributions
- Tables for structured data, breakdowns, and detailed metrics
- Specific data formats that can be easily visualized

Original prompt: "${prompt}"

Respond in JSON format:
{
  "reportTitle": "Professional Report Title",
  "sections": [
    {
      "title": "Section Title",
      "prompt": "Specific focused prompt for this section that includes chart/table generation requests",
      "estimatedTokens": 300
    }
  ]
}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.message || data.response || "";
        
        // Try to parse JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error analyzing prompt:", error);
    }

    // Fallback: enhanced splitting with visualization requests
    return {
      reportTitle: "Professional Data-Rich Report with Visualizations",
      sections: [
        {
          title: "Executive Summary & Overview",
          prompt: `Provide an executive summary and overview for: ${prompt.substring(0, 200)}... 

CRITICAL: Include specific data patterns like:
- Overall performance: 85%, target achievement: 92%, satisfaction score: 8.7/10
- Key categories breakdown: Category A: 45%, Category B: 32%, Category C: 23%
- Create a summary table with metrics, values, and status indicators
- Include time-based trends: Morning: 65%, Afternoon: 78%, Evening: 82%`,
          estimatedTokens: 400
        },
        {
          title: "Detailed Analysis & Metrics",
          prompt: `Provide comprehensive data analysis for: ${prompt.substring(0, 200)}... 

MANDATORY DATA FORMAT:
- Station performance: KAYA FM: 8.5/10, Metro FM: 7.8/10, 5FM: 9.1/10
- Engagement metrics: High engagement: 73%, Medium: 22%, Low: 5%
- Time series data: 6AM: 23%, 7AM: 34%, 8AM: 45%, 9AM: 67%, 10AM: 72%
- Create detailed tables with all performance indicators
- Include comparative charts showing before/after or competitor analysis`,
          estimatedTokens: 500
        },
        {
          title: "Performance Breakdown & Insights",
          prompt: `Analyze key performance indicators and insights for: ${prompt.substring(0, 200)}... 

SPECIFIC REQUIREMENTS:
- Department scores: Marketing: 88%, Sales: 91%, Operations: 76%, Support: 83%
- Quality ratings: Excellent: 67%, Good: 28%, Fair: 5%
- Regional breakdown: North: 82%, South: 77%, East: 85%, West: 79%
- Include performance comparison tables and trend analysis charts
- Format all data for automatic visualization`,
          estimatedTokens: 450
        },
        {
          title: "Recommendations & Action Plan",
          prompt: `Provide actionable recommendations and conclusions for: ${prompt.substring(0, 200)}... 

MUST INCLUDE:
- Priority levels: High priority: 34%, Medium: 45%, Low: 21%
- Resource allocation: Budget 1: 40%, Budget 2: 35%, Budget 3: 25%
- Timeline projections: Q1: 25%, Q2: 35%, Q3: 25%, Q4: 15%
- Create recommendation tables with actions, timelines, and expected outcomes
- Include ROI projections and implementation roadmap charts`,
          estimatedTokens: 400
        }
      ]
    };
  };

  const handleAnalyzePrompt = async () => {
    if (!originalPrompt.trim()) return;

    setIsProcessing(true);
    setChunks([]);
    setCurrentChunkIndex(-1);
    setGeneratedReport("");

    try {
      const analysis = await analyzeComplexPrompt(originalPrompt);
      setReportTitle(analysis.reportTitle);
      
      const newChunks: ReportChunk[] = analysis.sections.map((section: any, index: number) => ({
        id: `chunk-${index}`,
        title: section.title,
        prompt: section.prompt,
        status: 'pending' as const,
        order: index,
        estimatedTokens: section.estimatedTokens
      }));

      setChunks(newChunks);
    } catch (error) {
      console.error("Error analyzing prompt:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processChunk = async (chunk: ReportChunk): Promise<string> => {
    const enhancedPrompt = `${chunk.prompt}

MANDATORY DATA FORMATTING for automatic chart and table generation:

1. Use specific numerical patterns:
   - Percentages: "Category A: 65%, Category B: 25%, Category C: 10%"
   - Scores: "Performance Score: 8.5/10, Quality Rating: 92%"
   - Time series: "Morning: 45%, Afternoon: 67%, Evening: 82%"
   - Comparisons: "Station X: 85%, Station Y: 72%, Station Z: 91%"

2. Include structured data tables with pipe formatting:
   | Metric | Value | Change |
   |--------|-------|--------|
   | Engagement | 73% | +5% |
   | Sentiment | 8.2/10 | +0.3 |

3. Provide specific numbers, not ranges:
   - Use "73%" not "70-75%"
   - Use "8.5/10" not "high score"
   - Use "245 mentions" not "many mentions"

CRITICAL: Include real numerical data with exact percentages, scores, and metrics throughout your response. Format data exactly as shown above for automatic visualization.`;

    const response = await fetch(createApiUrl("/api/chat-response"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: enhancedPrompt,
        conversationHistory: chunks
          .filter(c => c.order < chunk.order && c.response)
          .map(c => [
            { role: "user", content: c.prompt },
            { role: "assistant", content: c.response }
          ])
          .flat()
      }),
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message || data.response || "No response generated";
  };

  const handleStartProcessing = async () => {
    if (chunks.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    setProcessingProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (isPaused) {
          setIsProcessing(false);
          return;
        }

        setCurrentChunkIndex(i);
        
        // Update chunk status to processing
        setChunks(prev => prev.map(chunk => 
          chunk.order === i 
            ? { ...chunk, status: 'processing' as const }
            : chunk
        ));

        try {
          const response = await processChunk(chunks[i]);
          
          // Update chunk with response
          setChunks(prev => prev.map(chunk => 
            chunk.order === i 
              ? { ...chunk, response, status: 'completed' as const }
              : chunk
          ));
          
          setProcessingProgress(((i + 1) / chunks.length) * 100);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            break;
          }
          
          // Update chunk status to error
          setChunks(prev => prev.map(chunk => 
            chunk.order === i 
              ? { ...chunk, status: 'error' as const }
              : chunk
          ));
          
          console.error(`Error processing chunk ${i}:`, error);
        }
      }
    } finally {
      setIsProcessing(false);
      setCurrentChunkIndex(-1);
    }
  };

  const handlePauseProcessing = () => {
    setIsPaused(true);
    setIsProcessing(false);
    abortControllerRef.current?.abort();
  };

  const handleStopProcessing = () => {
    setIsPaused(false);
    setIsProcessing(false);
    setCurrentChunkIndex(-1);
    abortControllerRef.current?.abort();
  };

  const generateFinalReport = async () => {
    const completedChunks = chunks.filter(c => c.status === 'completed' && c.response);
    if (completedChunks.length === 0) return;

    setIsGeneratingReport(true);

    try {
      const reportSections = completedChunks
        .sort((a, b) => a.order - b.order)
        .map(chunk => `## ${chunk.title}\n\n${chunk.response}`)
        .join('\n\n---\n\n');

      const finalReportPrompt = `Please take these report sections and create a polished, professional, client-ready report with enhanced data visualization integration. 

IMPORTANT: Ensure the report includes data in formats that can be automatically detected and visualized:
- Include specific numerical data, percentages, and metrics
- Format comparative data clearly (Station A: 45%, Station B: 32%, etc.)
- Include time-based data (Morning: 65%, Afternoon: 78%, etc.)
- Provide structured data that can be converted to tables and charts
- Use consistent data formatting throughout

Report Title: ${reportTitle}

Report Sections:
${reportSections}

Please format this as a complete professional report with:
- Professional title page style heading
- Executive summary with key metrics and data points
- Properly formatted sections with consistent headings
- Data presented in formats suitable for charts and tables
- Include specific numbers, percentages, and comparative data
- Professional language and formatting with data-rich content
- Proper citations where mentioned
- Conclusion/recommendations section with actionable data

Ensure all numerical data is clearly formatted and labeled for easy visualization.`;

      const response = await fetch(createApiUrl("/api/chat-response"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalReportPrompt
        })
      });

      if (response.ok) {
        const data = await response.json();
        const finalReport = data.message || data.response || "";
        setGeneratedReport(finalReport);
      }
    } catch (error) {
      console.error("Error generating final report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Unified function that handles the entire report generation process
  const handleGenerateFullReport = async () => {
    if (!originalPrompt.trim()) return;

    setIsGeneratingFullReport(true);
    setChunks([]);
    setCurrentChunkIndex(-1);
    setGeneratedReport("");
    setProcessingProgress(0);

    try {
      // Step 1: Analyze the prompt
      setCurrentStep("Analyzing your request and breaking it down into sections...");
      
      const analysis = await analyzeComplexPrompt(originalPrompt);
      setReportTitle(analysis.reportTitle);
      
      const newChunks: ReportChunk[] = analysis.sections.map((section: any, index: number) => ({
        id: `chunk-${index}`,
        title: section.title,
        prompt: section.prompt,
        status: 'pending' as const,
        order: index,
        estimatedTokens: section.estimatedTokens
      }));

      setChunks(newChunks);

      // Step 2: Process all chunks sequentially
      setCurrentStep("Processing report sections...");
      setIsProcessing(true);
      abortControllerRef.current = new AbortController();

      const processedChunks = [...newChunks];
      
      for (let i = 0; i < newChunks.length; i++) {
        setCurrentChunkIndex(i);
        setCurrentStep(`Processing section ${i + 1} of ${newChunks.length}: ${newChunks[i].title}`);
        
        // Update chunk status to processing
        processedChunks[i] = { ...processedChunks[i], status: 'processing' as const };
        setChunks([...processedChunks]);

        try {
          const response = await processChunk(newChunks[i]);
          
          // Update chunk with response
          processedChunks[i] = { ...processedChunks[i], response, status: 'completed' as const };
          setChunks([...processedChunks]);
          
          setProcessingProgress(((i + 1) / newChunks.length) * 80); // Use 80% for processing, 20% for final report
        } catch (error) {
          processedChunks[i] = { ...processedChunks[i], status: 'error' as const };
          setChunks([...processedChunks]);
          console.error(`Error processing chunk ${i}:`, error);
        }
      }

      // Step 3: Generate final report
      setCurrentStep("Generating final professional report...");
      setIsGeneratingReport(true);
      
      const completedChunks = processedChunks.filter(c => c.status === 'completed' && c.response);
      if (completedChunks.length > 0) {
        const reportSections = completedChunks
          .sort((a, b) => a.order - b.order)
          .map(chunk => `## ${chunk.title}\n\n${chunk.response}`)
          .join('\n\n---\n\n');

        const finalReportPrompt = `Please take these report sections and create a polished, professional, client-ready report with enhanced markdown formatting and data visualization integration. 

CRITICAL FORMATTING REQUIREMENTS:

1. MARKDOWN STRUCTURE - Use these exact patterns:
   - Main Headers: "# Executive Summary"
   - Sub Headers: "## Key Findings"
   - Bold Text: "**Important Point**"
   - Bullet Points: "- Key insight"
   - Numbered Lists: "1. First recommendation"

2. NUMERICAL DATA FORMAT - Use these exact patterns:
   - Percentages: "Positive sentiment: 65%, Negative sentiment: 15%, Neutral sentiment: 20%"
   - Comparisons: "Station A: 85%, Station B: 72%, Station C: 91%"
   - Time series: "Morning (6-10AM): 45%, Afternoon (10AM-2PM): 67%, Evening (2-6PM): 82%"
   - Metrics: "Engagement Score: 8.5/10, Recall Rate: 73%, Conversion: 12%"

3. TABLE DATA FORMAT - Use clear markdown tables:
   | Station | Sentiment Score | Engagement | Mentions |
   |---------|----------------|------------|----------|
   | KAYA FM | 8.5/10 | 73% | 245 |
   | Metro FM | 7.8/10 | 68% | 198 |
   | 5FM | 9.1/10 | 81% | 312 |

4. PROFESSIONAL FORMATTING:
   - Use source citations: 【message idx:search idx†Radio Station Name】
   - Currency formatting: R123.45
   - Quoted content: "Direct quotes from broadcasts"
   - Program identification: "Show Name on Station Name"

Report Title: ${analysis.reportTitle}

Report Sections:
${reportSections}

MANDATORY: Structure the report with clear markdown headers (# and ##), include specific numerical data, percentages, and metrics throughout. Use markdown tables for structured data. Format all content for professional presentation with proper citations and emphasis.

Create a complete professional report with:
- # Main title with professional heading
- ## Executive summary with key metrics and data points  
- ## Properly formatted sections with consistent sub-headings
- Multiple markdown tables with real numbers and percentages
- **Bold emphasis** for key findings
- - Bullet points for insights and recommendations
- Time-series data for trend analysis
- Comparative data across categories/stations
- Professional language with **emphasized** key points
- ## Conclusion/recommendations with actionable metrics

Ensure ALL content follows markdown formatting standards and includes rich numerical data.`;

        const response = await fetch(createApiUrl("/api/chat-response"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: finalReportPrompt
          })
        });

        if (response.ok) {
          const data = await response.json();
          const finalReport = data.message || data.response || "";
          setGeneratedReport(finalReport);
        }
      }

      setProcessingProgress(100);
      setCurrentStep("Report generation complete!");
      
    } catch (error) {
      console.error("Error in full report generation:", error);
      setCurrentStep("Error occurred during report generation");
    } finally {
      setIsGeneratingFullReport(false);
      setIsProcessing(false);
      setIsGeneratingReport(false);
      setCurrentChunkIndex(-1);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportTitle(template.title);
    setOriginalPrompt(`Generate a ${template.title} based on the radio broadcast data in your knowledge base. ${template.description}`);
    
    const templateChunks: ReportChunk[] = template.sections.map((section, index) => ({
      id: `template-chunk-${index}`,
      title: section.title,
      prompt: section.prompt,
      status: 'pending' as const,
      order: index,
      estimatedTokens: section.estimatedTokens
    }));

    setChunks(templateChunks);
    setShowTemplateDialog(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedReport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/chat")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Brain className="text-white" size={24} />
                </div>
                Advanced Report Generator
              </h1>
              <p className="text-gray-600 mt-1">Transform complex prompts into structured, professional reports</p>
            </div>
          </div>
          <Button
            onClick={() => setShowTemplateDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Use Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input & Configuration */}
          <div className="space-y-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Complex Prompt Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Report Title
                  </label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Complex Prompt
                  </label>
                  <Textarea
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="Enter your complex prompt here. The system will automatically break it down into manageable chunks for processing...

Example:
Generate a professional, client-ready sentiment analysis report for the Shoprite Weekend Xtra campaign using the radio broadcast data in your knowledge base. The report must be well-structured with clear headings, subheadings, tables, and bullet points where applicable. Use a polished, business-report tone (not casual)..."
                    className="min-h-[200px] w-full"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Be specific about format requirements, data sources, and desired tone for best results.
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateFullReport}
                    disabled={!originalPrompt.trim() || isGeneratingFullReport}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isGeneratingFullReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  {(chunks.length > 0 || generatedReport) && (
                    <Button
                      onClick={() => {
                        setChunks([]);
                        setGeneratedReport("");
                        setCurrentChunkIndex(-1);
                        setProcessingProgress(0);
                        setCurrentStep("");
                      }}
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Processing Progress */}
            {(isGeneratingFullReport || chunks.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      {isGeneratingFullReport ? "Report Generation Progress" : "Processing Progress"}
                    </div>
                    <Badge variant="secondary">
                      {chunks.filter(c => c.status === 'completed').length} / {chunks.length} completed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={processingProgress} className="w-full" />
                  {currentStep && (
                    <div className="text-sm text-blue-600 font-medium">
                      {currentStep}
                    </div>
                  )}
                  {!isGeneratingFullReport && chunks.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Estimated time: ~{calculateEstimatedTime()} seconds
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">🚀 Simple 3-Step Process</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>Step 1:</strong> Enter your complex request or use a template</li>
                    <li>• <strong>Step 2:</strong> Click "Generate Report" - everything happens automatically</li>
                    <li>• <strong>Step 3:</strong> Review your professional report with charts and tables</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">✍️ Writing Effective Prompts</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Be specific about the type of analysis needed</li>
                    <li>• Mention data sources and scope clearly</li>
                    <li>• Request specific charts, tables, or visualizations</li>
                    <li>• Specify tone (professional, casual, technical)</li>
                    <li>• Include citation and reference requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">⚡ What Happens Automatically</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Prompt analysis and intelligent breakdown</li>
                    <li>• Sequential processing of all sections</li>
                    <li>• Automatic chart and table generation</li>
                    <li>• Professional report compilation and formatting</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">🎯 Example Use Cases</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-blue-50 rounded border">
                      <div className="font-medium text-blue-700">Sentiment Analysis</div>
                      <div className="text-blue-600">Radio campaign performance</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded border">
                      <div className="font-medium text-green-700">Market Research</div>
                      <div className="text-green-600">Consumer behavior insights</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border">
                      <div className="font-medium text-purple-700">Competitive Analysis</div>
                      <div className="text-purple-600">Market positioning study</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded border">
                      <div className="font-medium text-orange-700">Performance Review</div>
                      <div className="text-orange-600">KPI analysis & recommendations</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chunks & Results */}
          <div className="space-y-6">
            {/* Status Overview */}
            {chunks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Processing Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {chunks.filter(c => c.status === 'completed').length}
                      </div>
                      <div className="text-xs text-blue-600">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {chunks.filter(c => c.status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-600">Remaining</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Total Sections:</span>
                      <span>{chunks.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Estimated Tokens:</span>
                      <span>{chunks.reduce((sum, chunk) => sum + (chunk.estimatedTokens || 200), 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress:</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Report Chunks */}
            {chunks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Report Sections ({chunks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chunks.map((chunk, index) => (
                      <div
                        key={chunk.id}
                        ref={el => chunkRefs.current[index] = el}
                        className={`p-3 border rounded-lg transition-all ${
                          currentChunkIndex === index
                            ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                            : chunk.status === 'completed'
                            ? 'border-green-500 bg-green-50'
                            : chunk.status === 'error'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{chunk.title}</h4>
                          <div className="flex items-center gap-2">
                            {chunk.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {chunk.status === 'processing' && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {chunk.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {chunk.estimatedTokens || 200} tokens
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {chunk.prompt}
                        </p>
                        {chunk.response && (
                          <div className="mt-2 p-2 bg-white rounded border text-xs">
                            <p className="line-clamp-3">{chunk.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Report */}
            {generatedReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                      Professional Report
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(generatedReport.length / 4)} words
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedReport)}
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={downloadReport}
                        className="bg-emerald-500 hover:bg-emerald-600"
                        title="Download report"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Report Metadata */}
                    <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Title:</span>
                        <span>{reportTitle}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Sections:</span>
                        <span>{chunks.filter(c => c.status === 'completed').length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Generated:</span>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Report Content */}
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <ReportVisualization content={generatedReport} />
                      </div>
                    </div>
                    
                    {/* Report Actions */}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Report ready for client delivery</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGeneratedReport("");
                            setChunks([]);
                            setOriginalPrompt("");
                            setReportTitle("");
                          }}
                          className="text-xs"
                        >
                          Start New Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Template Selection Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose Report Template</DialogTitle>
              <DialogDescription>
                Select a pre-configured template to get started quickly
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {REPORT_TEMPLATES.map((template, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {index === 0 ? (
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Users className="w-5 h-5 text-green-500" />
                      )}
                      {template.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.sections.length} sections</span>
                        <span>
                          ~{template.sections.reduce((sum, s) => sum + s.estimatedTokens, 0)} tokens
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p className="font-medium mb-1">Sections include:</p>
                        <ul className="space-y-1">
                          {template.sections.slice(0, 3).map((section, idx) => (
                            <li key={idx}>• {section.title}</li>
                          ))}
                          {template.sections.length > 3 && (
                            <li>• ... and {template.sections.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
