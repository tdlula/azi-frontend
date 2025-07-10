import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Mic, FileSpreadsheet } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200 p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to create a chart, analyze data, or get insights..."
                className="resize-none rounded-2xl border-gray-300 pr-24 min-h-[48px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Paperclip size={14} />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  size="icon"
                  className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="h-auto p-1">
              <Mic className="mr-1" size={14} />
              Voice
            </Button>
            <Button variant="ghost" size="sm" className="h-auto p-1">
              <FileSpreadsheet className="mr-1" size={14} />
              Upload CSV
            </Button>
          </div>
          <div className="text-xs">
            Press <kbd className="bg-gray-100 px-1 rounded text-xs">Enter</kbd> to send, <kbd className="bg-gray-100 px-1 rounded text-xs">Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </div>
  );
}
