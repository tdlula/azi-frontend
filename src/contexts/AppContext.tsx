import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
    totalTranscripts: number;
    activeStations: number;
    topTopic: string;
    topStation: string;
    growth: number;
    engagement: number;
  };
  charts: {
    [key: string]: any; // Dynamic charts from OpenAI
  };
}

interface AppState {
  // Chat state
  currentConversationId: number | null;
  conversations: Conversation[];
  messages: Message[];
  suggestions: any[];
  isSuggestionsLoading: boolean;
  
  // Dashboard state
  dashboardData: DashboardData | null;
  isDashboardLoading: boolean;
  
  // Word Cloud state
  wordCloudData: any | null;
  isWordCloudLoading: boolean;
  
  // UI state
  isLoading: boolean;
  lastActivity: Date;
  
  // Cache state
  cachedResponses: Map<string, any>;
}

// Action types
type AppAction = 
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: number | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_SUGGESTIONS'; payload: any[] }
  | { type: 'SET_SUGGESTIONS_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_DATA'; payload: DashboardData }
  | { type: 'SET_DASHBOARD_LOADING'; payload: boolean }
  | { type: 'SET_WORD_CLOUD_DATA'; payload: any }
  | { type: 'SET_WORD_CLOUD_LOADING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'CACHE_RESPONSE'; payload: { key: string; data: any } }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

// Initial state
const initialState: AppState = {
  currentConversationId: null,
  conversations: [],
  messages: [],
  suggestions: [],
  isSuggestionsLoading: false,
  dashboardData: null,
  isDashboardLoading: false,
  wordCloudData: null,
  isWordCloudLoading: false,
  isLoading: false,
  lastActivity: new Date(),
  cachedResponses: new Map(),
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { 
        ...state, 
        currentConversationId: action.payload,
        lastActivity: new Date()
      };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        lastActivity: new Date()
      };
    
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    
    case 'SET_SUGGESTIONS_LOADING':
      return { ...state, isSuggestionsLoading: action.payload };
    
    case 'SET_DASHBOARD_DATA':
      return { 
        ...state, 
        dashboardData: action.payload,
        isDashboardLoading: false,
        lastActivity: new Date()
      };
    
    case 'SET_DASHBOARD_LOADING':
      return { ...state, isDashboardLoading: action.payload };
    
    case 'SET_WORD_CLOUD_DATA':
      return { 
        ...state, 
        wordCloudData: action.payload,
        isWordCloudLoading: false,
        lastActivity: new Date()
      };
    
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
      // Convert timestamp strings back to Date objects when restoring
      const restoredMessages = action.payload.messages?.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) || state.messages;
      
      return { 
        ...state, 
        ...action.payload,
        messages: restoredMessages,
        lastActivity: action.payload.lastActivity ? new Date(action.payload.lastActivity) : state.lastActivity,
        cachedResponses: new Map(state.cachedResponses) // Keep existing cache
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Helper functions
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  loadSuggestions: () => Promise<void>;
  loadDashboardData: (forceRefresh?: boolean) => Promise<void>;
  loadWordCloudData: (forceRefresh?: boolean) => Promise<void>;
  saveStateToSession: () => Promise<void>;
  loadStateFromSession: () => Promise<boolean>;
} | null>(null);

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const queryClient = useQueryClient();

  // Session storage key
  const SESSION_KEY = 'analysisgenius-app-state';

  // Load conversations from API or cache
  const loadConversations = async () => {
    const cacheKey = 'conversations';
    const cached = state.cachedResponses.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
      dispatch({ type: 'SET_CONVERSATIONS', payload: cached.data });
      return;
    }

    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const conversations = await response.json();
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: conversations, timestamp: Date.now() } 
          } 
        });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: number) => {
    const cacheKey = `messages-${conversationId}`;
    const cached = state.cachedResponses.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 min cache
      dispatch({ type: 'SET_MESSAGES', payload: cached.data });
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        dispatch({ type: 'SET_MESSAGES', payload: messages });
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: messages, timestamp: Date.now() } 
          } 
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Load suggestions from API or cache
  const loadSuggestions = async () => {
    const cacheKey = 'suggestions';
    const cached = state.cachedResponses.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 min cache
      dispatch({ type: 'SET_SUGGESTIONS', payload: cached.data });
      return;
    }

    dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: true });

    try {
      const response = await fetch('/api/suggestions');
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.suggestions || data || [];
        dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: suggestions, timestamp: Date.now() } 
          } 
        });
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      dispatch({ type: 'SET_SUGGESTIONS_LOADING', payload: false });
    }
  };

  // Load dashboard data
  const loadDashboardData = async (forceRefresh = false) => {
    const cacheKey = 'dashboard-data';
    const cached = state.cachedResponses.get(cacheKey);
    
    // Use cache only if not forcing refresh and cache is valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // Check if cached data has charts - if not, refresh anyway
      if (cached.data?.charts?.monthlyTrend?.data) {
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: cached.data });
        return;
      }
    }

    try {
      // Set loading state
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true });
      
      const response = await fetch('/api/dashboard-data');
      if (response.ok) {
        const dashboardData = await response.json();
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboardData });
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: dashboardData, timestamp: Date.now() } 
          } 
        });
      } else {
        dispatch({ type: 'SET_DASHBOARD_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: false });
    }
  };

  // Load word cloud data from OpenAI assistant
  const loadWordCloudData = async (forceRefresh = false) => {
    const cacheKey = 'word-cloud-data';
    const cached = state.cachedResponses.get(cacheKey);
    
    // Use cache only if not forcing refresh and cache is valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 min cache
      dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: cached.data });
      return;
    }

    try {
      // Set loading state
      dispatch({ type: 'SET_WORD_CLOUD_LOADING', payload: true });
      
      const response = await fetch('/api/word-cloud-data');
      if (response.ok) {
        const wordCloudData = await response.json();
        dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: wordCloudData });
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: wordCloudData, timestamp: Date.now() } 
          } 
        });
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
        
        // Only restore if data is less than 30 minutes old
        if (Date.now() - sessionData.timestamp < 30 * 60 * 1000) {
          dispatch({ type: 'RESTORE_STATE', payload: sessionData });
          console.log('State restored from session storage');
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

  // Auto-save state on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStateToSession();
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [state.currentConversationId, state.messages, state.dashboardData]);

  // Load initial state on mount
  useEffect(() => {
    const initializeApp = async () => {
      const restored = await loadStateFromSession();
      
      if (!restored) {
        // Load fresh data if no session data
        await Promise.all([
          loadConversations(),
          loadSuggestions(),
          loadDashboardData(),
        ]);
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

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}