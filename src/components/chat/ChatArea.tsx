import { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import Message from "./Message";
import SuggestionBubbles from "./SuggestionBubbles";
import { Button } from "@/components/ui/button";
import { Download, Share, Settings } from "lucide-react";
import type { Message as MessageType } from "@shared/schema";

interface ChatAreaProps {
  messages: MessageType[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onChartExpand: (chartData: any) => void;
}

export default function ChatArea({ 
  messages, 
  onSendMessage, 
  isLoading, 
  onChartExpand 
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [isLoading]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Data Visualization Assistant</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">AI Online</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <Download size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <Message
              message={{
                id: 0,
                conversationId: 0,
                content: "👋 Hello! I'm your AI data visualization assistant. I can help you create beautiful charts, analyze data trends, and generate insights. What would you like to visualize today?",
                role: "assistant",
                createdAt: new Date(),
                chartData: null,
              }}
              onChartExpand={onChartExpand}
            />
          ) : (
            messages.map((message) => (
              <Message
                key={`message-${message.id}`}
                message={message}
                onChartExpand={onChartExpand}
              />
            ))
          )}
        </div>



        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3 animate-slide-up">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              🤖
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-md p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
