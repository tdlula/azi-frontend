import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logApiRequest, logError, logPerformance } from "./sentry";

// API Configuration - Backend detection and fallback
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '5000';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || 'localhost';
const API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorDetails = '';
    
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || res.statusText;
      errorDetails = errorData.details || '';
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      try {
        errorMessage = await res.text() || res.statusText;
      } catch (textError) {
        errorMessage = res.statusText;
      }
    }
    
    const error = new Error(`${res.status}: ${errorMessage}`);
    (error as any).status = res.status;
    (error as any).details = errorDetails;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: { timeout?: number; retries?: number } = {}
): Promise<Response> {
  const { timeout = 30000, retries = 1 } = options;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const startTime = Date.now();
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(fullUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      // Log successful API request
      logApiRequest(method, url, res.status, responseTime, {
        attempt: attempt + 1,
        totalRetries: retries,
        requestSize: data ? JSON.stringify(data).length : 0,
        contentType: res.headers.get('content-type') || 'unknown'
      });
      
      await throwIfResNotOk(res);
      
      // Log performance for successful requests
      logPerformance(`api_${method.toLowerCase()}_${url.replace(/[^a-zA-Z0-9]/g, '_')}`, startTime, {
        status: res.status,
        attempt: attempt + 1
      });
      
      return res;
      
    } catch (error) {
      lastError = error as Error;
      const responseTime = Date.now() - startTime;
      
      // Log error with context
      const status = (error as any).status || 0;
      logApiRequest(method, url, status, responseTime, {
        attempt: attempt + 1,
        totalRetries: retries,
        errorMessage: lastError.message,
        isRetryableError: status < 400 || status >= 500
      });
      
      // Log to Sentry for tracking
      logError(lastError, `API Request: ${method} ${url}`, {
        attempt: attempt + 1,
        status,
        responseTime,
        requestData: data
      });
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (status && (status === 400 || status === 401 || status === 403 || status === 404)) {
          throw error;
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError!;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      credentials: "include",
      mode: 'cors'
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
