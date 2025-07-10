// Simplified logging without Sentry dependency
export const initSentry = () => {
  // Sentry initialization disabled - using console logging instead
  console.log('Logging initialized (console-only mode)');
};

// Custom error logging utilities
export const logError = (error: Error, context?: string, extra?: Record<string, any>) => {
  console.error(`[${context || 'Unknown'}]`, error, extra);
};

// Performance monitoring
export const logPerformance = (operation: string, startTime: number, metadata?: Record<string, any>) => {
  const duration = Date.now() - startTime;
  console.log(`Performance: ${operation} completed in ${duration}ms`, metadata);
};

// User interaction tracking
export const logUserAction = (action: string, component: string, metadata?: Record<string, any>) => {
  console.log(`User action: ${action} in ${component}`, metadata);
};

// API request tracking
export const logApiRequest = (method: string, url: string, status: number, duration: number, metadata?: Record<string, any>) => {
  const level = status >= 400 ? 'error' : 'info';
  console[level](`API ${method} ${url} ${status} (${duration}ms)`, metadata);
};

// Chart rendering tracking
export const logChartRender = (chartType: string, dataPoints: number, renderTime: number) => {
  logPerformance(`chart_render_${chartType}`, Date.now() - renderTime, {
    chartType,
    dataPoints,
  });
};

// OpenAI integration tracking
export const logOpenAIRequest = (operation: string, tokens: number, model: string, responseTime: number) => {
  console.log(`OpenAI: ${operation} (${tokens} tokens, ${model}, ${responseTime}ms)`);
};