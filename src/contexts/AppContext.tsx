import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CacheManager } from '@/utils/cacheUtils';
import { API_BASE_URL } from '@/config/api';

// Types for application state
interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chartData?: any;
  sentimentData?: any;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

interface DashboardData {
  metrics: {
    overallPositiveSentiment: { value: number; label: string };
    totalMentions: { value: number; label: string };
    highEngagementMoments: { value: number; label: string };
    whatsappNumberMentions: { value: number; label: string };
  };
  charts: { [key: string]: any };
}

interface AppState {
  currentConversationId: number | null;
  conversations: Conversation[];
  messages: Message[];
  suggestions: any[];
  isSuggestionsLoading: boolean;
  dashboardData: DashboardData | null;
  isDashboardLoading: boolean;
  dashboardError?: string;
  wordCloudData: any | null;
  isWordCloudLoading: boolean;
  wordCloudError?: string;
  isLoading: boolean;
  lastActivity: Date;
  cachedResponses: Map<string, any>;
}

// --- Actions ---
type AppAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: number | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_SUGGESTIONS'; payload: any[] }
  | { type: 'SET_SUGGESTIONS_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_DATA'; payload: DashboardData }
  | { type: 'SET_DASHBOARD_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_ERROR'; payload: string }
  | { type: 'SET_WORD_CLOUD_DATA'; payload: any }
  | { type: 'SET_WORD_CLOUD_LOADING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'CACHE_RESPONSE'; payload: { key: string; data: any } }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

// --- Initial state ---
const initialState: AppState = {
  currentConversationId: null,
  conversations: [],
  messages: [],
  suggestions: [],
  isSuggestionsLoading: false,
  dashboardData: null,
  isDashboardLoading: false,
  dashboardError: undefined,
  wordCloudData: null,
  isWordCloudLoading: false,
  wordCloudError: undefined,
  isLoading: false,
  lastActivity: new Date(),
  cachedResponses: new Map(),
};

// --- Reducer ---
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload, lastActivity: new Date() };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload], lastActivity: new Date() };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], lastActivity: new Date() };

    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };

    case 'SET_SUGGESTIONS_LOADING':
      return { ...state, isSuggestionsLoading: action.payload };

    case 'SET_DASHBOARD_DATA':
      return { ...state, dashboardData: action.payload, isDashboardLoading: false, lastActivity: new Date() };

    case 'SET_DASHBOARD_LOADING':
      return { ...state, isDashboardLoading: action.payload };

    case 'SET_WORD_CLOUD_DATA':
      return { ...state, wordCloudData: action.payload, isWordCloudLoading: false, lastActivity: new Date() };

    case 'SET_WORD_CLOUD_LOADING':
      return { ...state, isWordCloudLoading: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'UPDATE_LAST_ACTIVITY':
      return { ...state, lastActivity: new Date() };

    case 'CACHE_RESPONSE':
      const newCache = new Map(state.cachedResponses);
      newCache.set(action.payload.key, action.payload.data);
      return { ...state, cachedResponses: newCache };

    case 'RESTORE_STATE':
      const restoredMessages =
        action.payload.messages?.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })) || state.messages;
      return {
        ...state,
        ...action.payload,
        messages: restoredMessages,
        lastActivity: action.payload.lastActivity ? new Date(action.payload.lastActivity) : state.lastActivity,
        cachedResponses: new Map(state.cachedResponses),
      };

    default:
      return state;
  }
}

// --- Context ---
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  loadSuggestions: () => Promise<void>;
  loadDashboardData: (forceRefresh?: boolean, topic?: string, dateRange?: { from: Date; to: Date }) => Promise<void>;
  loadWordCloudData: (forceRefresh?: boolean) => Promise<void>;
  saveStateToSession: () => Promise<void>;
  loadStateFromSession: () => Promise<boolean>;
} | null>(null);

// --- Provider ---
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const SESSION_KEY = 'analysisgenius-app-state';

  // Conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`);
      if (response.ok) {
        const conversations = await response.json();
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Messages
  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Suggestions
  const loadSuggestions = async () => {
    dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/suggestions`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_SUGGESTIONS', payload: data.suggestions || data || [] });
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: false });
    }
  };

  // Dashboard
  const loadDashboardData = async (forceRefresh = false, topic?: string, dateRange?: { from: Date; to: Date }) => {
    try {
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true });
      const params = new URLSearchParams();
      if (forceRefresh) params.append('force_refresh', 'true');
      if (topic && topic !== 'general') params.append('topic', topic);
      if (dateRange) {
        params.append('from_date', dateRange.from.toISOString().split('T')[0]);
        params.append('to_date', dateRange.to.toISOString().split('T')[0]);
      }
      const response = await fetch(`${API_BASE_URL}/api/dashboard-data${params.toString() ? '?' + params.toString() : ''}`);
      if (response.ok) {
        const dashboardData = await response.json();
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboardData });
      } else {
        dispatch({ type: 'SET_DASHBOARD_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: false });
    }
  };

  // Word Cloud
  const loadWordCloudData = async (forceRefresh = false) => {
    try {
      dispatch({ type: 'SET_WORD_CLOUD_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/word-cloud-data`);
      if (response.ok) {
        const wordCloudData = await response.json();
        dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: wordCloudData });
      } else {
        dispatch({ type: 'SET_WORD_CLOUD_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load word cloud data:', error);
      dispatch({ type: 'SET_WORD_CLOUD_LOADING', payload: false });
    }
  };

  // Save state to session storage
  const saveStateToSession = async () => {
    try {
      const sessionData = {
        currentConversationId: state.currentConversationId,
        conversations: state.conversations,
        messages: state.messages,
        suggestions: state.suggestions,
        dashboardData: state.dashboardData,
        lastActivity: state.lastActivity,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save state to session:', error);
    }
  };

  // Load state from session storage
  const loadStateFromSession = async () => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const sessionData = JSON.parse(stored);
        if (Date.now() - sessionData.timestamp < 30 * 60 * 1000) {
          dispatch({ type: 'RESTORE_STATE', payload: sessionData });
          return true;
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load state from session:', error);
    }
    return false;
  };

  // Auto-save to session
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStateToSession();
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.currentConversationId, state.messages, state.dashboardData]);

  // Initial load
  useEffect(() => {
    const initializeApp = async () => {
      const restored = await loadStateFromSession();
      if (!restored) {
        await Promise.all([loadConversations(), loadSuggestions(), loadDashboardData()]);
      }
    };
    initializeApp();
  }, []);

  const contextValue = {
    state,
    dispatch,
    loadConversations,
    loadMessages,
    loadSuggestions,
    loadDashboardData,
    loadWordCloudData,
    saveStateToSession,
    loadStateFromSession,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// --- Hook ---
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
