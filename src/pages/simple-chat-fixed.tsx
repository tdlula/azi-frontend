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
  ArrowRight
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
  return Date.now() + ++messageIdCounter;
};

interface Message {
  id: number;
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
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(true);
  const [suggestionSearch, setSuggestionSearch] = useState("");

  const [assistantPersonality, setAssistantPersonality] = useState("Analytical");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Restore sidebarRef for sidebar DOM access
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Hamburger Menu */}
      <div style={{ paddingTop: '-7rem' }}>
        <HamburgerMenu
          onScreenshot={() => console.log('Screenshot taken')}
          onShareUrl={() => console.log('URL shared')}
          onCopyContent={() => console.log('Content copied')}
          onExportData={() => console.log('Data exported')}
          onDownloadChat={downloadChatHistory}
          onShareChat={shareChatHistory}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col chat-area">
        {/* Consistent Header */}
        <AppHeader />

      <div className="flex-1 flex flex-row relative">
        {/* Top right Show Suggestion Prompt button (only when dialog is closed) */}
        <div className="absolute right-8 top-4 z-50">
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
        {suggestionsDialogOpen && (
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
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: '100%',
            // Add right margin only when panel is open so chat area is not covered
            marginRight: suggestionsDialogOpen ? '320px' : 0,
            transition: 'margin-right 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Messages Area */}
          <div className="flex-1 relative overflow-y-auto p-4 pt-20 space-y-6">
            {/* Top Reference Point */}
            <div ref={messagesTopRef} />
            {/* ...existing code for messages... */}
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
                            {(typeof message.content === 'string' ? message.content : String(message.content || '')).split('\n').map((line: string, index: number) => {
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
    </div>
  );
}