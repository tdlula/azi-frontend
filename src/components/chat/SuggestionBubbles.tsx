import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, PieChart, LineChart, Brain, Target } from "lucide-react";
import { useLocation } from "wouter";

// Define Suggestion type locally to match usage
interface Suggestion {
  id: string;
  text: string;
  category: "analysis" | "visualization" | "prediction" | "comparison";
  emoji: string;
  prompt: string;
}

interface SuggestionBubblesProps {
  onSuggestionClick: (prompt: string) => void;
}

const defaultSuggestions: Suggestion[] = [
  {
    id: "1",
    text: "Sales Performance Analysis",
    category: "analysis",
    emoji: "📈",
    prompt: "Create a detailed analysis of sales performance over the last 12 months with trend insights"
  },
  {
    id: "2", 
    text: "Market Share Comparison",
    category: "comparison",
    emoji: "🥧",
    prompt: "Generate a pie chart showing market share distribution across different product categories"
  },
  {
    id: "3",
    text: "Revenue Forecast",
    category: "prediction",
    emoji: "🔮",
    prompt: "Create a forecast chart predicting revenue trends for the next quarter based on historical data"
  },
  {
    id: "4",
    text: "Customer Demographics",
    category: "visualization",
    emoji: "👥",
    prompt: "Visualize customer demographics breakdown by age groups and geographic regions"
  },
  {
    id: "5",
    text: "Product Performance",
    category: "comparison",
    emoji: "🏆",
    prompt: "Compare product performance metrics across different categories with bar charts"
  },
  {
    id: "6",
    text: "Growth Analytics",
    category: "analysis",
    emoji: "🚀",
    prompt: "Analyze growth patterns and identify key performance indicators over time"
  }
];

const categoryColors: Record<Suggestion["category"], string> = {
  analysis: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  visualization: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100", 
  prediction: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  comparison: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
};

const categoryIcons: Record<Suggestion["category"], React.ComponentType<{ size?: string | number }>> = {
  analysis: TrendingUp,
  visualization: BarChart3,
  prediction: Brain,
  comparison: Target
};

export default function SuggestionBubbles({ onSuggestionClick }: SuggestionBubblesProps) {
  const [, navigate] = useLocation();

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8"></div>
        <div className="max-w-4xl">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="text-indigo-600" size={18} />
            <p className="text-sm font-medium text-gray-700">AI Suggestions</p>
            <Badge variant="secondary" className="text-xs">Smart Prompts</Badge>
          </div>
          
          {/* Advanced Report Generator Highlight */}
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Brain className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Advanced Report Generator</h3>
                  <p className="text-sm text-gray-600">Break down complex prompts into professional reports</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/advanced-report")}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                size="sm"
              >
                Create Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {defaultSuggestions.map((suggestion) => {
              const IconComponent = categoryIcons[suggestion.category];
              return (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start text-left space-y-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${categoryColors[suggestion.category]}`}
                  onClick={() => onSuggestionClick(suggestion.prompt)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <span className="text-lg">{suggestion.emoji}</span>
                    <IconComponent size={16} />
                    <Badge variant="outline" className="ml-auto text-xs capitalize">
                      {suggestion.category}
                    </Badge>
                  </div>
                  <span className="font-medium text-sm">{suggestion.text}</span>
                </Button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-indigo-700">
                <strong>Pro Tip:</strong> Try asking for specific chart types like "Create a scatter plot showing..." or "Generate a heatmap for..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}