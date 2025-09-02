// Chat-related custom hooks

import { useState, useEffect, useRef } from "react";
import { Message, StreamingState, FileUploadState } from "@/types/chat";
import { generateUniqueId } from "@/utils/chat/chatUtils";

export const useStreamingText = () => {
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startStreaming = (messageId: number) => {
    setStreamingMessageId(messageId);
  };

  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setStreamingMessageId(null);
  };

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  return {
    streamingMessageId,
    streamingIntervalRef,
    startStreaming,
    stopStreaming
  };
};

export const useFileUpload = () => {
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    isProcessing: false,
    fileName: null
  });

  const startUpload = (fileName: string) => {
    setFileUpload({
      isProcessing: true,
      fileName
    });
  };

  const stopUpload = () => {
    setFileUpload({
      isProcessing: false,
      fileName: null
    });
  };

  return {
    fileUpload,
    startUpload,
    stopUpload
  };
};

export const useTextareaResize = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Store the current scroll position
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height (min 44px for touch targets, max 120px)
      const minHeight = 44;
      const maxHeight = 120;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      
      // Set the new height
      textarea.style.height = newHeight + 'px';
      
      // Restore scroll position to prevent jumping
      window.scrollTo(0, scrollTop);
    }
  };

  return {
    textareaRef,
    autoResizeTextarea
  };
};

export const useChatScroll = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: "smooth" 
    });
  };

  return {
    messagesEndRef,
    messagesTopRef,
    scrollToTop,
    scrollToBottom
  };
};

export const useCopyMessage = () => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyMessage = async (message: string, id: number, event?: React.MouseEvent) => {
    // Prevent event bubbling to parent chat bubble
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      console.log('Copy button clicked for message:', id);
      
      // Check if clipboard is available
      if (!navigator.clipboard) {
        console.error('Clipboard API not available');
        alert('Clipboard not supported in this browser. Please manually copy the text.');
        return;
      }

      await navigator.clipboard.writeText(message);
      console.log('Message copied successfully');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      
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

  return {
    copiedId,
    copyMessage
  };
};

export const useConversation = () => {
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate a unique conversation ID for this chat session
    return `conversation:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  const startNewConversation = () => {
    // Generate a new conversation ID for a fresh thread
    const newConversationId = `conversation:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConversationId);
    console.log('Started new conversation with ID:', newConversationId);
    return newConversationId;
  };

  return {
    conversationId,
    startNewConversation
  };
};
