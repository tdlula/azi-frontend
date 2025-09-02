// MessagesContainer component

import React from "react";
import { Bot } from "lucide-react";
import { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import StreamingMessage from "./StreamingMessage";

interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
  isUploadProcessing: boolean;
  streamingMessageId: number | null;
  copiedId: number | null;
  messagesTopRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onCopyMessage: (content: string, id: number, event?: React.MouseEvent) => void;
  onChartClick: (dataPoint: any, chartType: string, chartTitle: string) => void;
}

export default function MessagesContainer({
  messages,
  isLoading,
  isUploadProcessing,
  streamingMessageId,
  copiedId,
  messagesTopRef,
  messagesEndRef,
  onCopyMessage,
  onChartClick
}: MessagesContainerProps) {
  return (
    <div className="messages-container p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-transparent transition-all duration-300 pb-32 sm:pb-40 md:pb-44">
      {/* Top Reference Point */}
      <div ref={messagesTopRef} />
      
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-200">
          <p className="text-sm sm:text-base">Start a conversation by asking a question or clicking on a topic above!</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
            streamingMessageId={streamingMessageId}
            copiedId={copiedId}
            onCopyMessage={onCopyMessage}
            onChartClick={onChartClick}
            StreamingMessageContent={StreamingMessage}
          />
        ))
      )}
      
      {(isLoading || isUploadProcessing) && (
        <div className="message-wrapper flex items-start space-x-2 sm:space-x-3 w-full">
          <div className="flex flex-col">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="message-avatar-bot flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600">
                <Bot className="avatar-icon w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="message-bubble-bot px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-slate-800 text-white border border-slate-600 inline-block">
                <div className="flex items-center gap-2">
                  {isUploadProcessing ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="message-text text-xs sm:text-sm leading-relaxed">Processing PDF document...</span>
                    </>
                  ) : (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
