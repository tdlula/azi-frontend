// Conversation management utilities

import { Message } from "@/types/chat";
import { generateUniqueId } from "@/utils/chat/chatUtils";

export interface ConversationMetadata {
  id: string;
  title: string;
  lastUpdated: Date;
  messageCount: number;
  preview: string;
}

export const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateConversationTitle = (messages: Message[]): string => {
  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  
  if (!firstUserMessage) {
    return 'New Conversation';
  }

  // Take the first 50 characters of the first user message
  let title = firstUserMessage.content.trim();
  
  // Remove common prefixes
  const prefixesToRemove = [
    'can you',
    'could you',
    'please',
    'i need',
    'help me',
    'show me',
    'create',
    'generate'
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const prefix of prefixesToRemove) {
    if (lowerTitle.startsWith(prefix)) {
      title = title.substring(prefix.length).trim();
      break;
    }
  }

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title || 'New Conversation';
};

export const getConversationPreview = (messages: Message[]): string => {
  // Get the last assistant message for preview
  const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
  
  if (!lastAssistantMessage) {
    return 'No messages yet';
  }

  let preview = lastAssistantMessage.content || lastAssistantMessage.fullContent || '';
  
  // Remove markdown formatting for preview
  preview = preview
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/`(.*?)`/g, '$1')       // Remove code
    .replace(/#{1,6}\s/g, '')        // Remove headers
    .replace(/\n+/g, ' ')            // Replace newlines with spaces
    .trim();

  // Truncate if too long
  if (preview.length > 100) {
    preview = preview.substring(0, 97) + '...';
  }
  
  return preview || 'Message sent';
};

export const saveConversation = (
  conversationId: string,
  messages: Message[]
): void => {
  try {
    const conversationData = {
      id: conversationId,
      messages: messages,
      lastUpdated: new Date().toISOString(),
      title: generateConversationTitle(messages),
      messageCount: messages.length,
      preview: getConversationPreview(messages)
    };
    
    localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(conversationData));
    
    // Update conversations list
    updateConversationsList(conversationData);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

export const loadConversation = (conversationId: string): Message[] | null => {
  try {
    const conversationData = localStorage.getItem(`conversation_${conversationId}`);
    if (!conversationData) return null;
    
    const parsed = JSON.parse(conversationData);
    
    // Convert timestamp strings back to Date objects
    const messages = parsed.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    return messages;
  } catch (error) {
    console.error('Error loading conversation:', error);
    return null;
  }
};

export const deleteConversation = (conversationId: string): void => {
  try {
    localStorage.removeItem(`conversation_${conversationId}`);
    
    // Update conversations list
    const conversations = getConversationsList();
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    localStorage.setItem('conversations_list', JSON.stringify(updatedConversations));
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
};

export const getConversationsList = (): ConversationMetadata[] => {
  try {
    const conversationsData = localStorage.getItem('conversations_list');
    if (!conversationsData) return [];
    
    const conversations = JSON.parse(conversationsData);
    
    // Convert timestamp strings back to Date objects and sort by last updated
    return conversations
      .map((conv: any) => ({
        ...conv,
        lastUpdated: new Date(conv.lastUpdated)
      }))
      .sort((a: ConversationMetadata, b: ConversationMetadata) => 
        b.lastUpdated.getTime() - a.lastUpdated.getTime()
      );
  } catch (error) {
    console.error('Error getting conversations list:', error);
    return [];
  }
};

const updateConversationsList = (conversationData: any): void => {
  try {
    const conversations = getConversationsList();
    
    // Remove existing conversation with same ID
    const filteredConversations = conversations.filter(conv => conv.id !== conversationData.id);
    
    // Add updated conversation
    const metadata: ConversationMetadata = {
      id: conversationData.id,
      title: conversationData.title,
      lastUpdated: new Date(conversationData.lastUpdated),
      messageCount: conversationData.messageCount,
      preview: conversationData.preview
    };
    
    filteredConversations.unshift(metadata);
    
    // Keep only the most recent 50 conversations
    const trimmedConversations = filteredConversations.slice(0, 50);
    
    localStorage.setItem('conversations_list', JSON.stringify(trimmedConversations));
  } catch (error) {
    console.error('Error updating conversations list:', error);
  }
};

export const clearAllConversations = (): void => {
  try {
    // Get all conversation keys
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('conversation_') || key === 'conversations_list'
    );
    
    // Remove all conversation data
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
};

export const exportConversation = (conversationId: string): string | null => {
  try {
    const messages = loadConversation(conversationId);
    if (!messages) return null;
    
    const title = generateConversationTitle(messages);
    const timestamp = new Date().toISOString();
    
    let exportText = `# ${title}\n`;
    exportText += `Exported on: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(message => {
      const role = message.role === 'user' ? 'You' : 'Assistant';
      const content = message.content || message.fullContent || '';
      const time = message.timestamp.toLocaleTimeString();
      
      exportText += `## ${role} (${time})\n`;
      exportText += `${content}\n\n`;
      
      if (message.chartData) {
        exportText += `[Chart: ${message.chartData.title || 'Data Visualization'}]\n\n`;
      }
      
      if (message.sentimentData) {
        exportText += `[Sentiment Analysis Table]\n\n`;
      }
    });
    
    return exportText;
  } catch (error) {
    console.error('Error exporting conversation:', error);
    return null;
  }
};

export const searchConversations = (query: string): ConversationMetadata[] => {
  try {
    const conversations = getConversationsList();
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.preview.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching conversations:', error);
    return [];
  }
};
