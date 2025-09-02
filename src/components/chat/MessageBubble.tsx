// MessageBubble component

import React from "react";
import { Button } from "@/components/ui/button";
import { User, Bot, Copy, Check } from "lucide-react";
import { Message } from "@/types/chat";
import ChartRenderer from "@/components/charts/ChartRenderer";
import SentimentTable from "@/components/SentimentTable";

interface MessageBubbleProps {
  message: Message;
  index: number;
  streamingMessageId: number | null;
  copiedId: number | null;
  onCopyMessage: (content: string, id: number, event?: React.MouseEvent) => void;
  onChartClick: (dataPoint: any, chartType: string, chartTitle: string) => void;
  StreamingMessageContent: React.ComponentType<{ message: Message }>;
}

export default function MessageBubble({
  message,
  index,
  streamingMessageId,
  copiedId,
  onCopyMessage,
  onChartClick,
  StreamingMessageContent
}: MessageBubbleProps) {
  return (
    <div
      key={message.id}
      className={`message-slide-in ${
        message.role === "user" 
          ? "message-wrapper-user flex items-start space-x-2 sm:space-x-3 w-full justify-end flex-row-reverse space-x-reverse" 
          : "message-wrapper flex items-start space-x-2 sm:space-x-3 w-full"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`flex flex-col w-full`}>
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className={`${
            message.role === "user" ? "message-avatar-user" : "message-avatar-bot"
          } flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
            message.role === "user" 
              ? "bg-gradient-to-r from-blue-500 to-purple-600" 
              : "bg-gradient-to-r from-emerald-500 to-teal-600"
          }`}> 
            {message.role === "user" ? (
              <User className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
            ) : (
              <Bot className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
            )}
          </div>
          <div className={`flex-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`message-bubble inline-block ${
              message.role === "user" 
                ? "message-bubble-user px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white max-w-lg" 
                : "message-bubble-bot px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-slate-800 text-white border border-slate-600 max-w-4xl"
            }`}>
              {message.role === "assistant" ? (
                <div className="message-text text-xs sm:text-sm leading-relaxed text-white">
                  {(message.id === streamingMessageId && Boolean(message.isStreaming))
                    ? <StreamingMessageContent message={{ ...message, isStreaming: true }} />
                    : <StreamingMessageContent message={{ ...message, isStreaming: false }} />}
                </div>
              ) : (
                <div className="message-text text-xs sm:text-sm leading-relaxed text-white">
                  {message.content}
                </div>
              )}
            </div>
            
            {/* Chart rendering for this message only */}
            {message.chartData && (
              <div className="mt-3 sm:mt-4 w-full">
                <div className="p-4 sm:p-6 bg-slate-900 border border-slate-600 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 text-white">
                    {message.chartData.title || 'Generated Chart'}
                  </h3>
                  {(message.chartData.type || message.chartData.chart_type) && message.chartData.data ? (
                    <ChartRenderer 
                      chartData={message.chartData} 
                      onChartClick={onChartClick}
                    />
                  ) : null}
                </div>
              </div>
            )}
            
            {message.sentimentData && (
              <div className="mt-3 sm:mt-4 w-full">
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
                  <SentimentTable data={message.sentimentData} />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <span className="message-timestamp text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onCopyMessage(message.content, message.id, e)}
                className="text-xs p-1 h-auto transition-all hover:scale-110 relative z-10 text-gray-400 hover:text-white"
              >
                {copiedId === message.id ? (
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 bounce-once" />
                ) : (
                  <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
