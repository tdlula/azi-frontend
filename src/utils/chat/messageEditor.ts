// Message editing and management utilities

import { Message } from "@/types/chat";
import { generateUniqueId } from "@/utils/chat/chatUtils";

export const editMessage = async (
  messageId: number,
  newContent: string,
  messages: Message[],
  dispatch: any,
  conversationId: string,
  setStreamingMessageId: (id: number | null) => void,
  abortController?: AbortController
) => {
  // Find the message to edit
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) return;

  const editedMessage = { ...messages[messageIndex], content: newContent };
  
  // Update the message
  dispatch({ type: 'UPDATE_MESSAGE', payload: editedMessage });

  // If it's a user message, we need to regenerate the assistant's responses
  if (editedMessage.role === 'user') {
    // Remove all messages after this one
    const messagesToKeep = messages.slice(0, messageIndex + 1);
    
    // Update the conversation to only include messages up to this point
    dispatch({ type: 'SET_MESSAGES', payload: [...messagesToKeep.slice(0, -1), editedMessage] });

    // Regenerate the assistant's response
    try {
      // Build conversation history for context
      const conversationHistory = messagesToKeep.map(msg => ({
        role: msg.role,
        content: msg.role === 'user' && msg.id === messageId ? newContent : msg.content
      }));

      // Regular chat API call with conversation history
      const { createApiUrl } = await import("@/lib/api");
      const response = await fetch(createApiUrl("/api/chat-response"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: newContent,
          conversationHistory: conversationHistory,
          conversationId: conversationId
        }),
        signal: abortController?.signal
      });

      if (response.ok) {
        const data = await response.json();
        const responseContent = data.message || data.response || "I'm here to help with your data analysis needs.";
        
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
    } catch (error) {
      console.error('Error regenerating response:', error);
      
      // Handle AbortError (user cancelled request)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: "I encountered an error while regenerating the response. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        isStreaming: false,
        fullContent: "I encountered an error while regenerating the response. Please try again.",
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    }
  }
};

export const deleteMessage = (messageId: number, dispatch: any) => {
  dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
};

export const regenerateResponse = async (
  messageId: number,
  messages: Message[],
  dispatch: any,
  conversationId: string,
  setStreamingMessageId: (id: number | null) => void,
  abortController?: AbortController
) => {
  // Find the assistant message to regenerate
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) return;

  const messageToRegenerate = messages[messageIndex];
  if (messageToRegenerate.role !== 'assistant') return;

  // Find the user message that prompted this response
  let userMessageContent = "";
  for (let i = messageIndex - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userMessageContent = messages[i].content;
      break;
    }
  }

  if (!userMessageContent) return;

  // Remove the current assistant message
  dispatch({ type: 'DELETE_MESSAGE', payload: messageId });

  try {
    // Build conversation history up to the point before the message to regenerate
    const conversationHistory = messages.slice(0, messageIndex).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Call the API to regenerate the response
    const { createApiUrl } = await import("@/lib/api");
    const response = await fetch(createApiUrl("/api/chat-response"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message: userMessageContent,
        conversationHistory: conversationHistory,
        conversationId: conversationId
      }),
      signal: abortController?.signal
    });

    if (response.ok) {
      const data = await response.json();
      const responseContent = data.message || data.response || "I'm here to help with your data analysis needs.";
      
      // Create new response with streaming effect
      const newMessageId = generateUniqueId();
      const aiMessage: Message = {
        id: newMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        isStreaming: true,
        fullContent: responseContent,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
      
      // Start streaming effect
      setStreamingMessageId(newMessageId);
    }
  } catch (error) {
    console.error('Error regenerating response:', error);
    
    // Handle AbortError (user cancelled request)
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    
    const errorMessage: Message = {
      id: generateUniqueId(),
      content: "I encountered an error while regenerating the response. Please try again.",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: false,
      fullContent: "I encountered an error while regenerating the response. Please try again.",
    };
    dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
  }
};
