import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CacheManager } from '@/utils/cacheUtils';

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
    overallPositiveSentiment: {
      value: number;
      label: string;
    };
    totalMentions: {
      value: number;
      label: string;
    };
    highEngagementMoments: {
      value: number;
      label: string;
    };
    whatsappNumberMentions: {
      value: number;
      label: string;
    };
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
    dashboardError?: string;
    wordCloudError?: string;
}

// Action types
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

// Initial state
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
    
    case 'CLEAR_MESSAGES':
      return { 
        ...state, 
        messages: [],
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
  loadDashboardData: (forceRefresh?: boolean, topic?: string, dateRange?: { from: Date; to: Date }) => Promise<void>;
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
  const loadDashboardData = async (forceRefresh = false, topic?: string, dateRange?: { from: Date; to: Date }) => {
    const cacheKey = CacheManager.generateCacheKey('dashboard', topic, dateRange);
    const memoryCached = state.cachedResponses.get(cacheKey);
    
    // Check memory cache first
    if (!forceRefresh && memoryCached && Date.now() - memoryCached.timestamp < 5 * 60 * 1000) {
      const hasValidCharts = memoryCached.data?.charts && Object.keys(memoryCached.data.charts).length > 0;
      if (hasValidCharts) {
        console.log('🧠 Using memory cached dashboard data:', {
          chartCount: Object.keys(memoryCached.data.charts).length,
          chartKeys: Object.keys(memoryCached.data.charts),
          topic: topic || 'general'
        });
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: memoryCached.data });
        return;
      }
    }
    
    // Check localStorage cache if memory cache missed
    if (!forceRefresh) {
      const localCached = CacheManager.getFromCache(cacheKey);
      if (localCached?.charts && Object.keys(localCached.charts).length > 0) {
        console.log('� Using localStorage cached dashboard data:', {
          chartCount: Object.keys(localCached.charts).length,
          chartKeys: Object.keys(localCached.charts),
          topic: topic || 'general'
        });
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: localCached });
        
        // Also update memory cache
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: localCached, timestamp: Date.now() } 
          } 
        });
        return;
      }
    }

    try {
      // Set loading state
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true });
      
      // Build URL with force refresh, topic, and date range parameters
      const params = new URLSearchParams();
      if (forceRefresh) params.append('force_refresh', 'true');
      if (topic && topic !== 'general') params.append('topic', topic);
      if (dateRange) {
        params.append('from_date', dateRange.from.toISOString().split('T')[0]);
        params.append('to_date', dateRange.to.toISOString().split('T')[0]);
      }
      
      const url = `/api/dashboard-data${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const dashboardData = await response.json();
        console.log('📊 Received new dashboard data from API:', {
          chartCount: dashboardData?.charts ? Object.keys(dashboardData.charts).length : 0,
          chartKeys: dashboardData?.charts ? Object.keys(dashboardData.charts) : [],
          forceRefresh,
          topic: topic || 'general'
        });
        
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboardData });
        
        // Cache in both memory and localStorage
        const cacheData = { data: dashboardData, timestamp: Date.now() };
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: cacheData 
          } 
        });
        CacheManager.saveToCache(
          cacheKey, 
          dashboardData, 
          topic || 'general', 
          dateRange ? `${dateRange.from.toISOString().split('T')[0]}-${dateRange.to.toISOString().split('T')[0]}` : 'default'
        );
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
    const cacheKey = CacheManager.generateCacheKey('wordcloud');
    const memoryCached = state.cachedResponses.get(cacheKey);
    
    // Check memory cache first
    if (!forceRefresh && memoryCached && Date.now() - memoryCached.timestamp < 10 * 60 * 1000) { // 10 min cache
      console.log('🧠 Using memory cached word cloud data');
      dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: memoryCached.data });
      return;
    }
    
    // Check localStorage cache if memory cache missed
    if (!forceRefresh) {
      const localCached = CacheManager.getFromCache(cacheKey);
      if (localCached) {
        console.log('💾 Using localStorage cached word cloud data');
        dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: localCached });
        
        // Also update memory cache
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: { data: localCached, timestamp: Date.now() } 
          } 
        });
        return;
      }
    }

    try {
      // Set loading state
      dispatch({ type: 'SET_WORD_CLOUD_LOADING', payload: true });
      
      const response = await fetch('/api/word-cloud-data');
      if (response.ok) {
        const wordCloudData = await response.json();
        console.log('☁️ Received new word cloud data from API');
        dispatch({ type: 'SET_WORD_CLOUD_DATA', payload: wordCloudData });
        
        // Cache in both memory and localStorage
        const cacheData = { data: wordCloudData, timestamp: Date.now() };
        dispatch({ 
          type: 'CACHE_RESPONSE', 
          payload: { 
            key: cacheKey, 
            data: cacheData 
          } 
        });
        CacheManager.saveToCache(cacheKey, wordCloudData);
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