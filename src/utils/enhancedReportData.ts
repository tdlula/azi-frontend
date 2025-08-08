interface EnhancedReportData {
  executiveSummary?: {
    campaignSentimentTrends?: string;
    keyTakeaways?: string[];
    sentimentBreakdown?: { positive: number; neutral: number; negative: number };
    topPerformingStations?: Array<{ name: string; score: number; format: string }>;
  };
  methodology?: {
    aiToolDescription?: string;
    dialectRecognition?: string;
    dataSources?: string[];
    timePeriod?: string;
    stationCoverage?: string;
    limitations?: string[];
  };
  sentimentMapping?: {
    overallDistribution?: { positive: number; neutral: number; negative: number };
    toneBreakdown?: Array<{ emotion: string; score: number }>;
    examples?: Array<{ text: string; sentiment: string; score: number }>;
  };
  dealResonance?: {
    mentionsPerDeal?: Array<{ dealName: string; mentions: number; sentiment: number }>;
    xtraSavingsLanguage?: {
      popularPhrases?: Array<{ phrase: string; frequency: number; sentiment: number }>;
      wordCloudData?: Array<{ text: string; value: number; sentiment: string }>;
    };
  };
  stationAnalysis?: {
    linguisticAnalysis?: Array<{ station: string; expressions: string[]; sentimentTrend: number }>;
    culturalNuances?: Array<{ phrase: string; meaning: string; tone: string; station: string }>;
  };
  engagementIndicators?: {
    highEngagementMoments?: Array<{ timestamp: string; description: string; engagementScore: number }>;
    whatsappMentions?: { frequency: number; sentimentContext: string; correlations: string[] };
  };
  contentFormatAnalysis?: {
    formatComparison?: Array<{ format: string; sentimentScore: number; effectiveness: number }>;
    recallIndicators?: Array<{ keyword: string; frequency: number; format: string }>;
    optimizationOpportunities?: string[];
  };
  complianceMonitoring?: {
    nonComplianceIncidents?: Array<{ type: string; description: string; severity: string }>;
    cleanBroadcastPercentage?: number;
    brandSafetyRecommendations?: string[];
  };
}

interface EnhancedReportRequest {
  topic: string;
  dateRange: {
    from: string;
    to: string;
  };
  sessionId?: string;
}

interface EnhancedReportResponse {
  success: boolean;
  data?: EnhancedReportData;
  sessionId?: string;
  error?: string;
  details?: string;
}

/**
 * Fetch enhanced report data from the backend OpenAI assistant
 */
export async function fetchEnhancedReportData(
  request: EnhancedReportRequest
): Promise<EnhancedReportData | null> {
  try {
    console.log('🔄 Fetching enhanced report data...', request);

    const response = await fetch('/api/generate-enhanced-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Enhanced report fetch failed:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result: EnhancedReportResponse = await response.json();

    if (result.success && result.data) {
      console.log('✅ Enhanced report data fetched successfully');
      return result.data;
    } else {
      console.error('❌ Enhanced report generation failed:', result.error);
      throw new Error(result.error || 'Failed to generate enhanced report data');
    }
  } catch (error) {
    console.error('❌ Error fetching enhanced report data:', error);
    
    // Return null to allow the report to render with fallback data
    return null;
  }
}

/**
 * Cache for enhanced report data to avoid repeated API calls
 */
const enhancedDataCache = new Map<string, EnhancedReportData>();

/**
 * Generate cache key for enhanced report data
 */
function generateCacheKey(request: EnhancedReportRequest): string {
  return `${request.topic}:${request.dateRange.from}:${request.dateRange.to}`;
}

/**
 * Fetch enhanced report data with caching
 */
export async function fetchEnhancedReportDataCached(
  request: EnhancedReportRequest
): Promise<EnhancedReportData | null> {
  const cacheKey = generateCacheKey(request);
  
  // Check cache first
  if (enhancedDataCache.has(cacheKey)) {
    console.log('📋 Using cached enhanced report data');
    return enhancedDataCache.get(cacheKey) || null;
  }

  // Fetch fresh data
  const data = await fetchEnhancedReportData(request);
  
  // Cache the result if successful
  if (data) {
    enhancedDataCache.set(cacheKey, data);
  }
  
  return data;
}

/**
 * Clear the enhanced report data cache
 */
export function clearEnhancedReportCache(): void {
  enhancedDataCache.clear();
  console.log('🗑️ Enhanced report cache cleared');
}

/**
 * Check if enhanced report data is available in cache
 */
export function hasEnhancedReportCache(request: EnhancedReportRequest): boolean {
  const cacheKey = generateCacheKey(request);
  return enhancedDataCache.has(cacheKey);
}

export type { EnhancedReportData, EnhancedReportRequest, EnhancedReportResponse };
