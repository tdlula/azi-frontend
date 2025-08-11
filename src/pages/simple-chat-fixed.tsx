import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Upload, 
  BarChart3, 
  HelpCircle, 
  Download, 
  Share2, 
  Copy, 
  Check,
  BarChart,
  TrendingUp,
  PieChart,
  Target,
  Zap,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
  Database,
  LineChart,
  Activity,
  Cloud,
  Hash,
  Grid3X3,
  ChevronUp,
  ChevronDown,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Settings,
  Trash2
} from "lucide-react";
import ChartRenderer from "@/components/charts/ChartRenderer";
import SentimentTable from "@/components/SentimentTable";
import DataTable from "@/components/ui/DataTable";
import DrillDownModal from "@/components/modals/DrillDownModal";
import SmartHelpOverlay from "@/components/help/SmartHelpOverlay";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import "@/styles/chat-animations.css";

import jsPDF from "jspdf";
import { Link } from "wouter";
import { useAppContext } from "@/contexts/AppContext";
import { detectMultipleTableFormats, hasTableData } from "@/utils/tableDetection";
import ReportGenerator from "@/components/ReportGenerator";
import { CacheManager } from "@/utils/cacheUtils";
import { fetchEnhancedReportDataCached, EnhancedReportData } from "@/utils/enhancedReportData";

// Generate unique IDs for messages to prevent React key warnings
let messageIdCounter = 0;
const generateUniqueId = () => {
  return Date.now() + ++messageIdCounter;
};

interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chartData?: any;
  sentimentData?: any;
  tableData?: any;
}

interface Suggestion {
  title: string;
  category: string;  
  description: string;
  prompt: string;
  icon: string;
  color: string;
}

// Function to render message content with table detection
const renderMessageContent = (content: string) => {
  // First check if the content contains table data
  const tableData = detectMultipleTableFormats(content);
  
  if (tableData) {
    // Extract non-table content (content before and after table)
    const lines = content.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    
    // Find table boundaries in the content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|') && line.split('|').length >= 3) {
        if (tableStartIndex === -1) {
          tableStartIndex = i;
        }
        tableEndIndex = i;
      }
    }
    
    const beforeTable = tableStartIndex > 0 ? lines.slice(0, tableStartIndex).join('\n').trim() : '';
    const afterTable = tableEndIndex < lines.length - 1 ? lines.slice(tableEndIndex + 1).join('\n').trim() : '';
    
    return (
      <div>
        {beforeTable && (
          <div className="prose prose-sm max-w-none mb-4 text-white">
            {beforeTable.split('\n').map((line: string, index: number) => {
              if (line.trim() === '') return <br key={index} />;
              return <p key={index} className="mb-2 leading-relaxed text-white">{line}</p>;
            })}
          </div>
        )}
        <DataTable data={tableData} title={tableData.title} />
        {afterTable && (
          <div className="prose prose-sm max-w-none mt-4 text-white">
            {afterTable.split('\n').map((line: string, index: number) => {
              if (line.trim() === '') return <br key={index} />;
              return <p key={index} className="mb-2 leading-relaxed text-white">{line}</p>;
            })}
          </div>
        )}
      </div>
    );
  }
  
  // No table detected, render as normal text
  return (
    <div className="prose prose-sm max-w-none text-white">
      {content.split('\n').map((line: string, index: number) => {
        if (line.trim() === '') return <br key={index} />;
        return <p key={index} className="mb-2 leading-relaxed text-white">{line}</p>;
      })}
    </div>
  );
};

