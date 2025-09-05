import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartLine, ChartBar, ChartPie, Plus, Upload } from "lucide-react";
import type { Conversation } from "@shared/schema";

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string;
  onConversationSelect: (id: string) => void;
}

export default function ChatSidebar({ 
  conversations, 
  selectedConversationId, 
  onConversationSelect 
}: ChatSidebarProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <ChartLine className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ChartMind AI</h1>
            <p className="text-sm text-gray-500">Data Visualization Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Conversations</h3>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConversationId === conversation.id
                    ? "bg-indigo-50 border border-indigo-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ChartBar className="text-blue-600" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getTimeAgo(conversation.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-100">
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="default">
            <Plus className="mr-3" size={18} />
            New Chart
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Upload className="mr-3" size={18} />
            Upload Data
          </Button>
        </div>
      </div>
    </div>
  );
}
