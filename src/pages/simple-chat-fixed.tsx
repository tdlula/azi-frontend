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
  ChevronDown
} from "lucide-react";
import ChartRenderer from "@/components/charts/ChartRenderer";
import SentimentTable from "@/components/SentimentTable";
import SmartHelpOverlay from "@/components/help/SmartHelpOverlay";
import AppHeader from "@/components/AppHeader";
import HamburgerMenu from "@/components/HamburgerMenu";

import html2canvas from "html2canvas";
import { Link } from "wouter";
import { useAppContext } from "@/contexts/AppContext";

// Generate unique IDs for messages to prevent React key warnings
let messageIdCounter = 0;
const generateUniqueId = () => {
  return `${Date.now()}-${++messageIdCounter}`;
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chartData?: any;
  sentimentData?: any;
}

interface Suggestion {
  title: string;
  category: string;  
  description: string;
  prompt: string;
  icon: string;
  color: string;
}

export default function SimpleChatFixedPage() {
  const { state, dispatch, loadMessages, loadSuggestions } = useAppContext();
  
  // Use persistent state from context
  const messages = state.messages;
  const suggestions = state.suggestions;
  const isLoading = state.isLoading;
  const isSuggestionsLoading = state.isSuggestionsLoading;
  
  // Local UI state that doesn't need persistence
  const [input, setInput] = useState("");
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showSuggestionHelp, setShowSuggestionHelp] = useState(false);
  const [showChartHelp, setShowChartHelp] = useState(false);
  const [showAllCharts, setShowAllCharts] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const [assistantPersonality, setAssistantPersonality] = useState("Analytical");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToTop = () => {
    messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    // Use context function for loading suggestions with caching
    await loadSuggestions();
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
          const chartData = await chartResponse.json();
          const aiMessage: Message = {
            id: generateUniqueId(),
            content: chartData.message || "Here's your requested chart:",
            role: "assistant",
            timestamp: new Date(),
            chartData: chartData,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          return;
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

  // Chart Generation Suggestions - All 10 types
  const chartSuggestions = [
    {
      title: "Brand Mentions Over Time",
      prompt: "Generate a line chart showing the number of times [brand] was mentioned on [station/program] over [time period].",
      icon: "LineChart",
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Top Topics by Frequency", 
      prompt: "Create a bar chart of the top [N] topics discussed on [station/program] during [time period].",
      icon: "BarChart3",
      color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
    },
    {
      title: "Sentiment Distribution",
      prompt: "Show a pie chart of sentiment (positive, neutral, negative) for [brand/topic] mentions on [station] last [week/month].",
      icon: "PieChart",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Brand vs Competitor",
      prompt: "Display a grouped bar chart comparing mentions of [brand] and [competitor brand] on [station/program] for [time period].",
      icon: "BarChart",
      color: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
    },
    {
      title: "Sentiment Over Time",
      prompt: "Generate a line chart showing how sentiment about [brand/topic] changed over [time period] on [station].",
      icon: "Activity",
      color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
    },
    {
      title: "Keyword Word Cloud",
      prompt: "Create a word cloud of the most common keywords mentioned on [station/program] during [time period].",
      icon: "Cloud",
      color: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400"
    },
    {
      title: "Mentions by Presenter",
      prompt: "Show a bar chart of [brand/topic] mentions broken down by presenter/program on [station] for [time period].",
      icon: "Users",
      color: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Top Guests by Mentions",
      prompt: "Generate a bar chart of the top guests most frequently mentioned in radio transcripts on [station] over [time period].",
      icon: "Target",
      color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Topic Sentiment Comparison",
      prompt: "Create a stacked bar chart comparing sentiment for the top [N] topics on [station/program] during [time period].",
      icon: "BarChart3",
      color: "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400"
    },
    {
      title: "Topic Correlation Matrix",
      prompt: "Show a heatmap of how often different topics are mentioned together in transcripts from [station/program] during [time period].",
      icon: "Grid3X3",
      color: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400"
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Hamburger Menu */}
      <HamburgerMenu 
        onScreenshot={() => console.log('Screenshot taken')}
        onShareUrl={() => console.log('URL shared')}
        onCopyContent={() => console.log('Content copied')}
        onExportData={() => console.log('Data exported')}
        onDownloadChat={downloadChatHistory}
        onShareChat={shareChatHistory}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col chat-area">
        {/* Consistent Header */}
        <AppHeader />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Persistent Word Cloud and Suggestions */}
          <div className="border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="text-center py-4">
              <div className="max-w-4xl mx-auto px-4">

                {/* Suggestions Header with Help Icon */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Radio Analysis Suggestions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestionHelp(true)}
                    className="h-8 w-8 p-0 hover:bg-secondary/50"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </div>

                {/* Compact Suggestions Grid - Centered */}
                <div className="flex justify-center w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full max-w-3xl mx-auto">
                    {isSuggestionsLoading
                      ? Array.from({ length: 3 }).map((_, index) => (
                          <Card key={`skeleton-${index}`} className="p-2 animate-pulse">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-muted rounded-md flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <div className="h-3 bg-muted rounded mb-1"></div>
                                <div className="h-2 bg-muted/70 rounded w-3/4"></div>
                              </div>
                            </div>
                          </Card>
                        ))
                      : suggestions.slice(0, showAllSuggestions ? 8 : 3).map((suggestion, index) => (
                          <Card
                            key={index}
                            className="p-2 cursor-pointer hover:bg-secondary/50 transition-all group suggestion-card interactive-hover ripple-effect fade-in-up"
                            onClick={() => useSuggestion(suggestion.prompt)}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={`p-1 rounded-md ${suggestion.color} flex-shrink-0`}>
                                {suggestion.icon === 'BarChart3' && <BarChart3 className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'TrendingUp' && <TrendingUp className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'PieChart' && <PieChart className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'Target' && <Target className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'Zap' && <Zap className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'LayoutDashboard' && <LayoutDashboard className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'MessageSquare' && <MessageSquare className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'FileText' && <FileText className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'Users' && <Users className="w-2.5 h-2.5" />}
                                {suggestion.icon === 'Database' && <Database className="w-2.5 h-2.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-xs mb-0.5 group-hover:text-primary transition-colors truncate leading-tight">
                                  {suggestion.title}
                                </h3>
                                <span className="text-xs text-primary font-medium">
                                  {suggestion.category}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                  </div>
                </div>

                {/* Show More Button for Suggestions */}
                {!showAllSuggestions && suggestions.length > 3 && (
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllSuggestions(true)}
                      className="text-xs hover:bg-secondary/50"
                    >
                      Show More Suggestions ({Math.min(suggestions.length - 3, 5)} more)
                    </Button>
                  </div>
                )}

                {/* Show Less Button for Suggestions */}
                {showAllSuggestions && (
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllSuggestions(false)}
                      className="text-xs hover:bg-secondary/50"
                    >
                      Show Less
                    </Button>
                  </div>
                )}

                {/* Chart Generation Suggestions */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Chart Generation Prompts</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChartHelp(true)}
                      className="h-8 w-8 p-0 hover:bg-secondary/50"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-4xl mx-auto">
                      {isSuggestionsLoading
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <Card key={`chart-skeleton-${index}`} className="p-2 animate-pulse">
                              <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-8 h-8 bg-muted rounded-md flex-shrink-0"></div>
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="h-3 bg-muted rounded mb-1"></div>
                                  <div className="h-2 bg-muted/70 rounded w-1/2 mx-auto"></div>
                                </div>
                              </div>
                            </Card>
                          ))
                        : chartSuggestions.slice(0, showAllCharts ? chartSuggestions.length : 4).map((chart, index) => (
                            <Card
                              key={index}
                              className="p-2 cursor-pointer hover:bg-secondary/50 transition-all group suggestion-card interactive-hover ripple-effect fade-in-up"
                              onClick={() => useSuggestion(chart.prompt)}
                              style={{ animationDelay: `${(index + 8) * 100}ms` }}
                            >
                              <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className={`p-1.5 rounded-md ${chart.color} flex-shrink-0`}>
                                  {chart.icon === 'LineChart' && <LineChart className="w-3 h-3" />}
                                  {chart.icon === 'BarChart3' && <BarChart3 className="w-3 h-3" />}
                                  {chart.icon === 'PieChart' && <PieChart className="w-3 h-3" />}
                                  {chart.icon === 'BarChart' && <BarChart className="w-3 h-3" />}
                                  {chart.icon === 'Activity' && <Activity className="w-3 h-3" />}
                                  {chart.icon === 'Cloud' && <Cloud className="w-3 h-3" />}
                                  {chart.icon === 'Users' && <Users className="w-3 h-3" />}
                                  {chart.icon === 'Target' && <Target className="w-3 h-3" />}
                                  {chart.icon === 'Grid3X3' && <Grid3X3 className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-xs mb-0.5 group-hover:text-primary transition-colors truncate leading-tight">
                                    {chart.title}
                                  </h4>
                                  <span className="text-xs text-primary font-medium">
                                    CHART
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                    </div>
                  </div>

                  {/* Show More Button */}
                  {!showAllCharts && chartSuggestions.length > 4 && (
                    <div className="flex justify-center mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllCharts(true)}
                        className="text-xs hover:bg-secondary/50"
                      >
                        Show More Charts ({chartSuggestions.length - 4} more)
                      </Button>
                    </div>
                  )}

                  {/* Show Less Button */}
                  {showAllCharts && (
                    <div className="flex justify-center mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllCharts(false)}
                        className="text-xs hover:bg-secondary/50"
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 relative overflow-y-auto p-4 space-y-6">
            {/* Top Reference Point */}
            <div ref={messagesTopRef} />
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Start a conversation by asking a question or clicking on a topic above!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex message-enter ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`${message.chartData ? 'max-w-[60%]' : 'max-w-[50%]'} chat-bubble ${
                      message.role === "user"
                        ? "chat-bubble-user"
                        : "chat-bubble-bot"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {message.role === "user" ? (
                          <User className="w-5 h-5 opacity-90" />
                        ) : (
                          <Bot className="w-5 h-5 opacity-90" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {message.role === "assistant" ? (
                          <div className="chat-message-text prose prose-sm max-w-none">
                            {(typeof message.content === 'string' ? message.content : message.content?.message || String(message.content || '')).split('\n').map((line, index) => {
                              if (line.trim() === '') return <br key={index} />;
                              return <p key={index} className="mb-2 leading-relaxed">{line}</p>;
                            })}
                          </div>
                        ) : (
                          <div className="chat-message-text">
                            {message.content}
                          </div>
                        )}
                        {message.chartData && (
                          <div className="mt-4 p-4 sm:p-6 bg-card border border-border rounded-lg">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{message.chartData.title}</h3>
                            <ChartRenderer chartData={message.chartData} />
                          </div>
                        )}
                        {message.sentimentData && (
                          <div className="mt-4">
                            <SentimentTable data={message.sentimentData} />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="chat-timestamp">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => copyMessage(message.content, message.id, e)}
                            className="text-xs p-1 h-auto transition-all hover:scale-110 relative z-10"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3 text-green-500 bounce-once" />
                            ) : (
                              <Copy className="w-3 h-3" />
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
              <div className="flex justify-start">
                <div className="chat-bubble chat-bubble-bot max-w-[50%]">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 opacity-90" />
                    <div className="flex items-center gap-2">
                      {isUploadProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span className="chat-message-text">Processing PDF document...</span>
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
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Round Orange Scroll Buttons - Far Right */}
          {messages.length > 3 && (
            <div className="fixed right-4 bottom-32 flex flex-col gap-2 z-50">
              <Button
                onClick={scrollToTop}
                variant="outline"
                size="sm"
                className="rounded-full h-12 w-12 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                title="Jump to top"
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
              <Button
                onClick={scrollToBottom}
                variant="outline"
                size="sm"
                className="rounded-full h-12 w-12 bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                title="Jump to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Fixed Input Area - Always Visible */}
          <div className="sticky bottom-0 border-t border-border p-4 glass-effect">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
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
                className="flex-shrink-0 micro-bounce rounded-full h-12 w-12 border-2 hover:border-primary/50"
              >
                <Upload className={`w-5 h-5 ${isUploadProcessing ? 'animate-spin' : ''}`} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading || isUploadProcessing}
                className="flex-1 h-12 rounded-full px-6 text-base bg-white border-2 border-gray-300 focus:border-primary focus:bg-white transition-all duration-300 shadow-sm focus:shadow-md text-gray-900 placeholder:text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || isUploadProcessing}
                className={`flex-shrink-0 micro-bounce rounded-full h-12 w-12 ${
                  !input.trim() ? 'opacity-50' : 'hover:scale-105'
                } transition-all duration-200`}
              >
                <Send className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </form>
            {isUploadProcessing && uploadedFile && (
              <div className="mt-2 text-sm text-muted-foreground">
                Processing {uploadedFile}...
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Chart Help Modal */}
      <Dialog open={showChartHelp} onOpenChange={setShowChartHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📊 Chart Generation Prompts</DialogTitle>
            <DialogDescription className="text-left">
              These prompts create data visualizations from radio transcript analysis:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="bg-secondary/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Replace variables with specific data:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• <strong>[brand]</strong> → Your brand name</li>
                <li>• <strong>[station/program]</strong> → Radio station or show</li>
                <li>• <strong>[time period]</strong> → Date range</li>
                <li>• <strong>[N]</strong> → Number (e.g., "top 5")</li>
                <li>• <strong>[topic]</strong> → Specific topic or theme</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Example:</strong> "Create a bar chart of the top 10 topics discussed on Metro FM during December"
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowChartHelp(false)}
              className="flex-1"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}