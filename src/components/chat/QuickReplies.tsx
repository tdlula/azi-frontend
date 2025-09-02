// QuickReplies component

import React from "react";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { QUICK_REPLY_SUGGESTIONS } from "@/constants/chatConstants";

interface QuickRepliesProps {
  show: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelect: (suggestion: string) => void;
}

export default function QuickReplies({ show, isLoading, onClose, onSelect }: QuickRepliesProps) {
  if (!show || isLoading) return null;

  return (
    <div className="quick-replies-container quick-replies-slide-in bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto fixed bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-40 shadow-lg">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-300 font-medium">💬 Quick Replies</span>
          <span className="text-xs text-gray-500">(Select to continue the conversation)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 h-auto"
          title="Hide suggestions"
        >
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {QUICK_REPLY_SUGGESTIONS.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion.text)}
            className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 transition-all duration-200 hover:scale-105 touch-target justify-start"
            title={`Click to use: "${suggestion.text}"`}
          >
            <span className="text-xs sm:text-sm flex-shrink-0">{suggestion.icon}</span>
            <span className="text-xs leading-tight truncate">{suggestion.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
