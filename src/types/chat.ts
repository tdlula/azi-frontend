// Chat application types

export interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chartData?: any;
  sentimentData?: any;
  tableData?: any;
  isStreaming?: boolean;
  fullContent?: string;
}

export interface Suggestion {
  title: string;
  category: string;  
  description: string;
  prompt: string;
  icon: string;
  color: string;
  purpose?: string;
}

export interface DrillDownModalState {
  isOpen: boolean;
  data: any;
  title: string;
  subtitle: string;
  type: 'chart' | 'metrics';
  fields: Array<{ label: string; value: string | number; key: string }>;
}

export interface QuickReplySuggestion {
  text: string;
  icon: string;
}

export interface ChatSettings {
  isOpen: boolean;
  isGeneratingReport: boolean;
  isLoadingEnhancedData: boolean;
}

export interface FileUploadState {
  isProcessing: boolean;
  fileName: string | null;
}

export interface StreamingState {
  messageId: number | null;
  interval: NodeJS.Timeout | null;
}
