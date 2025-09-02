// Chat API utilities

import { Message } from "@/types/chat";
import { 
  generateUniqueId, 
  normalizeChartData, 
  detectChartFromResponse,
  hasChartKeywords,
  hasSentimentKeywords,
  isSentimentComparison
} from "@/utils/chat/chatUtils";
import { CHART_KEYWORDS, SENTIMENT_KEYWORDS, FILE_SIZE_LIMITS } from "@/constants/chatConstants";

export const submitChatMessage = async (
  input: string,
  messages: Message[],
  conversationId: string,
  dispatch: any,
  setStreamingMessageId: (id: number | null) => void,
  abortController?: AbortController
) => {
  console.log('[Chat] Submitting message with conversation ID:', conversationId);

  const userMessage: Message = {
    id: generateUniqueId(),
    content: input,
    role: "user",
    timestamp: new Date(),
    isStreaming: false,
  };

  dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

  try {
    // Check for chart generation requests - only explicit visual requests
    const hasChartRequest = hasChartKeywords(input, CHART_KEYWORDS);
    
    console.log('Chart keyword check:', {
      input: input.toLowerCase(),
      hasChartRequest,
      matchingKeywords: CHART_KEYWORDS.filter(keyword => input.toLowerCase().includes(keyword))
    });

    if (hasChartRequest) {
      // Route to chart generation system
      const { createApiUrl } = await import("@/lib/api");
      const chartResponse = await fetch(createApiUrl("/api/generate-chart"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (chartResponse.ok) {
        const rawChartData = await chartResponse.json();
        const chartData = normalizeChartData(rawChartData);
        
        console.log('[Chart Generation] Raw chart data from API:', rawChartData);
        console.log('[Chart Generation] Normalized chart data:', chartData);
        
        const messageId = generateUniqueId();
        const aiMessage: Message = {
          id: messageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          chartData: chartData,
          isStreaming: true,
          fullContent: chartData.message || "Here's your requested chart:",
        };
        dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
        
        // Start streaming effect
        setStreamingMessageId(messageId);
        return;
      } else {
        console.error('[Chart Generation] Chart API request failed:', chartResponse.status, chartResponse.statusText);
        // Fall through to regular chat processing if chart generation fails
      }
    }

    // Check for sentiment analysis with format specification
    const isTableFormatRequest = input.toLowerCase().includes("table format");
    const isSummaryFormatRequest = input.toLowerCase().includes("summary format");
    const hasSentimentRequest = hasSentimentKeywords(input, SENTIMENT_KEYWORDS);
    const isSentimentComparisonRequest = isSentimentComparison(input);

    if (hasSentimentRequest && (isTableFormatRequest || isSummaryFormatRequest || isSentimentComparisonRequest)) {
      // Call sentiment API with format parameter - default to table for comparisons
      const format = (isTableFormatRequest || isSentimentComparisonRequest) ? "table" : "summary";
      const { createApiUrl } = await import("@/lib/api");
      const sentimentResponse = await fetch(createApiUrl("/api/chat/extract-sentiment"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: input,
          format: format 
        }),
        signal: abortController?.signal
      });

      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        
        if (format === "table") {
          const messageId = generateUniqueId();
          const aiMessage: Message = {
            id: messageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            sentimentData: sentimentData.table || sentimentData,
            isStreaming: true,
            fullContent: sentimentData.analysis || "Here's your sentiment analysis:",
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          
          // Start streaming effect
          setStreamingMessageId(messageId);
        } else {
          const messageId = generateUniqueId();
          const aiMessage: Message = {
            id: messageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            isStreaming: true,
            fullContent: sentimentData.analysis || sentimentData.summary || "Analysis complete.",
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          
          // Start streaming effect
          setStreamingMessageId(messageId);
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
    const { createApiUrl } = await import("@/lib/api");
    const response = await fetch(createApiUrl("/api/chat-response"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message: input,
        conversationHistory: conversationHistory,
        conversationId: conversationId
      }),
      signal: abortController?.signal
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if the response contains chart data
      if (data.chartData) {
        const messageId = generateUniqueId();
        const aiMessage: Message = {
          id: messageId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          chartData: data.chartData,
          isStreaming: true,
          fullContent: data.message || "Here's a visualization based on your request:",
        };
        dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
        
        // Start streaming effect
        setStreamingMessageId(messageId);
      } else {
        const responseContent = data.message || data.response || "I'm here to help with your data analysis needs.";
        
        // Check if the AI response contains chart instructions and data
        const extractedChartData = detectChartFromResponse(responseContent);
        
        if (extractedChartData) {
          console.log('[Chat] Detected chart data in AI response:', extractedChartData.title);
          // Response contains chart data - create message with chart and streaming
          const messageId = generateUniqueId();
          const aiMessage: Message = {
            id: messageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            chartData: extractedChartData,
            isStreaming: true,
            fullContent: responseContent,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          
          // Start streaming effect
          setStreamingMessageId(messageId);
        } else {
          // Regular text response with streaming effect
          const messageId = generateUniqueId();
          const aiMessage: Message = {
            id: messageId,
            content: "",
            role: "assistant",
            timestamp: new Date(),
            isStreaming: true,
            fullContent: responseContent,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          
          // Start streaming effect
          setStreamingMessageId(messageId);
        }
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Chat error:', error);
    
    // Handle AbortError (user cancelled request)
    if (error instanceof Error && error.name === 'AbortError') {
      // Don't add an error message for user-cancelled requests
      return;
    }
    
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
      isStreaming: false,
      fullContent: errorContent,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
  }
};

export const uploadFile = async (
  file: File,
  dispatch: any,
  startUpload: (fileName: string) => void,
  stopUpload: () => void
) => {
  const fileName = file.name;
  const fileSize = file.size;
  const isPDF = file.type === 'application/pdf';
  const maxSize = isPDF ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS.TEXT;

  // File validation
  if (fileSize > maxSize) {
    const errorMessage: Message = {
      id: generateUniqueId(),
      content: `File is too large. Please upload a ${isPDF ? 'PDF' : 'text'} file smaller than ${isPDF ? '50MB' : '10MB'}.`,
      role: "assistant",
      timestamp: new Date(),
      isStreaming: false,
      fullContent: `File is too large. Please upload a ${isPDF ? 'PDF' : 'text'} file smaller than ${isPDF ? '50MB' : '10MB'}.`,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    return;
  }

  startUpload(fileName);

  const uploadMessage: Message = {
    id: generateUniqueId(),
    content: `Analyzing ${fileName}...`,
    role: "assistant", 
    timestamp: new Date(),
    isStreaming: false,
    fullContent: `Analyzing ${fileName}...`,
  };
  dispatch({ type: 'ADD_MESSAGE', payload: uploadMessage });

  try {
    const formData = new FormData();
    formData.append('document', file);

    const endpoint = isPDF ? '/api/upload-pdf' : '/api/upload-document';
    const { createApiUrl } = await import("@/lib/api");
    const uploadResponse = await fetch(createApiUrl(endpoint), {
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
        isStreaming: false,
        fullContent: isPDF ? "PDF processed successfully! Analysis:" : "Document analyzed successfully! Here are the insights:",
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
          isStreaming: false,
          fullContent: formattedContent || "Analysis completed successfully.",
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
          isStreaming: false,
          fullContent: "Here's a visual representation of your document:",
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
      isStreaming: false,
      fullContent: errorContent,
    };
    dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
  } finally {
    stopUpload();
  }
};
