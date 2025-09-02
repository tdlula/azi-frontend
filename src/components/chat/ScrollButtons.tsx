// ScrollButtons component

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ScrollButtonsProps {
  messagesLength: number;
  showQuickReplies: boolean;
  isLoading: boolean;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}

export default function ScrollButtons({
  messagesLength,
  showQuickReplies,
  isLoading,
  onScrollToTop,
  onScrollToBottom
}: ScrollButtonsProps) {
  if (messagesLength <= 3) return null;

  return (
    <div className={`fixed right-4 sm:right-6 md:right-8 flex flex-col gap-2 z-50 transition-all duration-300 ${
      showQuickReplies && !isLoading 
        ? 'bottom-32 sm:bottom-40 md:bottom-44' 
        : 'bottom-20 sm:bottom-32'
    }`}>
      <Button
        onClick={onScrollToTop}
        variant="outline"
        size="sm"
        className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-500 hover:border-purple-600 shadow-lg hover:shadow-xl hover-glow transition-all duration-200 hover:scale-110 touch-target"
        title="Jump to top"
      >
        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
      <Button
        onClick={onScrollToBottom}
        variant="outline"
        size="sm"
        className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-500 hover:border-purple-600 shadow-lg hover:shadow-xl hover-glow transition-all duration-200 hover:scale-110 touch-target"
        title="Jump to bottom"
      >
        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
}
