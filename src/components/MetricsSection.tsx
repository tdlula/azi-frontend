import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Target, Activity, BarChart3, Radio, Award, Clock, Zap } from 'lucide-react';

interface MetricsSectionProps {
  metrics: any;
  onMetricClick: (metricType: string, metricTitle: string, metricValue: string) => void;
  isLoading?: boolean;
}

const MetricsSection: React.FC<MetricsSectionProps> = ({ 
  metrics, 
  onMetricClick, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="p-3 sm:p-4 animate-pulse">
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-4 h-4 bg-muted rounded mb-1" />
              <div className="w-16 sm:w-20 h-3 bg-muted rounded" />
              <div className="w-10 sm:w-12 h-5 sm:h-6 bg-muted rounded" />
              <div className="w-12 sm:w-16 h-3 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
      <Card 
        className="p-3 sm:p-4 cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm touch-target" 
        onClick={() => onMetricClick("overall_positive_sentiment", metrics?.overallPositiveSentiment?.label || "Overall Positive Sentiment", (metrics?.overallPositiveSentiment?.value || 0).toString())}
      >
        <div className="flex flex-col items-center text-center space-y-1">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mb-1" />
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight text-center px-1">
            {metrics?.overallPositiveSentiment?.label || "Overall Positive Sentiment"}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{metrics?.overallPositiveSentiment?.value || 0}%</p>
          <p className="text-xs text-muted-foreground">Positive</p>
        </div>
      </Card>

      <Card 
        className="p-3 sm:p-4 cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm touch-target" 
        onClick={() => onMetricClick("total_mentions", metrics?.totalMentions?.label || "Total On-Air Mentions", (metrics?.totalMentions?.value || 0).toString())}
      >
        <div className="flex flex-col items-center text-center space-y-1">
          <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mb-1" />
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight text-center px-1">
            {metrics?.totalMentions?.label || "Total On-Air Mentions"}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{metrics?.totalMentions?.value || 0}</p>
          <p className="text-xs text-muted-foreground">Mentions</p>
        </div>
      </Card>

      <Card 
        className="p-3 sm:p-4 cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm touch-target" 
        onClick={() => onMetricClick("high_engagement_moments", metrics?.highEngagementMoments?.label || "High Engagement Moments", (metrics?.highEngagementMoments?.value || 0).toString())}
      >
        <div className="flex flex-col items-center text-center space-y-1">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mb-1" />
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight text-center px-1">
            {metrics?.highEngagementMoments?.label || "High Engagement Moments"}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{metrics?.highEngagementMoments?.value || 0}</p>
          <p className="text-xs text-muted-foreground">Moments</p>
        </div>
      </Card>

      <Card 
        className="p-3 sm:p-4 cursor-pointer hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200 shadow-sm touch-target" 
        onClick={() => onMetricClick("whatsapp_number_mentions", metrics?.whatsappNumberMentions?.label || "WhatsApp Number Mentions", (metrics?.whatsappNumberMentions?.value || 0).toString())}
      >
        <div className="flex flex-col items-center text-center space-y-1">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mb-1" />
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight text-center px-1">
            {metrics?.whatsappNumberMentions?.label || "WhatsApp Number Mentions"}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{metrics?.whatsappNumberMentions?.value || 0}</p>
          <p className="text-xs text-muted-foreground">WhatsApp</p>
        </div>
      </Card>
    </div>
  );
};

export default MetricsSection;
