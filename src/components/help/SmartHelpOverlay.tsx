import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Lightbulb, TrendingUp, BarChart3, Target, Zap } from "lucide-react";

interface HelpRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  confidence: number;
  category: 'optimization' | 'suggestion' | 'insight' | 'improvement';
  icon: string;
}

interface SmartHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: {
    lastChartTypes: string[];
    messageCount: number;
    recentPrompts: string[];
    preferredTheme: string;
  };
  onRecommendationClick: (action: string) => void;
}

export default function SmartHelpOverlay({ 
  isOpen, 
  onClose, 
  userContext, 
  onRecommendationClick 
}: SmartHelpOverlayProps) {
  const [recommendations, setRecommendations] = useState<HelpRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate smart recommendations based on user context
  useEffect(() => {
    if (isOpen) {
      generateRecommendations();
    }
  }, [isOpen, userContext]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/smart-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: userContext,
          requestType: 'contextual_help'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        // Fallback to static intelligent recommendations
        setRecommendations(getStaticRecommendations());
      }
    } catch (error) {
      console.error('Failed to fetch smart recommendations:', error);
      setRecommendations(getStaticRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const getStaticRecommendations = (): HelpRecommendation[] => {
    const { lastChartTypes, messageCount, recentPrompts } = userContext;
    const recommendations: HelpRecommendation[] = [];

    // Chart diversity recommendation
    if (lastChartTypes.length > 0) {
      const uniqueTypes = new Set(lastChartTypes);
      if (uniqueTypes.size < 3) {
        recommendations.push({
          id: 'chart_diversity',
          title: 'Explore More Chart Types',
          description: 'Try different visualizations like scatter plots or area charts for deeper insights',
          action: 'Create a scatter plot showing correlation between two variables with trend analysis',
          confidence: 0.85,
          category: 'suggestion',
          icon: '📊'
        });
      }
    }

    // Text analysis suggestion for new users
    if (messageCount < 5) {
      recommendations.push({
        id: 'text_analysis_intro',
        title: 'Try Text Analysis',
        description: 'Upload documents or analyze text data to extract key insights and themes',
        action: 'Upload a document or ask me to analyze trending topics in South African data',
        confidence: 0.90,
        category: 'suggestion',
        icon: '📄'
      });
    }

    // Advanced features for experienced users
    if (messageCount > 10) {
      recommendations.push({
        id: 'advanced_analysis',
        title: 'Advanced Analytics',
        description: 'Combine multiple chart types for comprehensive data storytelling',
        action: 'Create a dashboard with bar chart for categories, line chart for trends, and pie chart for distribution',
        confidence: 0.80,
        category: 'optimization',
        icon: '🚀'
      });
    }

    // Contextual chart improvements
    if (recentPrompts.some(prompt => prompt.toLowerCase().includes('compare'))) {
      recommendations.push({
        id: 'comparison_enhancement',
        title: 'Enhanced Comparisons',
        description: 'Use grouped bar charts or radar charts for multi-dimensional comparisons',
        action: 'Create a radar chart comparing performance across multiple metrics and categories',
        confidence: 0.75,
        category: 'improvement',
        icon: '🎯'
      });
    }

    // Smart insights suggestion
    recommendations.push({
      id: 'insights_focus',
      title: 'Focus on Insights',
      description: 'Ask for specific analytical insights to get more actionable recommendations',
      action: 'Analyze the data trends and provide key insights with recommendations for improvement',
      confidence: 0.70,
      category: 'insight',
      icon: '💡'
    });

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'optimization': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'insight': return <Target className="w-5 h-5 text-blue-500" />;
      case 'improvement': return <Zap className="w-5 h-5 text-purple-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'optimization': return 'border-green-200 bg-green-50';
      case 'suggestion': return 'border-yellow-200 bg-yellow-50';
      case 'insight': return 'border-blue-200 bg-blue-50';
      case 'improvement': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Contextual Help
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered recommendations based on your usage patterns
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Analyzing your usage patterns...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Based on your recent activity ({userContext.messageCount} messages, {userContext.lastChartTypes.length} charts created)
              </div>
              
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${getCategoryColor(rec.category)} dark:bg-gray-800 dark:border-gray-600`}
                  onClick={() => {
                    onRecommendationClick(rec.action);
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(rec.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rec.title}
                        </h3>
                        <span className="text-lg">{rec.icon}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            {Math.round(rec.confidence * 100)}% match
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        Click to try: "{rec.action.substring(0, 60)}..."
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {recommendations.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep using AnalysisGenius to get personalized recommendations!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Recommendations update based on your usage patterns</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRecommendations}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}