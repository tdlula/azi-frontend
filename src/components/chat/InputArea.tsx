// InputArea component

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Send, 
  Square, 
  MessageSquareText, 
  ChevronUp 
} from "lucide-react";
import { FileUploadState } from "@/types/chat";

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  fileUpload: FileUploadState;
  showQuickReplies: boolean;
  messagesLength: number;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStopGeneration: () => void;
  onShowQuickReplies: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export default function InputArea({
  input,
  isLoading,
  fileUpload,
  showQuickReplies,
  messagesLength,
  onInputChange,
  onKeyDown,
  onSubmit,
  onFileUpload,
  onStopGeneration,
  onShowQuickReplies,
  textareaRef
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing: isUploadProcessing, fileName: uploadedFile } = fileUpload;

  return (
    <div className="input-container p-3 sm:p-4 md:p-6 border-t border-slate-600 bg-slate-800/50 flex-shrink-0 w-full fixed bottom-0 left-0 right-0 z-50 mt-4">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Quick Replies Toggle Button - Show when quick replies are hidden */}
        {!showQuickReplies && messagesLength > 0 && !isLoading && (
          <div className="flex justify-center mb-3">
            <Button
              onClick={onShowQuickReplies}
              variant="outline"
              size="sm"
              className="quick-replies-toggle flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700/90 to-slate-600/90 border-slate-500 text-gray-200 hover:from-slate-600 hover:to-slate-500 hover:text-white transition-all duration-300 rounded-full shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
              title="Show quick reply suggestions"
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="text-sm font-medium">Quick Replies</span>
              <ChevronUp className="w-3 h-3 opacity-75" />
            </Button>
          </div>
        )}

        <form onSubmit={onSubmit} className="input-wrapper flex items-end space-x-2 sm:space-x-4 w-full">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".txt,.pdf,text/plain,application/pdf"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadProcessing}
            className="flex-shrink-0 hover-lift p-2 sm:p-3 bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-all duration-200"
          >
            <Upload className={`w-4 h-4 sm:w-5 sm:h-5 ${isUploadProcessing ? 'animate-spin' : ''}`} />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading || isUploadProcessing}
            className="message-input flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] max-h-[120px] resize-none overflow-y-auto"
            rows={1}
          />
          <Button
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? onStopGeneration : undefined}
            disabled={(!isLoading && !input.trim()) || isUploadProcessing}
            className={`send-button p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl flex-shrink-0 self-end ${
              isLoading 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : !input.trim() 
                  ? 'loading-disabled opacity-60 cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'hover-glow bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
            }`}
            title={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <Square className="send-icon w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Send className="send-icon w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </form>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-1 text-xs text-gray-400 text-center">
          {isLoading ? (
            <span className="text-orange-300">🔴 AI is responding... Press Escape or click Stop to cancel</span>
          ) : (
            <>
              <span className="hidden sm:inline">💡 Press Enter to send • Shift+Enter for new line</span>
              <span className="sm:hidden">💡 Enter = send • Shift+Enter = new line</span>
            </>
          )}
        </div>
        
        {isUploadProcessing && uploadedFile && (
          <div className="mt-2 text-xs sm:text-sm text-gray-200">
            Processing {uploadedFile}...
          </div>
        )}
      </div>
    </div>
  );
}
