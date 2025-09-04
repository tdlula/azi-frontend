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
  Square,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Brain,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Target,
  Users
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
  const [currentStep, setCurrentStep] = useState<string>("");
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  const [chartPrompts, setChartPrompts] = useState<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-scroll to current processing chunk
  const chunkRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load chart prompts on component mount
  useEffect(() => {
    const loadChartPrompts = async () => {
      try {
        const response = await fetch(createApiUrl("/api/chart-prompts"));
        if (response.ok) {
          const data = await response.json();
          setChartPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error("Error loading chart prompts:", error);
      }
    };
    
    loadChartPrompts();
  }, []);

  useEffect(() => {
    if (currentChunkIndex >= 0 && chunkRefs.current[currentChunkIndex]) {
      chunkRefs.current[currentChunkIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentChunkIndex]);

  const calculateEstimatedTime = () => {
    const totalTokens = chunks.reduce((sum, chunk) => sum + (chunk.estimatedTokens || 300), 0);
    return Math.ceil(totalTokens / 150); // More realistic estimate: 150 tokens per second
  };

  const analyzeComplexPrompt = async (prompt: string) => {
    try {
      // Enhanced prompt analysis that includes chart prompts integration
      const chartPromptsText = chartPrompts.slice(0, 6).map(p => `${p.title}: ${p.prompt.substring(0, 200)}...`).join('\n');
      
      const response = await fetch(createApiUrl("/api/chat-response"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Analyze this complex prompt and break it down into 6-10 logical, sequential sections for comprehensive professional reporting. Each section must be designed to generate rich data visualizations, detailed tables, and charts.

CHART PROMPTS AVAILABLE FOR INTEGRATION:
${chartPromptsText}

MANDATORY REQUIREMENTS:
1. Each section must explicitly request specific chart types (donut, bar, line, radar)
2. Include data formatting requirements for automatic visualization
3. Request structured tables with specific columns and data types
4. Ask for percentage breakdowns, time-series data, and comparative metrics
5. Require professional citations and source references
6. Use chart prompts as examples for data structure requirements

Original request: "${prompt}"

Create 6-10 focused sections, each containing:
- Clear title (2-4 words)
- Comprehensive prompt that requests charts, tables, and visualizations
- Specific data format requirements
- Integration with available chart prompt patterns
- Estimated complexity (300-600 tokens)

Respond in JSON format:
{
  "reportTitle": "Professional Report Title with Data Insights",
  "sections": [
    {
      "title": "Section Title",
      "prompt": "Detailed prompt requesting specific charts, tables, and data formats with citation requirements",
      "estimatedTokens": 400
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

    // Enhanced fallback with chart prompts integration
    const topChartPrompts = chartPrompts.slice(0, 4); // Use top 4 chart prompts as examples
    
    return {
      reportTitle: "Comprehensive Data Analysis Report with Professional Visualizations",
      sections: [
        {
          title: "Executive Overview",
          prompt: `Provide an executive summary and overview for: ${prompt.substring(0, 200)}... 

CRITICAL DATA REQUIREMENTS - Follow chart prompts format:
- Overall performance: 85%, target achievement: 92%, satisfaction score: 8.7/10
- Key categories breakdown: Category A: 45%, Category B: 32%, Category C: 23%
- Create summary table with metrics, values, and status indicators
- Include time-based trends: Morning: 65%, Afternoon: 78%, Evening: 82%
- Use donut chart format for distribution data
- Request bar chart for performance comparisons
${topChartPrompts[0] ? `\nChart Prompt Example: ${topChartPrompts[0].prompt.substring(0, 200)}...` : ''}`,
          estimatedTokens: 450
        },
        {
          title: "Data Analysis & Metrics",
          prompt: `Provide comprehensive data analysis for: ${prompt.substring(0, 200)}... 

MANDATORY VISUALIZATION FORMAT:
- Station performance: Station A: 8.5/10, Station B: 7.8/10, Station C: 9.1/10
- Engagement metrics: High engagement: 73%, Medium: 22%, Low: 5%
- Time series data: 6AM: 23%, 7AM: 34%, 8AM: 45%, 9AM: 67%, 10AM: 72%
- Create detailed tables with all performance indicators
- Include line chart for hourly trends
- Use radar chart for comparative analysis
${topChartPrompts[1] ? `\nChart Prompt Example: ${topChartPrompts[1].prompt.substring(0, 200)}...` : ''}`,
          estimatedTokens: 550
        },
        {
          title: "Performance Insights",
          prompt: `Analyze key performance indicators for: ${prompt.substring(0, 200)}... 

SPECIFIC VISUALIZATION REQUIREMENTS:
- Department scores: Marketing: 88%, Sales: 91%, Operations: 76%, Support: 83%
- Quality ratings: Excellent: 67%, Good: 28%, Fair: 5%
- Regional breakdown: North: 82%, South: 77%, East: 85%, West: 79%
- Include performance comparison tables and trend analysis charts
- Format all data for automatic bar chart generation
${topChartPrompts[2] ? `\nChart Prompt Example: ${topChartPrompts[2].prompt.substring(0, 200)}...` : ''}`,
          estimatedTokens: 500
        },
        {
          title: "Strategic Recommendations",
          prompt: `Provide actionable recommendations for: ${prompt.substring(0, 200)}... 

MUST INCLUDE STRUCTURED DATA:
- Priority levels: High priority: 34%, Medium: 45%, Low: 21%
- Resource allocation: Budget 1: 40%, Budget 2: 35%, Budget 3: 25%
- Timeline projections: Q1: 25%, Q2: 35%, Q3: 25%, Q4: 15%
- Create recommendation tables with actions, timelines, expected outcomes
- Include ROI projections and implementation roadmap charts
${topChartPrompts[3] ? `\nChart Prompt Example: ${topChartPrompts[3].prompt.substring(0, 200)}...` : ''}`,
          estimatedTokens: 450
        }
      ]
    };
  };

  const processChunk = async (chunk: ReportChunk): Promise<string> => {
    // Integrate chart prompts examples for enhanced data formatting
    const relevantChartPrompts = chartPrompts
      .filter(cp => chunk.title.toLowerCase().includes(cp.title.toLowerCase().split(' ')[0]))
      .slice(0, 2);
    
    const chartExamples = relevantChartPrompts.length > 0 
      ? `\n\nCHART GENERATION EXAMPLES from available prompts:\n${relevantChartPrompts.map(cp => 
          `${cp.title}: ${cp.prompt.substring(0, 300)}...`).join('\n\n')}`
      : '';

    const enhancedPrompt = `${chunk.prompt}

PROFESSIONAL REPORT REQUIREMENTS with CHART INTEGRATION:

1. DATA FORMATTING for automatic visualization:
   - Percentages: "Category A: 65%, Category B: 25%, Category C: 10%"
   - Scores: "Performance Score: 8.5/10, Quality Rating: 92%"
   - Time series: "Morning: 45%, Afternoon: 67%, Evening: 82%"
   - Comparisons: "Station X: 85%, Station Y: 72%, Station Z: 91%"

2. STRUCTURED DATA TABLES with pipe formatting:
   | Metric | Value | Change | Status |
   |--------|-------|--------|--------|
   | Engagement | 73% | +5% | Excellent |
   | Sentiment | 8.2/10 | +0.3 | Strong |

3. PROFESSIONAL CITATIONS and REFERENCES:
   - Use format: 【source:station name†timestamp】
   - Include specific examples: "According to Station A analysis【source:Station_A†2024-01-15 10:30】"

4. CHART JSON OBJECTS - MANDATORY:
   You MUST include 1-2 complete chart JSON objects in your response using this exact format:

   DONUT CHART EXAMPLE:
   {
     "chart_type": "donut",
     "type": "donut",
     "title": "Your Chart Title",
     "data": [
       {"label": "Category A", "value": 65.0, "color": "#4CAF50"},
       {"label": "Category B", "value": 25.0, "color": "#FF9800"},
       {"label": "Category C", "value": 10.0, "color": "#F44336"}
     ],
     "metadata": {
       "total_entries": 100,
       "analysis_period": "2024-01-01 to 2024-01-31"
     }
   }

   BAR CHART EXAMPLE:
   {
     "chart_type": "bar",
     "type": "bar", 
     "title": "Performance Comparison",
     "data": [
       {"label": "Item A", "value": 85.5, "color": "#2196F3"},
       {"label": "Item B", "value": 72.3, "color": "#1976D2"}
     ]
   }

5. SPECIFIC NUMERICAL DATA requirements:
   - Use exact percentages, not ranges (73% not "70-75%")
   - Use precise scores (8.5/10 not "high score")
   - Use concrete numbers (245 mentions not "many mentions")
${chartExamples}

CRITICAL: Your response MUST include both narrative analysis AND at least one complete chart JSON object with "chart_type" and "type" fields. The chart data must relate directly to your analysis.`;

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
    // This function is now integrated into handleGenerateFullReport
    // Keeping it for compatibility but redirecting to the main function
    if (chunks.length === 0) {
      await handleGenerateFullReport();
      return;
    }

    setIsProcessing(true);
    setCurrentChunkIndex(0);
    setProcessingProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunkIndex(i);
        
        setChunks(prev => prev.map(chunk => 
          chunk.order === i 
            ? { ...chunk, status: 'processing' as const }
            : chunk
        ));

        try {
          const response = await processChunk(chunks[i]);
          
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

  const handleStopProcessing = () => {
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
   | Station A | 8.5/10 | 73% | 245 |
   | Station B | 7.8/10 | 68% | 198 |
   | Station C | 9.1/10 | 81% | 312 |

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Smart Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Professional Input Section */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Brain className="text-white" size={18} />
                  </div>
                  Intelligent Report Generator
                </CardTitle>
                <p className="text-sm text-gray-600">Enter your request and let AI create a comprehensive professional report</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-800 mb-3 block">
                    Report Request
                  </label>
                  <Textarea
                    value={originalPrompt}
                    onChange={(e) => setOriginalPrompt(e.target.value)}
                    placeholder="Describe the analysis or report you need...

Examples:
• Analyze sentiment trends for Shoprite weekend campaign
• Generate market research report for radio audience engagement
• Create competitive analysis report comparing station performance
• Produce comprehensive performance metrics analysis with visualizations"
                    className="min-h-[160px] w-full resize-none border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-800 mb-3 block">
                    Report Title (Auto-generated)
                  </label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Will be generated automatically..."
                    className="w-full border-gray-200 bg-gray-50"
                  />
                </div>

                 <div className="pt-2 border-t border-gray-100">
                  <Button
                    onClick={() => setShowTemplateDialog(true)}
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Or Use Report Template
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleGenerateFullReport}
                    disabled={!originalPrompt.trim() || isGeneratingFullReport}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg transition-all duration-200"
                  >
                    {isGeneratingFullReport ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        Analyzing & Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>

               
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Processing & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Smart Progress Indicator */}
            {(isGeneratingFullReport || chunks.length > 0) && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-white" size={18} />
                      </div>
                      Analysis Progress
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {chunks.filter(c => c.status === 'completed').length} / {chunks.length} sections
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Progress value={processingProgress} className="w-full h-2" />
                    {currentStep && (
                      <div className="text-sm text-emerald-700 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        {currentStep}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {chunks.filter(c => c.status === 'completed').length}
                      </div>
                      <div className="text-sm text-blue-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">
                        {Math.round(processingProgress)}%
                      </div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                  </div>

                  {(isProcessing || isGeneratingFullReport) && (
                    <div className="pt-3 border-t border-gray-100">
                      <Button
                        onClick={handleStopProcessing}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Processing
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Report Sections Overview */}
            {chunks.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-white" size={18} />
                    </div>
                    Report Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {chunks.map((chunk, index) => (
                      <div
                        key={chunk.id}
                        ref={el => chunkRefs.current[index] = el}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          currentChunkIndex === index
                            ? 'border-blue-400 bg-blue-50 shadow-md'
                            : chunk.status === 'completed'
                            ? 'border-green-400 bg-green-50'
                            : chunk.status === 'error'
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-800">{chunk.title}</h4>
                          <div className="flex items-center gap-2">
                            {chunk.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {chunk.status === 'processing' && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {chunk.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        {chunk.response && (
                          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                            <p className="line-clamp-2">{chunk.response.substring(0, 120)}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Report Output */}
            {generatedReport && (
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="text-white" size={18} />
                      </div>
                      Professional Report
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedReport)}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={downloadReport}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Report Metadata */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-800">{reportTitle}</div>
                        <div className="text-xs text-gray-600">Title</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-800">{chunks.filter(c => c.status === 'completed').length}</div>
                        <div className="text-xs text-gray-600">Sections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-800">{new Date().toLocaleDateString()}</div>
                        <div className="text-xs text-gray-600">Generated</div>
                      </div>
                    </div>
                    
                    {/* Report Content with Visualization */}
                    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <ReportVisualization content={generatedReport} />
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm text-emerald-600 font-medium">✓ Report ready download</span>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedReport("");
                          setChunks([]);
                          setOriginalPrompt("");
                          setReportTitle("");
                          setProcessingProgress(0);
                          setCurrentStep("");
                        }}
                        className="border-gray-200 hover:bg-gray-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Professional Template Selection Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold">Professional Report Templates</DialogTitle>
              <DialogDescription className="text-base">
                Choose from expertly crafted templates designed for comprehensive analysis and professional reporting
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {REPORT_TEMPLATES.map((template, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-xl transition-all duration-200 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        index === 0 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {index === 0 ? (
                          <TrendingUp className="text-white" size={20} />
                        ) : (
                          <Users className="text-white" size={20} />
                        )}
                      </div>
                      {template.title}
                    </CardTitle>
                    <p className="text-gray-600 leading-relaxed">{template.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-100">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">{template.sections.length}</div>
                        <div className="text-sm text-gray-600">Sections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {Math.round(template.sections.reduce((sum, s) => sum + s.estimatedTokens, 0) / 100)}min
                        </div>
                        <div className="text-sm text-gray-600">Est. Time</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 text-sm">Report Sections Include:</h4>
                      <div className="space-y-2">
                        {template.sections.slice(0, 4).map((section, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            <span className="text-gray-700">{section.title}</span>
                          </div>
                        ))}
                        {template.sections.length > 4 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span className="text-gray-500 italic">+ {template.sections.length - 4} more sections</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Template Benefits</h4>
                  <p className="text-sm text-blue-700">
                    Each template includes pre-configured sections optimized for comprehensive analysis, 
                    automatic chart generation, and professional formatting. Templates integrate with our 
                    chart prompts system to ensure rich data visualizations.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