export default function SimpleChatFixedPage() {
  // ...existing code...
  // Restore context state extraction for chat page
  const { state, dispatch, loadMessages, loadSuggestions } = useAppContext();
  const messages = state.messages;
  const suggestions = state.suggestions;
  const isLoading = state.isLoading;
  const isSuggestionsLoading = state.isSuggestionsLoading;
  const [input, setInput] = useState("");
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showSuggestionHelp, setShowSuggestionHelp] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState("");

  const [assistantPersonality, setAssistantPersonality] = useState("Analytical");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Settings dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [enhancedReportData, setEnhancedReportData] = useState<EnhancedReportData | null>(null);
  const [isLoadingEnhancedData, setIsLoadingEnhancedData] = useState(false);

  // Drill down modal state
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    data: any;
    title: string;
    subtitle: string;
    type: 'chart' | 'metrics';
    fields: Array<{ label: string; value: string | number; key: string }>;
  }>({
    isOpen: false,
    data: null,
    title: "",
    subtitle: "",
    type: 'chart',
    fields: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Restore sidebarRef for sidebar DOM access
  const sidebarRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: "smooth" 
    });
  };

  useEffect(() => {
    // Ensure body can scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Add custom scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      html {
        scrollbar-width: auto;
        scrollbar-color: #4a5568 #e2e8f0;
      }
      
      html::-webkit-scrollbar {
        width: 12px;
      }
      
      html::-webkit-scrollbar-track {
        background: #e2e8f0;
      }
      
      html::-webkit-scrollbar-thumb {
        background: #4a5568;
        border-radius: 6px;
      }
      
      html::-webkit-scrollbar-thumb:hover {
        background: #2d3748;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ 
        top: document.documentElement.scrollHeight, 
        behavior: "smooth" 
      });
    }, 100);
  }, [messages]);

  // Close settings dropdown when loading starts
  useEffect(() => {
    if ((isLoading || isGeneratingReport || isLoadingEnhancedData) && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [isLoading, isGeneratingReport, isLoadingEnhancedData, isSettingsOpen]);

  useEffect(() => {
    // Only load data if not already available in context
    if (messages.length === 0) {
      loadMessages(1); // Load messages for default conversation ID 1
    }
    if (suggestions.length === 0 && !isSuggestionsLoading) {
      fetchSuggestions();
    }
  }, []);

  const fetchSuggestions = async () => {
    // Fetch chart suggestions directly from backend
    try {
      const response = await fetch('/api/chart-suggestions');
      if (response.ok) {
        const data = await response.json();
        // Use 'suggestions' array from response
        dispatch({ type: 'SET_SUGGESTIONS', payload: data.suggestions || data.prompts || [] });
      }
    } catch (error) {
      console.error('Failed to load chart suggestions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    setInput("");
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Check for chart generation requests - only explicit visual requests
      const chartKeywords = [
        'chart', 'graph', 'plot', 'visual', 'visualization', 'visualize',
        'bar chart', 'line chart', 'pie chart', 'area chart', 'scatter plot', 
        'create chart', 'generate chart', 'show chart', 'display chart',
        'trending chart', 'trends chart', 'distribution chart', 'comparison chart'
      ];
      const hasChartKeywords = chartKeywords.some(keyword => 
        input.toLowerCase().includes(keyword)
      );
      
      console.log('Chart keyword check:', {
        input: input.toLowerCase(),
        hasChartKeywords,
        matchingKeywords: chartKeywords.filter(keyword => input.toLowerCase().includes(keyword))
      });

      if (hasChartKeywords) {
        // Route to chart generation system
        const chartResponse = await fetch("/api/generate-chart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: input }),
        });

        if (chartResponse.ok) {
          const rawChartData = await chartResponse.json();
          
          // Normalize chart data using the same logic as dashboard
          const normalizeChartData = (chart: any) => {
            if (!chart || (!chart.data && !chart.datasets)) {
              console.warn('🔧 Chart normalization: No chart or data found', chart);
              return chart;
            }
            
            try {
              const normalizedChart = { ...chart };
              
              // Determine chart type - handle both 'type' and 'chart_type' fields
              const chartType = chart.type || chart.chart_type || 'bar';
              normalizedChart.type = chartType;
              normalizedChart.chart_type = chartType;
              
              // Ensure title exists
              if (!normalizedChart.title) {
                normalizedChart.title = 'Generated Chart';
              }
              
              console.log('🔧 Chart normalized with type:', chartType);
              return normalizedChart;
              
            } catch (error) {
              console.error('🔧 Error normalizing chart data:', error);
              // Return chart with default type as fallback
              return {
                ...chart,
                type: 'bar',
                chart_type: 'bar',
                title: chart.title || 'Generated Chart'
              };
            }
          };
          
          const chartData = normalizeChartData(rawChartData);
          
          // Enhanced debugging for chart data structure
          console.log('[Chart Generation] Raw chart data from API:', rawChartData);
          console.log('[Chart Generation] Normalized chart data:', chartData);
          console.log('[Chart Generation] Chart data analysis:', {
            hasType: !!(chartData.type || chartData.chart_type),
            type: chartData.type || chartData.chart_type,
            hasData: !!chartData.data,
            dataType: Array.isArray(chartData.data) ? 'array' : typeof chartData.data,
            dataLength: Array.isArray(chartData.data) ? chartData.data.length : Object.keys(chartData.data || {}).length,
            hasTitle: !!chartData.title,
            allKeys: Object.keys(chartData)
          });
          
          const aiMessage: Message = {
            id: generateUniqueId(),
            content: chartData.message || "Here's your requested chart:",
            role: "assistant",
            timestamp: new Date(),
            chartData: chartData,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          return;
        } else {
          console.error('[Chart Generation] Chart API request failed:', chartResponse.status, chartResponse.statusText);
          // Fall through to regular chat processing if chart generation fails
        }
      }

      // Check for sentiment analysis with format specification
      const isTableFormatRequest = input.toLowerCase().includes("table format");
      const isSummaryFormatRequest = input.toLowerCase().includes("summary format");
      const sentimentKeywords = ['sentiment', 'feeling', 'opinion', 'positive', 'negative', 'compare sentiment', 'sentiment comparison'];
      const hasSentimentKeywords = sentimentKeywords.some(keyword => 
        input.toLowerCase().includes(keyword)
      );

      // Auto-detect sentiment comparison requests (should default to table format)
      const isSentimentComparison = input.toLowerCase().includes('compare') || 
                                   input.toLowerCase().includes('comparison') || 
                                   input.toLowerCase().includes('vs') ||
                                   input.toLowerCase().includes('versus');

      if (hasSentimentKeywords && (isTableFormatRequest || isSummaryFormatRequest || isSentimentComparison)) {
        // Call sentiment API with format parameter - default to table for comparisons
        const format = (isTableFormatRequest || isSentimentComparison) ? "table" : "summary";
        const sentimentResponse = await fetch("/api/chat/extract-sentiment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            text: input,
            format: format 
          }),
        });

        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          
          if (format === "table") {
            const aiMessage: Message = {
              id: generateUniqueId(),
              content: sentimentData.analysis || "Here's your sentiment analysis:",
              role: "assistant",
              timestamp: new Date(),
              sentimentData: sentimentData.table || sentimentData,
            };
            dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          } else {
            const aiMessage: Message = {
              id: generateUniqueId(),
              content: sentimentData.analysis || sentimentData.summary || "Analysis complete.",
              role: "assistant",
              timestamp: new Date(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          }
          return;
        }
      }

      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Regular chat API call with conversation history
      const response = await fetch("/api/chat-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input,
          conversationHistory: conversationHistory
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if the response contains chart data
        if (data.chartData) {
          const aiMessage: Message = {
            id: generateUniqueId(),
            content: data.message || "Here's a visualization based on your request:",
            role: "assistant",
            timestamp: new Date(),
            chartData: data.chartData,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
        } else {
          const aiMessage: Message = {
            id: generateUniqueId(),
            content: data.message || data.response || "I'm here to help with your data analysis needs.",
            role: "assistant",
            timestamp: new Date(),
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorContent = "I encountered an error while processing your request. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorContent = "Request timed out. Please try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorContent = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('500')) {
          errorContent = "Server error. Please try again in a moment.";
        } else if (error.message.includes('404')) {
          errorContent = "Service temporarily unavailable. Please try again.";
        }
      }
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name;
    const fileSize = file.size;
    const isPDF = file.type === 'application/pdf';
    const maxSize = isPDF ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for PDF, 10MB for text

    // File validation
    if (fileSize > maxSize) {
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: `File is too large. Please upload a ${isPDF ? 'PDF' : 'text'} file smaller than ${isPDF ? '50MB' : '10MB'}.`,
        role: "assistant",
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      return;
    }

    setUploadedFile(fileName);
    setIsUploadProcessing(true);

    const uploadMessage: Message = {
      id: generateUniqueId(),
      content: `Analyzing ${fileName}...`,
      role: "assistant", 
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: uploadMessage });

    try {
      const formData = new FormData();
      formData.append('document', file);

      const endpoint = isPDF ? '/api/upload-pdf' : '/api/upload-document';
      const uploadResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        
        const processingMessage: Message = {
          id: generateUniqueId(),
          content: isPDF ? "PDF processed successfully! Analysis:" : "Document analyzed successfully! Here are the insights:",
          role: "assistant",
          timestamp: new Date(),
        };
        dispatch({ type: "ADD_MESSAGE", payload: processingMessage });

        if (data.analysis) {
          // Format analysis response properly
          const analysis = data.analysis;
          let formattedContent = "";
          
          if (analysis.summary) {
            formattedContent += `**Summary:**\n${analysis.summary}\n\n`;
          }
          
          if (analysis.keyInsights && Array.isArray(analysis.keyInsights)) {
            formattedContent += `**Key Insights:**\n`;
            analysis.keyInsights.forEach((insight: string, index: number) => {
              formattedContent += `${index + 1}. ${insight}\n`;
            });
            formattedContent += `\n`;
          }
          
          if (analysis.sentiment) {
            formattedContent += `**Sentiment Analysis:**\n`;
            formattedContent += `Overall: ${analysis.sentiment.overall}\n`;
            formattedContent += `Score: ${analysis.sentiment.score}/10\n`;
            formattedContent += `Confidence: ${Math.round(analysis.sentiment.confidence * 100)}%\n\n`;
          }
          
          if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
            formattedContent += `**Recommendations:**\n`;
            analysis.recommendations.forEach((rec: string, index: number) => {
              formattedContent += `${index + 1}. ${rec}\n`;
            });
          }

          const analysisMessage: Message = {
            id: generateUniqueId(),
            content: formattedContent || "Analysis completed successfully.",
            role: "assistant",
            timestamp: new Date(),
          };
          dispatch({ type: "ADD_MESSAGE", payload: analysisMessage });
        }

        if (data.chartData) {
          const chartMessage: Message = {
            id: generateUniqueId(),
            content: "Here's a visual representation of your document:",
            role: "assistant",
            timestamp: new Date(),
            chartData: data.chartData,
          };
          dispatch({ type: "ADD_MESSAGE", payload: chartMessage });
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorContent = "I encountered an error while processing your document. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('too large') || error.message.includes('size')) {
          errorContent = `File is too large. Please upload a ${isPDF ? 'PDF' : 'text'} file smaller than ${isPDF ? '50MB' : '10MB'}.`;
        } else if (error.message.includes('timeout')) {
          errorContent = "File upload timed out. Please try again with a smaller file.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorContent = "Network error during upload. Please check your connection and try again.";
        } else if (error.message.includes('unsupported') || error.message.includes('format')) {
          errorContent = `Unsupported file format. Please upload a ${isPDF ? 'PDF' : 'text (.txt)'} file.`;
        }
      }
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      };
      dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
    } finally {
      setIsUploadProcessing(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadChatHistory = async () => {
    try {
      if (messages.length === 0) {
        alert("No chat history to download.");
        return;
      }

      const chatContent = messages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n\n');
      
      const blob = new Blob([chatContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading chat:', error);
      alert("Failed to download chat history. Please try again.");
    }
  };

  const shareChatHistory = async () => {
    try {
      if (messages.length === 0) {
        alert("No chat history to share.");
        return;
      }

      const summary = messages.slice(-3).map(msg => 
        `${msg.role}: ${msg.content.substring(0, 100)}...`
      ).join('\n');
      
      if ('share' in navigator && navigator.share) {
        await navigator.share({
          title: 'AZI Chat Summary',
          text: summary,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        alert('Summary copied to clipboard!');
      } else {
        alert('Sharing and clipboard not supported in this browser.');
      }
    } catch (error) {
      console.error('Error sharing chat:', error);
      // Fallback to clipboard if sharing fails
      try {
        const summary = messages.slice(-3).map(msg => 
          `${msg.role}: ${msg.content.substring(0, 100)}...`
        ).join('\n');
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(summary);
          alert('Chat summary copied to clipboard!');
        } else {
          alert('Failed to share or copy chat summary. Browser not supported.');
        }
      } catch (clipboardError) {
        alert('Failed to share or copy chat summary. Please try again.');
      }
    }
  };

  const copyMessage = async (message: string, id: number, event?: React.MouseEvent) => {
    // Prevent event bubbling to parent chat bubble
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      console.log('Copy button clicked for message:', id); // Debug log
      
      // Check if clipboard is available
      if (!navigator.clipboard) {
        console.error('Clipboard API not available');
        alert('Clipboard not supported in this browser. Please manually copy the text.');
        return;
      }

      await navigator.clipboard.writeText(message);
      console.log('Message copied successfully'); // Debug log
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      
      // Optional: Show a brief success message
      // You can remove this if you prefer just the visual feedback
    } catch (error) {
      console.error('Error copying message:', error);
      
      // Fallback for browsers with restricted clipboard access
      try {
        // Create a temporary textarea for fallback copying
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        console.log('Fallback copy successful');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        alert('Failed to copy message. Please manually select and copy the text.');
      }
    }
  };

  const useSuggestion = (prompt: string) => {
    setInput(prompt);
  };

  // Drill-down analysis functions
  const analyzeChartDrillDown = async (data: any, type: string, title: string) => {
    const response = await fetch('/api/chart-drill-down', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataPoint: data,
        chartType: data.chartType || type,
        chartTitle: data.chartTitle || title,
        topic: null // Chat doesn't have topic filtering like dashboard
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const analyzeMetricsDrillDown = async (data: any, type: string, title: string) => {
    console.log('🔍 analyzeMetricsDrillDown called with:', { data, type, title });
    
    const response = await fetch('/api/metrics-drill-down', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataPoint: data,
        metricType: data.metricType || type,
        metricTitle: data.metricTitle || title,
        topic: null // Chat doesn't have topic filtering like dashboard
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Settings functionality
  const forceRefresh = async () => {
    try {
      console.log('🔄 Force refreshing chat data...');
      // Clear the messages and reload suggestions
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      await loadSuggestions();
      setIsSettingsOpen(false);
      alert('Chat data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please try again.');
    }
  };

  const clearCache = () => {
    try {
      console.log('🗑️ Clearing all chat cache...');
      CacheManager.clearAllCache();
      
      // Show cache stats after clearing
      const stats = CacheManager.getCacheStats();
      alert(`Cache cleared successfully!\n\nRemaining items: ${stats.count}\nTotal size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache. Please try again.');
    }
  };

  const generateReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      setIsLoadingEnhancedData(true);
      
      // Fetch enhanced report data from OpenAI assistant
      console.log('Fetching enhanced report data...');
      const enhancedData = await fetchEnhancedReportDataCached({
        topic: 'general',
        dateRange: { from: '30 days ago', to: 'today' }
      });
      
      setEnhancedReportData(enhancedData);
      setIsLoadingEnhancedData(false);
      
      console.log('Generating chat report PDF programmatically...');
      
      // Create PDF with proper settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to draw text with word wrap
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        let lineY = y;
        
        for (const line of lines) {
          checkPageBreak(fontSize * 0.5);
          pdf.text(line, x, lineY);
          lineY += fontSize * 0.5;
        }
        
        return lineY;
      };
      
      // Helper function to draw simple bar chart
      const drawBarChart = (data: any[], x: number, y: number, width: number, height: number, title: string) => {
        checkPageBreak(height + 20);
        
        // Chart title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, x, y);
        currentY = y + 10;
        
        // Chart border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, currentY, width, height);
        
        if (data && data.length > 0) {
          const maxValue = Math.max(...data.map(item => item.value || 0));
          const barWidth = width / data.length;
          
          data.forEach((item, index) => {
            const barHeight = (item.value || 0) / maxValue * (height - 20);
            const barX = x + (index * barWidth) + (barWidth * 0.1);
            const barY = currentY + height - barHeight - 10;
            
            // Draw bar
            pdf.setFillColor(54, 162, 235); // Blue color
            pdf.rect(barX, barY, barWidth * 0.8, barHeight, 'F');
            
            // Draw value label
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(item.value || 0), barX + (barWidth * 0.4), barY - 2, { align: 'center' });
            
            // Draw category label (rotated)
            const label = item.name || item.label || `Item ${index + 1}`;
            const labelX = barX + (barWidth * 0.4);
            const labelY = currentY + height + 5;
            pdf.text(label.substring(0, 10), labelX, labelY, { align: 'center', angle: 45 });
          });
        }
        
        currentY += height + 15;
        return currentY;
      };
      
      // Helper function to draw simple pie chart
      const drawPieChart = (data: any[], x: number, y: number, radius: number, title: string) => {
        checkPageBreak(radius * 2 + 30);
        
        // Chart title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, x, y);
        currentY = y + 10;
        
        if (data && data.length > 0) {
          const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
          const centerX = x + radius;
          const centerY = currentY + radius;
          
          let startAngle = 0;
          const colors = [
            [255, 99, 132],   // Red
            [54, 162, 235],   // Blue
            [255, 205, 86],   // Yellow
            [75, 192, 192],   // Green
            [153, 102, 255],  // Purple
            [255, 159, 64]    // Orange
          ];
          
          data.forEach((item, index) => {
            const value = item.value || 0;
            const angle = (value / total) * 360;
            const color = colors[index % colors.length];
            
            // Draw pie slice
            pdf.setFillColor(color[0], color[1], color[2]);
            
            // Calculate arc points (simplified approach)
            const endAngle = startAngle + angle;
            const midAngle = startAngle + (angle / 2);
            
            // Draw sector using lines (simplified)
            const startX = centerX + Math.cos(startAngle * Math.PI / 180) * radius;
            const startY = centerY + Math.sin(startAngle * Math.PI / 180) * radius;
            const endX = centerX + Math.cos(endAngle * Math.PI / 180) * radius;
            const endY = centerY + Math.sin(endAngle * Math.PI / 180) * radius;
            
            // Draw triangle from center
            pdf.triangle(centerX, centerY, startX, startY, endX, endY, 'F');
            
            // Draw label
            const labelX = centerX + Math.cos(midAngle * Math.PI / 180) * (radius + 15);
            const labelY = centerY + Math.sin(midAngle * Math.PI / 180) * (radius + 15);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${item.name || item.label}: ${value}`, labelX, labelY);
            
            startAngle = endAngle;
          });
        }
        
        currentY += radius * 2 + 20;
        return currentY;
      };
      
      // Enhanced helper function to draw table with improved formatting
      const drawTable = (data: any, x: number, y: number, width: number, title: string) => {
        if (!data) return y;
        
        checkPageBreak(80); // Ensure space for title + header + at least one row
        
        let startY = y;
        
        // Table title with better spacing
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235); // Blue color for title
        pdf.text(title, x, startY);
        startY += 15; // More space after title
        
        let tableData: any[] = [];
        
        // Handle different data formats
        if (Array.isArray(data)) {
          if (data.length === 0) return startY;
          
          // Check if it's an array of objects
          if (typeof data[0] === 'object' && data[0] !== null) {
            tableData = data;
          } else {
            // Convert array of primitives to objects
            tableData = data.map((item, index) => ({ Index: index + 1, Value: item }));
          }
        } else if (typeof data === 'object') {
          // Convert object to array of key-value pairs
          tableData = Object.entries(data).map(([key, value]) => ({ Property: key, Value: value }));
        } else {
          // Single value
          tableData = [{ Value: data }];
        }
        
        if (tableData.length === 0) return startY;
        
        // Limit table size to prevent overflow
        if (tableData.length > 15) {
          tableData = tableData.slice(0, 15);
          // Add indication of truncation
          tableData.push({ '...': '(more data truncated for display)' });
        }
        
        // Get headers from first row
        const headers = Object.keys(tableData[0]);
        const maxCols = Math.min(headers.length, 5); // Limit columns to prevent overflow
        const actualHeaders = headers.slice(0, maxCols);
        const colWidth = Math.max(width / actualHeaders.length, 30); // Minimum column width
        const actualWidth = colWidth * actualHeaders.length;
        const rowHeight = 10; // Increased row height for better readability
        
        // Draw table background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(x, startY, actualWidth, (tableData.length + 1) * rowHeight, 'F');
        
        // Draw header background
        pdf.setFillColor(226, 232, 240);
        pdf.rect(x, startY, actualWidth, rowHeight, 'F');
        
        // Draw headers
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
        actualHeaders.forEach((header, index) => {
          const colX = x + (index * colWidth) + 3;
          let headerText = String(header);
          if (headerText.length > 12) {
            headerText = headerText.substring(0, 9) + '...';
          }
          pdf.text(headerText, colX, startY + 7);
        });
        
        startY += rowHeight;
        
        // Draw data rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        tableData.forEach((row, rowIndex) => {
          checkPageBreak(rowHeight + 5);
          
          // Alternate row colors for better readability
          if (rowIndex % 2 === 1) {
            pdf.setFillColor(241, 245, 249);
            pdf.rect(x, startY, actualWidth, rowHeight, 'F');
          }
          
          actualHeaders.forEach((header, colIndex) => {
            const colX = x + (colIndex * colWidth) + 3;
            let value = row[header];
            
            // Handle different value types
            if (value === null || value === undefined) {
              value = '-';
            } else if (typeof value === 'object') {
              value = JSON.stringify(value);
            } else {
              value = String(value);
            }
            
            // Truncate long values based on column width
            const maxChars = Math.floor(colWidth / 5); // Approximate chars per column width
            if (value.length > maxChars) {
              value = value.substring(0, maxChars - 3) + '...';
            }
            
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, colX, startY + 7);
          });
          
          startY += rowHeight;
        });
        
        // Draw table border
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y + 15, actualWidth, startY - (y + 15));
        
        // Add extra spacing after table
        startY += 15;
        return startY;
      };
        
      // START GENERATING PDF CONTENT
      
      // Title and header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text('AI Chat Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      
      // Report metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, currentY);
      currentY += 6;
      pdf.text(`Total Messages: ${messages.length}`, margin, currentY);
      currentY += 6;
      pdf.text(`Topic: General Chat Analysis`, margin, currentY);
      currentY += 15;
      
      // Separator line
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Chat Messages Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Chat History', margin, currentY);
      currentY += 10;
      
      // Process each message
      for (const message of messages) {
        checkPageBreak(30);
        
        // Message header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const userColor = [29, 78, 216] as const;
        const assistantColor = [5, 150, 105] as const;
        const textColor = message.role === 'user' ? userColor : assistantColor;
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        const roleLabel = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
        pdf.text(roleLabel, margin, currentY);
        
        // Timestamp
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const timestamp = `${message.timestamp.toLocaleDateString()} ${message.timestamp.toLocaleTimeString()}`;
        pdf.text(timestamp, pageWidth - margin - 40, currentY);
        currentY += 8;
        
        // Message content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const content = typeof message.content === 'string' ? message.content : String(message.content || '');
        currentY = addWrappedText(content, margin + 5, currentY, contentWidth - 10);
        
        // Check for chart data and render charts
        if (message.chartData) {
          try {
            const chartData = message.chartData;
            
            if (chartData.type === 'bar' && chartData.data) {
              currentY = drawBarChart(chartData.data, margin, currentY + 5, contentWidth * 0.8, 60, chartData.title || 'Chart');
            } else if (chartData.type === 'pie' && chartData.data) {
              currentY = drawPieChart(chartData.data, margin, currentY + 5, 40, chartData.title || 'Chart');
            }
          } catch (error) {
            console.warn('Error rendering chart in PDF:', error);
          }
        }
        
        // Check for table data with enhanced format detection
        if (message.sentimentData || (message as any).tableData) {
          try {
            const tableData = message.sentimentData || (message as any).tableData;
            if (tableData) {
              currentY = drawTable(tableData, margin, currentY + 5, contentWidth, 'Data Table');
            }
          } catch (error) {
            console.warn('Error rendering table in PDF:', error);
          }
        }
        
        // Also check for table-like data in message content
        if (message.role === 'assistant' && message.content) {
          try {
            // Try to detect structured data in text content
            const lines = message.content.split('\n');
            let detectedTable: any[] = [];
            
            // Look for pipe-separated tables (| header1 | header2 |)
            const tableLines = lines.filter(line => line.includes('|') && line.split('|').length > 2);
            if (tableLines.length >= 2) {
              const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
              if (headers.length > 0) {
                detectedTable = tableLines.slice(1).map(line => {
                  const values = line.split('|').map(v => v.trim()).filter(v => v);
                  const row: any = {};
                  headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                  });
                  return row;
                }).filter(row => Object.values(row).some(v => v));
                
                if (detectedTable.length > 0) {
                  currentY = drawTable(detectedTable, margin, currentY + 5, contentWidth, 'Detected Data Table');
                }
              }
            }
          } catch (error) {
            console.warn('Error detecting table in message content:', error);
          }
        }
        
        currentY += 10;
      }
      
      // Enhanced Analysis Section
      if (enhancedData) {
        checkPageBreak(50);
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(146, 64, 14); // Orange color
        pdf.text('🤖 Enhanced AI Analysis', margin, currentY);
        currentY += 10;
        
        if (enhancedData.executiveSummary?.keyTakeaways) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Key Takeaways:', margin, currentY);
          currentY += 8;
          
          enhancedData.executiveSummary.keyTakeaways.forEach((takeaway, index) => {
            checkPageBreak(15);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            currentY = addWrappedText(`• ${takeaway}`, margin + 5, currentY, contentWidth - 10);
            currentY += 2;
          });
        }
      }
      
      // Save PDF
      const filename = `chat_report_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.pdf`;
      pdf.save(filename);
      
      console.log('✅ Chat report PDF generated programmatically');
      alert('Chat report PDF with programmatically drawn charts and tables generated successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
      setIsLoadingEnhancedData(false);
      setIsSettingsOpen(false);
    }
  };

  // Handle chart click for drill-down analysis
  const handleChartClick = (dataPoint: any, chartType: string, chartTitle: string) => {
    setDrillDownModal({
      isOpen: true,
      data: dataPoint,
      title: `Chart Analysis: ${dataPoint?.label || dataPoint?.category || 'Data Point'}`,
      subtitle: "Interactive chart drilling with detailed analysis from AI assistant",
      type: 'chart',
      fields: [
        { label: 'Chart Type', value: chartType, key: 'chartType' },
        { label: 'Value', value: dataPoint?.value || 'N/A', key: 'value' },
        { label: 'Label', value: dataPoint?.label || dataPoint?.category || 'Unknown', key: 'label' }
      ]
    });
  };

  return (
    <div className="chatbot-page min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      {/* Main Content Area */}
      <div className="flex flex-col w-full">
        {/* Consistent Header */}
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

      <div className="flex flex-row relative w-full min-w-full max-w-full">
        {/* Top right Show Suggestion Prompt button (only when dialog is closed) */}
        <div className="absolute right-8 top-4 z-50" style={{ display: 'none' }}>
          <div
            style={{
              transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)',
              opacity: !suggestionsDialogOpen ? 1 : 0,
              transform: !suggestionsDialogOpen ? 'translateY(0)' : 'translateY(-20px)',
              pointerEvents: !suggestionsDialogOpen ? 'auto' : 'none',
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuggestionsDialogOpen(true)}
              className="rounded-full px-4 h-10 shadow-lg"
            >
              Show Suggestion Prompt
            </Button>
          </div>
        </div>

        {/* Suggestions Docked Right */}
        {false && suggestionsDialogOpen && (
          <div
            ref={sidebarRef}
            className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg z-40 flex flex-col"
            style={{
              willChange: 'transform, opacity',
              transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)',
              opacity: suggestionsDialogOpen ? 1 : 0,
              transform: suggestionsDialogOpen ? 'translateX(0)' : 'translateX(100px)',
              boxShadow: suggestionsDialogOpen ? '-20px 0 60px rgba(0,0,0,0.15)' : 'none',
              minWidth: '320px',
              maxWidth: '400px',
            }}
          >
            {/* ...existing code for suggestions panel... */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-medium text-muted-foreground">Radio Analysis Suggestions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuggestionsDialogOpen(false)}
                className="h-8 w-8 p-0 hover:bg-secondary/50 transition-transform duration-300"
                title="Close Suggestions"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            {/* Suggestions Search Input */}
            <div className="px-4 pt-3 pb-2">
              <Input
                type="text"
                value={suggestionSearch}
                onChange={e => setSuggestionSearch(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full h-9 rounded-md border border-border px-3 text-sm focus:border-primary focus:ring-0"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2" style={{ paddingBottom: '64px' }}>
              {/* ...existing code for suggestions list... */}
              {isSuggestionsLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <Card key={`skeleton-${index}`} className="p-3 animate-pulse mb-2">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-8 h-8 bg-muted rounded-md flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="h-3 bg-muted rounded mb-1"></div>
                          <div className="h-2 bg-muted/70 rounded w-3/4 mx-auto"></div>
                        </div>
                      </div>
                    </Card>
                  ))
                : suggestions
                    .filter(suggestion =>
                      (suggestion.title?.toLowerCase() || '').includes(suggestionSearch.toLowerCase())
                    )
                    .slice(0, showAllSuggestions ? suggestions.length : 12)
                    .map((suggestion, index) => (
                      <Card
                        key={`suggestion-${index}`}
                        className="p-3 cursor-pointer hover:bg-secondary/50 transition-all group suggestion-card interactive-hover ripple-effect fade-in-up mb-2"
                        onClick={() => useSuggestion(suggestion.prompt)}
                        style={{ animationDelay: `${index * 50}ms` }}
                        title={suggestion.purpose || ''}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <h3 className="font-medium text-xs mb-1 group-hover:text-primary transition-colors leading-tight">
                            {suggestion.title ? suggestion.title : <span className="text-muted-foreground">No title</span>}
                          </h3>
                        </div>
                      </Card>
                    ))}
              {suggestions.length > 12 && (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                    className="text-xs hover:bg-secondary/50"
                  >
                    {showAllSuggestions ? `Show Less` : `Show More Suggestions (${suggestions.length - 12} more)`}
                  </Button>
                </div>
              )}
              <div className="flex justify-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestionHelp(true)}
                  className="h-8 w-8 p-0 hover:bg-secondary/50"
                  title="Help"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area - always fills available space, leaves room for panel if open */}
        <div className="flex flex-col w-full">{/* Chat Header - Full Width */}
          <div className="chat-header bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 flex items-center justify-between w-full">
            {/* Hamburger Menu - Left side */}
            <div className="flex-shrink-0">
              <HamburgerMenu
                onScreenshot={() => console.log('Screenshot taken')}
                onShareUrl={() => console.log('URL shared')}
                onCopyContent={() => console.log('Content copied')}
                onExportData={() => console.log('Data exported')}
                onDownloadChat={downloadChatHistory}
                onShareChat={shareChatHistory}
              />
            </div>
            
            {/* Text Content - Center */}
            <div className="flex-1 text-center">
              <h2 className="chat-title text-lg sm:text-xl font-semibold text-white">AI Assistant</h2>
              <p className="chat-subtitle text-blue-100 text-xs sm:text-sm">Ask me anything about your data</p>
            </div>

            {/* Settings Dropdown - Right side */}
            <div className="relative settings-dropdown flex-shrink-0">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                disabled={isLoading || isGeneratingReport || isLoadingEnhancedData}
                title="Chat settings and actions"
                className={`flex items-center gap-1 px-3 py-2 text-sm bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors ${
                  isLoading || isGeneratingReport || isLoadingEnhancedData ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
                {isLoading || isGeneratingReport || isLoadingEnhancedData ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-1"></div>
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </button>
              
              {isSettingsOpen && !(isLoading || isGeneratingReport || isLoadingEnhancedData) && (
                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        generateReport();
                        setIsSettingsOpen(false);
                      }}
                      disabled={isGeneratingReport || isLoadingEnhancedData}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isLoadingEnhancedData ? 'Fetching AI Data...' : isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button
                      onClick={() => {
                        forceRefresh();
                        setIsSettingsOpen(false);
                      }}
                      disabled={isLoading}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      {isLoading ? 'Refreshing...' : 'Force Refresh'}
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        clearCache();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 text-orange-600 hover:text-orange-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cache
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Container - Full Width */}
          <div className="chat-container flex-1 w-full overflow-hidden">
            {/* Chat Wrapper */}
            <div className="chat-wrapper h-full flex flex-col">

            {/* Messages Area */}
            <div className="messages-container p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-transparent pb-24 sm:pb-28 md:pb-32" style={{ minHeight: '200vh' }}>
              {/* Top Reference Point */}
              <div ref={messagesTopRef} />
              {/* ...existing code for messages... */}
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-200">
                  <p className="text-sm sm:text-base">Start a conversation by asking a question or clicking on a topic above!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`message-slide-in ${message.role === "user" ? "message-wrapper-user flex items-start space-x-2 sm:space-x-3 w-full justify-end flex-row-reverse space-x-reverse" : "message-wrapper flex items-start space-x-2 sm:space-x-3 w-full"}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`flex flex-col w-full`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className={`${message.role === "user" ? "message-avatar-user" : "message-avatar-bot"} flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${message.role === "user" ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`}>
                          {message.role === "user" ? (
                            <User className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          ) : (
                            <Bot className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          )}
                        </div>
                        <div className={`flex-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                          <div className={`message-bubble inline-block ${message.role === "user" ? "message-bubble-user px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white max-w-lg" : "message-bubble-bot px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-slate-800 text-white border border-slate-600 max-w-4xl"}`}>
                            {message.role === "assistant" ? (
                              <div className="message-text text-xs sm:text-sm leading-relaxed text-white">
                                {renderMessageContent(typeof message.content === 'string' ? message.content : String(message.content || ''))}
                              </div>
                            ) : (
                              <div className="message-text text-xs sm:text-sm leading-relaxed text-white">
                                {message.content}
                              </div>
                            )}
                          </div>
                          {message.chartData && (
                            <div className="mt-3 sm:mt-4 w-full">
                              <div className="p-4 sm:p-6 bg-slate-900 border border-slate-600 rounded-lg">
                                <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 text-white">{message.chartData.title || 'Generated Chart'}</h3>
                                {/* Add defensive rendering - only render if chart has valid structure */}
                                {(message.chartData.type || message.chartData.chart_type) && message.chartData.data ? (
                                  <ChartRenderer 
                                    chartData={message.chartData} 
                                    onChartClick={handleChartClick}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-24 sm:h-32 text-gray-200">
                                    <div className="text-center">
                                      <p className="text-xs sm:text-sm">Chart data is incomplete</p>
                                      <p className="text-xs mt-1">
                                        Missing: {!message.chartData.type && !message.chartData.chart_type ? 'type field' : ''} 
                                        {!message.chartData.data ? ((!message.chartData.type && !message.chartData.chart_type) ? ' and data field' : 'data field') : ''}
                                      </p>
                                      <details className="mt-2 text-xs">
                                        <summary className="cursor-pointer">Debug Info</summary>
                                        <pre className="mt-1 text-left bg-slate-800 border border-slate-600 p-2 rounded overflow-auto max-h-24 sm:max-h-32 text-xs text-gray-200">
                                          {JSON.stringify(message.chartData, null, 2)}
                                        </pre>
                                      </details>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {message.sentimentData && (
                            <div className="mt-3 sm:mt-4 w-full">
                              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
                                <SentimentTable data={message.sentimentData} />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 sm:mt-2">
                            <span className="message-timestamp text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => copyMessage(message.content, message.id, e)}
                              className="text-xs p-1 h-auto transition-all hover:scale-110 relative z-10 text-gray-400 hover:text-white"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 bounce-once" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {(isLoading || isUploadProcessing) && (
                <div className="message-wrapper flex items-start space-x-2 sm:space-x-3 w-full">
                  <div className="flex flex-col">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="message-avatar-bot flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600">
                        <Bot className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="message-bubble-bot px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-slate-800 text-white border border-slate-600 inline-block">
                        <div className="flex items-center gap-2">
                          {isUploadProcessing ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span className="message-text text-xs sm:text-sm leading-relaxed">Processing PDF document...</span>
                            </>
                          ) : (
                            <div className="typing-indicator">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            </div>
          </div>

          {/* Input Area - Full Width */}
          <div className="input-container p-3 sm:p-4 md:p-6 border-t border-slate-600 bg-slate-800/50 flex-shrink-0 w-full fixed bottom-0 left-0 right-0 z-50">
            <form onSubmit={handleSubmit} className="input-wrapper flex items-center space-x-2 sm:space-x-4 w-full">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,text/plain,application/pdf"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadProcessing}
                  className="flex-shrink-0 hover-lift p-2 sm:p-3 bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-all duration-200"
                >
                  <Upload className={`w-4 h-4 sm:w-5 sm:h-5 ${isUploadProcessing ? 'animate-spin' : ''}`} />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  disabled={isLoading || isUploadProcessing}
                  className="message-input flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim() || isUploadProcessing}
                  className={`send-button p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl flex-shrink-0 ${
                    !input.trim() ? 'loading-disabled opacity-60 cursor-not-allowed' : 'hover-glow'
                  }`}
                >
                  <Send className={`send-icon w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </form>
              {isUploadProcessing && uploadedFile && (
                <div className="mt-2 text-xs sm:text-sm text-gray-200">
                  Processing {uploadedFile}...
                </div>
              )}
            </div>

        </div>
      </div>
      </div>

      {/* Round Scroll Buttons - Far Right with updated styling */}
      {messages.length > 3 && (
        <div className="fixed right-6 sm:right-8 bottom-20 sm:bottom-32 flex flex-col gap-2 z-50">
              <Button
                onClick={scrollToTop}
                variant="outline"
                size="sm"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-500 hover:border-purple-600 shadow-lg hover:shadow-xl hover-glow transition-all duration-200 hover:scale-110"
                title="Jump to top"
              >
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={scrollToBottom}
                variant="outline"
                size="sm"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-500 hover:border-purple-600 shadow-lg hover:shadow-xl hover-glow transition-all duration-200 hover:scale-110"
                title="Jump to bottom"
              >
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          )}

      {/* Suggestion Help Modal */}
      <Dialog open={showSuggestionHelp} onOpenChange={setShowSuggestionHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📝 How to Use Radio Analysis Prompts</DialogTitle>
            <DialogDescription className="text-left">
              These prompts are designed for radio transcript analysis. To use them effectively:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="bg-secondary/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Replace bracketed items with:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• <strong>[my brand]</strong> → Your brand name</li>
                <li>• <strong>[competitor brand]</strong> → Competitor name</li>
                <li>• <strong>[station]</strong> → Radio station name</li>
                <li>• <strong>[program]</strong> → Specific radio program</li>
                <li>• <strong>[time period]</strong> → Date range (e.g., "last week")</li>
                <li>• <strong>[category]</strong> → Industry or topic area</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Example:</strong> "Show me all mentions of Nike on 94.7 during last month"
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSuggestionHelp(false)}
              className="flex-1"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Help Overlay */}
      <SmartHelpOverlay 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)}
        userContext={{
          messageCount: messages.length,
          lastChartTypes: [],
          recentPrompts: [],
          preferredTheme: 'system'
        }}
        onRecommendationClick={(action) => {
          useSuggestion(action);
          setIsHelpOpen(false);
        }}
      />

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
        data={drillDownModal.data}
        title={drillDownModal.title}
        subtitle={drillDownModal.subtitle}
        type={drillDownModal.type}
        fields={drillDownModal.fields}
        onAnalyze={drillDownModal.type === 'chart' ? analyzeChartDrillDown : analyzeMetricsDrillDown}
      />

      {/* Hidden Report Container for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '1200px' }}>
        <ReportGenerator
          ref={reportRef}
          data={{
            metrics: {},
            charts: {},
            wordCloudData: undefined,
            dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date(), label: 'Last 30 days' },
            selectedTopic: 'general',
            topicLabel: 'Chat History'
          }}
          enhancedData={enhancedReportData}
          normalizeChartData={(chart: any) => chart}
        />
      </div>
    </div>
  );
}