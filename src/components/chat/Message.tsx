import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expand, Download, Lightbulb } from "lucide-react";
import ChartRenderer from "@/components/charts/ChartRenderer";
import type { Message as MessageType } from "@shared/schema";

interface MessageProps {
  message: MessageType;
  onChartExpand?: (chartData: any) => void;
}

export default function Message({ message, onChartExpand }: MessageProps) {
  const isUser = message.role === "user";
  // Add type safety for chartData
  const chartData = message.chartData as Record<string, any> | undefined;

  return (
    <div className={`mb-4 animate-slide-up ${isUser ? "flex justify-end" : ""}`}>
      {isUser ? (
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-md p-4 max-w-lg">
          <p>{message.content}</p>
        </div>
      ) : (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span role="img" aria-label="AI">
              🤖
            </span>
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-md p-4 max-w-2xl">
            <p className="text-gray-800 mb-4">{message.content}</p>

            {/* Chart */}
            {chartData && (
              <Card className="bg-white border border-gray-200 chart-container">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {chartData.title || "Generated Chart"}
                    </h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onChartExpand?.(chartData)}
                      >
                        <Expand size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Download size={12} />
                      </Button>
                    </div>
                  </div>

                  <ChartRenderer chartData={chartData} />

                  {chartData.insights && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Lightbulb className="inline mr-2" size={14} />
                        <strong>AI Insight:</strong> {chartData.insights}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
