import React from 'react';
import { Card } from '@/components/ui/card';

interface WordCloudSectionProps {
  wordCloudData: any;
  onWordClick: (dataPoint: any, chartType: string, chartTitle: string) => void;
  isLoading?: boolean;
}

const WordCloudSection: React.FC<WordCloudSectionProps> = ({ 
  wordCloudData, 
  onWordClick, 
  isLoading = false 
}) => {
  // Word cloud color function
  const getColorByFrequency = (value: number, max: number, min: number) => {
    const normalizedValue = (value - min) / (max - min);
    
    // Use a predefined color palette for better contrast and readability
    if (normalizedValue > 0.8) {
      return '#ffffff'; // White for highest frequency
    } else if (normalizedValue > 0.6) {
      return '#fbbf24'; // Gold for high frequency
    } else if (normalizedValue > 0.4) {
      return '#60a5fa'; // Light blue for medium-high frequency
    } else if (normalizedValue > 0.2) {
      return '#34d399'; // Light green for medium frequency
    } else {
      return '#9ca3af'; // Light gray for low frequency
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Popular Topics</h3>
          <div className="min-h-[300px] flex flex-col justify-center">
            <div className="flex flex-wrap justify-center items-center p-4 min-h-[250px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
                <div 
                  key={index} 
                  className="m-2 p-2 rounded-md animate-pulse"
                  style={{
                    width: `${60 + Math.random() * 80}px`,
                    height: `${20 + Math.random() * 20}px`,
                    backgroundColor: '#e5e7eb'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-full h-4 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Popular Topics</h3>
        <div className="min-h-[300px] flex flex-col justify-center">
          {wordCloudData?.wordData && wordCloudData.wordData.length > 0 ? (
            <div className="flex flex-wrap justify-center items-center p-4 min-h-[250px]">
              {wordCloudData.wordData.map((word: any, index: number) => {
                const maxValue = Math.max(...wordCloudData.wordData.map((w: any) => w.value));
                const minValue = Math.min(...wordCloudData.wordData.map((w: any) => w.value));
                const normalizedValue = (word.value - minValue) / (maxValue - minValue);
                const size = 16 + (normalizedValue * 32); // Font size range: 16px to 48px
                const opacity = 0.6 + (normalizedValue * 0.4); // Opacity range: 0.6 to 1.0
                
                return (
                  <span
                    key={index}
                    className="word-cloud-word cursor-pointer inline-block m-1 p-2 rounded-md hover:bg-muted/40 hover:scale-110 hover:shadow-lg relative transition-all duration-300"
                    title={`Click to analyze "${word.text}" topic - mentioned ${word.value} times. Get AI insights into context, sentiment, and related discussions.`}
                    style={{ 
                      fontSize: `${size}px`, 
                      opacity: opacity,
                      color: getColorByFrequency(word.value, maxValue, minValue),
                      fontWeight: word.value > maxValue * 0.6 ? 'bold' : 'normal',
                      animationDelay: `${index * 0.2}s`,
                      textShadow: `0 1px 2px rgba(0, 0, 0, 0.3), 0 0 4px rgba(0, 0, 0, 0.2)`,
                      filter: `brightness(${0.95 + (word.value / maxValue) * 0.15})`,
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      const chartData = {
                        label: word.text,
                        value: word.value,
                        category: word.category,
                        sentiment: word.sentiment,
                        chartType: 'wordcloud',
                        chartTitle: 'Popular Topics Word Cloud'
                      };
                      onWordClick(chartData, 'wordcloud', 'Popular Topics Word Cloud');
                    }}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          ) : (
            // Fallback if no data
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">Analyzing trending topics...</p>
                <p className="text-xs mt-1">Building word cloud from radio transcripts</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">AI Insight:</span> {
              wordCloudData?.metadata?.analysisScope || 
              "Most frequently mentioned topics from radio transcript database, with word size indicating mention frequency."
            }
          </p>
          {wordCloudData?.metadata && (
            <p className="text-xs text-muted-foreground mt-1">
              Source: {wordCloudData.metadata.dataSource} | 
              Updated: {wordCloudData.metadata.lastUpdated} | 
              Total words: {wordCloudData.metadata.totalWords}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WordCloudSection;
