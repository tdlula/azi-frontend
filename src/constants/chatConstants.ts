// Chat application constants

export const QUICK_REPLY_SUGGESTIONS = [
  { text: "Create advanced report", icon: "🧠" },
  { text: "Summarize this", icon: "📄" },
  { text: "Give more detail", icon: "🔍" },
  { text: "Explain simply", icon: "💡" },
  { text: "Show me a chart", icon: "📊" },
  { text: "What's the key insight?", icon: "🎯" },
  { text: "Compare with competitors", icon: "⚡" },
  { text: "Show trends over time", icon: "📈" },
  { text: "Break this down", icon: "🧩" }
];

export const CHART_KEYWORDS = [
  'chart', 'graph', 'plot', 'visual', 'visualization', 'visualize',
  'bar chart', 'line chart', 'pie chart', 'area chart', 'scatter plot', 
  'create chart', 'generate chart', 'show chart', 'display chart',
  'trending chart', 'trends chart', 'distribution chart', 'comparison chart'
];

export const SENTIMENT_KEYWORDS = [
  'sentiment', 'feeling', 'opinion', 'positive', 'negative', 'compare sentiment', 'sentiment comparison'
];

export const CHART_INDICATORS = [
  'line chart', 'bar chart', 'pie chart', 'area chart', 'scatter plot',
  'chart data:', 'visualization notes:', 'x-axis:', 'y-axis:',
  'plotting', 'curve peaks', 'trends', 'distribution',
  'structured to allow plotting', 'visualization', 'dataset'
];

export const FILE_SIZE_LIMITS = {
  PDF: 50 * 1024 * 1024, // 50MB
  TEXT: 10 * 1024 * 1024, // 10MB
};

export const STREAMING_SPEED = 1; // milliseconds per character

export const MESSAGE_COLORS = {
  USER: {
    background: 'from-blue-500 to-purple-600',
    hover: 'from-blue-600 to-purple-700',
  },
  ASSISTANT: {
    background: 'from-emerald-500 to-teal-600',
    border: 'border-slate-600',
  }
};

export const SCROLL_BEHAVIOR = {
  SMOOTH: 'smooth' as ScrollBehavior,
  AUTO: 'auto' as ScrollBehavior,
};
